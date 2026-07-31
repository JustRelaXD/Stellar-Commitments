import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useWallet } from './hooks/useWallet';
import { useContract } from './hooks/useContract';
import { WalletConnect } from './components/WalletConnect';
import { CubeIcon } from './components/CubeIcon';
import { CreateCommitment } from './components/CreateVault';
import { VaultList } from './components/VaultList';
import { EventFeed } from './components/EventFeed';
import { TxStatus } from './components/TxStatus';
import { UserStatsBar } from './components/UserStatsBar';
import { OnboardingModal } from './components/OnboardingModal';
import type { Vault, ContractEvent, UserStats } from './types';

function App() {
  const { wallet, error, isConnecting, connect, disconnect, signTransaction } = useWallet();
  const contract = useContract(wallet.address, signTransaction);

  const [vaults, setVaults] = useState<{ id: number; data: Vault }[]>([]);
  const [events, setEvents] = useState<ContractEvent[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [isLoadingVaults, setIsLoadingVaults] = useState(false);
  const [contractAvailable, setContractAvailable] = useState(true);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [txHashes, setTxHashes] = useState<
    Record<number, { created?: string; checkIns: string[]; settled?: string }>
  >({});
  const loadedRef = useRef(false);

  // Show onboarding on first visit (once per user).
  // Key bumped to v2 so anyone who dismissed the old intro sees it once more.
  useEffect(() => {
    const seen = localStorage.getItem('stellar_vault_onboarding_seen_v2');
    if (!seen) {
      const t = setTimeout(() => setShowOnboardingModal(true), 400);
      return () => clearTimeout(t);
    }
  }, []);



  const loadData = useCallback(async () => {
    if (!wallet.isConnected || !wallet.address) return;
    setIsLoadingVaults(true);
    try {
      setContractAvailable(true);
      const vaultIds = await contract.getUserVaults(wallet.address);
      if (vaultIds.length > 0) {
        const results = await Promise.all(
          vaultIds.map((id: number) => contract.getVault(id).catch(() => null))
        );
        setVaults(results.filter((v): v is { id: number; data: Vault } => v !== null));
      } else setVaults([]);
      try {
        const us = await contract.getUserStats(wallet.address);
        setUserStats(us);
      } catch { /* */ }
    } catch { setContractAvailable(false); }
    finally { setIsLoadingVaults(false); }
  }, [wallet.isConnected, wallet.address, contract]);

  useEffect(() => {
    if (wallet.isConnected && wallet.address && !loadedRef.current) {
      loadedRef.current = true;
      loadData();
    }
    if (!wallet.isConnected) {
      loadedRef.current = false;
      setUserStats(null); // clear stale stats when switching/disconnecting wallets
    }
  }, [wallet.isConnected, wallet.address, loadData]);

  const addEvent = useCallback((type: ContractEvent['type'], data: any) => {
    setEvents(prev => [{ type, data, timestamp: Date.now() }, ...prev]);
  }, []);

  const handleCreateVault = useCallback(async (
    desc: string, durationSeconds: number, checkIns: number, stake: number,
    beneficiary: string, strictPenalty: boolean,
  ) => {
    if (!wallet.isConnected) throw new Error('Wallet not connected');
    const { vaultId, hash } = await contract.createVault(desc, durationSeconds, checkIns, stake, beneficiary, strictPenalty);
    setTxHashes(prev => ({ ...prev, [vaultId]: { created: hash, checkIns: [] } }));
    addEvent('vault_created', {
      vault_id: vaultId, stake, required: checkIns,
      deadline: Math.floor(Date.now() / 1000) + durationSeconds, owner: wallet.address,
    });
    await loadData();
  }, [wallet, contract, addEvent, loadData]);

  const handleCheckIn = useCallback(async (vaultId: number) => {
    if (!wallet.isConnected) throw new Error('Wallet not connected');
    const { hash } = await contract.checkIn(vaultId);
    setTxHashes(prev => ({
      ...prev,
      [vaultId]: { ...(prev[vaultId] || { checkIns: [] }), checkIns: [...(prev[vaultId]?.checkIns || []), hash] },
    }));
    addEvent('checked_in', { vault_id: vaultId, owner: wallet.address });
    await loadData();
  }, [wallet, contract, addEvent, loadData]);

  const handleSettle = useCallback(async (vaultId: number) => {
    if (!wallet.isConnected) throw new Error('Wallet not connected');
    const { hash } = await contract.settleVault(vaultId);
    setTxHashes(prev => ({ ...prev, [vaultId]: { ...(prev[vaultId] || { checkIns: [] }), settled: hash } }));
    addEvent('vault_settled', { vault_id: vaultId, owner: wallet.address });
    await loadData();
  }, [wallet, contract, addEvent, loadData]);

  const userAddress = wallet.isConnected ? wallet.address : '';

  return (
    <div className="min-h-screen bg-canvas">
      {/* Onboarding modal popup */}
      {showOnboardingModal && (
        <OnboardingModal
          onDismiss={() => {
            localStorage.removeItem('stellar_vault_onboarding_seen'); // clear stale old key
            localStorage.setItem('stellar_vault_onboarding_seen_v2', 'true');
            setShowOnboardingModal(false);
          }}
          onConnect={connect}
        />
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-hairline-soft bg-canvas/90 backdrop-blur-lg">
        <div className="px-6 lg:px-10 h-14 flex items-center justify-between max-w-screen-2xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-stellar-400 via-stellar-500 to-stellar-600 flex items-center justify-center shadow-sm overflow-hidden">
              {/* Decorative dots */}
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-white/10" />
              <span className="absolute -bottom-0.5 -left-0.5 w-2 h-2 rounded-full bg-white/10" />
              <span className="absolute top-0.5 right-2.5 w-1 h-1 rounded-full bg-white/20" />
              {/* Grid pattern overlay */}
              <svg className="absolute inset-0 w-full h-full opacity-[0.07]" viewBox="0 0 36 36" fill="none">
                <path d="M9 0v36M18 0v36M27 0v36M0 9h36M0 18h36M0 27h36" stroke="white" strokeWidth="0.5" />
              </svg>
              {/* Block icon - matches the commitment section icon */}
              <CubeIcon className="relative w-5 h-5 text-white" />
              {/* Bottom-right accent bar */}
              <span className="absolute bottom-0.5 right-0.5 w-2 h-0.5 rounded-full bg-white/25" />
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight">Stellar Commitment</h1>
              <p className="text-[9px] text-mute leading-none mt-0.5">Commitment savings on Stellar</p>
            </div>
          </div>
          {/* Header actions — info, wallet */}
          <div className="flex items-center gap-1">
            {/* Info button */}
            <button
              onClick={() => setShowOnboardingModal(true)}
              className="w-8 h-8 flex items-center justify-center text-stone-400 hover:text-ink hover:bg-stone-100 rounded-lg transition-all"
              title="How it works"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
              </svg>
            </button>
            <WalletConnect
              address={wallet.address}
              isConnected={wallet.isConnected}
              isConnecting={isConnecting}
              error={error}
              onConnect={connect}
              onDisconnect={disconnect}
            />
          </div>
        </div>
      </header>

      {/* Contract warning */}
      {!contractAvailable && wallet.isConnected && (
        <div className="px-6 lg:px-10 pt-4 max-w-screen-2xl mx-auto">
          <div className="border border-sale/20 bg-sale/5 rounded-card px-5 py-3">
            <div className="flex items-center gap-2.5 text-sale">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="text-xs">
                Cannot reach contract{' '}
                <code className="text-[10px] bg-white px-1.5 py-0.5 rounded border border-sale/20">
                  {import.meta.env.VITE_CONTRACT_ADDRESS || 'Not set'}
                </code>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main content - full width */}
      <main className="px-6 lg:px-10 py-6 max-w-screen-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-display-sm tracking-tight">Dashboard</h2>
            <p className="text-sm text-mute mt-0.5">
              {wallet.isConnected
                ? `Manage your commitments and track your progress`
                : 'Connect your wallet to get started'}
            </p>
          </div>
          {wallet.isConnected && (
            <button
              onClick={loadData}
              disabled={isLoadingVaults}
              className="btn-ghost text-xs"
            >
              <svg className={`w-3.5 h-3.5 ${isLoadingVaults ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          )}
        </div>

        {/* Stats row - the connected wallet's own stats only */}
        <div className="mb-6">
          {wallet.isConnected && userStats && (
            <UserStatsBar stats={userStats} address={wallet.address} />
          )}
        </div>

        {/* 2-column layout: Left (Create + Activity) + Right (Commitments) */}
        <div className="grid lg:grid-cols-3 gap-6 items-start">
          {/* Left 2/3: Create Commitment + Activity */}
          <div className="lg:col-span-2 space-y-6">
            {wallet.isConnected && (
              <CreateCommitment onCreateVault={handleCreateVault} disabled={!wallet.isConnected} />
            )}
            <EventFeed events={events} userAddress={userAddress} />
          </div>

          {/* Right 1/3: Commitments */}
          <div className="space-y-4">
            {wallet.isConnected && (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-xs font-medium text-mute uppercase tracking-widest">
                    Your Commitments
                  </h3>
                  {vaults.length > 0 && (
                    <span className="text-[10px] text-mute/60">({vaults.length})</span>
                  )}
                </div>
                <VaultList
                  vaults={vaults}
                  userAddress={userAddress}
                  onCheckIn={handleCheckIn}
                  onSettle={handleSettle}
                  isLoading={isLoadingVaults}
                  txHashes={txHashes}
                />
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-[10px] text-stone/60 mt-8 pt-4 border-t border-hairline-soft">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-success" />
              Testnet
            </span>
            <span className="opacity-30">|</span>
            <span className="font-mono">
              {import.meta.env.VITE_CONTRACT_ADDRESS
                ? `${import.meta.env.VITE_CONTRACT_ADDRESS.slice(0, 6)}...`
                : 'No contract'}
            </span>
          </div>
          <span>Stellar Commitment</span>
        </div>
      </main>

      <TxStatus tx={contract.txState} onDismiss={contract.resetTx} />
    </div>
  );
}

export default App;
