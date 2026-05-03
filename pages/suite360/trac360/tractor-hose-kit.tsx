/**
 * TRAC360 Tractor Hose Kit Page - Step 6 of 10
 * Optional add-on: Tractor Hose Kit
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Trac360Layout from '../../../components/Trac360/Layout/Trac360Layout';
import ContinueButton from '../../../components/Trac360/Shared/ContinueButton';
import BackButton from '../../../components/Trac360/Shared/BackButton';
import { useTrac360 } from '../../../context/Trac360Context';
import { COLORS } from '../../../components/Trac360/styles';
import addonData from '../../../data/trac360/tractor-hose-kit.json';
import SetupReminder from '../../../components/Trac360/Shared/SetupReminder';

export default function TractorHoseKit() {
  const router = useRouter();
  const { config, addAddon, removeAddon } = useTrac360();

  // Get previous selections from context
  const valveSetup = config.valveSetup;
  const operationType = config.operationType;

  // Local state for addon selection
  const [isAddonSelected, setIsAddonSelected] = useState(false);
  const [isNotRequired, setIsNotRequired] = useState(false);

  // Check if this addon is already in context
  React.useEffect(() => {
    const existingAddon = config.addons?.find(a => a.id === addonData.id);
    if (existingAddon) {
      setIsAddonSelected(true);
      setIsNotRequired(false);
    }
  }, [config.addons]);

  // Handle addon selection (ADD+ button)
  const handleAddonToggle = () => {
    const addon = {
      id: addonData.id,
      name: addonData.name,
      description: addonData.description,
      basePrice: addonData.basePrice,
      price: addonData.basePrice,
      swellProductId: addonData.swellProductId,
      selectedSubOption: null,
      subOptions: [],
      components: addonData.components
    };

    if (!isAddonSelected) {
      addAddon(addon as any);
      setIsAddonSelected(true);
      setIsNotRequired(false);
    }
  };

  // Handle addon removal (X button)
  const handleAddonRemove = () => {
    removeAddon(addonData.id);
    setIsAddonSelected(false);
  };

  // Handle "NOT REQUIRED" button click
  const handleNotRequired = () => {
    if (isAddonSelected) {
      removeAddon(addonData.id);
      setIsAddonSelected(false);
    }
    setIsNotRequired(true);
  };

  // Handle continue
  const handleContinue = () => {
    router.push('/suite360/trac360/hose-protection');
  };

  // Handle back
  const handleBack = () => {
    router.push('/suite360/trac360/valve-adaptors');
  };

  // Redirect if no valve setup or operation type selected
  React.useEffect(() => {
    if (!valveSetup || !operationType) {
      router.push('/suite360/trac360/tractor-info');
    }
  }, [valveSetup, operationType, router]);

  // Continue button is enabled if addon is selected OR "not required" is clicked
  const canContinue = isAddonSelected || isNotRequired;

  // Don't render if redirecting
  if (!valveSetup || !operationType) {
    return null;
  }

  return (
    <Trac360Layout currentStep={6} totalSteps={11}>
      {/* Back Button */}
      <BackButton onClick={handleBack} />
      <SetupReminder />

      <div className="max-w-3xl mx-auto px-4">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="flex justify-center"
        >
          <div className="relative w-60 h-60">
            <Image
              src="/fluidpower_logo_transparent.gif"
              alt="Fluid Power Group"
              width={240}
              height={240}
              className="object-contain"
              unoptimized
            />
          </div>
        </motion.div>

        {/* Page Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <div
            className="inline-block px-8 py-3 rounded-full text-white text-lg font-semibold"
            style={{
              background: COLORS.grey.dark,
            }}
          >
            {addonData.name.toUpperCase()}
          </div>
        </motion.div>

        {/* Addon Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: 'rgba(255, 255, 255, 0.7)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.8)',
              boxShadow: '0 8px 20px rgba(0, 0, 0, 0.1)',
            }}
          >
            {/* Title */}
            <div className="p-6 text-center border-b border-gray-200">
              <h3 className="text-lg font-semibold" style={{ color: COLORS.grey.dark }}>
                {addonData.description}
              </h3>
            </div>

            {/* Image */}
            <div className="flex justify-center p-8 bg-gray-50">
              <div style={{ opacity: 1 }}>
                <Image
                  src={addonData.image}
                  alt={addonData.name}
                  width={300}
                  height={300}
                />
              </div>
            </div>

            {/* Price and Toggle - RESPONSIVE LAYOUT */}
            <div className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-200">
              {/* Price Section - Stacked on mobile, inline on desktop */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <span className="text-sm font-semibold text-center sm:text-left" style={{ color: COLORS.grey.medium }}>
                  EXTRA
                </span>
                <span className="text-2xl font-bold text-center sm:text-left" style={{ color: COLORS.yellow.primary }}>
                  A$240.00
                </span>
              </div>
              
              {/* ADD+ / ADDED Button with X Button */}
              <div className="flex items-center gap-2">
                <motion.button
                  onClick={handleAddonToggle}
                  disabled={isAddonSelected}
                  className="px-8 py-3 rounded-full font-semibold transition-all duration-300"
                  style={{
                    background: isAddonSelected 
                      ? 'rgba(250, 204, 21, 0.9)' 
                      : COLORS.grey.dark,
                    backdropFilter: isAddonSelected ? 'blur(10px)' : 'none',
                    WebkitBackdropFilter: isAddonSelected ? 'blur(10px)' : 'none',
                    color: isAddonSelected ? COLORS.grey.dark : '#ffffff',
                    border: isAddonSelected ? '2px solid rgba(255, 255, 255, 0.6)' : 'none',
                    cursor: isAddonSelected ? 'default' : 'pointer',
                    boxShadow: isAddonSelected 
                      ? '0 4px 15px rgba(250, 204, 21, 0.4)' 
                      : '0 4px 10px rgba(0, 0, 0, 0.2)',
                  }}
                  whileHover={!isAddonSelected ? { 
                    scale: 1.05,
                    boxShadow: '0 6px 15px rgba(0, 0, 0, 0.3)',
                  } : {}}
                  whileTap={!isAddonSelected ? { scale: 0.98 } : {}}
                >
                  {isAddonSelected ? 'ADDED' : 'ADD+'}
                </motion.button>

                {/* X Button - Only show when ADDED */}
                {isAddonSelected && (
                  <motion.button
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={handleAddonRemove}
                    className="flex items-center justify-center transition-all duration-200"
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      border: "1px solid rgba(220, 38, 38, 0.3)",
                      background: "rgba(254, 226, 226, 0.8)",
                      backdropFilter: "blur(10px)",
                      color: "#dc2626",
                      cursor: "pointer",
                      boxShadow: "0 2px 8px rgba(220, 38, 38, 0.2)"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(239, 68, 68, 0.9)";
                      e.currentTarget.style.borderColor = "rgba(220, 38, 38, 0.6)";
                      e.currentTarget.style.color = "#ffffff";
                      e.currentTarget.style.transform = "scale(1.1)";
                      e.currentTarget.style.boxShadow = "0 4px 12px rgba(220, 38, 38, 0.4)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(254, 226, 226, 0.8)";
                      e.currentTarget.style.borderColor = "rgba(220, 38, 38, 0.3)";
                      e.currentTarget.style.color = "#dc2626";
                      e.currentTarget.style.transform = "scale(1)";
                      e.currentTarget.style.boxShadow = "0 2px 8px rgba(220, 38, 38, 0.2)";
                    }}
                  >
                    <div style={{ width: "20px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </div>
                  </motion.button>
                )}
              </div>
            </div>

            {/* Components List */}
            <div className="p-6 bg-gray-50">
              <ul className="space-y-2">
                {addonData.components.map((component, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm" style={{ color: COLORS.grey.medium }}>
                    <span style={{ color: COLORS.yellow.primary }}>•</span>
                    <span>{component}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Not Required Button */}
            {!isAddonSelected && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="p-6 text-center border-t border-gray-200"
              >
                <motion.button
                  onClick={handleNotRequired}
                  className="px-8 py-3 rounded-full font-semibold transition-all duration-300"
                  style={{
                    background: isNotRequired 
                      ? 'rgba(107, 114, 128, 0.85)' 
                      : 'rgba(74, 74, 74, 0.85)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    color: '#ffffff',
                    border: isNotRequired 
                      ? '2px solid rgba(255, 255, 255, 0.5)' 
                      : '2px solid rgba(255, 255, 255, 0.3)',
                    cursor: 'pointer',
                    boxShadow: isNotRequired 
                      ? '0 6px 20px rgba(0, 0, 0, 0.25)' 
                      : '0 4px 10px rgba(0, 0, 0, 0.15)',
                  }}
                  whileHover={{ 
                    scale: 1.05,
                    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.25)',
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isNotRequired ? 'SKIPPED ✓' : 'NOT REQUIRED'}
                </motion.button>
              </motion.div>
            )}

            {/* Note */}
            {addonData.note && (
              <div className="px-6 pb-4 text-center text-xs italic" style={{ color: COLORS.grey.medium }}>
                {addonData.note}
              </div>
            )}
          </div>
        </motion.div>

        {/* Continue Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex justify-center mt-12"
        >
          <ContinueButton onClick={handleContinue} disabled={!canContinue} />
        </motion.div>
      </div>
    </Trac360Layout>
  );
}