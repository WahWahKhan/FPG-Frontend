/**
 * TRAC360 Valve Setup Page - Step 2 of 10 (REDESIGNED)
 * Select valve installation location (A, B, C, D)
 * Conditional display: CAB shows A/B/C, ROPS shows A/B/C/D
 * 
 * DESIGN: Tile-based selection with GIF animations
 * - Desktop: 2x2 grid
 * - Mobile: Single column
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Trac360Layout from '../../../components/Trac360/Layout/Trac360Layout';
import ContinueButton from '../../../components/Trac360/Shared/ContinueButton';
import BackButton from '../../../components/Trac360/Shared/BackButton';
import { useTrac360 } from '../../../context/Trac360Context';
import { COLORS } from '../../../components/Trac360/styles';
import Trac360OptionsGate from '../../../components/Trac360/Layout/Trac360OptionsGate';

function ValveSetupInner({ options }: { options: any }) {
  const valveSetups = options.valveSetups;
  const router = useRouter();
  const { config, updateValveSetup } = useTrac360();

  // Get protection type from context
  const protectionType = config.tractorInfo.protectionType;

  // Local state for selected valve setup - INITIALIZE FROM CONTEXT
  const [selectedSetup, setSelectedSetup] = useState<string | null>(
    config.valveSetup?.id || null
  );

  // Sync local state with context when context changes
  React.useEffect(() => {
    const contextSetupId = config.valveSetup?.id || null;
    setSelectedSetup(contextSetupId);
  }, [config.valveSetup?.id]);

  // Filter valve setups based on protection type
  const availableSetups = useMemo(() => {
    if (!protectionType) return [];
    return valveSetups.filter((setup: any) =>
      setup.compatibleWith.includes(protectionType)
    );
  }, [protectionType]);

  // Validation - must select a setup
  const isValid = Boolean(selectedSetup);

  // Handle setup selection - UPDATE CONTEXT IMMEDIATELY
  const handleSetupSelect = (setupId: string) => {
    setSelectedSetup(setupId);

    // ✅ Update context immediately
    const setup = valveSetups.find((s: any) => s.id === setupId);
    if (setup) {
      updateValveSetup(setup as any);
    }
  };

  // Handle continue
  const handleContinue = () => {
    if (!isValid) return;

    // Navigate to next step (context already updated)
    router.push('/suite360/trac360/operation-type');
  };

  // Handle back
  const handleBack = () => {
    router.push('/suite360/trac360/tractor-info');
  };

  // Redirect if no protection type selected (client-side only)
  useEffect(() => {
    if (!protectionType) {
      router.push('/suite360/trac360/tractor-info');
    }
  }, [protectionType, router]);

  // Don't render if redirecting
  if (!protectionType) {
    return null;
  }

  return (
    <Trac360Layout currentStep={2} totalSteps={10}>
      {/* Back Button */}
      <BackButton onClick={handleBack} />

      <div className="max-w-5xl mx-auto px-4">
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
          className="text-center mb-4"
        >
          <div
            className="inline-block px-8 py-3 rounded-full text-white text-lg font-semibold"
            style={{
              background: COLORS.grey.dark,
            }}
          >
            CHOOSE VALVE SETUP
          </div>
        </motion.div>

        {/* Subtitle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center mb-8"
        >
          <p className="text-sm" style={{ color: COLORS.grey.medium }}>
            Select the designated valve installation location
          </p>
        </motion.div>

        {/* Valve Setup Tiles - 2x2 Grid (Desktop) / 1 Column (Mobile) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
        >
          {availableSetups.map((setup: any, index: any) => (
            <motion.div
              key={setup.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              onClick={() => handleSetupSelect(setup.id)}
              className="cursor-pointer rounded-2xl overflow-hidden transition-all duration-300 relative"
              style={{
                background: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: `2px solid ${
                  selectedSetup === setup.id
                    ? COLORS.yellow.primary
                    : 'rgba(255, 255, 255, 0.8)'
                }`,
                boxShadow: selectedSetup === setup.id
                  ? '0 8px 25px rgba(250, 204, 21, 0.3)'
                  : '0 8px 20px rgba(0, 0, 0, 0.1)',
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* GIF Container */}
              <div className="w-full aspect-video bg-gray-50 relative flex items-center justify-center p-6">
                <Image
                  src={`/trac360/${protectionType.toUpperCase()}_(${setup.code}).gif`}
                  alt={`Setup ${setup.code} - ${setup.name}`}
                  width={400}
                  height={300}
                  className="object-contain"
                  unoptimized // Important for GIFs to animate
                />
              </div>

              {/* Setup Info */}
              <div className="p-6 text-center">
                {/* Badge and Title */}
                <div className="flex items-center justify-center gap-3 mb-2">
                  {/* Badge Circle */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-base font-bold"
                    style={{
                      background: selectedSetup === setup.id
                        ? COLORS.yellow.primary
                        : COLORS.grey.dark,
                      color: selectedSetup === setup.id
                        ? COLORS.grey.dark
                        : '#ffffff',
                    }}
                  >
                    {setup.code}
                  </div>

                  {/* Setup Name */}
                  <h3
                    className="text-lg font-bold"
                    style={{
                      color: selectedSetup === setup.id
                        ? COLORS.grey.dark
                        : COLORS.grey.dark,
                    }}
                  >
                    SETUP ({setup.code})
                  </h3>
                </div>

                {/* Description */}
                <p
                  className="text-sm"
                  style={{
                    color: COLORS.grey.medium,
                  }}
                >
                  {setup.name}
                </p>
              </div>

              {/* Selection Indicator */}
              {selectedSetup === setup.id && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-4 right-4"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{
                      background: COLORS.yellow.primary,
                      boxShadow: '0 2px 8px rgba(250, 204, 21, 0.4)',
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24">
                      <path
                        d="M5 12L10 17L20 7"
                        stroke={COLORS.grey.dark}
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                      />
                    </svg>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </motion.div>

        {/* Info Text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-6 text-xs italic"
          style={{ color: COLORS.grey.medium }}
        >
          *Model Availability - Enquire about your selected choice
        </motion.div>

        {/* Continue Button - Centered */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex justify-center mt-12"
        >
          <ContinueButton onClick={handleContinue} disabled={!isValid} />
        </motion.div>
      </div>
    </Trac360Layout>
  );
}

export default function ValveSetup() {
  return <Trac360OptionsGate>{(options) => <ValveSetupInner options={options} />}</Trac360OptionsGate>;
}