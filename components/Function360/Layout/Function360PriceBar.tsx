/**
 * FUNCTION360 Price Bar Component
 * Matches Trac360's floating expandable design
 * Desktop: Bottom-right floating pill that expands to show breakdown
 * Mobile: Bottom floating bar that expands upward
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFunction360 } from '../../../context/Function360Context';

const PRICE_BAR_DARK = {
  background: 'rgba(74, 74, 74, 0.95)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
};

const formatPrice = (price: number) => `A$${price.toFixed(2)}`;

export default function Function360PriceBar() {
  const { config } = useFunction360();
  const [isMobile, setIsMobile] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close expanded view when switching to desktop/mobile
  useEffect(() => {
    setIsExpanded(false);
  }, [isMobile]);

  // Get itemized list
  const getItemizedList = () => {
    const items: Array<{ name: string; price: number }> = [];

    const componentNames: Record<string, string> = {
      diverterValve: 'Solenoid Diverter Valve',
      quickCouplings: 'Quick Couplings',
      adaptors: 'Adaptors',
      hydraulicHoses: 'Hydraulic Hoses',
      electrical: 'Electrical Wiring & Joystick',
      mountingBrackets: 'Mounting Brackets',
    };

    Object.entries(config.selectedComponents).forEach(([key, isSelected]) => {
      if (isSelected) {
        const componentKey = key as keyof typeof config.componentPrices;  // ✅ Type cast
        items.push({
          name: componentNames[key],
          price: config.componentPrices[componentKey] || 0,  // ✅ Now TypeScript knows the type
        });
      }
    });

    return items;
  };

  const itemizedList = getItemizedList();
  const totalPrice = config.totalPrice;

  return (
    <>
      {/* ✅ DESKTOP VIEW - Floating bottom-right pill */}
      {!isMobile && (
        <>
          {/* Collapsed Bar */}
          {!isExpanded && (
            <motion.div
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              onClick={() => setIsExpanded(true)}
              style={{
                position: 'fixed',
                bottom: '120px',
                right: '30px',
                zIndex: 50,
                ...PRICE_BAR_DARK,
                borderRadius: '50px',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
                maxWidth: '400px',
                cursor: 'pointer',
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="px-6 py-4 flex items-center gap-6">
                {/* Base Price */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-300">Base:</span>
                  <span className="text-base font-semibold text-white">
                    {formatPrice(totalPrice)}
                  </span>
                </div>

                {/* Divider */}
                <div className="text-gray-500">|</div>

                {/* Total Price */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-300">Total:</span>
                  <motion.span
                    key={totalPrice}
                    initial={{ scale: 1.15, color: '#facc15' }}
                    animate={{ scale: 1, color: '#ffffff' }}
                    transition={{ duration: 0.3 }}
                    className="text-xl font-bold text-white"
                  >
                    {formatPrice(totalPrice)}
                  </motion.span>
                </div>

                {/* Expand Icon */}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="ml-2">
                  <path
                    d="M18 15L12 9L6 15"
                    stroke="#ffffff"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </motion.div>
          )}

          {/* Expanded View - Desktop */}
          <AnimatePresence>
            {isExpanded && (
              <>
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsExpanded(false)}
                  style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.5)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 59,
                  }}
                />

                {/* Expanded Panel */}
                <motion.div
                  initial={{ x: 100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 100, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    position: 'fixed',
                    bottom: '120px',
                    right: '30px',
                    zIndex: 60,
                    ...PRICE_BAR_DARK,
                    borderRadius: '20px',
                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
                    minWidth: '350px',
                    maxWidth: '500px',
                  }}
                >
                  <div className="px-6 py-5">
                    {/* Header with Close Button */}
                    <div
                      onClick={() => setIsExpanded(false)}
                      className="flex items-center justify-between mb-4 cursor-pointer"
                    >
                      <span className="text-base font-semibold text-gray-200">
                        Price Breakdown
                      </span>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M6 9L12 15L18 9"
                          stroke="#ffffff"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>

                    {/* Itemized List */}
                    <div className="space-y-3 mb-4">
                      {itemizedList.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center">
                          <span className="text-sm text-gray-300">{item.name}</span>
                          <span className="font-semibold text-white">
                            {formatPrice(item.price)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Divider */}
                    <div className="border-t border-gray-500 my-3" />

                    {/* Total */}
                    <div className="flex justify-between items-center">
                      <span className="text-base font-semibold text-white">Total</span>
                      <motion.span
                        key={totalPrice}
                        initial={{ scale: 1.15, color: '#facc15' }}
                        animate={{ scale: 1, color: '#ffffff' }}
                        className="text-2xl font-bold text-white"
                      >
                        {formatPrice(totalPrice)}
                      </motion.span>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </>
      )}

      {/* ✅ MOBILE VIEW - Bottom floating bar */}
      {isMobile && (
        <>
          {/* Mini Bar (Collapsed) */}
          {!isExpanded && (
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              onClick={() => setIsExpanded(true)}
              style={{
                position: 'fixed',
                bottom: '120px',
                left: '20px',
                right: '20px',
                zIndex: 50,
                ...PRICE_BAR_DARK,
                borderRadius: '20px',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
                cursor: 'pointer',
              }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="px-5 py-4 flex items-center justify-between">
                <span className="text-sm text-gray-300">Total:</span>
                <div className="flex items-center gap-3">
                  <motion.span
                    key={totalPrice}
                    initial={{ scale: 1.15, color: '#facc15' }}
                    animate={{ scale: 1, color: '#ffffff' }}
                    transition={{ duration: 0.3 }}
                    className="text-xl font-bold text-white"
                  >
                    {formatPrice(totalPrice)}
                  </motion.span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M18 15L12 9L6 15"
                      stroke="#ffffff"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
            </motion.div>
          )}

          {/* Expanded View - Mobile */}
          <AnimatePresence>
            {isExpanded && (
              <>
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsExpanded(false)}
                  style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.5)',
                    zIndex: 49,
                  }}
                />

                {/* Expanded Panel */}
                <motion.div
                  initial={{ y: 100, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 100, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    position: 'fixed',
                    bottom: '90px',
                    left: '20px',
                    right: '20px',
                    zIndex: 50,
                    ...PRICE_BAR_DARK,
                    borderRadius: '20px',
                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
                  }}
                >
                  <div className="px-5 py-5">
                    {/* Close Button */}
                    <div
                      onClick={() => setIsExpanded(false)}
                      className="flex items-center justify-between mb-4 cursor-pointer"
                    >
                      <span className="text-sm font-semibold text-gray-200">
                        Price Breakdown
                      </span>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M6 9L12 15L18 9"
                          stroke="#ffffff"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>

                    {/* Itemized List */}
                    {itemizedList.map((item, idx) => (
                      <div key={idx} className="flex justify-between mb-2">
                        <span className="text-sm text-gray-300">{item.name}</span>
                        <span className="font-semibold text-white">
                          {formatPrice(item.price)}
                        </span>
                      </div>
                    ))}

                    {/* Divider */}
                    <div className="border-t border-gray-500 my-3" />

                    {/* Total */}
                    <div className="flex justify-between items-center">
                      <span className="text-base font-semibold text-white">Total</span>
                      <motion.span
                        key={totalPrice}
                        initial={{ scale: 1.15, color: '#facc15' }}
                        animate={{ scale: 1, color: '#ffffff' }}
                        className="text-2xl font-bold text-white"
                      >
                        {formatPrice(totalPrice)}
                      </motion.span>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </>
      )}
    </>
  );
}