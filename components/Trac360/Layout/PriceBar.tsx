/**
 * TRAC360 Price Bar Component (FIXED - Expandable Desktop View)
 * Desktop: Expandable bar showing itemized breakdown
 * Mobile: Collapsible at bottom (unchanged)
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/router';
import { useTrac360 } from '../../../context/Trac360Context';
import { calculatePriceBreakdown, formatPrice } from '../../../utils/trac360/pricing';

// ✅ IMPROVED: Darker background matching screenshot 3
const PRICE_BAR_DARK = {
  background: 'rgba(74, 74, 74, 0.95)', // Darker grey for better contrast
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
};

/**
 * PriceBar - Real-time price display with itemized breakdown
 * 
 * Desktop: Fixed bottom-right, clickable to expand and show full breakdown
 * Mobile: Collapsible mini bar (well above chat)
 * 
 * Features:
 * - Real-time price updates from context
 * - Darker background for better readability
 * - Proper spacing from chat icon
 * - Smooth expand/collapse animation (both desktop and mobile)
 * - Shows itemized list when expanded
 * - Only shows when operation type is selected
 * 
 * @example
 * <PriceBar />
 * // Automatically pulls data from Trac360Context
 */
export default function PriceBar() {
  const { config } = useTrac360();
  const router = useRouter();
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

  // Calculate price breakdown
  const breakdown = calculatePriceBreakdown(config);

  // Close expanded view when switching to desktop/mobile
  useEffect(() => {
    setIsExpanded(false);
  }, [isMobile]);

  // Path A: show as soon as operation type is selected
  // Path B (circuits page): hide until a circuit is selected
  const onCircuitsPage = router.pathname === '/suite360/trac360/circuits';
  if (!config.operationType) return null;
  if (onCircuitsPage && !config.circuits) return null;

  // Get itemized list for expanded view
  const getItemizedList = () => {
    const items: Array<{ name: string; price: number }> = [];

    if (config.circuits) {
      // Path B: circuit price is the full base — show it as the base line item
      items.push({
        name: `${config.circuits.circuits}-Circuit Valve`,
        price: config.circuits.price,
      });
    } else if (config.operationType) {
      // Path A: flat 1250 base from operation type
      items.push({
        name: config.operationType.name,
        price: 1250,
      });
    }

    // Add-ons
    config.addons.forEach(addon => {
      let addonPrice = addon.basePrice;
      let name = addon.name;

      // Add sub-option name if selected
      if (addon.selectedSubOption && addon.subOptions) {
        const selectedSubOption = addon.subOptions.find(
          sub => sub.id === addon.selectedSubOption
        );
        if (selectedSubOption) {
          name += ` (${selectedSubOption.name})`;
          addonPrice += selectedSubOption.additionalPrice;
        }
      }

      items.push({ name, price: addonPrice });
    });

    return items;
  };

  const itemizedList = getItemizedList();

  return (
    <>
      {/* ✅ DESKTOP VIEW - Expandable with itemized breakdown */}
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
                maxWidth: '550px',
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
                    {formatPrice(breakdown.baseCircuitPrice)}
                  </span>
                </div>

                {/* Add-ons Total (if any) */}
                {breakdown.addonsTotal > 0 && (
                  <>
                    <div className="text-gray-500">|</div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-300">Add-ons:</span>
                      <span className="text-base font-semibold text-yellow-400">
                        +{formatPrice(breakdown.addonsTotal)}
                      </span>
                    </div>
                  </>
                )}

                {/* Divider */}
                <div className="text-gray-500">|</div>

                {/* Total Price */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-300">Total:</span>
                  <motion.span
                    key={breakdown.total}
                    initial={{ scale: 1.15, color: '#facc15' }}
                    animate={{ scale: 1, color: '#ffffff' }}
                    transition={{ duration: 0.3 }}
                    className="text-xl font-bold text-white"
                  >
                    {formatPrice(breakdown.total)}
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
                        key={breakdown.total}
                        initial={{ scale: 1.15, color: '#facc15' }}
                        animate={{ scale: 1, color: '#ffffff' }}
                        className="text-2xl font-bold text-white"
                      >
                        {formatPrice(breakdown.total)}
                      </motion.span>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </>
      )}

      {/* ✅ MOBILE VIEW - Higher above chat icon */}
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
                    key={breakdown.total}
                    initial={{ scale: 1.15, color: '#facc15' }}
                    animate={{ scale: 1, color: '#ffffff' }}
                    transition={{ duration: 0.3 }}
                    className="text-xl font-bold text-white"
                  >
                    {formatPrice(breakdown.total)}
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
                        key={breakdown.total}
                        initial={{ scale: 1.15, color: '#facc15' }}
                        animate={{ scale: 1, color: '#ffffff' }}
                        className="text-2xl font-bold text-white"
                      >
                        {formatPrice(breakdown.total)}
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