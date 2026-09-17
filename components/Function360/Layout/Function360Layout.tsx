/**
 * FUNCTION360 Layout Component
 * Main wrapper for all configurator pages
 * Provides consistent structure with progress indicator and price bar
 */

import React from 'react';
import ProgressIndicator from '../../Trac360/Layout/ProgressIndicator';
import Function360PriceBar from '../Layout/Function360PriceBar';

interface Function360LayoutProps {
  /** Current step number (1-9) */
  currentStep: number;
  /** Total number of steps (always 9) */
  totalSteps: number;
  /** Page content */
  children: React.ReactNode;
  /** Optional custom className */
  className?: string;
}

/**
 * Function360Layout - Main layout wrapper for configurator pages
 * 
 * Features:
 * - Responsive container with consistent padding
 * - Progress indicator at top (with extra spacing to clear header fade)
 * - Floating price bar at bottom (shows from step 2+ when components start)
 * - Bottom padding to prevent price bar overlap
 * 
 * @example
 * <Function360Layout currentStep={1} totalSteps={9}>
 *   <h1>Equipment Selection</h1>
 *   <SelectionGrid />
 * </Function360Layout>
 */
export default function Function360Layout({
  currentStep,
  totalSteps,
  children,
  className = '',
}: Function360LayoutProps) {
  // Show price bar from step 2 onwards (component selection begins)
  const showPriceBar = currentStep >= 2;

  return (
    <div
      className={`min-h-screen ${showPriceBar ? '' : 'pb-12'} ${className}`}
      style={showPriceBar ? { paddingBottom: 'var(--function360-pricebar-clearance, 220px)' } : undefined}
    >
      {/* Progress Indicator - Fixed at top with extra spacing */}
      <div className="pt-8">
        <ProgressIndicator current={currentStep} total={totalSteps} />
      </div>
      
      {/* Main Content Area */}
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {children}
      </div>
      
      {/* Floating Price Bar - Only show from step 2+ */}
      {showPriceBar && <Function360PriceBar />}
    </div>
  );
}