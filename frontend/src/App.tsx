import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useWallet } from './hooks/useWallet';
import { useContract } from './hooks/useContract';
import { WalletConnect } from './components/WalletConnect';
import { CreateVault } from './components/CreateVault';
import { VaultList } from './components/VaultList';
import { EventFeed } from './components/EventFeed';
import { TxStatus } from './components/TxStatus';
import { Leaderboard } from './components/Leaderboard';
import { GlobalStatsBar } from './components/GlobalStats';
import type { Vault, ContractEvent, GlobalStats, TxState } from './types';
import { getDemoEvents } from './utils/contract';

function App() {
  const { wallet, error, isConnecting, connect, disconnect, signTransaction } = useWallet();
  const contract = useContract(wallet.address, signTransaction);

  // ── State ──────────────────────────────────────────────────────────
  const [vaults, setVaults] = useState<{ id: number; data: Vault }[]>([]);
  const [events, setEvents] = useState<ContractEvent[]>([]);
  const [stats, setStats] = useState<GlobalStats>({
    total_vaults: 0,
    total_completed: 0,
    total_staked: 0,
    total_donated: 0,
  });
  const [leaderboard, setLeaderboard] = useState<
    { address: string; completed: number; totalStaked: number; totalReturned: number }[]
  >([]);
  const [isLoadingVaults, setIsLoadingVaults] = useState(false);
  const [contractAvailable, setContractAvailable] = useState(true);
  const loadedRef = useRef(false);

  // Seed demo events once
  useEffect(() => {
    if (events.length === 0) {
      setEvents(getDemoEvents());
    }
  }, []);

  // ── Load data from contract ────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!wallet.isConnected || !wallet.address) return;
    setIsLoadingVaults(true);

    try {
      // Load global stats
      const gs = await contract.getGlobalStats();
      setStats(gs);
      setContractAvailable(true);

      // Load user's vault IDs
      const vaultIds = await contract.getUserVaults(wallet.address);
      if (vaultIds.length > 0) {
        const vaultPromises = vaultIds.map((id: number) =>
          contract.getVault(id).catch(() => null)
        );
        const results = await Promise.all(vaultPromises);
        setVaults(results.filter((v): v is { id: number; data: Vault } => v !== null));
      } else {
        setVaults([]);
      }

      // Load user stats for leaderboard
      try {
        const userStats = await contract.getUserStats(wallet.address);
        setLeaderboard([{
          address: wallet.address,
          completed: userStats.completed_vaults,
          totalStaked: userStats.total_staked,
          totalReturned: userStats.total_returned,
        }]);
      } catch {
        // Stats not critical
      }
    } catch (err: unknown) {
      console.warn('Failed to load contract data (contract might not be deployed yet):', err);
      setContractAvailable(false);
    } finally {
      setIsLoadingVaults(false);
    }
  }, [wallet.isConnected, wallet.address, contract]);

  // Load data when wallet connects
  useEffect(() => {
    if (wallet.isConnected && wallet.address && !loadedRef.current) {
      loadedRef.current = true;
      loadData();
    }
    if (!wallet.isConnected) {
      loadedRef.current = false;
    }
  }, [wallet.isConnected, wallet.address, loadData]);

  // ── Handlers ───────────────────────────────────────────────────────

  const addEvent = useCallback((type: ContractEvent['type'], data: any) => {
    setEvents(prev => [{ type, data, timestamp: Date.now() }, ...prev]);
  }, []);

  const handleCreateVault = useCallback(async (
    description: string,
    days: number,
    checkIns: number,
    stake: number,
  ) => {
    if (!wallet.isConnected) {
      throw new Error('Wallet not connected');
    }

    try {
      const vaultId = await contract.createVault(description, days, checkIns, stake);
      addEvent('vault_created', {
        vault_id: vaultId,
        stake,
        required: checkIns,
        deadline: Math.floor(Date.now() / 1000) + days * 86400,
        owner: wallet.address,
      });
      // Refresh vaults & stats
      await loadData();
    } catch (err: unknown) {
      if (err instanceof Error) throw err;
      throw new Error('Failed to create vault');
    }
  }, [wallet, contract, addEvent, loadData]);

  const handleCheckIn = useCallback(async (vaultId: number) => {
    if (!wallet.isConnected) throw new Error('Wallet not connected');

    try {
      await contract.checkIn(vaultId);
      addEvent('checked_in', {
        vault_id: vaultId,
        owner: wallet.address,
      });
      await loadData();
    } catch (err: unknown) {
      if (err instanceof Error) throw err;
      throw new Error('Failed to check in');
    }
  }, [wallet, contract, addEvent, loadData]);

  const handleSettle = useCallback(async (vaultId: number) => {
    if (!wallet.isConnected) throw new Error('Wallet not connected');

    try {
      await contract.settleVault(vaultId);
      addEvent('vault_settled', {
        vault_id: vaultId,
        owner: wallet.address,
      });
      await loadData();
    } catch (err: unknown) {
      if (err instanceof Error) throw err;
      throw new Error('Failed to settle vault');
    }
  }, [wallet, contract, addEvent, loadData]);

  const userAddress = wallet.isConnected ? wallet.address : '';

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-stellar-500 to-stellar-700 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-stellar-500/20">
              S
            </div>
            <div>
              <h1 className="text-xl font-bold">Stellar Vault</h1>
              <p className="text-xs text-gray-500">Commitment Savings on Stellar</p>
            </div>
          </div>
          <WalletConnect
            address={wallet.address}
            isConnected={wallet.isConnected}
            isConnecting={isConnecting}
            error={error}
            onConnect={connect}
            onDisconnect={disconnect}
          />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Contract not available warning */}
        {!contractAvailable && wallet.isConnected && (
          <div className="card border-2 border-amber-500/30 bg-amber-500/5">
            <div className="flex items-center gap-3 text-amber-400">
              <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span>
                Cannot reach contract{' '}
                <code className="text-xs bg-gray-800 px-1.5 py-0.5 rounded">
                  {import.meta.env.VITE_CONTRACT_ADDRESS || 'Not set'}
                </code>
                . Make sure it's deployed and your <code className="text-xs bg-gray-800 px-1.5 py-0.5 rounded">.env</code> is correct.
              </span>
            </div>
          </div>
        )}

        {/* Global stats */}
        <GlobalStatsBar stats={stats} userCompleted={0} />

        {/* Main grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left column: Create vault + Vault list */}
          <div className="lg:col-span-2 space-y-6">
            {/* Create vault form */}
            {wallet.isConnected && (
              <CreateVault
                onCreateVault={handleCreateVault}
                disabled={!wallet.isConnected}
              />
            )}

            {/* Vault list */}
            <div>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-stellar-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Your Vaults
                {isLoadingVaults && (
                  <svg className="w-4 h-4 text-stellar-400 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
              </h2>
              <VaultList
                vaults={vaults}
                userAddress={userAddress}
                onCheckIn={handleCheckIn}
                onSettle={handleSettle}
                isLoading={isLoadingVaults}
              />
            </div>
          </div>

          {/* Right column: Event feed + Leaderboard */}
          <div className="space-y-6">
            <EventFeed
              events={events}
              userAddress={userAddress}
            />
            <Leaderboard entries={leaderboard} />
          </div>
        </div>

        {/* Network info bar */}
        <div className="card flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Testnet
            </span>
            <span>|</span>
            <span>Contract: {import.meta.env.VITE_CONTRACT_ADDRESS || 'Not deployed'}</span>
          </div>
          <button
            onClick={loadData}
            disabled={!wallet.isConnected}
            className="text-xs text-stellar-400 hover:text-stellar-300 transition-colors disabled:opacity-30"
          >
            Refresh
          </button>
        </div>
      </main>

      {/* Transaction status toast */}
      <TxStatus tx={contract.txState} onDismiss={contract.resetTx} />
    </div>
  );
}

export default App;
