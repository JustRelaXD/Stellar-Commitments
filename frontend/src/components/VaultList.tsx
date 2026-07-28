import React, { useState } from 'react';
import { VaultCard } from './VaultCard';
import type { Vault } from '../types';

interface VaultListProps {
  vaults: { id: number; data: Vault }[];
  userAddress: string;
  onCheckIn: (vaultId: number) => Promise<void>;
  onSettle: (vaultId: number) => Promise<void>;
  isLoading: boolean;
}

type FilterType = 'all' | 'active' | 'settled';

export const VaultList: React.FC<VaultListProps> = ({
  vaults,
  userAddress,
  onCheckIn,
  onSettle,
  isLoading,
}) => {
  const [filter, setFilter] = useState<FilterType>('all');

  const now = Date.now();
  const filtered = vaults.filter(({ data }) => {
    if (filter === 'active') return !data.settled && now <= data.deadline * 1000;
    if (filter === 'settled') return data.settled;
    return true;
  });

  if (isLoading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-12">
          <svg className="animate-spin h-8 w-8 text-stellar-400" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      </div>
    );
  }

  if (vaults.length === 0) {
    return (
      <div className="card text-center py-12">
        <svg className="w-12 h-12 text-gray-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
        <p className="text-gray-500">No vaults found</p>
        <p className="text-sm text-gray-600 mt-1">Create your first vault to get started!</p>
      </div>
    );
  }

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {(['all', 'active', 'settled'] as FilterType[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              filter === f
                ? 'bg-stellar-500/20 text-stellar-400 border border-stellar-500/30'
                : 'text-gray-500 hover:text-gray-300 border border-transparent'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === 'all' && ` (${vaults.length})`}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map(({ id, data }) => (
          <VaultCard
            key={id}
            vault={data}
            vaultId={id}
            isOwner={data.owner === userAddress}
            onCheckIn={onCheckIn}
            onSettle={onSettle}
          />
        ))}
      </div>
    </div>
  );
};
