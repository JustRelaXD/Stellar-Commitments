import React from 'react';

interface WalletConnectProps {
  address: string;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
}

export const WalletConnect: React.FC<WalletConnectProps> = ({
  address,
  isConnected,
  isConnecting,
  error,
  onConnect,
  onDisconnect,
}) => {
  const shortAddress = address
    ? `${address.slice(0, 4)}...${address.slice(-4)}`
    : '';

  return (
    <div className="flex items-center gap-3">
      {isConnected ? (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm text-emerald-400 font-mono">{shortAddress}</span>
          </div>
          <button
            onClick={onDisconnect}
            className="px-3 py-1.5 text-sm text-gray-400 hover:text-red-400 transition-colors"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <button
          onClick={onConnect}
          disabled={isConnecting}
          className="btn-primary flex items-center gap-2"
        >
          {isConnecting ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Connecting...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Connect Wallet
            </>
          )}
        </button>
      )}
      {error && (
        <div className="text-sm text-red-400 animate-fade-in">
          {error}
        </div>
      )}
    </div>
  );
};
