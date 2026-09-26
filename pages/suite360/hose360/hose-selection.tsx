/**
 * HOSE360 Step 2 — Hose Selection
 */

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useRouter } from 'next/router';
import Hose360Layout from '../../../components/Hose360/Layout/Hose360Layout';
import BackButton from '../../../components/Trac360/Shared/BackButton';
import { useHose360 } from '../../../context/Hose360Context';
import { COLORS, GLASS_CARD, GLASS_CARD_SELECTED } from '../../../components/Trac360/styles';
import Hose360OptionsGate from '../../../components/Hose360/Layout/Hose360OptionsGate';
import type { Hose360Options } from '../../../types/hose360';

function HoseSelectionInner({ options }: { options: Hose360Options }) {
  const router = useRouter();
  const { config, setSelectedHose } = useHose360();

  const handlePick = (size: string) => {
    setSelectedHose(size);
    router.push('/suite360/hose360/end1-fitting');
  };

  const handleBack = () => {
    router.push('/suite360/hose360');
  };

  return (
    <Hose360Layout currentStep={2} totalSteps={11} showPriceBar={false}>
      <BackButton onClick={handleBack} />

      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-8">
          <div className="inline-block px-8 py-3 rounded-full text-white text-lg font-semibold" style={{ background: COLORS.grey.dark }}>
            SELECT HOSE SIZE
          </div>
        </div>

        {/* Vertical single-column list per DECISIONS_ADDENDUM_2.md §2 — one
            row per size, left = size card (size/ID/hose imagery/price),
            right = a separate specs bullet column, side by side within the
            row (not nested inside one box), matching
            HoseSelectionScreen.js's buttonContainer: flexDirection:'row'. */}
        <div className="flex flex-col items-center gap-4">
          {options.hoseSizes.sizes.map((hose) => {
            const isSelected = config.selectedHose?.size === hose.size;
            return (
              <motion.button
                key={hose.size}
                onClick={() => handlePick(hose.size)}
                style={{ ...(isSelected ? GLASS_CARD_SELECTED : GLASS_CARD), width: 560, maxWidth: '100%' }}
                className={`h360-selectable ${isSelected ? 'h360-selected' : ''} text-left flex flex-col sm:flex-row gap-4 sm:items-center`}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex-shrink-0 flex flex-col items-start" style={{ width: 200 }}>
                  <span className="text-xl font-bold" style={{ color: COLORS.grey.dark }}>
                    {hose.size}
                  </span>
                  <span className="text-xs" style={{ color: COLORS.grey.medium }}>
                    Inside Diameter: {hose.insideDiameterLabel}
                  </span>
                  <div className="flex items-center gap-2 my-1">
                    <div className="relative w-16 h-10">
                      <Image src="/hose360/hose_cross_section.png" alt="" width={64} height={40} className="object-contain" unoptimized />
                    </div>
                    <div className="relative w-24 h-10">
                      <Image src="/hose360/hose_image.png" alt="" width={96} height={40} className="object-contain" unoptimized />
                    </div>
                  </div>
                  {/* Round 3.6: price pill always uses the vivid "selected"
                      treatment (solid yellow bg, black text) regardless of
                      whether this card is selected — the dull/translucent
                      version read as a weaker, less trustworthy price.
                      Selection is already communicated by the card's own
                      yellow border/glow, so the pill doesn't need to double
                      as a selection indicator too. */}
                  <span
                    className="inline-block px-3 py-1 rounded-full text-sm font-semibold"
                    style={{ color: '#000', background: 'rgba(250, 204, 21, 0.9)' }}
                  >
                    A${hose.pricePerMetre.toFixed(2)}/m
                  </span>
                </div>

                <ul className="text-xs space-y-1 sm:pl-4 sm:border-l" style={{ color: COLORS.grey.medium, borderColor: 'rgba(0,0,0,0.1)' }}>
                  <li>Spec: {options.hoseSizes.hoseSpec}</li>
                  <li>Working pressure: {hose.workingPressurePsi} psi</li>
                  <li>Burst pressure: {hose.burstPressurePsi} psi</li>
                  <li>Min bend radius: {hose.bendRadiusMm}mm</li>
                  {hose.saeEligible && (
                    <li className="pt-1">
                      <span
                        className="inline-block px-3 py-1 rounded-lg font-semibold"
                        style={{ background: 'rgba(0, 0, 0, 0.08)', color: COLORS.grey.dark }}
                      >
                        Can be ordered with SAE fittings
                      </span>
                    </li>
                  )}
                </ul>
              </motion.button>
            );
          })}
        </div>
      </div>
    </Hose360Layout>
  );
}

export default function HoseSelection() {
  return <Hose360OptionsGate>{(options) => <HoseSelectionInner options={options} />}</Hose360OptionsGate>;
}
