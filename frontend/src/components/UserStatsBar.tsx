import React from 'react';
import type { UserStats } from '../types';

const XLM = 10_000_000; // stroops per XLM

interface Props {
  stats: UserStats;
  address: string;
}

export const UserStatsBar: React.FC<Props> = ({ stats, address }) => (
  <div className="border border-hairline-soft rounded-card bg-white p-4 animate-fade-in">
    <div className="flex items-center justify-between mb-3 px-0.5">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-stellar-500" />
        <span className="text-[10px] font-medium uppercase tracking-widest text-mute">
          Your Stats
        </span>
      </div>
      <span className="font-mono text-[10px] text-stone-400" title={address}>
        {address.slice(0, 6)}...{address.slice(-4)}
      </span>
    </div>

    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      <div className="bg-soft-cloud/50 rounded-xl p-3 text-center">
        <p className="stat-value text-lg">{stats.total_vaults}</p>
        <p className="stat-label">Commitments</p>
      </div>
      <div className="bg-soft-cloud/50 rounded-xl p-3 text-center">
        <p className="stat-value text-lg text-success">{stats.completed_vaults}</p>
        <p className="stat-label">Completed</p>
      </div>
      <div className="bg-soft-cloud/50 rounded-xl p-3 text-center">
        <p className="stat-value text-lg">{stats.total_check_ins}</p>
        <p className="stat-label">Check-ins</p>
      </div>
      <div className="bg-soft-cloud/50 rounded-xl p-3 text-center">
        <p className="stat-value text-lg text-stellar-600">
          {(stats.total_staked / XLM).toFixed(1)}
          <span className="text-xs font-normal opacity-60 ml-0.5">XLM</span>
        </p>
        <p className="stat-label">Total Staked</p>
      </div>
      <div className="bg-soft-cloud/50 rounded-xl p-3 text-center">
        <p className="stat-value text-lg text-amber-600">
          {(stats.total_returned / XLM).toFixed(1)}
          <span className="text-xs font-normal opacity-60 ml-0.5">XLM</span>
        </p>
        <p className="stat-label">Returned</p>
      </div>
    </div>
  </div>
);
