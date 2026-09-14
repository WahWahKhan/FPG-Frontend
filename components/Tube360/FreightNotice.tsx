/**
 * TUBE360 FreightNotice - shown whenever the tube is longer than the freight
 * threshold (1000 mm). Same look and wording as the Steel Tubes product-page
 * note (pages/products/[id].tsx SteelTubesShippingNote) so customers get the
 * same message wherever long tubes are ordered.
 *
 * Values come from GET /api/tube360/options (options.freight), never hardcoded.
 */

import { FiInfo } from 'react-icons/fi';
import type { Tube360Options } from '../../types/tube360';

interface FreightNoticeProps {
  options: Tube360Options;
  /** Raw or numeric total length in mm. */
  totalLengthMm: string | number;
}

export default function FreightNotice({ options, totalLengthMm }: FreightNoticeProps) {
  const length = typeof totalLengthMm === 'number' ? totalLengthMm : parseInt(totalLengthMm, 10);
  const { oversizeThresholdMm, oversizeShipping } = options.freight;
  if (!Number.isFinite(length) || length <= oversizeThresholdMm) return null;

  const metres = oversizeThresholdMm / 1000;
  return (
    <div className="flex items-start gap-3 rounded-xl border border-yellow-300 bg-yellow-50 px-4 py-3" role="note">
      <FiInfo className="text-yellow-600 text-xl flex-shrink-0 mt-0.5" aria-hidden="true" />
      <p className="text-sm text-gray-700">
        Tubes longer than {metres} metre are shipped at a flat A${oversizeShipping} to cover the additional
        freight required for longer lengths. This is the actual cost of freight &mdash; we don&apos;t add a
        margin to shipping charges.
      </p>
    </div>
  );
}
