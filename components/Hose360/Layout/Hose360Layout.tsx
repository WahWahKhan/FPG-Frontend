/**
 * HOSE360 Layout Component — main wrapper for all configurator pages.
 * Mirrors Function360Layout exactly (progress indicator + floating price bar).
 */

import React from 'react';
import ProgressIndicator from '../../Trac360/Layout/ProgressIndicator';
import Hose360PriceBar from './Hose360PriceBar';

interface Hose360LayoutProps {
  /** Current step number (1-11) */
  currentStep: number;
  /** Total number of steps (11) */
  totalSteps: number;
  children: React.ReactNode;
  className?: string;
  /** Hide the floating price bar (e.g. on the Welcome/hose-selection steps before any price exists) */
  showPriceBar?: boolean;
}

export default function Hose360Layout({
  currentStep,
  totalSteps,
  children,
  className = '',
  showPriceBar = true,
}: Hose360LayoutProps) {
  return (
    <div
      className={`min-h-screen ${showPriceBar ? '' : 'pb-12'} ${className}`}
      style={showPriceBar ? { paddingBottom: 'var(--hose360-pricebar-clearance, 220px)' } : undefined}
    >
      <div className="pt-8">
        <ProgressIndicator current={currentStep} total={totalSteps} />
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">{children}</div>

      {showPriceBar && <Hose360PriceBar />}
    </div>
  );
}
