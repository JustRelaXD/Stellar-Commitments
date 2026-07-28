import React from 'react';
import type { TxState } from '../types';

interface TxStatusProps {
  tx: TxState;
  onDismiss?: () => void;
}

export const TxStatus: React.FC<TxStatusProps> = ({ tx, onDismiss }) => {
  if (tx.status === 'idle') return null;

  const statusConfig = {
    pending: {
      icon: (
        <svg className="animate-spin h-5 w-5 text-amber-400" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ),
      bg: 'bg-amber-500/10 border-amber-500/30',
      text: 'text-amber-400',
      label: 'Transaction Pending',
    },
    success: {
      icon: (
        <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      bg: 'bg-emerald-500/10 border-emerald-500/30',
      text: 'text-emerald-400',
      label: 'Transaction Successful',
    },
    failed: {
      icon: (
        <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      bg: 'bg-red-500/10 border-red-500/30',
      text: 'text-red-400',
      label: 'Transaction Failed',
    },
  };

  const config = statusConfig[tx.status];

  return (
    <div className={`animate-slide-up fixed bottom-6 right-6 z-50 max-w-md ${config.bg} border rounded-xl p-4 shadow-2xl`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{config.icon}</div>
        <div className="flex-1 min-w-0">
          <p className={`font-semibold ${config.text}`}>{config.label}</p>
          {tx.hash && (
            <a
              href={`https://stellar.expert/explorer/testnet/tx/${tx.hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-400 hover:text-stellar-400 truncate block mt-1"
            >
              Tx: {tx.hash.slice(0, 16)}...
            </a>
          )}
          {tx.error && (
            <p className="text-sm text-red-300 mt-1">{tx.error}</p>
          )}
        </div>
        {onDismiss && tx.status !== 'pending' && (
          <button onClick={onDismiss} className="text-gray-500 hover:text-gray-300 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};
