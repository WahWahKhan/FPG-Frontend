/**
 * FUNCTION360 OptionsGate — waits for the backend catalogue
 * (/api/function360/options) to load before rendering a configurator page.
 * Mirrors Trac360OptionsGate / Tube360's OptionsGate.
 *
 * Usage:
 *   <Function360OptionsGate>{(options) => <YourPage options={options} />}</Function360OptionsGate>
 */

import React from 'react';
import { useFunction360Options } from '../../../lib/function360/api';
import { COLORS } from '../../Trac360/styles';

export default function Function360OptionsGate({ children }: { children: (options: any) => React.ReactNode }) {
  const { options, loading, error, retry } = useFunction360Options();

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px] px-4">
        <div className="text-center max-w-md rounded-2xl p-8" style={{ background: 'rgba(255,255,255,0.9)', boxShadow: '0 8px 20px rgba(0,0,0,0.1)' }}>
          <p className="font-semibold mb-2" style={{ color: COLORS.grey.dark }}>
            We couldn&apos;t load the Function360 options.
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

  if (loading || !options) {
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
