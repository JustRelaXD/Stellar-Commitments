import React from 'react';
import type { TxState } from '../types';

interface Props { tx: TxState; onDismiss?: () => void; }

export const TxStatus: React.FC<Props> = ({ tx, onDismiss }) => {
  if (tx.status === 'idle') return null;

  const config = tx.status === 'pending' ? {
    icon: <svg className="animate-spin h-4 w-4 text-amber-500" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>,
    bg: 'bg-white border border-hairline',
    text: 'text-amber-600',
    label: 'Pending',
    desc: 'Waiting for Stellar...',
  } : tx.status === 'success' ? {
    icon: <svg className="h-4 w-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
    bg: 'bg-white border border-success/20',
    text: 'text-success',
    label: 'Confirmed',
    desc: 'Transaction successful',
  } : {
    icon: <svg className="h-4 w-4 text-sale" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
    bg: 'bg-white border border-sale/20',
    text: 'text-sale',
    label: 'Failed',
    desc: tx.error || 'Something went wrong',
  };

  return (
    <div className={`animate-slide-up fixed bottom-6 right-6 z-50 max-w-sm ${config.bg} rounded-card p-3 shadow-lg`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{config.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold ${config.text}`}>{config.label}</span>
            <span className="text-[10px] text-mute">{config.desc}</span>
          </div>
          {tx.hash && (
            <a href={`https://stellar.expert/explorer/testnet/tx/${tx.hash}`} target="_blank" rel="noopener noreferrer"
              className="text-[10px] text-stone/60 hover:text-stellar-500 transition-colors inline-block mt-0.5">
              Tx: {tx.hash.slice(0, 12)}...
            </a>
          )}
        </div>
        {onDismiss && tx.status !== 'pending' && (
          <button onClick={onDismiss} className="text-mute/40 hover:text-mute transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};
