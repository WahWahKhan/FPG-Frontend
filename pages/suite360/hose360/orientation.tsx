/**
 * HOSE360 Step 7 — Orientation (only reached when neither end is a Straight
 * shape). No price impact — literal "*No Extra Charges*" text per plan.
 *
 * Round 3.6 fixes (owner's direct visual QA):
 * - "NOT SURE" card was missing the OG's explanatory subtext
 *   (OrientationSelectionScreen.js's NotSureButton: "Click Here if you're
 *   Unsure and" / "we'll contact you to understand your Requirements") —
 *   restored verbatim.
 * - No hover feedback — added the same hoverScale + hoverGlow pattern used
 *   on the fitting-type/protection buttons elsewhere in this flow.
 * - Picking an angle used to navigate immediately (setOrientation + push in
 *   the same click), so the selection was never actually visible before the
 *   page changed. Now a click only marks the card selected
 *   (config.selectedAngle, already the source of the "selected" style) and
 *   a Continue button (disabled until something's selected) does the actual
 *   navigation — same select-then-continue pattern as every other step.
 *   Because config.selectedAngle persists across Back navigation and is
 *   only cleared by Hose360Context when end1/end2's fitting *actually
 *   changes* (see the setEnd1Fitting/setEnd2Fitting fix in
 *   context/Hose360Context.tsx — re-picking the identical fitting no longer
 *   wipes it), arriving here via Back with an unchanged prior selection
 *   shows Continue already enabled; arriving after a genuinely different
 *   end1/end2 pick shows it correctly disabled again.
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
import type { Hose360Options, Hose360OrientationAngle } from '../../../types/hose360';

function AngleButton({
  angle,
  selected,
  onClick,
}: {
  angle: Hose360OrientationAngle;
  selected: boolean;
  onClick: () => void;
}) {
  const baseStyle = selected ? GLASS_CARD_SELECTED : GLASS_CARD;
  const { transition, ...glassStyle } = baseStyle as any;
  const isNotSure = angle.angle === 'NOT SURE';

  return (
    <motion.button
      onClick={onClick}
      style={{ ...glassStyle, position: 'relative', overflow: 'hidden' }}
      className={`h360-selectable ${selected ? 'h360-selected' : ''} flex flex-col items-center text-center py-4 px-2`}
      whileHover={selected ? undefined : hoverScale}
      whileTap={{ scale: 0.97 }}
    >
      {angle.image && (
        <div className="relative w-16 h-16 mb-2">
          <Image src={angle.image} alt={angle.angle} width={64} height={64} className="object-contain" unoptimized />
        </div>
      )}
      <span className="relative text-sm font-semibold" style={{ color: COLORS.grey.dark }}>
        {angle.angle}
      </span>
      {isNotSure && (
        <span className="relative text-xs mt-1 leading-tight" style={{ color: COLORS.grey.medium }}>
          Click Here if you&apos;re Unsure and we&apos;ll contact you to understand your Requirements
        </span>
      )}
    </motion.button>
  );
}

function OrientationInner({ options }: { options: Hose360Options }) {
  const router = useRouter();
  const { config, setOrientation } = useHose360();

  useEffect(() => {
    if (!config.end2Shape || !config.end2Size) {
      router.replace('/suite360/hose360');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.end2Shape, config.end2Size]);

  if (!config.end2Shape) return null;

  const handleContinue = () => {
    if (!config.selectedAngle) return;
    router.push('/suite360/hose360/cut-lengths');
  };

  return (
    <Hose360Layout currentStep={7} totalSteps={11} showPriceBar>
      <FittingsReminder />
      {/* Round 3.5 fix: same ping-pong issue as end2-fitting.tsx — a bare
          router.back() here is unsafe once end2's FittingFamilyPicker has
          done its own router.push() to reach this page. Push explicitly to
          the actual end2-* route the user visited. */}
      <BackButton onClick={() => router.push(`/suite360/hose360/${config.end2Route || 'end2-fitting'}`)} />

      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-2">
          <div className="inline-block px-8 py-3 rounded-full text-white text-lg font-semibold" style={{ background: COLORS.grey.dark }}>
            SELECT ORIENTATION
          </div>
        </div>
        <p className="text-center text-sm mb-8" style={{ color: COLORS.yellow.primary }}>
          *No Extra Charges*
        </p>

        <div className="grid grid-cols-3 sm:grid-cols-3 gap-4 mb-8">
          {options.orientationAngles.map((a) => (
            <AngleButton
              key={a.angle}
              angle={a}
              selected={config.selectedAngle === a.angle}
              onClick={() => setOrientation(a.angle)}
            />
          ))}
        </div>

        <div className="flex justify-center mb-12">
          <ContinueButton onClick={handleContinue} disabled={!config.selectedAngle} />
        </div>
      </div>
    </Hose360Layout>
  );
}

export default function Orientation() {
  return <Hose360OptionsGate>{(options) => <OrientationInner options={options} />}</Hose360OptionsGate>;
}
