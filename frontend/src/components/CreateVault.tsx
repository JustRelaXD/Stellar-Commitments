import React, { useState } from 'react';

interface CreateVaultProps {
  onCreateVault: (description: string, days: number, checkIns: number, stake: number) => Promise<void>;
  disabled: boolean;
}

export const CreateVault: React.FC<CreateVaultProps> = ({ onCreateVault, disabled }) => {
  const [description, setDescription] = useState('');
  const [days, setDays] = useState(7);
  const [checkIns, setCheckIns] = useState(7);
  const [stake, setStake] = useState(10);
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;
    setIsCreating(true);
    try {
      await onCreateVault(description, days, checkIns, stake);
      setDescription('');
    } catch {
      // Error handled by parent
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="card">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-stellar-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        Create New Vault
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Goal Description</label>
          <input
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="e.g., Code 2 hours daily for a week"
            className="input-field"
            required
            maxLength={64}
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Duration (days)</label>
            <input
              type="number"
              value={days}
              onChange={e => setDays(Math.max(1, Number(e.target.value)))}
              className="input-field"
              min={1}
              max={365}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Check-ins Needed</label>
            <input
              type="number"
              value={checkIns}
              onChange={e => setCheckIns(Math.max(1, Number(e.target.value)))}
              className="input-field"
              min={1}
              max={100}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Stake (XLM)</label>
            <input
              type="number"
              value={stake}
              onChange={e => setStake(Math.max(1, Number(e.target.value)))}
              className="input-field"
              min={1}
              max={10000}
              step={0.1}
            />
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-xl p-4 text-sm text-gray-400 space-y-1">
          <p className="flex items-center gap-2">
            <svg className="w-4 h-4 text-stellar-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Complete <strong className="text-gray-300">{checkIns}</strong> check-ins in <strong className="text-gray-300">{days}</strong> days</span>
          </p>
          <p className="flex items-center gap-2">
            <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Stake <strong className="text-gray-300">{stake} XLM</strong> — proportional return on partial completion</span>
          </p>
          <p className="flex items-center gap-2">
            <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span>Missed check-ins are proportionally donated to charity</span>
          </p>
        </div>

        <button
          type="submit"
          disabled={disabled || isCreating || !description.trim()}
          className="btn-primary w-full"
        >
          {isCreating ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Creating...
            </span>
          ) : (
            'Create Vault & Stake'
          )}
        </button>
      </form>
    </div>
  );
};
