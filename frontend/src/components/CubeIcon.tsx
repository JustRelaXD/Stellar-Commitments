import React from 'react';

interface CubeIconProps {
  className?: string;
  strokeWidth?: number;
}

/**
 * Cube/block icon - the Stellar Commitment brand mark.
 * Used in the header logo, the "No Commitments Yet" empty state,
 * and the onboarding hero. Shared so the path never drifts.
 */
export const CubeIcon: React.FC<CubeIconProps> = ({ className, strokeWidth = 1.5 }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={strokeWidth} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);
