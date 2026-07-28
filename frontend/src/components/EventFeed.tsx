import React, { useRef, useEffect } from 'react';
import type { ContractEvent } from '../types';

interface EventFeedProps {
  events: ContractEvent[];
  userAddress: string;
}

const eventConfig = {
  vault_created: {
    icon: '🔒',
    label: 'Vault Created',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
  },
  checked_in: {
    icon: '✓',
    label: 'Checked In',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
  },
  vault_settled: {
    icon: '⚖️',
    label: 'Vault Settled',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/20',
  },
};

export const EventFeed: React.FC<EventFeedProps> = ({ events, userAddress }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [events.length]);

  const formatTime = (ts: number) => {
    const diff = Date.now() - ts;
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  if (events.length === 0) {
    return (
      <div className="card text-center py-8">
        <svg className="w-10 h-10 text-gray-600 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.413a4.5 4.5 0 00-6.364 0L5.248 10.03a4.5 4.5 0 01-1.242 7.244 4.5 4.5 0 005.367-2.885" />
        </svg>
        <p className="text-gray-500 text-sm">No events yet</p>
        <p className="text-gray-600 text-xs mt-1">Events will appear in real-time as vaults are created and check-ins happen</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold flex items-center gap-2">
          <svg className="w-4 h-4 text-stellar-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Live Activity
        </h3>
        <span className="text-xs text-gray-500">{events.length} events</span>
      </div>
      <div ref={scrollRef} className="space-y-2 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
        {events.map((event, i) => {
          const config = eventConfig[event.type] || eventConfig.vault_created;
          const isUser = event.data.owner === userAddress ||
            event.data.user === userAddress ||
            String(event.data.owner || '').includes(userAddress);

          return (
            <div
              key={`${event.txHash}-${i}`}
              className={`animate-slide-up ${config.bg} border rounded-xl p-3 transition-all hover:bg-opacity-20 ${
                isUser ? 'ring-1 ring-stellar-500/30' : ''
              }`}
            >
              <div className="flex items-start gap-2">
                <span className="text-lg mt-0.5">{config.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold ${config.color}`}>{config.label}</span>
                    {isUser && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-stellar-500/20 text-stellar-400 rounded-full">You</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">
                    {renderEventDescription(event)}
                  </p>
                  <p className="text-[10px] text-gray-600 mt-0.5">
                    {formatTime(event.timestamp)}
                    {event.txHash && ` · ${event.txHash.slice(0, 8)}...`}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

function renderEventDescription(event: ContractEvent): string {
  switch (event.type) {
    case 'vault_created':
      return `Vault #${event.data.vault_id} created with ${event.data.stake} XLM stake`;
    case 'checked_in':
      return `Vault #${event.data.vault_id} — Check-in ${event.data.count}/${event.data.required}`;
    case 'vault_settled':
      return `Vault #${event.data.vault_id} settled — returned ${event.data.returned} XLM`;
    default:
      return JSON.stringify(event.data);
  }
}
