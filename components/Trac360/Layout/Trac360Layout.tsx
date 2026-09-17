/**
 * TRAC360 Layout Component
 * Main wrapper for all configurator pages
 * Provides consistent structure with progress indicator and price bar
 */

import React from 'react';
import ProgressIndicator from '../Layout/ProgressIndicator';
import PriceBar from '../Layout/PriceBar';

interface Trac360LayoutProps {
  /** Current step number (1-6) */
  currentStep: number;
  /** Total number of steps (always 6) */
  totalSteps: number;
  /** Page content */
  children: React.ReactNode;
  /** Optional custom className */
  className?: string;
}

/**
 * Trac360Layout - Main layout wrapper for configurator pages
 * 
 * Features:
 * - Responsive container with consistent padding
 * - Progress indicator at top (with extra spacing to clear header fade)
 * - Floating price bar at bottom (only shows from step 4+)
 * - Bottom padding to prevent price bar overlap
 * 
 * @example
 * <Trac360Layout currentStep={1} totalSteps={6}>
 *   <h1>Tractor Information</h1>
 *   <SelectionGrid />
 * </Trac360Layout>
 */
export default function Trac360Layout({
  currentStep,
  totalSteps,
  children,
  className = '',
}: Trac360LayoutProps) {
  // Only show price bar from step 4 onwards (circuits, addons, summary)
  const showPriceBar = currentStep >= 4;

  return (
    <div
      className={`min-h-screen ${showPriceBar ? '' : 'pb-12'} ${className}`}
      style={showPriceBar ? { paddingBottom: 'var(--trac360-pricebar-clearance, 220px)' } : undefined}
    >
      {/* Progress Indicator - Fixed at top with extra spacing */}
      <div className="pt-8">
        <ProgressIndicator current={currentStep} total={totalSteps} />
      </div>
      
      {/* Main Content Area */}
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {children}
      </div>
      
      {/* Floating Price Bar - Only show from step 4+ */}
      {showPriceBar && <PriceBar />}
    </div>
  );
}