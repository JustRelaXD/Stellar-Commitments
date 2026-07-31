import React, { useState } from 'react';
import { VaultCard } from './VaultCard';
import { CubeIcon } from './CubeIcon';
import type { Vault } from '../types';

interface VaultListProps {
  vaults: { id: number; data: Vault }[];
  userAddress: string;
  onCheckIn: (vaultId: number) => Promise<void>;
  onSettle: (vaultId: number) => Promise<void>;
  isLoading: boolean;
  txHashes: Record<number, { created?: string; checkIns: string[]; settled?: string }>;
}

type FilterType = 'all' | 'active' | 'settled';

export const VaultList: React.FC<VaultListProps> = ({
  vaults, userAddress, onCheckIn, onSettle, isLoading, txHashes,
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
      <div className="border border-hairline-soft rounded-card p-5 bg-white">
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <svg className="animate-spin h-6 w-6 text-stellar-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-mute">Loading commitments from Stellar...</p>
        </div>
      </div>
    );
  }

  if (vaults.length === 0) {
    return (
      <div className="border border-hairline-soft rounded-card p-5 bg-white text-center py-12 animate-fade-in">
        <div className="w-14 h-14 rounded-full bg-stellar-500/5 border border-stellar-500/10 flex items-center justify-center mx-auto mb-4">
          <CubeIcon className="w-7 h-7 text-stellar-400/40" strokeWidth={1} />
        </div>
        <h3 className="text-base font-semibold mb-1">No Commitments Yet</h3>
        <p className="text-sm text-mute max-w-xs mx-auto leading-relaxed">
          Create your first commitment above. Set a goal, stake XLM, and start earning it back through check-ins.
        </p>
        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-mute">
          <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-stellar-400/50" />Set a goal</span>
          <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-stellar-400/50" />Stake XLM</span>
          <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-stellar-400/50" />Check in daily</span>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex gap-1.5 mb-4">
        {(['all', 'active', 'settled'] as FilterType[]).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-pill text-xs font-medium transition-all ${
              filter === f ? 'bg-ink text-white' : 'text-mute hover:text-ink'
            }`}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === 'all' && <span className="ml-1 text-[10px] opacity-60">{vaults.length}</span>}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="border border-hairline-soft rounded-card p-5 bg-white text-center py-8">
          <p className="text-sm text-mute">No {filter} commitments</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(({ id, data }) => (
            <VaultCard key={id} vault={data} vaultId={id}
              isOwner={data.owner === userAddress}
              onCheckIn={onCheckIn} onSettle={onSettle}
              txHashes={txHashes[id]} />
          ))}
        </div>
      )}
    </div>
  );
};
