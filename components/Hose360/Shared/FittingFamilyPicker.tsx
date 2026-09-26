/**
 * HOSE360 shared fitting-family picker (BSP/JIC/Metric/ORFS).
 * Renders a shape picker, then (once a shape is picked) a size picker
 * filtered to that family's compatibilityMatrix[hoseSize]. See
 * 02_FRONTEND_PLAN.md Step F5.
 *
 * Round 2 (DECISIONS_ADDENDUM_2.md §3b / 04_UX_FIDELITY_FIX_PLAN.md Step
 * U3b): deliberate NEW enhancement, no OG reference — shape list fades out
 * and size list fades in in the same screen position when a shape is
 * picked; Back while the size list is showing reverses that in place
 * (no navigation), only Back from the shape list itself navigates away.
 * The picker now owns its own BackButton (passed `onBackRoute`) so it can
 * intercept Back for the in-component revert; the parent page no longer
 * renders its own BackButton for this step.
 *
 * Round 3.5 fixes:
 * - Continue button used to be a sibling of the AnimatePresence block,
 *   conditional on `selectedShape` alone — so it popped in immediately the
 *   instant a shape was clicked, while the shape list was still mid
 *   fade-out, producing a visible flash before the size list itself had
 *   faded in. Moved inside the "size-list" motion.div so it only mounts
 *   once that fade-in actually starts.
 * - Shape/size grids used a fixed `grid-cols-2 sm:grid-cols-3`, which left
 *   a short last row (e.g. 2 items in a 3-col grid) sitting flush left
 *   instead of centred. Switched to `flex flex-wrap justify-center` with a
 *   fixed item width so any row, full or partial, is always centred.
 */

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import { GLASS_CARD, GLASS_CARD_SELECTED, COLORS } from '../../Trac360/styles';
import ContinueButton from '../../Trac360/Shared/ContinueButton';
import BackButton from '../../Trac360/Shared/BackButton';
import type { Hose360FittingFamily } from '../../../types/hose360';

interface FittingFamilyPickerProps {
  familyData: Hose360FittingFamily;
  hoseSize: string;
  end: 1 | 2;
  end1Shape?: string | null;
  onPicked: (shape: string, size: string, price: number) => void;
  /** Route to navigate to when Back is pressed from the shape list itself. */
  onBackRoute: () => void;
}

// ~300-500ms ease-in-out per DECISIONS_ADDENDUM_2.md §3b — matches the
// general feel of existing transitions in this codebase (e.g.
// ContinueButton, Function360PriceBar's AnimatePresence usage).
const FADE_TRANSITION = { duration: 0.35, ease: [0.4, 0, 0.2, 1] as const };

export default function FittingFamilyPicker({ familyData, hoseSize, onPicked, onBackRoute }: FittingFamilyPickerProps) {
  const [shapeId, setShapeId] = useState<string | null>(null);
  const [sizeKey, setSizeKey] = useState<string | null>(null);

  const selectedShape = familyData.shapes.find((s) => s.id === shapeId) || null;
  const allowedSizeKeys = hoseSize ? familyData.compatibilityMatrix[hoseSize] || [] : [];
  const availableSizes = familyData.sizes.filter((s) => allowedSizeKeys.includes(s.size));

  const handleShapePick = (id: string) => {
    setShapeId(id);
    setSizeKey(null);
  };

  const handleBack = () => {
    if (shapeId) {
      // Size list is showing — revert to the shape list in place, don't navigate.
      setShapeId(null);
      setSizeKey(null);
    } else {
      onBackRoute();
    }
  };

  const handleContinue = () => {
    if (!selectedShape || !sizeKey) return;
    const sizeEntry = availableSizes.find((s) => s.size === sizeKey);
    if (!sizeEntry) return;
    onPicked(selectedShape.label, sizeEntry.size, sizeEntry.price);
  };

  return (
    <>
      <BackButton onClick={handleBack} />

      <div className="max-w-3xl mx-auto px-4">
        <AnimatePresence exitBeforeEnter initial={false}>
          {!selectedShape ? (
            <motion.div
              key="shape-list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={FADE_TRANSITION}
            >
              <div className="text-center mb-6">
                <div className="inline-block px-8 py-3 rounded-full text-white text-lg font-semibold" style={{ background: COLORS.grey.dark }}>
                  {familyData.family} — Select Shape
                </div>
              </div>

              <div className="flex flex-wrap justify-center gap-4 mb-8">
                {familyData.shapes.map((shape) => (
                  <motion.button
                    key={shape.id}
                    onClick={() => handleShapePick(shape.id)}
                    style={{ ...GLASS_CARD, width: 140 }}
                    className="h360-selectable flex flex-col items-center text-center"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <div className="relative w-20 h-20 mb-2">
                      <Image src={shape.image} alt={shape.label} width={80} height={80} className="object-contain" unoptimized />
                    </div>
                    <span className="text-sm font-medium" style={{ color: COLORS.grey.dark }}>
                      {shape.label}
                    </span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="size-list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={FADE_TRANSITION}
            >
              <div className="text-center mb-6">
                <div className="inline-block px-8 py-3 rounded-full text-white text-lg font-semibold" style={{ background: COLORS.grey.dark }}>
                  Select Size
                </div>
              </div>

              {availableSizes.length === 0 ? (
                <p className="text-center text-sm mb-8" style={{ color: COLORS.error }}>
                  No compatible fitting sizes for this hose size. Please go back and choose a different hose size.
                </p>
              ) : (
                <div className="flex flex-wrap justify-center gap-4 mb-8">
                  {availableSizes.map((size) => (
                    <motion.button
                      key={size.size}
                      onClick={() => setSizeKey(size.size)}
                      style={{ ...(sizeKey === size.size ? GLASS_CARD_SELECTED : GLASS_CARD), width: 140 }}
                      className={`h360-selectable ${sizeKey === size.size ? 'h360-selected' : ''} flex flex-col items-center text-center`}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <span className="text-base font-semibold" style={{ color: COLORS.grey.dark }}>
                        {size.size}
                      </span>
                      <span className="mt-2 inline-block px-4 py-1 rounded-full text-base font-bold" style={{ background: '#F4D35E', color: '#000' }}>
 A$ {size.price.toFixed(2)}
 </span>
                    </motion.button>
                  ))}
                </div>
              )}

              {/* Continue lives inside this fade group so it only mounts
                  once the size list itself is fading in — round 3.5 fix for
                  the flash that appeared while the shape list was still
                  mid-exit. */}
              <div className="flex justify-center mt-8 mb-12">
                <ContinueButton onClick={handleContinue} disabled={!sizeKey} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
