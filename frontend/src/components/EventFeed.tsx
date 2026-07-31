import React, { useRef, useEffect } from 'react';
import type { ContractEvent } from '../types';

interface EventFeedProps {
  events: ContractEvent[];
  userAddress: string;
}

const eventConfig = {
  vault_created: {
    icon: <svg className="w-4 h-4 text-stellar-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
    label: 'Commitment Created',
    bg: 'bg-stellar-500/5 border-stellar-500/10',
  },
  checked_in: {
    icon: <svg className="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
    label: 'Checked In',
    bg: 'bg-success/5 border-success/10',
  },
  vault_settled: {
    icon: <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>,
    label: 'Commitment Settled',
    bg: 'bg-amber-500/5 border-amber-500/10',
  },
};

export const EventFeed: React.FC<EventFeedProps> = ({ events, userAddress }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = 0; }, [events.length]);

  const formatTime = (ts: number) => {
    const diff = Date.now() - ts;
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  return (
    <div className="border border-hairline-soft rounded-card p-5 bg-white">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-stellar-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          <h3 className="text-sm font-semibold">Activity</h3>
        </div>
        <span className="text-[10px] text-mute">{events.length} events</span>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-mute">No activity yet</p>
          <p className="text-[10px] text-mute/60 mt-1">Commitment creation, check-ins, and settlements appear here</p>
        </div>
      ) : (
        <div ref={scrollRef} className="space-y-1.5 max-h-80 overflow-y-auto">
          {events.map((event, i) => {
            const config = eventConfig[event.type] || eventConfig.vault_created;
            const isUser = !!(userAddress && (
              String(event.data.owner || '') === userAddress ||
              String(event.data.user || '') === userAddress
            ));
            return (
              <div key={`${event.txHash || i}-${i}`}
                className={`${config.bg} border rounded-lg px-3 py-2.5 transition-all animate-fade-in ${isUser ? 'ring-1 ring-stellar-500/10' : ''}`}>
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5">{config.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-medium">{config.label}</span>
                      {isUser && <span className="text-[9px] px-1.5 py-0.5 bg-stellar-500/10 text-stellar-600 rounded-pill">You</span>}
                    </div>
                    <p className="text-[11px] text-mute mt-0.5 truncate">{renderEventDescription(event)}</p>
                    <p className="text-[9px] text-stone/60 mt-0.5">
                      {formatTime(event.timestamp)}
                      {event.txHash && ` · ${event.txHash.slice(0, 8)}...`}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

function renderEventDescription(event: ContractEvent): string {
  switch (event.type) {
    case 'vault_created': return `Commitment #${event.data.vault_id} — ${event.data.stake} XLM staked`;
    case 'checked_in': return `Commitment #${event.data.vault_id} — check-in ${event.data.count || ''}${event.data.required ? `/${event.data.required}` : ''}`;
    case 'vault_settled': return `Commitment #${event.data.vault_id} — settled`;
    default: return JSON.stringify(event.data);
  }
}
