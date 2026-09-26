/**
 * HOSE360 Step 10 — Pressure Testing
 *
 * Round 3.7: brought in line with hose-protection.tsx — same 400px centred
 * buttons, hoverScale + hoverGlow, vivid solid-yellow price pill (same look
 * as the hose-size cards), and select-then-Continue instead of navigating
 * on click. Continue is disabled until the user has actually picked an
 * option (pressureChosen), stays enabled when returning via Back, and is
 * cleared by Hose360Context when an upstream fitting/hose selection really
 * changes — same rules as Orientation.
 */

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import Hose360Layout from '../../../components/Hose360/Layout/Hose360Layout';
import BackButton from '../../../components/Trac360/Shared/BackButton';
import ContinueButton from '../../../components/Trac360/Shared/ContinueButton';
import { useHose360 } from '../../../context/Hose360Context';
import { COLORS, GLASS_CARD, GLASS_CARD_SELECTED, hoverScale } from '../../../components/Trac360/styles';
import FittingsReminder from '../../../components/Hose360/Shared/FittingsReminder';
import Hose360OptionsGate from '../../../components/Hose360/Layout/Hose360OptionsGate';
import type { Hose360Options, Hose360PressureTestOption } from '../../../types/hose360';

function PressureButton({
  option,
  selected,
  onClick,
}: {
  option: Hose360PressureTestOption;
  selected: boolean;
  onClick: () => void;
}) {
  const baseStyle = selected ? GLASS_CARD_SELECTED : GLASS_CARD;
  const { transition, ...glassStyle } = baseStyle as any;
  const priceText =
    option.flatFee === 0 ? 'No extra charge' : `+A$${option.flatFee.toFixed(2)}${option.feeAppliedPerHose ? '/hose' : ''}`;

  return (
    <motion.button
      onClick={onClick}
      style={{ ...glassStyle, position: 'relative', width: 400, maxWidth: '100%', overflow: 'hidden' }}
      className={`h360-selectable ${selected ? 'h360-selected' : ''} flex flex-row items-center justify-between gap-4 text-left py-5 px-5`}
      whileHover={selected ? undefined : hoverScale}
      whileTap={{ scale: 0.98 }}
    >
      <span className="relative text-base font-semibold" style={{ color: COLORS.grey.dark }}>
        {option.label}
      </span>
      <span
        className="relative inline-block px-3 py-1 rounded-full text-sm font-semibold whitespace-nowrap"
        style={{ color: '#000', background: 'rgba(250, 204, 21, 0.9)' }}
      >
        {priceText}
      </span>
    </motion.button>
  );
}

function PressureTestingInner({ options }: { options: Hose360Options }) {
  const router = useRouter();
  const { config, setPressure } = useHose360();

  useEffect(() => {
    if (config.cutLengths.length === 0) {
      router.replace('/suite360/hose360');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.cutLengths]);

  if (config.cutLengths.length === 0) return null;

  const handleContinue = () => {
    if (!config.pressureChosen) return;
    router.push('/suite360/hose360/summary');
  };

  return (
    <Hose360Layout currentStep={10} totalSteps={11}>
      <FittingsReminder />
      <BackButton onClick={() => router.push('/suite360/hose360/hose-protection')} />

      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-8">
          <div className="inline-block px-8 py-3 rounded-full text-white text-lg font-semibold" style={{ background: COLORS.grey.dark }}>
            PRESSURE TESTING
          </div>
        </div>

        {/* Plain vertical single-column list per DECISIONS_ADDENDUM_2.md §5
            (text-only rows, no fade transition). */}
        <div className="flex flex-col items-center gap-4">
          {options.pressureTestOptions.map((p) => (
            <PressureButton
              key={p.label}
              option={p}
              selected={config.pressureChosen && config.selectedPressure === p.label}
              onClick={() => setPressure(p.label)}
            />
          ))}
        </div>

        <div className="flex justify-center mt-8 mb-12">
          <ContinueButton onClick={handleContinue} disabled={!config.pressureChosen} />
        </div>
      </div>
    </Hose360Layout>
  );
}

export default function PressureTesting() {
  return <Hose360OptionsGate>{(options) => <PressureTestingInner options={options} />}</Hose360OptionsGate>;
}
