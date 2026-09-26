/**
 * HOSE360 shared SAE fitting picker (Code 61 / Code 62).
 * Shape picker from codeData.shapes (always 3: Straight/45°/90°), then size
 * picker is ALWAYS both SAE sizes (3/4" and 1") — SAE has no compatibility
 * matrix. See 02_FRONTEND_PLAN.md Step F5.
 *
 * Round 2 (DECISIONS_ADDENDUM_2.md §3b / 04_UX_FIDELITY_FIX_PLAN.md Step
 * U3b): same shape->size fade transition + in-place Back revert as
 * FittingFamilyPicker — see that file's header comment for the full
 * rationale. The picker now owns its own BackButton (`onBackRoute`).
 *
 * Round 3.5: same two fixes as FittingFamilyPicker.tsx — Continue moved
 * inside the size-list fade group (was flashing during the shape-list's
 * exit), and grids switched from fixed grid-cols to flex-wrap justify-center
 * so a short row stays centred instead of flush left.
 */

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import { GLASS_CARD, GLASS_CARD_SELECTED, COLORS } from '../../Trac360/styles';
import ContinueButton from '../../Trac360/Shared/ContinueButton';
import BackButton from '../../Trac360/Shared/BackButton';
import type { Hose360SaeCode, Hose360FittingSize } from '../../../types/hose360';

interface SAEFittingPickerProps {
  code: 'Code 61' | 'Code 62';
  codeData: Hose360SaeCode;
  sizes: Hose360FittingSize[];
  end: 1 | 2;
  end1Shape?: string | null;
  onPicked: (shape: string, size: string, price: number) => void;
  /** Route to navigate to when Back is pressed from the shape list itself. */
  onBackRoute: () => void;
}

const FADE_TRANSITION = { duration: 0.35, ease: [0.4, 0, 0.2, 1] as const };

export default function SAEFittingPicker({ code, codeData, sizes, onPicked, onBackRoute }: SAEFittingPickerProps) {
  const [shapeId, setShapeId] = useState<string | null>(null);
  const [sizeKey, setSizeKey] = useState<string | null>(null);

  const selectedShape = codeData.shapes.find((s) => s.id === shapeId) || null;

  const handleBack = () => {
    if (shapeId) {
      setShapeId(null);
      setSizeKey(null);
    } else {
      onBackRoute();
    }
  };

  const handleContinue = () => {
    if (!selectedShape || !sizeKey) return;
    const sizeEntry = sizes.find((s) => s.size === sizeKey);
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
                  SAE {code} ({codeData.pressureRating}) — Select Shape
                </div>
              </div>

              <div className="flex flex-wrap justify-center gap-4 mb-8">
                {codeData.shapes.map((shape) => (
                  <motion.button
                    key={shape.id}
                    onClick={() => {
                      setShapeId(shape.id);
                      setSizeKey(null);
                    }}
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

              <div className="flex flex-wrap justify-center gap-4 mb-8">
                {sizes.map((size) => (
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
