/**
 * FUNCTION360 Equipment Selection Page - Step 1
 * Select equipment HP and function type
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Function360Layout from '../../../components/Function360/Layout/Function360Layout';
import ContinueButton from '../../../components/Trac360/Shared/ContinueButton';
import BackButton from '../../../components/Trac360/Shared/BackButton';
import { useFunction360 } from '../../../context/Function360Context';
import { COLORS } from '../../../components/Trac360/styles';
import Function360OptionsGate from '../../../components/Function360/Layout/Function360OptionsGate';

function EquipmentInner({ options }: { options: any }) {
  const equipmentData = options.equipmentOptions;
  const router = useRouter();
  const { config, updateEquipment } = useFunction360();

  const [horsepower, setHorsepower] = useState<string | null>(config.equipment.horsepower);
  const [functionType, setFunctionType] = useState<string | null>(config.equipment.functionType);
  const [isHydrated, setIsHydrated] = useState(false);

  const isValid = Boolean(horsepower && functionType);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsHydrated(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleContinue = () => {
    if (!isValid) return;

    updateEquipment({
      horsepower: horsepower as any,
      functionType: functionType as any,
    });

    router.push('/suite360/function360/diverter-valve');
  };

  const handleBack = () => {
    router.push('/suite360/function360/start');
  };

  if (!isHydrated) {
    return (
      <Function360Layout currentStep={1} totalSteps={9}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
            <p style={{ color: COLORS.grey.medium }}>Loading...</p>
          </div>
        </div>
      </Function360Layout>
    );
  }

  return (
    <Function360Layout currentStep={1} totalSteps={9}>
      <BackButton onClick={handleBack} />

      <div className="max-w-2xl mx-auto px-4">
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
            FUNCTION SELECTION
          </div>
        </motion.div>

        {/* Function360 Hero GIF */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex justify-center mb-8"
        >
          <div className="relative w-full max-w-md">
            <Image
              src="/function360/Function360.gif"
              alt="Function360 Hydraulic Kit"
              width={400}
              height={400}
              className="object-contain"
              unoptimized
            />
          </div>
        </motion.div>

        {/* Form Fields */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-6"
        >
          {/* Horsepower Dropdown */}
          <div className="relative">
            <div
              className="w-full px-4 py-4 text-center rounded-full cursor-pointer"
              style={{
                background: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: `2px solid ${horsepower ? COLORS.yellow.primary : 'rgba(255, 255, 255, 0.8)'}`,
                boxShadow: '0 8px 20px rgba(0, 0, 0, 0.1)',
              }}
            >
              <div className="text-xs font-semibold mb-1" style={{ color: COLORS.grey.medium }}>
                EQUIPMENT HORSEPOWER *
              </div>
              <select
                value={horsepower || ''}
                onChange={(e) => setHorsepower(e.target.value)}
                className="w-full text-center text-base font-medium bg-transparent border-none outline-none cursor-pointer appearance-none"
                style={{ color: COLORS.grey.dark }}
              >
                <option value="" disabled>Select Horsepower</option>
                {equipmentData.horsepowerOptions.map((option: any) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Function Type Dropdown */}
          <div className="relative">
            <div
              className="w-full px-4 py-4 text-center rounded-full cursor-pointer"
              style={{
                background: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: `2px solid ${functionType ? COLORS.yellow.primary : 'rgba(255, 255, 255, 0.8)'}`,
                boxShadow: '0 8px 20px rgba(0, 0, 0, 0.1)',
              }}
            >
              <div className="text-xs font-semibold mb-1" style={{ color: COLORS.grey.medium }}>
                FUNCTION TYPE *
              </div>
              <select
                value={functionType || ''}
                onChange={(e) => setFunctionType(e.target.value)}
                className="w-full text-center text-base font-medium bg-transparent border-none outline-none cursor-pointer appearance-none"
                style={{ color: COLORS.grey.dark }}
              >
                <option value="" disabled>Select Function Type</option>
                {equipmentData.functionTypes.map((option: any) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </motion.div>

        {/* Continue Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex justify-center mt-12"
        >
          <ContinueButton onClick={handleContinue} disabled={!isValid} />
        </motion.div>

        {/* Required Fields Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-4 text-sm"
          style={{ color: COLORS.grey.medium }}
        >
          Fields marked with <span style={{ color: COLORS.yellow.primary }}>*</span> are required
        </motion.div>
      </div>
    </Function360Layout>
  );
}

export default function Equipment() {
  return <Function360OptionsGate>{(options) => <EquipmentInner options={options} />}</Function360OptionsGate>;
}