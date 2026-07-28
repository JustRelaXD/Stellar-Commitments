import React, { useState, useCallback, useEffect } from 'react';
import { useWallet } from './hooks/useWallet';
import { WalletConnect } from './components/WalletConnect';
import { CreateVault } from './components/CreateVault';
import { VaultList } from './components/VaultList';
import { EventFeed } from './components/EventFeed';
import { TxStatus } from './components/TxStatus';
import { Leaderboard } from './components/Leaderboard';
import { GlobalStatsBar } from './components/GlobalStats';
// Contract addresses available via env vars (see constants.ts)
import type { Vault, ContractEvent, GlobalStats, TxState } from './types';
import { getDemoEvents } from './utils/contract';

const DEMO_USER = 'GAXHJ7WJ7P3X3X3X3X3X3X3X3X3X3X3X3X3X3X3X3X3X3X3X3X3X';

function App() {
  const { wallet, error, isConnecting, connect, disconnect, signTransaction } = useWallet();

  // Demo state
  const [demoVaults, setDemoVaults] = useState<{ id: number; data: Vault }[]>([]);
  const [demoEvents, setDemoEvents] = useState<ContractEvent[]>([]);
  const [demoStats, setDemoStats] = useState<GlobalStats>({
    total_vaults: 0,
    total_completed: 0,
    total_staked: 0,
    total_donated: 0,
  });
  const [demoLeaderboard, setDemoLeaderboard] = useState<{ address: string; completed: number; totalStaked: number; totalReturned: number }[]>([]);

  const [txState, setTxState] = useState<TxState>({ status: 'idle' });
  const [isLoadingVaults, setIsLoadingVaults] = useState(false);

  // Add demo events on mount
  useEffect(() => {
    setDemoEvents(getDemoEvents());
  }, []);

  const handleCreateVault = useCallback(async (
    description: string,
    days: number,
    checkIns: number,
    stake: number,
  ) => {
    if (!wallet.isConnected) {
      setTxState({ status: 'failed', error: 'Wallet not connected' });
      throw new Error('Wallet not connected');
    }

    setTxState({ status: 'pending' });

    // Simulate creating a vault for demo
    const newVault: Vault = {
      owner: wallet.address,
      description,
      required_check_ins: checkIns,
      check_in_count: 0,
      deadline: Math.floor(Date.now() / 1000) + days * 86400,
      stake,
      settled: false,
    };

    const newId = demoVaults.length + 1;
    setDemoVaults(prev => [...prev, { id: newId, data: newVault }]);
    setDemoStats(prev => ({
      ...prev,
      total_vaults: prev.total_vaults + 1,
      total_staked: prev.total_staked + stake,
    }));
    setDemoEvents(prev => [{
      type: 'vault_created',
      data: { vault_id: newId, stake, required: checkIns, deadline: newVault.deadline, owner: wallet.address },
      timestamp: Date.now(),
    }, ...prev]);

    // Simulate tx delay
    await new Promise(r => setTimeout(r, 1500));
    setTxState({ status: 'success', hash: `demo_tx_create_${newId}` });
  }, [wallet, demoVaults]);

  const handleCheckIn = useCallback(async (vaultId: number) => {
    if (!wallet.isConnected) {
      setTxState({ status: 'failed', error: 'Wallet not connected' });
      throw new Error('Wallet not connected');
    }

    setTxState({ status: 'pending' });

    const vaultIndex = demoVaults.findIndex(v => v.id === vaultId);
    if (vaultIndex === -1) {
      setTxState({ status: 'failed', error: 'Vault not found' });
      return;
    }

    // Simulate check-in
    setDemoVaults(prev => prev.map((v, i) => {
      if (i === vaultIndex) {
        const newCount = v.data.check_in_count + 1;
        const completed = newCount >= v.data.required_check_ins;
        if (completed) {
          setDemoStats(s => ({
            ...s,
            total_completed: s.total_completed + 1,
          }));
          setDemoLeaderboard(l => {
            const existing = l.find(e => e.address === wallet.address);
            if (existing) {
              return l.map(e => e.address === wallet.address
                ? { ...e, completed: e.completed + 1, totalReturned: e.totalReturned + v.data.stake }
                : e
              );
            }
            return [...l, { address: wallet.address, completed: 1, totalStaked: v.data.stake, totalReturned: v.data.stake }];
          });
        }
        return { ...v, data: { ...v.data, check_in_count: newCount } };
      }
      return v;
    }));

    setDemoEvents(prev => [{
      type: 'checked_in',
      data: { vault_id: vaultId, count: demoVaults[vaultIndex].data.check_in_count + 1, required: demoVaults[vaultIndex].data.required_check_ins, owner: wallet.address },
      timestamp: Date.now(),
    }, ...prev]);

    await new Promise(r => setTimeout(r, 1000));
    setTxState({ status: 'success', hash: `demo_tx_check_${vaultId}` });
  }, [wallet, demoVaults]);

  const handleSettle = useCallback(async (vaultId: number) => {
    if (!wallet.isConnected) {
      setTxState({ status: 'failed', error: 'Wallet not connected' });
      throw new Error('Wallet not connected');
    }

    setTxState({ status: 'pending' });

    setDemoVaults(prev => prev.map(v => {
      if (v.id === vaultId) {
        const returned = (v.data.stake * v.data.check_in_count) / v.data.required_check_ins;
        const donated = v.data.stake - returned;
        setDemoStats(s => ({
          ...s,
          total_donated: s.total_donated + donated,
        }));
        return { ...v, data: { ...v.data, settled: true } };
      }
      return v;
    }));

    setDemoEvents(prev => [{
      type: 'vault_settled',
      data: { vault_id: vaultId, owner: wallet.address, returned: Math.floor(vaultId * 10 / 7), donated: vaultId * 10 - Math.floor(vaultId * 10 / 7) },
      timestamp: Date.now(),
    }, ...prev]);

    await new Promise(r => setTimeout(r, 1000));
    setTxState({ status: 'success', hash: `demo_tx_settle_${vaultId}` });
  }, [wallet]);

  const resetTx = useCallback(() => setTxState({ status: 'idle' }), []);

  // Replace with a real address for the demo
  const demoAddress = wallet.isConnected ? wallet.address : DEMO_USER;

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
        {/* Global stats */}
        <GlobalStatsBar stats={demoStats} userCompleted={0} />

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
              </h2>
              <VaultList
                vaults={demoVaults.filter(v => v.data.owner === demoAddress)}
                userAddress={demoAddress}
                onCheckIn={handleCheckIn}
                onSettle={handleSettle}
                isLoading={isLoadingVaults}
              />
            </div>
          </div>

          {/* Right column: Event feed + Leaderboard */}
          <div className="space-y-6">
            <EventFeed
              events={demoEvents}
              userAddress={demoAddress}
            />
            <Leaderboard entries={demoLeaderboard} />
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
          <span className="text-xs">Stellar Vault v0.1.0</span>
        </div>
      </main>

      {/* Transaction status toast */}
      <TxStatus tx={txState} onDismiss={resetTx} />
    </div>
  );
}

export default App;
