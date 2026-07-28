import React from 'react';
import type { Vault } from '../types';

interface VaultCardProps {
  vault: Vault;
  vaultId: number;
  isOwner: boolean;
  onCheckIn: (vaultId: number) => Promise<void>;
  onSettle: (vaultId: number) => Promise<void>;
}

export const VaultCard: React.FC<VaultCardProps> = ({
  vault,
  vaultId,
  isOwner,
  onCheckIn,
  onSettle,
}) => {
  const progress = vault.required_check_ins > 0
    ? Math.round((vault.check_in_count / vault.required_check_ins) * 100)
    : 0;

  const deadlineDate = new Date(vault.deadline * 1000);
  const now = Date.now();
  const isExpired = now > vault.deadline * 1000;
  const canCheckIn = isOwner && !vault.settled && !isExpired && vault.check_in_count < vault.required_check_ins;
  const canSettle = !vault.settled && isExpired;

  const [isChecking, setIsChecking] = React.useState(false);
  const [isSettling, setIsSettling] = React.useState(false);

  const handleCheckIn = async () => {
    setIsChecking(true);
    try {
      await onCheckIn(vaultId);
    } finally {
      setIsChecking(false);
    }
  };

  const handleSettle = async () => {
    setIsSettling(true);
    try {
      await onSettle(vaultId);
    } finally {
      setIsSettling(false);
    }
  };

  return (
    <div className="card-hover animate-fade-in">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg truncate">{vault.description}</h3>
          <p className="text-xs text-gray-500 font-mono mt-1">
            #{vaultId} · Owner: {vault.owner.slice(0, 4)}...{vault.owner.slice(-4)}
          </p>
        </div>
        {vault.settled ? (
          <span className="badge-settled">Settled</span>
        ) : isExpired ? (
          <span className="badge-failed">Expired</span>
        ) : (
          <span className="badge-active">Active</span>
        )}
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-400">Progress</span>
          <span className="text-gray-300 font-medium">{vault.check_in_count} / {vault.required_check_ins}</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${Math.min(progress, 100)}%` }} />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-gray-800/40 rounded-lg p-2 text-center">
          <p className="text-lg font-bold text-stellar-400">{vault.stake} XLM</p>
          <p className="text-xs text-gray-500">Staked</p>
        </div>
        <div className="bg-gray-800/40 rounded-lg p-2 text-center">
          <p className="text-lg font-bold text-amber-400">{vault.stake - Math.floor(vault.stake * vault.check_in_count / (vault.required_check_ins || 1))} XLM</p>
          <p className="text-xs text-gray-500">At Risk</p>
        </div>
        <div className="bg-gray-800/40 rounded-lg p-2 text-center">
          <p className="text-lg font-bold text-gray-300">{deadlineDate.toLocaleDateString()}</p>
          <p className="text-xs text-gray-500">Deadline</p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        {canCheckIn && (
          <button
            onClick={handleCheckIn}
            disabled={isChecking}
            className="btn-primary flex-1 text-sm"
          >
            {isChecking ? 'Checking in...' : '✓ Check In'}
          </button>
        )}
        {canSettle && (
          <button
            onClick={handleSettle}
            disabled={isSettling}
            className="btn-secondary flex-1 text-sm"
          >
            {isSettling ? 'Settling...' : '⚖️ Settle'}
          </button>
        )}
      </div>

      {vault.settled && (
        <div className="mt-3 pt-3 border-t border-gray-800">
          <p className="text-sm text-emerald-400">
            ✓ Vault completed — {vault.check_in_count}/{vault.required_check_ins} check-ins done
          </p>
        </div>
      )}
    </div>
  );
};
