import React, { useState, useEffect, useRef } from 'react';
import { BURN_ADDRESS } from '../constants';

type DurationUnit = 'minutes' | 'hours' | 'days';

const UNIT_MULTIPLIER: Record<DurationUnit, number> = {
  minutes: 60,
  hours: 3600,
  days: 86400,
};

const UNIT_RANGES: Record<DurationUnit, { min: number; max: number }> = {
  minutes: { min: 1, max: 525600 },
  hours: { min: 1, max: 8760 },
  days: { min: 1, max: 365 },
};

// Convert a value from one unit to another
function convertUnit(value: number, from: DurationUnit, to: DurationUnit): number {
  const fromSec = value * UNIT_MULTIPLIER[from];
  return Math.round(fromSec / UNIT_MULTIPLIER[to]);
}

interface CreateCommitmentProps {
  onCreateVault: (
    description: string,
    durationSeconds: number,
    checkIns: number,
    stake: number,
    beneficiary: string,
    strictPenalty: boolean,
  ) => Promise<void>;
  disabled: boolean;
}

export const CreateCommitment: React.FC<CreateCommitmentProps> = ({ onCreateVault, disabled }) => {
  const [description, setDescription] = useState('');
  const [durationValue, setDurationValue] = useState(7);
  const [durationUnit, setDurationUnit] = useState<DurationUnit>('days');
  const [checkIns, setCheckIns] = useState(7);
  const [stake, setStake] = useState(10);
  const [beneficiary, setBeneficiary] = useState('');
  const [strictPenalty, setStrictPenalty] = useState(false);
  const [descriptionBlurred, setDescriptionBlurred] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unitOpen, setUnitOpen] = useState(false);
  const unitRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (unitRef.current && !unitRef.current.contains(e.target as Node)) setUnitOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Clear error when wallet disconnects
  useEffect(() => { if (disabled) setError(null); }, [disabled]);

  const handleUnitSwitch = (newUnit: DurationUnit) => {
    if (newUnit === durationUnit) { setUnitOpen(false); return; }
    const converted = convertUnit(durationValue, durationUnit, newUnit);
    setDurationValue(Math.max(1, converted));
    setDurationUnit(newUnit);
    setUnitOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;
    setError(null);
    setIsCreating(true);
    try {
      const durationSeconds = durationValue * UNIT_MULTIPLIER[durationUnit];
      const ben = beneficiary.trim() || BURN_ADDRESS;
      await onCreateVault(description, durationSeconds, checkIns, stake, ben, strictPenalty);
      setDescription('');
      setDescriptionBlurred(false);
      setBeneficiary('');
      setStrictPenalty(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message
        : typeof err === 'string' ? err
        : err && typeof err === 'object' && 'message' in err ? String((err as any).message)
        : 'Transaction failed. Check your wallet and try again.';
      setError(msg);
    } finally {
      setIsCreating(false);
    }
  };

  const { min, max } = UNIT_RANGES[durationUnit];

  return (
    <div className="border border-hairline-soft rounded-card p-5 bg-white animate-fade-in">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-full bg-stellar-500/5 border border-stellar-500/10 flex items-center justify-center">
          <svg className="w-5 h-5 text-stellar-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h2 className="text-base font-semibold">Create a Commitment</h2>
          <p className="text-xs text-mute">Set a goal, stake XLM, and commit to your goal</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="input-label">What are you committing to?</label>
          <input type="text" value={description} onChange={e => setDescription(e.target.value)}
            onBlur={() => setDescriptionBlurred(true)}
            placeholder="e.g., Code 2 hours daily for a week" className="input-field" required maxLength={64} />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="input-label">Duration</label>
            <div className="relative" ref={unitRef}>
              <input type="number" value={durationValue}
                onChange={e => setDurationValue(Math.max(min, Math.min(max, Number(e.target.value))))}
                className="input-field pr-16" min={min} max={max} />
              {/* Unit dropdown trigger */}
              <button type="button" onClick={() => setUnitOpen(o => !o)}
                className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-mute hover:text-ink bg-white px-1.5 py-0.5 rounded transition-colors">
                {durationUnit}
                <svg className={`w-3 h-3 transition-transform ${unitOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {/* Dropdown menu */}
              {unitOpen && (
                <div className="absolute right-0 top-full mt-1 w-28 bg-white border border-hairline-soft rounded-lg shadow-lg z-10 py-1 animate-scale-in overflow-hidden">
                  {(['days', 'hours', 'minutes'] as DurationUnit[]).map(u => (
                    <button key={u} type="button" onClick={() => handleUnitSwitch(u)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors ${
                        u === durationUnit
                          ? 'bg-stellar-500/10 text-stellar-600 font-medium'
                          : 'text-mute hover:bg-soft-cloud hover:text-ink'
                      }`}>
                      {u}
                      {u === durationUnit && (
                        <svg className="w-3.5 h-3.5 text-stellar-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div>
            <label className="input-label">Check-ins</label>
            <input type="number" value={checkIns} onChange={e => setCheckIns(Math.max(1, Number(e.target.value)))}
              className="input-field" min={1} max={100} />
          </div>
          <div>
            <label className="input-label">Stake</label>
            <div className="relative">
              <input type="number" value={stake} onChange={e => setStake(Math.max(1, Number(e.target.value)))}
                className="input-field pr-10" min={1} max={10000} step={0.1} />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-mute">XLM</span>
            </div>
          </div>
        </div>

        {/* Options section — appears once user types a name and clicks away */}
        {descriptionBlurred && description.trim().length > 0 && (
          <>
        {/* ── Divider between params and options ── */}
        <div className="flex items-center gap-3 animate-fade-in">
          <div className="flex-1 h-px bg-hairline-soft" />
          <span className="text-[9px] font-medium uppercase tracking-widest text-stone-300">Options</span>
          <div className="flex-1 h-px bg-hairline-soft" />
        </div>

        {/* Beneficiary + Strict Penalty - spacious section below the grid */}
        <div className="bg-soft-cloud/20 rounded-xl border border-hairline-soft p-4 space-y-4 animate-fade-in">
          {/* Beneficiary */}
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <svg className="w-4 h-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
              <label className="text-xs font-medium">Beneficiary <span className="text-stone-300 font-normal">(leave empty to burn)</span></label>
            </div>
            <input type="text" value={beneficiary} onChange={e => setBeneficiary(e.target.value)}
              placeholder="Friend's Stellar address (leave blank to burn slashed XLM)"
              className="input-field w-full" maxLength={56} />
            <p className="text-[10px] text-mute mt-1 leading-relaxed">
              If you miss your target, the slashed XLM is sent here. Leave blank to burn — the funds
              stay in the contract forever, unreachable by anyone.
            </p>
          </div>

          {/* Divider between beneficiary and penalty */}
          <div className="border-t border-hairline-soft" />

          {/* Strict penalty toggle */}
          <div className="flex items-start gap-3">
            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
              <input type="checkbox" checked={strictPenalty} onChange={e => setStrictPenalty(e.target.checked)}
                className="sr-only peer" />
              <div className="w-9 h-5 bg-stone-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-stellar-500/30 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-stellar-500"></div>
            </label>
            <div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286zm0 13.036h.008v.008H12v-.008z" />
                </svg>
                <label className="text-xs font-medium cursor-pointer" onClick={() => setStrictPenalty(p => !p)}>
                  Strict penalty mode
                </label>
                <span className="badge-amber text-[9px] leading-none">Optional</span>
              </div>
              <p className="text-[10px] text-mute leading-relaxed mt-1">
                When enabled: if you complete less than 50% of your required check-ins,
                <strong className="text-amber-600"> your entire stake</strong> goes to the beneficiary (or gets burned).
                Complete 50% or more, and you earn back proportionally.
              </p>
            </div>
          </div>
        </div>
          </>
        )}

        {/* Inline error message */}
        {error && (
          <div className="flex items-start gap-2 bg-sale/5 border border-sale/15 rounded-lg px-3 py-2.5">
            <svg className="w-4 h-4 text-sale shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <div className="text-xs text-sale leading-relaxed">{error}</div>
          </div>
        )}

        <button type="submit" disabled={disabled || isCreating || !description.trim()} className="btn-primary w-full">
          {isCreating ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Creating on Stellar...
            </span>
          ) : (
            <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>Commit & Stake {stake} XLM</>
          )}
        </button>
      </form>
    </div>
  );
};
