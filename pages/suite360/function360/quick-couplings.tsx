/**
 * FUNCTION360 Quick Couplings Page - Step 3
 * Select or skip quick couplings component
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { FiX } from 'react-icons/fi';
import Function360Layout from '../../../components/Function360/Layout/Function360Layout';
import ContinueButton from '../../../components/Trac360/Shared/ContinueButton';
import BackButton from '../../../components/Trac360/Shared/BackButton';
import { useFunction360 } from '../../../context/Function360Context';
import { COLORS } from '../../../components/Trac360/styles';
import Function360OptionsGate from '../../../components/Function360/Layout/Function360OptionsGate';

// Helper to get the right variant
const getQuickCouplingsVariant = (horsepower: string | null, functionType: string | null): string => {
  // Default fallback
  if (!horsepower || !functionType) {
    return 'default_below_50hp';
  }
  
  const hpSuffix = horsepower === 'below_50hp' ? 'below_50hp' : 'above_50hp';
  
  if (functionType === 'electric_3rd_4th') {
    return `electric_3rd_4th_${hpSuffix}`;
  }
  
  // default for electric_3rd and live_3rd
  return `default_${hpSuffix}`;
};

function QuickCouplingsInner({ options }: { options: any }) {
  const componentDataFile = options.components.quickCouplings;
  const router = useRouter();
  const { config, toggleComponent } = useFunction360();

  // ✅ Get the correct variant
  const variantKey = getQuickCouplingsVariant(config.equipment.horsepower, config.equipment.functionType);
  const variantData = (componentDataFile.variants as any)[variantKey];
  const componentData = {
    ...variantData,
    price: variantData.price,  // ✅ NEW: Uses variant-specific price
    currency: componentDataFile.currency,
    fallbackImage: componentDataFile.fallbackImage,
    name: componentDataFile.name,
  };

  const [isSelected, setIsSelected] = useState(config.selectedComponents.quickCouplings);
  const [isSkipped, setIsSkipped] = useState(false);

  useEffect(() => {
    setIsSelected(config.selectedComponents.quickCouplings);  // ← Keep component key
  }, [config.selectedComponents.quickCouplings]);

  const handleSelect = () => {
    if (!isSelected) {
      toggleComponent('quickCouplings', componentData.price);  // ← Use correct key for each page
      setIsSelected(true);
      setIsSkipped(false);
    }
  };
  
  const handleDeselect = () => {
    toggleComponent('quickCouplings' , 0);  // ← Use correct key for each page
    setIsSelected(false);
    setIsSkipped(false);
  };
  
  const handleSkip = () => {
    if (isSelected) {
      toggleComponent('quickCouplings' , 0);  // ← Use correct key for each page
      setIsSelected(false);
    }
    setIsSkipped(true);
  };

  const handleContinue = () => {
    router.push('/suite360/function360/adaptors');
  };

  const canContinue = isSelected || isSkipped;

  const handleBack = () => {
    router.push('/suite360/function360/diverter-valve');
  };

  return (
    <Function360Layout currentStep={3} totalSteps={9}>
      <BackButton onClick={handleBack} />

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

        {/* Title */}
        <div className="p-6 text-center border-b border-gray-200">
              <h3 className="text-lg font-semibold" style={{ color: COLORS.grey.dark }}>
                {componentData.description}
              </h3>
            </div>

            {/* Image */}
            <div className="flex justify-center p-8 bg-gray-50">
              <Image
                src={componentData.image}
                alt={componentData.name}
                width={200}
                height={200}
                className="object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = componentData.fallbackImage;
                }}
              />
            </div>

            {/* Price and ADD+ Button - RESPONSIVE LAYOUT */}
            <div className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-200">
              {/* Price Section */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <span className="text-2xl font-bold text-center sm:text-left" style={{ color: COLORS.yellow.primary }}>
                  A${componentData.price.toFixed(2)}
                </span>
              </div>
              
              {/* ADD+ / ADDED Button with X Button */}
              <div className="flex items-center gap-2">
                <motion.button
                  onClick={handleSelect}
                  disabled={isSelected}
                  className="px-8 py-3 rounded-full font-semibold transition-all duration-300"
                  style={{
                    background: isSelected ? 'rgba(250, 204, 21, 0.9)' : COLORS.grey.dark,
                    backdropFilter: isSelected ? 'blur(10px)' : 'none',
                    color: isSelected ? COLORS.grey.dark : '#ffffff',
                    border: isSelected ? '2px solid rgba(255, 255, 255, 0.6)' : 'none',
                    cursor: isSelected ? 'default' : 'pointer',
                    boxShadow: isSelected ? '0 4px 15px rgba(250, 204, 21, 0.4)' : '0 4px 10px rgba(0, 0, 0, 0.2)',
                  }}
                  whileHover={!isSelected ? { scale: 1.05, boxShadow: '0 6px 15px rgba(0, 0, 0, 0.3)' } : {}}
                  whileTap={!isSelected ? { scale: 0.98 } : {}}
                >
                  {isSelected ? 'ADDED' : 'ADD+'}
                </motion.button>

                {/* X Button - Only show when ADDED */}
                {isSelected && (
                  <motion.button
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    onClick={handleDeselect}
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
                      e.currentTarget.style.color = "#ffffff";
                      e.currentTarget.style.transform = "scale(1.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(254, 226, 226, 0.8)";
                      e.currentTarget.style.color = "#dc2626";
                      e.currentTarget.style.transform = "scale(1)";
                    }}
                  >
                    <FiX size={20} />
                  </motion.button>
                )}
              </div>
            </div>

            {/* Specifications List */}
            <div className="p-6 bg-gray-50">
              <ul className="space-y-2">
                {Object.entries(componentData.specifications).map(([key, value]) => (
                  <li key={key} className="flex items-start gap-2 text-sm" style={{ color: COLORS.grey.medium }}>
                    <span style={{ color: COLORS.yellow.primary }}>•</span>
                    <span>
                      <span className="font-semibold">{key.replace(/([A-Z])/g, ' $1').trim()}:</span> {String(value)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* NOT REQUIRED Button - Only show when NOT selected */}
            {!isSelected && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 text-center border-t border-gray-200"
              >
                <motion.button
                  onClick={handleSkip}
                  className="px-8 py-3 rounded-full font-semibold transition-all duration-300"
                  style={{
                    background: isSkipped ? 'rgba(107, 114, 128, 0.85)' : 'rgba(74, 74, 74, 0.85)',
                    backdropFilter: 'blur(10px)',
                    color: '#ffffff',
                    border: isSkipped ? '2px solid rgba(255, 255, 255, 0.5)' : '2px solid rgba(255, 255, 255, 0.3)',
                    cursor: 'pointer',
                    boxShadow: isSkipped ? '0 6px 20px rgba(0, 0, 0, 0.25)' : '0 4px 10px rgba(0, 0, 0, 0.15)',
                  }}
                  whileHover={{ scale: 1.05, boxShadow: '0 6px 20px rgba(0, 0, 0, 0.25)' }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isSkipped ? 'SKIPPED ✓' : 'NOT REQUIRED'}
                </motion.button>
              </motion.div>
            )}

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
    </Function360Layout>
  );
}

export default function QuickCouplings() {
  return <Function360OptionsGate>{(options) => <QuickCouplingsInner options={options} />}</Function360OptionsGate>;
}