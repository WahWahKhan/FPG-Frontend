/**
 * HOSE360 shared fitting-TYPE chooser (BSP/JIC/Metric/ORFS/Code61/Code62).
 * Used by both end1-fitting.tsx and end2-fitting.tsx — the SAE gating rule
 * (only show Code 61/62 when selectedHose.size is 3/4" or 1") is identical
 * for both ends and keyed off the same config.selectedHose.size.
 *
 * Round 3 (visual QA item 4/6): heading text/order matched to the reference
 * deployment ("Select END {end} Thread" with the number in a small yellow
 * circular badge), a hero thread-diagram image + "END {end}" numbered badge
 * added under the heading, buttons narrowed to a fixed max-width instead of
 * spanning edge-to-edge, and each button now has a small circular "?" help
 * icon in its top-right corner opening a FittingHelpModal.
 *
 * Round 3.5 fixes (owner's direct visual QA against the reference
 * deployment, both ends):
 * - Hero image: was the static `end{n}_thread_diagram.png`; the reference
 *   deployment actually serves `end{n}_thread_diagram.gif` (confirmed via
 *   its own network requests) showing a single hose, not the multi-hose
 *   bundle png we'd picked. Swapped to the .gif (copied from
 *   HoseCalculator/assets/ — round 1 had excluded it as an assumed unused
 *   duplicate, which was wrong for this specific screen).
 * - Help modal content: was a generated one-line description; the
 *   reference's actual "?" modal shows the OG's dedicated
 *   `<family>_help.png` thread-measurement reference image (Male/Female
 *   diagrams + Thread Size -> Diameter table baked into the image),
 *   confirmed live by opening the reference deployment's own modal. Now
 *   passes the real per-family help image instead of text.
 * - Hover feedback: the previous `whileHover={{ scale: 1.01 }}` was too
 *   subtle to read as an animation. Switched to the same richer
 *   hoverScale + hoverGlow (mouse-enter/leave driven glow overlay) pattern
 *   `components/Trac360/SelectionCard.tsx` already uses elsewhere in this
 *   codebase, for consistency.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { COLORS, GLASS_CARD, hoverScale } from '../../Trac360/styles';
import FittingHelpModal from './FittingHelpModal';
import type { Hose360Options } from '../../../types/hose360';

interface FittingTypeChooserProps {
  options: Hose360Options;
  hoseSize: string;
  end: 1 | 2;
  onPick: (route: string) => void;
}

const HELP_IMAGE: Record<string, string> = {
  BSP: '/hose360/bsp_help.png',
  JIC: '/hose360/jic_help.png',
  Metric: '/hose360/metric_help.png',
  ORFS: '/hose360/orfs_help.png',
  'SAE Code 61': '/hose360/code61_help.png',
  'SAE Code 62': '/hose360/code62_help.png',
};

function TypeButton({ label, route, onPick, onHelp }: { label: string; route: string; onPick: (route: string) => void; onHelp: (label: string) => void }) {
  const { transition, ...glassStyle } = GLASS_CARD as any;

  return (
    <motion.button
      onClick={() => onPick(route)}
      style={{ ...glassStyle, position: 'relative', width: '100%', maxWidth: 320, overflow: 'hidden' }}
      className="h360-selectable text-center py-5"
      whileHover={hoverScale}
      whileTap={{ scale: 0.98 }}
    >
      <span className="relative text-lg font-semibold" style={{ color: COLORS.grey.dark }}>
        {label}
      </span>
      <span
        role="button"
        tabIndex={0}
        aria-label={`About ${label}`}
        onClick={(e) => {
          e.stopPropagation();
          onHelp(label);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.stopPropagation();
            onHelp(label);
          }
        }}
        className="inline-flex items-center justify-center"
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          width: 22,
          height: 22,
          borderRadius: '50%',
          background: 'rgba(0,0,0,0.08)',
          color: COLORS.grey.dark,
          fontSize: 12,
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        ?
      </span>
    </motion.button>
  );
}

export default function FittingTypeChooser({ options, hoseSize, end, onPick }: FittingTypeChooserProps) {
  const isSAEEligible = options.saeFittings.saeEligibleHoseSizes.includes(hoseSize);
  const [helpFor, setHelpFor] = useState<string | null>(null);

  const buttons: { label: string; route: string }[] = [
    { label: 'BSP', route: `end${end}-bsp` },
    { label: 'JIC', route: `end${end}-jic` },
    { label: 'Metric', route: `end${end}-metric` },
    { label: 'ORFS', route: `end${end}-orfs` },
  ];

  if (isSAEEligible) {
    buttons.push({ label: 'SAE Code 61', route: `end${end}-sae-61` });
    buttons.push({ label: 'SAE Code 62', route: `end${end}-sae-62` });
  }

  return (
    <div className="max-w-3xl mx-auto px-4">
      <div className="text-center mb-6">
        <div
          className="inline-flex items-center gap-2 px-8 py-3 rounded-full text-white text-lg font-semibold"
          style={{ background: COLORS.grey.dark }}
        >
          <span>Select END</span>
          <span
            className="inline-flex items-center justify-center rounded-full text-sm font-bold"
            style={{ width: 24, height: 24, background: COLORS.yellow.primary, color: '#000' }}
          >
            {end}
          </span>
          <span>Thread</span>
        </div>
      </div>

      {/* Hero thread-diagram image + numbered "END n" badge, matching the
          reference deployment's layout above the button list. Round 3.5:
          uses the animated .gif (the reference's actual asset), not the
          static multi-hose-bundle .png. */}
      <div className="flex flex-col items-center mb-8">
        {/* Round 3.6: enlarged from max-w-xs/h-40 (320x160) — was reading
            too small for a diagram customers need to actually study. */}
        <div className="relative w-full max-w-sm h-56">
          <Image
            src={`/hose360/end${end}_thread_diagram.gif`}
            alt={`End ${end} thread diagram`}
            layout="fill"
            objectFit="contain"
            unoptimized
          />
        </div>
        <div className="flex flex-col items-center mt-2">
          <span className="text-xs font-semibold tracking-wide" style={{ color: COLORS.grey.medium }}>
            END
          </span>
          <span
            className="inline-flex items-center justify-center rounded-full text-sm font-bold mt-1"
            style={{ width: 26, height: 26, background: COLORS.yellow.primary, color: '#000' }}
          >
            {end}
          </span>
        </div>
      </div>

      {/* Vertical single-column stack, narrowed (not full-width) per round 3
          visual QA item 4 — matches the reference deployment's button
          proportions more closely than the previous edge-to-edge rows. */}
      <div className="flex flex-col gap-3 items-center">
        {buttons.map((b) => (
          <TypeButton key={b.route} label={b.label} route={b.route} onPick={onPick} onHelp={setHelpFor} />
        ))}
      </div>

      <FittingHelpModal
        isOpen={helpFor !== null}
        onClose={() => setHelpFor(null)}
        title={helpFor || ''}
        image={helpFor ? HELP_IMAGE[helpFor] || '' : ''}
      />
    </div>
  );
}
