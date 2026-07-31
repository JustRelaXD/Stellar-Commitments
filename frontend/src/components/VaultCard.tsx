import React, { useState, useEffect } from 'react';
import {
  rpc, Contract, Address,
  nativeToScVal, scValToNative,
  TransactionBuilder, BASE_FEE,
} from '@stellar/stellar-sdk';
import { BURN_ADDRESS, CONTRACT_ADDRESS, XLM_TOKEN_ADDRESS, RPC_URL, NETWORK_PASSPHRASE } from '../constants';
import type { Vault } from '../types';

const TX_EXPLORER = 'https://stellar.expert/explorer/testnet/tx/';
const ACCT_EXPLORER = 'https://stellar.expert/explorer/testnet/account/';
const CONTRACT_EXPLORER = 'https://lab.stellar.org/r/testnet/contract/';
const XLM = 10_000_000; // stroops per XLM

// Human-readable remaining time, in the most meaningful unit
function formatTimeLeft(ms: number): string {
  if (ms <= 0) return '0m';
  const totalMin = Math.ceil(ms / 60000);
  if (totalMin < 60) return `${totalMin}m`;
  const h = Math.floor(totalMin / 60);
  const rem = totalMin % 60;
  if (h < 24) return rem > 0 ? `${h}h ${rem}m` : `${h}h`;
  const d = Math.floor(h / 24);
  const remH = h % 24;
  return remH > 0 ? `${d}d ${remH}h` : `${d}d`;
}

interface VaultCardProps {
  vault: Vault;
  vaultId: number;
  isOwner: boolean;
  onCheckIn: (vaultId: number) => Promise<void>;
  onSettle: (vaultId: number) => Promise<void>;
  txHashes?: { created?: string; checkIns: string[]; settled?: string };
}

export const VaultCard: React.FC<VaultCardProps> = ({
  vault, vaultId, isOwner, onCheckIn, onSettle, txHashes,
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [contractBalance, setContractBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  // Fetch contract XLM balance via SAC when details are opened
  useEffect(() => {
    if (!showDetails) return;
    setBalanceLoading(true);
    (async () => {
      try {
        const server = new rpc.Server(RPC_URL);
        const sac = new Contract(XLM_TOKEN_ADDRESS);
        const source = await server.getAccount(vault.owner);
        const tx = new TransactionBuilder(source, {
          fee: BASE_FEE, networkPassphrase: NETWORK_PASSPHRASE,
        })
          .addOperation(sac.call('balance', new Address(CONTRACT_ADDRESS).toScVal()))
          .setTimeout(30)
          .build();
        const sim: any = await server.simulateTransaction(tx);
        if (sim.result?.retval) {
          setContractBalance(Number(scValToNative(sim.result.retval)) / XLM);
        }
      } catch { /* fallback — show link instead */ }
      finally { setBalanceLoading(false); }
    })();
  }, [showDetails, vault.owner]);
  const progress = vault.required_check_ins > 0
    ? Math.round((vault.check_in_count / vault.required_check_ins) * 100) : 0;
  const deadlineDate = new Date(vault.deadline * 1000);
  const now = Date.now();
  const isExpired = now > vault.deadline * 1000;
  const canCheckIn = isOwner && !vault.settled && !isExpired && vault.check_in_count < vault.required_check_ins;
  const canSettle = !vault.settled && isExpired;
  const [isChecking, setIsChecking] = React.useState(false);
  const [isSettling, setIsSettling] = React.useState(false);

  const handleCheckIn = async () => { setIsChecking(true); try { await onCheckIn(vaultId); } finally { setIsChecking(false); } };
  const handleSettle = async () => { setIsSettling(true); try { await onSettle(vaultId); } finally { setIsSettling(false); } };

  const stakeXlm = vault.stake / XLM;
  const returnedStroops = Math.floor(vault.stake * vault.check_in_count / (vault.required_check_ins || 1));
  const returnedXlm = returnedStroops / XLM;
  const atRiskXlm = stakeXlm - returnedXlm;
  const timeLeftMs = Math.max(0, vault.deadline * 1000 - now);
  const isBelow50 = vault.check_in_count * 100 < vault.required_check_ins * 50;
  const isBurned = vault.beneficiary === BURN_ADDRESS;
  const benShort = vault.beneficiary?.slice(0, 6) ?? '—';

  return (
    <div className="border border-hairline-soft rounded-card p-5 bg-white hover:border-hairline hover:bg-[#fafafa] transition-all animate-scale-in">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-mono text-stone">#{vaultId}</span>
            {vault.settled ? <span className="badge-neutral">Settled</span>
            : isExpired ? <span className="badge-error">Expired</span>
            : <span className="badge-success">Active</span>}
          </div>
          <h3 className="text-sm font-semibold truncate">{vault.description}</h3>
        </div>
        {isOwner && !vault.settled && <span className="badge-stellar text-[10px]">Yours</span>}
      </div>

      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-mute">Progress</span>
          <span className="font-medium">{vault.check_in_count} / {vault.required_check_ins}</span>
        </div>
        <div className="progress-bar">
          <div className={vault.settled && vault.check_in_count >= vault.required_check_ins ? 'progress-fill-success' : isExpired ? 'progress-fill-warning' : 'progress-fill'}
            style={{ width: `${Math.min(progress, 100)}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-1.5 mb-4">
        <div className="bg-soft-cloud/50 rounded-lg p-1.5 text-center">
          <p className="text-xs font-bold">{stakeXlm.toFixed(1)}</p>
          <p className="text-[9px] text-mute">Staked</p>
        </div>
        <div className="bg-soft-cloud/50 rounded-lg p-1.5 text-center">
          <p className="text-xs font-bold text-stellar-600">{returnedXlm.toFixed(1)}</p>
          <p className="text-[9px] text-mute">Return</p>
        </div>
        <div className="bg-soft-cloud/50 rounded-lg p-1.5 text-center">
          <p className={`text-xs font-bold ${atRiskXlm > 0 ? 'text-amber-600' : 'text-stone'}`}>{atRiskXlm.toFixed(1)}</p>
          <p className="text-[9px] text-mute">At Risk</p>
        </div>
        <div className="bg-soft-cloud/50 rounded-lg p-1.5 text-center">
          <p className="text-xs font-bold">{vault.settled ? '—' : isExpired ? '0m' : formatTimeLeft(timeLeftMs)}</p>
          <p className="text-[9px] text-mute">{vault.settled ? 'Done' : isExpired ? 'Expired' : 'Left'}</p>
        </div>
      </div>

      {/* Penalty mode badge */}
      {vault.strict_penalty && !vault.settled && (
        <div className="mb-2.5 flex items-center gap-1.5">
          <span className="badge-amber text-[9px]">Strict penalty</span>
          <span className="text-[9px] text-mute">
            {isBelow50 ? '< 50% done — all at risk' : '≥ 50% done — proportional'}
          </span>
        </div>
      )}

      {/* Beneficiary display */}
      <div className="flex items-center gap-1.5 mb-2.5">
        <span className="text-[9px] text-stone-400">Beneficiary:</span>
        {isBurned ? (
          <span className="text-[9px] text-stone-400" title="No beneficiary set — slashed funds are burned">
            —
          </span>
        ) : (
          <span className="text-[9px] font-mono text-stone-500" title={vault.beneficiary}>
            {benShort}...
          </span>
        )}
      </div>

      {!vault.settled && (
        <div className="text-[10px] text-mute mb-3 bg-soft-cloud/30 rounded-lg px-3 py-1.5 leading-relaxed">
          {isExpired
            ? `Deadline passed. ${vault.check_in_count}/${vault.required_check_ins} check-ins done. Settle to return ${returnedXlm.toFixed(1)} XLM${vault.strict_penalty && isBelow50 ? ' (all at risk)' : ` and ${isBurned ? 'burn' : 'donate'} ${atRiskXlm.toFixed(1)} XLM.`}`
            : `Complete ${vault.required_check_ins - vault.check_in_count} more check-in${vault.required_check_ins - vault.check_in_count !== 1 ? 's' : ''} by ${deadlineDate.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })} to ${vault.strict_penalty ? 'reach the 50% threshold and earn' : 'keep'} your full stake.`}
        </div>
      )}

      <div className="flex gap-2">
        {canCheckIn && <button onClick={handleCheckIn} disabled={isChecking} className="btn-primary flex-1 text-xs">{isChecking ? 'Checking in...' : '✓ Check In'}</button>}
        {canSettle && <button onClick={handleSettle} disabled={isSettling} className="btn-secondary flex-1 text-xs">{isSettling ? 'Settling...' : '⚖️ Settle'}</button>}
      </div>

      {vault.settled && (
        <div className="mt-3 pt-3 border-t border-hairline-soft">
          <p className="text-xs text-success">
            {vault.check_in_count >= vault.required_check_ins
              ? `✓ Commitment completed! ${returnedXlm.toFixed(1)} XLM returned.`
              : vault.strict_penalty && isBelow50
                ? `✓ Strict penalty applied. ${returnedXlm.toFixed(1)} XLM returned, ${atRiskXlm.toFixed(1)} XLM ${isBurned ? 'burned' : 'sent to beneficiary'}.`
                : `✓ Commitment settled. ${returnedXlm.toFixed(1)} XLM returned, ${atRiskXlm.toFixed(1)} XLM ${isBurned ? 'burned' : 'sent to beneficiary'}.`}
          </p>
        </div>
      )}

      {/* ── More Details ── */}
      <div className="mt-3 pt-2.5 border-t border-hairline-soft">
        <button
          onClick={() => setShowDetails(d => !d)}
          className="flex items-center gap-1.5 text-[10px] text-stone-400 hover:text-ink transition-colors w-full"
        >
          <svg className={`w-3 h-3 transition-transform ${showDetails ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          More Details
        </button>

        {showDetails && (() => {
          const h = txHashes; // local alias for TS narrowing
          return (
          <div className="mt-2.5 space-y-2 bg-soft-cloud/20 rounded-lg p-3 text-[10px] animate-fade-in">
            {/* Contract */}
            <div className="flex items-center justify-between">
              <span className="text-stone-400">Contract</span>
              <a href={`${CONTRACT_EXPLORER}${CONTRACT_ADDRESS}`} target="_blank" rel="noopener noreferrer"
                className="font-mono text-stellar-600 hover:text-stellar-700 hover:underline truncate max-w-[180px] block">
                {CONTRACT_ADDRESS.slice(0, 8)}...
              </a>
            </div>

            {/* Vault ID */}
            <div className="flex items-center justify-between">
              <span className="text-stone-400">Vault ID</span>
              <span className="font-mono text-stone-500">#{vaultId}</span>
            </div>

            {/* Owner */}
            <div className="flex items-center justify-between">
              <span className="text-stone-400">Owner</span>
              <a href={`${ACCT_EXPLORER}${vault.owner}`} target="_blank" rel="noopener noreferrer"
                className="font-mono text-stellar-600 hover:text-stellar-700 hover:underline truncate max-w-[180px] block">
                {vault.owner.slice(0, 8)}...
              </a>
            </div>

            {/* Beneficiary */}
            <div className="flex items-center justify-between">
              <span className="text-stone-400">Beneficiary</span>
              {isBurned ? (
                <span className="text-amber-600 font-medium">🔥 Burned</span>
              ) : (
                <a href={`${ACCT_EXPLORER}${vault.beneficiary}`} target="_blank" rel="noopener noreferrer"
                  className="font-mono text-stellar-600 hover:text-stellar-700 hover:underline truncate max-w-[180px] block">
                  {vault.beneficiary.slice(0, 8)}...
                </a>
              )}
            </div>

            {/* Contract balance */}
            <div className="flex items-center justify-between">
              <span className="text-stone-400">Contract XLM</span>
              {balanceLoading ? (
                <span className="text-[9px] text-stone-400 animate-pulse">Loading...</span>
              ) : contractBalance !== null ? (
                <span className="font-mono text-stone-500">{contractBalance.toFixed(2)} XLM</span>
              ) : (
                <a href={`${CONTRACT_EXPLORER}${CONTRACT_ADDRESS}`} target="_blank" rel="noopener noreferrer"
                  className="font-mono text-stellar-600 hover:underline text-[9px]">
                  View on explorer
                </a>
              )}
            </div>

            {/* Settlement event breakdown — only for settled vaults */}
            {vault.settled && (
              <div className="border-t border-hairline-soft pt-2 mt-1 space-y-1.5">
                <span className="text-[9px] font-medium text-stone-400 uppercase tracking-wider">Settlement</span>
                <div className="flex items-center justify-between">
                  <span className="text-stone-400">Returned</span>
                  <span className="font-mono text-success font-medium">+{returnedXlm.toFixed(2)} XLM</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone-400">Slashed</span>
                  <span className="font-mono text-amber-600 font-medium">{atRiskXlm.toFixed(2)} XLM</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone-400">Transfer to beneficiary</span>
                  {isBurned ? (
                    <span className="font-mono text-amber-600">
                      SKIPPED 🔥
                      <span className="block text-[8px] text-stone-400 leading-tight">funds stay in contract</span>
                    </span>
                  ) : (
                    <span className="font-mono text-stellar-600">
                      SENT
                      <span className="block text-[8px] text-stone-400 leading-tight">to beneficiary address</span>
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Create tx */}
            {h?.created && (
              <div className="flex items-center justify-between">
                <span className="text-stone-400">Created</span>
                <a href={`${TX_EXPLORER}${h.created}`} target="_blank" rel="noopener noreferrer"
                  className="font-mono text-stellar-600 hover:text-stellar-700 hover:underline truncate max-w-[180px] block">
                  {h.created.slice(0, 12)}...
                </a>
              </div>
            )}

            {/* Check-in txs */}
            {h?.checkIns && h.checkIns.length > 0 && (
              <div className="flex items-start justify-between">
                <span className="text-stone-400 mt-0.5">Check-ins ({h.checkIns.length})</span>
                <div className="flex flex-col gap-0.5">
                  {h.checkIns.map((hash, i) => (
                    <a key={i} href={`${TX_EXPLORER}${hash}`} target="_blank" rel="noopener noreferrer"
                      className="font-mono text-stellar-600 hover:text-stellar-700 hover:underline text-right">
                      #{i + 1}: {hash.slice(0, 12)}...
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Settlement tx */}
            {h?.settled && (
              <div className="flex items-center justify-between">
                <span className="text-stone-400">Settled</span>
                <a href={`${TX_EXPLORER}${h.settled}`} target="_blank" rel="noopener noreferrer"
                  className="font-mono text-stellar-600 hover:text-stellar-700 hover:underline truncate max-w-[180px] block">
                  {h.settled.slice(0, 12)}...
                </a>
              </div>
            )}

            {/* Stellar link row */}
            <div className="pt-1.5 border-t border-hairline-soft flex items-center gap-2">
              <svg className="w-3 h-3 text-stone-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <span className="text-[9px] text-stone-400">
                All transactions verified on{' '}
                <a href="https://stellar.expert" target="_blank" rel="noopener noreferrer"
                  className="text-stellar-600 hover:underline">Stellar Expert</a>
              </span>
            </div>
          </div>
          );
        })()}
      </div>
    </div>
  );
};
