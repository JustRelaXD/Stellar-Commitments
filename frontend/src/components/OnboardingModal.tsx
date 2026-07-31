import React from 'react';
import { CubeIcon } from './CubeIcon';

interface OnboardingModalProps {
  onDismiss: () => void;
  onConnect?: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ onDismiss, onConnect }) => {
  const steps = [
    {
      num: '1',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
        </svg>
      ),
      title: 'Connect your wallet',
      desc: 'Link Freighter, Lobstr, or any Stellar wallet to get started.',
    },
    {
      num: '2',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: 'Create a commitment',
      desc: 'Set your goal, pick a duration, and stake XLM as your promise.',
    },
    {
      num: '3',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: 'Check in regularly',
      desc: 'Meet your check-in target to earn back every XLM you staked.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onDismiss} />

      {/* Modal - much wider now */}
      <div className="relative bg-white rounded-2xl border border-hairline-soft shadow-2xl max-w-4xl w-full animate-scale-in overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button onClick={onDismiss}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center text-stone-400 hover:text-ink transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* ---- Top hero section ---- */}
        <div className="px-10 pt-8 pb-0 text-center">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-stellar-400 to-stellar-600 shadow-lg flex items-center justify-center mx-auto mb-3">
            <CubeIcon className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight">Stellar Commitment</h2>
          <p className="text-base text-mute mt-1.5 max-w-lg mx-auto">
            Set a goal, stake XLM, check in regularly, and earn it all back —
            or send what you miss to a beneficiary.
          </p>
        </div>

        {/* ---- Steps in a horizontal row ---- */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 px-10 mt-5">
          {steps.map(({ num, icon, title, desc }) => (
            <div key={num}
              className="relative flex flex-col items-center text-center p-4 rounded-xl border border-hairline-soft bg-white hover:shadow-sm hover:border-hairline transition-all group">
              {/* Step number badge */}
              <span className="absolute -top-2.5 -left-2.5 w-7 h-7 rounded-full bg-ink text-white flex items-center justify-center text-xs font-bold shadow-sm">
                {num}
              </span>
              {/* Icon */}
              <div className="w-11 h-11 rounded-full bg-stellar-500/5 border border-stellar-500/10 flex items-center justify-center text-stellar-500 mb-2 group-hover:bg-stellar-500/10 transition-colors">
                {icon}
              </div>
              <h3 className="text-sm font-semibold text-ink mb-1">{title}</h3>
              <p className="text-xs text-mute leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* ---- Divider ---- */}
        <div className="flex items-center gap-3 px-10 mt-4 mb-3">
          <div className="flex-1 h-px bg-hairline-soft" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-stone-300">How it works</span>
          <div className="flex-1 h-px bg-hairline-soft" />
        </div>

        {/* ---- How it works - 2x2 grid ---- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-10 pb-4">
          {/* Card 1: Stake */}
          <div className="p-3.5 rounded-xl border border-hairline-soft bg-soft-cloud/20 hover:bg-soft-cloud/40 transition-colors">
            <div className="flex items-center gap-2.5 mb-2">
              <span className="w-8 h-8 rounded-lg bg-stellar-500/10 text-stellar-600 flex items-center justify-center text-sm font-bold">$</span>
              <h4 className="text-sm font-semibold">You stake XLM</h4>
            </div>
            <p className="text-xs text-mute leading-relaxed">
              Your XLM is locked in the contract until the deadline. No one can touch it — not even you.
            </p>
          </div>

          {/* Card 2: Check in */}
          <div className="p-3.5 rounded-xl border border-hairline-soft bg-soft-cloud/20 hover:bg-soft-cloud/40 transition-colors">
            <div className="flex items-center gap-2.5 mb-2">
              <span className="w-8 h-8 rounded-lg bg-success/10 text-success flex items-center justify-center text-sm font-bold">✓</span>
              <h4 className="text-sm font-semibold">You check in</h4>
            </div>
            <p className="text-xs text-mute leading-relaxed">
              Each check-in earns back a proportional share of your stake. Hit your target to get everything back.
            </p>
          </div>

          {/* Card 3: Two penalty modes (now merged into one card, old card 4 removed) */}
          <div className="p-3.5 rounded-xl border border-hairline-soft bg-soft-cloud/20 hover:bg-soft-cloud/40 transition-colors">
            <div className="flex items-center gap-2.5 mb-2">
              <span className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center text-sm font-bold">!</span>
              <h4 className="text-sm font-semibold">Two penalty modes</h4>
            </div>
            <p className="text-xs text-mute leading-relaxed">
              <strong>Default:</strong> proportional — miss some, only the unearned portion goes to your beneficiary.
              <br /><strong>Strict:</strong> enable the &ldquo;strict penalty&rdquo; toggle. Complete less than 50% of
              check-ins and <em className="text-amber-600 not-italic font-medium">your entire stake</em> goes to the beneficiary.
              Hit 50%+ to earn back proportionally.
            </p>
          </div>

          {/* Card 4: Beneficiary */}
          <div className="p-3.5 rounded-xl border border-hairline-soft bg-soft-cloud/20 hover:bg-soft-cloud/40 transition-colors">
            <div className="flex items-center gap-2.5 mb-2">
              <span className="w-8 h-8 rounded-lg bg-stellar-500/10 text-stellar-600 flex items-center justify-center text-sm font-bold">@</span>
              <h4 className="text-sm font-semibold">Pick a beneficiary</h4>
            </div>
            <p className="text-xs text-mute leading-relaxed">
              Name a friend, a charity, or anyone with a Stellar address. If you fall short, the slashed
              XLM goes to them. Leave it blank and the funds are burned — locked in the contract forever,
              unreachable by anyone.
            </p>
          </div>
        </div>

        {/* ---- Footer / CTA ---- */}
        <div className="bg-soft-cloud/40 border-t border-hairline-soft px-10 py-4 flex items-center justify-between gap-4">
          <p className="text-[10px] text-stone-400 hidden sm:block">
            Powered by Stellar Soroban smart contracts
          </p>
          <button onClick={() => { onDismiss(); onConnect?.(); }}
            className="btn-primary text-sm shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            Connect Wallet to Start
          </button>
        </div>
      </div>
    </div>
  );
};
