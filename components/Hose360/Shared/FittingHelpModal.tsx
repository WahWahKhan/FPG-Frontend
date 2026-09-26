/**
 * HOSE360 shared fitting-type help modal — small circular "?" on each
 * fitting-type button (FittingTypeChooser.tsx) opens this.
 *
 * Round 3.5 fix: the reference deployment's modal isn't a text blurb — it
 * shows the OG's dedicated `<family>_help.png` thread-measurement reference
 * image (Male/Female diagrams + a Thread Size -> Diameter lookup table baked
 * into the image itself, e.g. HoseCalculator/assets/bsp_help.png, confirmed
 * live via the reference deployment's own "Fitting Information" ->
 * "{TYPE} Thread Information" modal). Render that image directly instead of
 * a generated description.
 */

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { GLASS_MODAL, COLORS } from '../../Trac360/styles';

interface FittingHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  image: string;
}

export default function FittingHelpModal({ isOpen, onClose, title, image }: FittingHelpModalProps) {
  const [mounted, setMounted] = React.useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.div
            key="modal"
            style={{ ...GLASS_MODAL, padding: 'clamp(12px, 3vw, 28px)', maxWidth: 1100, width: '96vw', maxHeight: '96vh', overflowY: 'auto' }}
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-lg font-bold" style={{ color: COLORS.grey.dark }}>
                {title} Thread Information
              </h3>
              {/* Round 3.6 fix: the previous close button used the "&times;"
                  glyph, which most fonts don't render centred within its own
                  line box — combined with the button's default (non-zero,
                  non-border-box) padding/box-sizing, that made the "X" look
                  off-centre inside a circle that wasn't reliably a perfect
                  circle either. Explicit padding:0 + box-sizing:border-box
                  guarantees a true 32x32 circle, and a hand-drawn SVG X
                  (centred on its own 12x12 viewBox) replaces the glyph so
                  the mark itself is pixel-centred too. */}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex items-center justify-center flex-shrink-0"
                style={{
                  width: 32,
                  height: 32,
                  padding: 0,
                  margin: 0,
                  lineHeight: 0,
                  boxSizing: 'border-box',
                  borderRadius: '50%',
                  background: 'rgba(0,0,0,0.06)',
                  border: 'none',
                  cursor: 'pointer',
                  color: COLORS.grey.dark,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            {/* Natural aspect ratio, full width — no fixed 4:3 box / min-height,
                so portrait guides fill the modal instead of leaving white space. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image}
              alt={`${title} thread measurement guide`}
              style={{ display: 'block', width: '100%', height: 'auto', maxHeight: 'calc(96vh - 90px)', objectFit: 'contain', margin: '0 auto' }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
