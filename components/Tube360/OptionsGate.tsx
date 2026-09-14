/**
 * TUBE360 OptionsGate — waits for (1) the context to hydrate from
 * localStorage and (2) the backend options to load, showing the same spinner
 * the other configurators use. On failure shows a retry card.
 *
 * Usage:
 *   <OptionsGate>{(options) => <YourPage options={options} />}</OptionsGate>
 */

import React from 'react';
import { useTube360 } from '../../context/Tube360Context';
import { useTube360Options } from '../../lib/tube360/api';
import { COLORS } from '../Trac360/styles';
import type { Tube360Options } from '../../types/tube360';

export default function OptionsGate({ children }: { children: (options: Tube360Options) => React.ReactNode }) {
  const { isHydrated } = useTube360();
  const { options, loading, error, retry } = useTube360Options();

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px] px-4">
        <div className="text-center max-w-md rounded-2xl p-8" style={{ background: 'rgba(255,255,255,0.9)', boxShadow: '0 8px 20px rgba(0,0,0,0.1)' }}>
          <p className="font-semibold mb-2" style={{ color: COLORS.grey.dark }}>
            We couldn&apos;t load the tube options.
          </p>
          <p className="text-sm mb-6" style={{ color: COLORS.grey.medium }}>
            {error}
          </p>
          <button
            onClick={retry}
            className="px-8 py-3 rounded-full font-semibold"
            style={{ background: COLORS.yellow.primary, color: '#000' }}
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!isHydrated || loading || !options) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p style={{ color: COLORS.grey.medium }}>Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children(options)}</>;
}
