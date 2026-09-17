/**
 * TRAC360 Circuits Page - Step 4 of 10 (UPDATED for Setup D)
 * Select number of hydraulic valve circuits
 * 
 * LOGIC:
 * - Setup D + Handles → Show 11-D through 16-D circuits (6 options)
 * - Setup D + Joystick → Show 21-D through 25-D circuits (5 options)
 * - All other setups → Show regular 1-6 circuits
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Trac360Layout from '../../../components/Trac360/Layout/Trac360Layout';
import ContinueButton from '../../../components/Trac360/Shared/ContinueButton';
import BackButton from '../../../components/Trac360/Shared/BackButton';
import { useTrac360 } from '../../../context/Trac360Context';
import Trac360OptionsGate from '../../../components/Trac360/Layout/Trac360OptionsGate';
import { COLORS } from '../../../components/Trac360/styles';
import SetupReminder from '../../../components/Trac360/Shared/SetupReminder';

function CircuitsInner({ options }: { options: any }) {
  const circuits = options.circuits;
  const router = useRouter();
  const { config, updateCircuits } = useTrac360();

  // Get previous selections from context
  const valveSetup = config.valveSetup;
  const operationType = config.operationType;

  // Local state for selected circuit - INITIALIZE FROM CONTEXT
  const [selectedCircuit, setSelectedCircuit] = useState<string | null>(
    config.circuits?.id || null
  );

  // Filter circuits based on operation type
  const availableCircuits = React.useMemo(() => {
    if (!operationType?.id) return circuits.filter((c: any) => c.compatibleWith.includes('all'));
    
    // Setup D with Handles → Show 11-D through 16-D circuits
    if (operationType.id === 'setup-d-handles') {
      return circuits.filter((c: any) => c.compatibleWith.includes('setup-d-handles'));
    }
    
    // Setup D with Joystick → Show 21-D through 25-D circuits
    if (operationType.id === 'setup-d-joystick') {
      return circuits.filter((c: any) => c.compatibleWith.includes('setup-d-joystick'));
    }
    
    // All other setups → Show regular 1-6 circuits
    return circuits.filter((c: any) => c.compatibleWith.includes('all'));
  }, [operationType?.id]);

  // Sync local state with context when context changes (without circular dependency)
  React.useEffect(() => {
    const contextCircuitId = config.circuits?.id || null;
    setSelectedCircuit(contextCircuitId);
  }, [config.circuits?.id]); // ✅ FIX: Only watch the ID, not entire object

  // Validation - circuit selection is required
  const isValid = Boolean(selectedCircuit);

  // Handle circuit selection - UPDATE CONTEXT IMMEDIATELY
  const handleCircuitSelect = (circuitId: string) => {
    setSelectedCircuit(circuitId);
    
    // ✅ Update context immediately
    const circuit = availableCircuits.find((c: any) => c.id === circuitId);
    if (circuit) {
      updateCircuits(circuit as any);
    }
  };

  // Handle continue
  const handleContinue = () => {
    if (!selectedCircuit) return;
    
    // Context is already updated from handleCircuitSelect
    router.push('/suite360/trac360/valve-adaptors');
  };

  // Handle back
  const handleBack = () => {
    router.push('/suite360/trac360/operation-type');
  };

  // Redirect if no valve setup or operation type selected (client-side only)
  React.useEffect(() => {
    if (!valveSetup || !operationType) {
      router.push('/suite360/trac360/tractor-info');
    }
  }, [valveSetup, operationType, router]);

  // Don't render if redirecting
  if (!valveSetup || !operationType) {
    return null;
  }

  return (
    <Trac360Layout currentStep={4} totalSteps={10}>
      {/* Back Button */}
      <BackButton onClick={handleBack} />
      <SetupReminder /> {/* ← ADD THIS */}

      <div className="max-w-4xl mx-auto px-4">
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
            NUMBER OF CIRCUITS
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
            Select Number of Valve Circuits
          </p>
        </motion.div>

        {/* Circuit Grid - 3 columns on desktop, 2 on tablet, 1 on mobile */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8"
        >
          {availableCircuits.map((circuit: any, index: number) => (
            <motion.div
              key={circuit.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.05 }}
              onClick={() => handleCircuitSelect(circuit.id)}
              className="cursor-pointer rounded-2xl overflow-hidden transition-all duration-300 relative"
              style={{
                background: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: `2px solid ${
                  selectedCircuit === circuit.id
                    ? COLORS.yellow.primary
                    : 'rgba(255, 255, 255, 0.8)'
                }`,
                boxShadow: selectedCircuit === circuit.id
                  ? '0 8px 25px rgba(250, 204, 21, 0.3)'
                  : '0 8px 20px rgba(0, 0, 0, 0.1)',
                transform: selectedCircuit === circuit.id ? 'scale(1.03)' : 'scale(1)',
              }}
            >
              {/* Image Section */}
              <div className="w-full h-32 relative flex items-center justify-center p-4">
                <Image
                  src={circuit.image}
                  alt={`${circuit.circuits}-Circuit`}
                  width={120}
                  height={120}
                  className="object-contain"
                />
              </div>

              {/* Content Section */}
              <div className="p-4 text-center">
                {/* Circuit Count */}
                <h3
                  className="text-xl font-bold mb-2"
                  style={{
                    color: selectedCircuit === circuit.id
                      ? COLORS.grey.dark
                      : COLORS.grey.dark,
                  }}
                >
                  {circuit.circuits}-Circuit
                </h3>

                {/* Price */}
                <div
                  className="text-lg font-semibold"
                  style={{
                    color: selectedCircuit === circuit.id
                      ? COLORS.yellow.primary
                      : COLORS.grey.medium,
                  }}
                >
                  A${circuit.price.toLocaleString()}
                </div>
              </div>

              {/* Selection Indicator */}
              {selectedCircuit === circuit.id && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-3 right-3"
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

        {/* Info Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center mb-8 text-sm italic"
          style={{ color: COLORS.grey.medium }}
        >
          Note: Cable Lengths are calculated based on Valve Selected Location
        </motion.div>

        {/* Continue Button - Centered */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="flex justify-center mt-12"
        >
          <ContinueButton onClick={handleContinue} disabled={!isValid} />
        </motion.div>
      </div>
    </Trac360Layout>
  );
}

export default function Circuits() {
  return <Trac360OptionsGate>{(options) => <CircuitsInner options={options} />}</Trac360OptionsGate>;
}