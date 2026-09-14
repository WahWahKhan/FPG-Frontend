/**
 * TUBE360 Layout — progress indicator + centred content.
 * Same structure as components/Function360/Layout/Function360Layout.tsx,
 * without the floating price bar (Tube360 prices come from the server on the
 * summary page only).
 */

import React from 'react';
import ProgressIndicator from '../Trac360/Layout/ProgressIndicator';

export const TUBE360_TOTAL_STEPS = 4;

interface Tube360LayoutProps {
  currentStep: number;
  children: React.ReactNode;
}

export default function Tube360Layout({ currentStep, children }: Tube360LayoutProps) {
  return (
    <div className="min-h-screen pb-12">
      <div className="pt-8">
        <ProgressIndicator current={currentStep} total={TUBE360_TOTAL_STEPS} />
      </div>
      <div className="container mx-auto px-4 py-8 max-w-7xl">{children}</div>
    </div>
  );
}
