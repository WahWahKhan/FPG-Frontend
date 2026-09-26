/**
 * HOSE360 Price Bar — simplified floating total display.
 * Mirrors Function360PriceBar's collapsed pill, without the itemized
 * breakdown expansion (Hose360's breakdown comes from the backend's
 * priceHose360Line() response shape, which the frontend plan treats as
 * opaque display data — showing the raw total here is enough for the MVP).
 */

'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useHose360 } from '../../../context/Hose360Context';
import { usePriceBarClearance } from '../../../utils/usePriceBarClearance';

const PRICE_BAR_BOTTOM_OFFSET = 120;

const PRICE_BAR_DARK = {
  background: 'rgba(74, 74, 74, 0.95)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
};

const formatPrice = (price: number) => `A$${price.toFixed(2)}`;

export default function Hose360PriceBar() {
  const { config, priceLoading } = useHose360();
  const [isMobile, setIsMobile] = useState(false);
  const barRef = usePriceBarClearance('--hose360-pricebar-clearance', PRICE_BAR_BOTTOM_OFFSET);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <motion.div
      ref={barRef}
      initial={{ y: isMobile ? 100 : 0, x: isMobile ? 0 : 100, opacity: 0 }}
      animate={{ y: 0, x: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      style={{
        position: 'fixed',
        bottom: isMobile ? '20px' : '120px',
        left: isMobile ? '20px' : 'auto',
        right: isMobile ? '20px' : '30px',
        zIndex: 50,
        ...PRICE_BAR_DARK,
        borderRadius: isMobile ? '20px' : '50px',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
      }}
    >
      <div className="px-6 py-4 flex items-center justify-between gap-4">
        <span className="text-xs text-gray-300">{priceLoading ? 'Updating…' : 'Total:'}</span>
        <motion.span
          id="hoseTotalPrice"
          key={config.totalPrice}
          initial={{ scale: 1.15, color: '#facc15' }}
          animate={{ scale: 1, color: '#ffffff' }}
          transition={{ duration: 0.3 }}
          className="text-xl font-bold text-white"
        >
          {formatPrice(config.totalPrice)}
        </motion.span>
      </div>
    </motion.div>
  );
}
