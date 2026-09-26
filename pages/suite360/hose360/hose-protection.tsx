/**
 * HOSE360 Step 9 — Hose Protection. Always continues to pressure-testing
 * (Hose-Only mode's alternate branch isn't built, per DECISIONS.md §1).
 *
 * Round 3.5 fixes (owner's direct visual QA against HoseProtectionScreen.js):
 * - Buttons were `w-full` inside a max-w-3xl container, reading as way too
 *   wide. The OG caps these at `Math.min(320, screenWidth * 0.8)` — matched
 *   that here (320px, centred), same width used for the fitting-type/shape/
 *   size buttons elsewhere in this flow.
 * - The OG's title/subtitle copy ("Hose PROTECTION (Optional)" / "Get your
 *   Hose Protected — Safety and Long Life" / "*Hose Protection Prices
 *   Applied On Hose Lengths Only") was missing entirely bar the bare title
 *   pill. Restored verbatim.
 * - No hover feedback. Added the same hoverScale + hoverGlow pattern used
 *   on the fitting-type buttons (FittingTypeChooser.tsx).
 * - Price was shown as a raw "+30%" style percentage. The OG instead shows
 *   the actual computed dollar amount that option would ADD
 *   (`initialPrice * (multiplier - 1)`, HoseProtectionScreen.js:270) — a
 *   customer sees what they'd actually pay, not a percentage they have to
 *   do the math on themselves. `config.breakdown.assemblySubtotal` (from
 *   the last successful /api/hose360/price call — base hose + both end
 *   fittings, before any protection uplift) is exactly the OG's
 *   `initialPrice`, so the same formula applies directly.
 */

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Hose360Layout from '../../../components/Hose360/Layout/Hose360Layout';
import BackButton from '../../../components/Trac360/Shared/BackButton';
import ContinueButton from '../../../components/Trac360/Shared/ContinueButton';
import { useHose360 } from '../../../context/Hose360Context';
import { COLORS, GLASS_CARD, GLASS_CARD_SELECTED, hoverScale } from '../../../components/Trac360/styles';
import FittingsReminder from '../../../components/Hose360/Shared/FittingsReminder';
import Hose360OptionsGate from '../../../components/Hose360/Layout/Hose360OptionsGate';
import type { Hose360Options, Hose360ProtectionOption } from '../../../types/hose360';

function ProtectionButton({
  option,
  selected,
  priceText,
  onClick,
}: {
  option: Hose360ProtectionOption;
  selected: boolean;
  priceText: string;
  onClick: () => void;
}) {
  const baseStyle = selected ? GLASS_CARD_SELECTED : GLASS_CARD;
  const { transition, ...glassStyle } = baseStyle as any;

  return (
    <motion.button
      onClick={onClick}
      style={{ ...glassStyle, position: 'relative', width: 400, maxWidth: '100%', overflow: 'hidden' }}
      className={`h360-selectable ${selected ? 'h360-selected' : ''} flex flex-row items-center gap-4 text-left py-4 px-4`}
      whileHover={selected ? undefined : hoverScale}
      whileTap={{ scale: 0.98 }}
    >
      {option.image && (
        <div className="relative w-24 h-24 flex-shrink-0">
          <Image src={option.image} alt={option.label} width={96} height={96} className="object-contain" unoptimized />
        </div>
      )}
      <div className="flex-1 flex items-center justify-between gap-3 relative">
        <span className="text-sm font-semibold" style={{ color: COLORS.grey.dark }}>
          {option.label}
        </span>
        {priceText && (
          <span
            className="inline-block px-3 py-1 rounded-full text-sm font-semibold whitespace-nowrap"
            style={{ color: '#000', background: 'rgba(250, 204, 21, 0.9)' }}
          >
            {priceText}
          </span>
        )}
      </div>
    </motion.button>
  );
}

function HoseProtectionInner({ options }: { options: Hose360Options }) {
  const router = useRouter();
  const { config, setProtection } = useHose360();

  useEffect(() => {
    if (config.cutLengths.length === 0) {
      router.replace('/suite360/hose360');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.cutLengths]);

  if (config.cutLengths.length === 0) return null;

  // Select-then-Continue (round 3.7): a click only marks the option; the
  // Continue button (disabled until protectionChosen) navigates. Same
  // memory rules as Orientation — protectionChosen survives Back, and is
  // cleared in Hose360Context whenever an upstream fitting/hose changes.
  const handleContinue = () => {
    if (!config.protectionChosen) return;
    router.push('/suite360/hose360/pressure-testing');
  };

  // The pre-protection assembly subtotal (base hose + both end fittings) —
  // matches the OG's `initialPrice`. Falls back to null (no price shown)
  // if a price hasn't resolved yet, rather than showing a wrong number.
  const assemblySubtotal = config.breakdown?.assemblySubtotal as number | undefined;

  const priceTextFor = (p: Hose360ProtectionOption) => {
    if (p.multiplier === 1) return '';
    if (typeof assemblySubtotal !== 'number') return '';
    return `A$ ${(assemblySubtotal * (p.multiplier - 1)).toFixed(2)}`;
  };

  return (
    <Hose360Layout currentStep={9} totalSteps={11}>
      <FittingsReminder />
      <BackButton onClick={() => router.push('/suite360/hose360/cut-lengths')} />

      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-2">
          <div className="inline-block px-8 py-3 rounded-full text-white text-lg font-semibold leading-tight" style={{ background: COLORS.grey.dark }}>
            Hose PROTECTION
            <br />
            (Optional)
          </div>
        </div>

        <p className="text-center text-sm font-semibold mt-4" style={{ color: COLORS.yellow.primary }}>
          Get your Hose Protected
          <br />
          Safety and Long Life
        </p>

        <p className="text-center text-xs font-semibold mt-2 mb-8" style={{ color: COLORS.grey.dark }}>
          *Hose Protection Prices Applied
          <br />
          On Hose Lengths Only
        </p>

        {/* Reverted to plain vertical single-column list per
            DECISIONS_ADDENDUM_2.md §5 — matches HoseProtectionScreen.js's
            scrollViewContent (alignItems:'center', no wrap/row). No fade
            transition here — that enhancement is U3b-only. */}
        <div className="flex flex-col items-center gap-4">
          {options.protectionOptions.map((p) => (
            <ProtectionButton
              key={p.label}
              option={p}
              selected={config.protectionChosen && config.selectedProtection === p.label}
              priceText={priceTextFor(p)}
              onClick={() => setProtection(p.label)}
            />
          ))}
        </div>

        <div className="flex justify-center mt-8 mb-12">
          <ContinueButton onClick={handleContinue} disabled={!config.protectionChosen} />
        </div>
      </div>
    </Hose360Layout>
  );
}

export default function HoseProtection() {
  return <Hose360OptionsGate>{(options) => <HoseProtectionInner options={options} />}</Hose360OptionsGate>;
}
