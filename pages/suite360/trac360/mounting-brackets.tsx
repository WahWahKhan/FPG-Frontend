/**
 * TRAC360 Mounting Brackets Page - Step 9 of 10 (FIXED)
 * Optional add-on with sub-options: Valve Bracket or Joystick/Levers Bracket
 * 
 * FIXES:
 * - Two separate bracket options as selectable tiles
 * - Can now unselect tiles by clicking them again
 * - NOT REQUIRED button always visible
 * - Price updates immediately when tile selected
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
import Trac360OptionsGate from '../../../components/Trac360/Layout/Trac360OptionsGate';
import SetupReminder from '../../../components/Trac360/Shared/SetupReminder';

function MountingBracketsInner({ options }: { options: any }) {
  const addonData = options.addons.find((a: any) => a.id === 'mounting-brackets');
  const router = useRouter();
  const { config, addAddon, removeAddon, updateAddonSubOption } = useTrac360();

  // Get previous selections from context
  const valveSetup = config.valveSetup;
  const operationType = config.operationType;

  // Local state
  const [selectedSubOption, setSelectedSubOption] = useState<string | null>(null);
  const [isNotRequired, setIsNotRequired] = useState(false);

  // Check if this addon is already in context
  React.useEffect(() => {
    const existingAddon = config.addons?.find(a => a.id === addonData.id);
    if (existingAddon) {
      setSelectedSubOption(existingAddon.selectedSubOption || null);
      setIsNotRequired(false);
    }
  }, [config.addons]);

  // Handle sub-option selection/deselection
  const handleSubOptionSelect = (subOptionId: string) => {
    // If clicking the same option, deselect it
    if (selectedSubOption === subOptionId) {
      removeAddon(addonData.id);
      setSelectedSubOption(null);
      setIsNotRequired(false);
      return;
    }

    // Select new option
    setSelectedSubOption(subOptionId);
    setIsNotRequired(false);

    // Find the selected sub-option
    const subOption = addonData.subOptions.find((opt: any) => opt.id === subOptionId);
    if (!subOption) return;

    // Check if addon already exists
    const existingAddon = config.addons?.find(a => a.id === addonData.id);

    if (existingAddon) {
      // Update sub-option on existing addon
      updateAddonSubOption(addonData.id, subOptionId);
    } else {
      // Add new addon with sub-option
      const addon = {
        id: addonData.id,
        name: addonData.name,
        description: addonData.description,
        basePrice: addonData.basePrice,
        price: addonData.basePrice + subOption.additionalPrice,
        swellProductId: addonData.swellProductId,
        selectedSubOption: subOptionId,
        subOptions: addonData.subOptions.map((opt: any) => ({
          id: opt.id,
          name: opt.name,
          additionalPrice: opt.additionalPrice,
          components: opt.components,
        })),
        components: subOption.components,
      };
      addAddon(addon as any);
    }
  };

  // Handle "NOT REQUIRED" button click
  const handleNotRequired = () => {
    // Remove addon if it exists
    if (selectedSubOption) {
      removeAddon(addonData.id);
      setSelectedSubOption(null);
    }
    setIsNotRequired(true);
  };

  // Handle continue - go to summary
  const handleContinue = () => {
    router.push('/suite360/trac360/additional-info');
  };

  // Handle back
  const handleBack = () => {
    // Check if operation type is "Cables & Levers" - skip joystick upgradation
    const isLeversOperation = operationType?.id === 'cables-levers-2' || operationType?.id === 'cables-levers-11';
    
    if (isLeversOperation) {
      router.push('/suite360/trac360/hose-protection');
    } else {
      router.push('/suite360/trac360/joystick-upgradation');
    }
  };

  // Redirect if no valve setup or operation type selected
  React.useEffect(() => {
    if (!valveSetup || !operationType) {
      router.push('/suite360/trac360/tractor-info');
    }
  }, [valveSetup, operationType, router]);

  // Continue button is enabled if sub-option selected OR "not required" is clicked
  const canContinue = selectedSubOption !== null || isNotRequired;

  // Don't render if redirecting
  if (!valveSetup || !operationType) {
    return null;
  }

  return (
    <Trac360Layout currentStep={9} totalSteps={10}>
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
              <h3 className="text-lg font-semibold mb-2" style={{ color: COLORS.grey.dark }}>
                {addonData.description}
              </h3>
              <p className="text-sm" style={{ color: COLORS.grey.medium }}>
              </p>
            </div>

            {/* Single Bracket Tile - Centered */}
            <div className="p-6 flex justify-center">
              {/* Show only the first sub-option */}
              {addonData.subOptions.slice(0, 1).map((subOption: any, idx: any) => (
                <motion.button
                key={subOption.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + idx * 0.1 }}
                onClick={() => handleSubOptionSelect(subOption.id)}
                className="relative overflow-hidden rounded-xl transition-all duration-300 max-w-md w-full"
                style={{
                    background: selectedSubOption === subOption.id
                      ? 'rgba(250, 204, 21, 0.15)'
                      : 'rgba(255, 255, 255, 0.5)',
                    border: selectedSubOption === subOption.id
                      ? `2px solid ${COLORS.yellow.primary}`
                      : '2px solid rgba(200, 200, 200, 0.3)',
                    cursor: 'pointer',
                    padding: '20px',
                    boxShadow: selectedSubOption === subOption.id
                      ? '0 4px 15px rgba(250, 204, 21, 0.3)'
                      : '0 2px 8px rgba(0, 0, 0, 0.1)',
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Image */}
                  <div className="flex justify-center mb-3">
                    <div style={{ opacity: 1 }}>
                      <Image
                        src={subOption.image}
                        alt={subOption.name}
                        width={250}
                        height={250}
                      />
                    </div>
                  </div>

                  <div className="text-center mb-3">
                    <p className="text-xs italic" style={{ color: COLORS.grey.medium }}>
                      (Picture only for reference)
                    </p>
                  </div>

                  {/* Name */}
                  <div className="text-center">
                    <h4
                      className="text-xs font-semibold"
                      style={{
                        color: selectedSubOption === subOption.id
                          ? COLORS.grey.dark
                          : COLORS.grey.medium,
                      }}
                    >
                      {subOption.name}
                    </h4>
                  </div>

                  {/* Selection Indicator */}
                  {selectedSubOption === subOption.id && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-2 right-2"
                    >
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center"
                        style={{
                          background: COLORS.yellow.primary,
                          boxShadow: '0 2px 8px rgba(250, 204, 21, 0.4)',
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24">
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
                </motion.button>
              ))}
            </div>

            {/* Price Display */}
            <div className="px-6 py-4 border-t border-gray-200 text-center">
              <span className="text-sm font-semibold" style={{ color: COLORS.grey.medium }}>
                EXTRA{' '}
              </span>
              <span className="text-2xl font-bold" style={{ color: COLORS.yellow.primary }}>
                A${addonData.basePrice.toFixed(2)}
              </span>

              <div className="mt-3">
                <p className="text-sm" style={{ color: COLORS.grey.medium }}>
                  Standard Valve & Joystick Brackets with Hardware
                </p>
              </div>
            </div>

            {/* Note */}
            {addonData.note && (
              <div className="px-6 pb-4 bg-gray-50 text-center text-xs italic" style={{ color: COLORS.grey.medium }}>
                {addonData.note}
              </div>
            )}

            {/* NOT REQUIRED Button - ALWAYS VISIBLE */}
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

export default function MountingBrackets() {
  return <Trac360OptionsGate>{(options) => <MountingBracketsInner options={options} />}</Trac360OptionsGate>;
}