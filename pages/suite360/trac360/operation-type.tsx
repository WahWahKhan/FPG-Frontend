/**
 * TRAC360 Operation Type Page - Step 3 of 6
 * Select operation method (cables, joystick, levers, etc.)
 * Filtered by protection type (CAB/ROPS)
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
import SetupReminder from '../../../components/Trac360/Shared/SetupReminder';

function OperationTypeInner({ options }: { options: any }) {
  const operationTypes = options.operationTypes;
  const router = useRouter();
  const { config, updateOperationType } = useTrac360();

  // Get protection type and valve setup from context
  const protectionType = config.tractorInfo.protectionType;
  const valveSetup = config.valveSetup;

  // Local state for selected operation type
  const [selectedOperation, setSelectedOperation] = useState<string | null>(
    config.operationType?.id || null
  );

  // Filter operation types based on valve setup
  const availableOperations = useMemo(() => {
    if (!valveSetup || !valveSetup.id) return [];
    
    // Get compatible operation IDs for this valve setup
    const compatibleOps = (valveSetup as any).compatibleOperations || [];
    
    // Filter operations to only show compatible ones
    const filtered = operationTypes.filter((operation: any) =>
      compatibleOps.includes(operation.id)
    );
    
    return filtered;
  }, [valveSetup]);

  // Validation - must select an operation
  const isValid = Boolean(selectedOperation);

  // Handle operation selection
  const handleOperationSelect = (operationId: string) => {
    setSelectedOperation(operationId);
  };

  // Determine next step based on valve setup + operation type combination
  const getNextStep = (valveSetupId: string, operationId: string): string => {
    // Setup A (Loader)
    if (valveSetupId === 'loader-style') {
      return '/suite360/trac360/valve-adaptors';
    }

    // Setup B (Mid SCV)
    if (valveSetupId === 'mid-scv-style') {
      if (operationId === 'cables-joystick-1' || operationId === 'cables-levers-2' || operationId === 'cables-joystick-10' || operationId === 'setup-b-direct-joystick') {
        return '/suite360/trac360/valve-adaptors';
      }
      if (operationId === 'cables-levers-11' || operationId === 'joystick-levers') {
        return '/suite360/trac360/circuits';
      }
    }

    // Setup C (Rear Remotes)
    if (valveSetupId === 'rear-remotes-style') {
      if (operationId === 'cables-joystick-10') {
        return '/suite360/trac360/valve-adaptors';
      }
      if (operationId === 'cables-levers-11') {
        return '/suite360/trac360/circuits';
      }
    }

    // Setup D (Next-to-Operator)
    if (valveSetupId === 'next-to-operator-style') {
      return '/suite360/trac360/circuits';
    }

    // Default fallback
    return '/suite360/trac360/circuits';
  };

  // Handle continue
  const handleContinue = () => {
    if (!isValid || !selectedOperation || !valveSetup) return;

    const operation = operationTypes.find((op: any) => op.id === selectedOperation);
    if (!operation) return;

    // Update context with complete operation object (cast to bypass type check)
    updateOperationType(operation as any);

    // Navigate to next step based on valve setup + operation combination
    const nextStep = getNextStep(valveSetup.id, selectedOperation);
    router.push(nextStep);
  };

  // Handle back
  const handleBack = () => {
    router.push('/suite360/trac360/valve-setup');
  };

  // Redirect if no protection type or valve setup selected (client-side only)
  useEffect(() => {
    if (!protectionType || !valveSetup) {
      router.push('/suite360/trac360/tractor-info');
    }
  }, [protectionType, valveSetup, router]);

  // Don't render if redirecting
  if (!protectionType || !valveSetup) {
    return null;
  }

  return (
    <Trac360Layout currentStep={3} totalSteps={10}>
      {/* Back Button */}
      <BackButton onClick={handleBack} />
      <SetupReminder /> 

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
          className="text-center mb-4"
        >
          <div
            className="inline-block px-8 py-3 rounded-full text-white text-lg font-semibold"
            style={{
              background: COLORS.grey.dark,
            }}
          >
            OPERATION TYPE
          </div>
        </motion.div>

        {/* Subtitle with valve setup info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center mb-8"
        >
          <p className="text-sm" style={{ color: COLORS.grey.medium }}>
            Setup {valveSetup.code} - Select your operation method
          </p>
        </motion.div>

        {/* Operation Type Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-4"
        >
          {availableOperations.map((operation: any) => (
            <motion.div
              key={operation.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => handleOperationSelect(operation.id)}
              className="cursor-pointer rounded-2xl overflow-hidden transition-all duration-300"
              style={{
                background: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: `2px solid ${
                  selectedOperation === operation.id
                    ? COLORS.yellow.primary
                    : 'rgba(255, 255, 255, 0.8)'
                }`,
                boxShadow: selectedOperation === operation.id
                  ? '0 8px 25px rgba(250, 204, 21, 0.3)'
                  : '0 8px 20px rgba(0, 0, 0, 0.1)',
              }}
            >
              <div className="flex flex-col md:flex-row">
                {/* Image Section */}
                <div className="w-full md:w-1/3 h-48 md:h-auto relative flex items-center justify-center p-4">
                  <Image
                    src={operation.image}
                    alt={operation.name}
                    width={200}
                    height={200}
                    className="object-contain"
                  />
                </div>

                {/* Content Section */}
                <div className="flex-1 p-6">
                  {/* Title */}
                  <h3
                    className="text-lg font-bold mb-2"
                    style={{
                      color: selectedOperation === operation.id
                        ? COLORS.grey.dark
                        : COLORS.grey.dark,
                    }}
                  >
                    {operation.name}
                  </h3>

                  {/* Description */}
                  <p
                    className="text-sm mb-4"
                    style={{ color: COLORS.grey.medium }}
                  >
                    {operation.description}
                  </p>

                  {/* Components List */}
                  <div className="space-y-1">
                    <p
                      className="text-xs font-semibold uppercase mb-2"
                      style={{ color: COLORS.grey.medium }}
                    >
                      Included Components:
                    </p>
                    {operation.components.map((component: any, index: any) => (
                      <div
                        key={index}
                        className="text-xs flex items-start gap-2"
                        style={{ color: COLORS.grey.medium }}
                      >
                        <span style={{ color: COLORS.yellow.primary }}>•</span>
                        <span>{component}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Selection Indicator */}
                {selectedOperation === operation.id && (
                  <div className="absolute top-4 right-4">
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
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Continue Button - Centered */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex justify-center mt-12"
        >
          <ContinueButton onClick={handleContinue} disabled={!isValid} />
        </motion.div>

        {/* Required Fields Note 
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-4 text-sm"
          style={{ color: COLORS.grey.medium }}
        >
          Fields marked with{' '}
          <span style={{ color: COLORS.yellow.primary }}>*</span> need to be
          completed to continue
        </motion.div>*/}
      </div>
    </Trac360Layout>
  );
}

export default function OperationType() {
  return <Trac360OptionsGate>{(options) => <OperationTypeInner options={options} />}</Trac360OptionsGate>;
}