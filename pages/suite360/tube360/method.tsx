/**
 * TUBE360 Method Selection Page - Step 1
 * Choose manual entry or upload-for-quote
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Head from 'next/head';
import Tube360Layout from '../../../components/Tube360/Tube360Layout';
import OptionsGate from '../../../components/Tube360/OptionsGate';
import BackButton from '../../../components/Trac360/Shared/BackButton';
import ContinueButton from '../../../components/Trac360/Shared/ContinueButton';
import SelectionCard from '../../../components/Trac360/SelectionCard';
import { PagePill } from '../../../components/Tube360/Fields';
import { useTube360 } from '../../../context/Tube360Context';
import { COLORS } from '../../../components/Trac360/styles';
import type { Tube360Method } from '../../../types/tube360';

/**
 * TOGGLE: flip to `true` once pricing (rates.json / catalog.json / machine.json)
 * is confirmed and ready to go live. While `false`, the "Enter tube data
 * manually" card is shown greyed-out with a diagonal "COMING SOON" ribbon and
 * cannot be selected — customers can still use "Upload your own file".
 */
export const TUBE360_MANUAL_METHOD_ENABLED = true;

const METHODS: Array<{ id: Tube360Method; title: string; description: string; image: string }> = [
  {
    id: 'manual',
    title: 'Enter tube data manually',
    description: 'Choose your tube, ends and bends. See your price instantly and add it to your cart.',
    image: '/tubeBending.png',
  },
  {
    id: 'upload',
    title: 'Upload your own file',
    description: "Send us a drawing or CAD file (STEP, IGES, DXF, PDF...). We'll email you a quote, usually within 1 business day.",
    image: '/drafting.jpeg',
  },
];

export default function Method() {
  const router = useRouter();
  const { config, setMethod } = useTube360();

  const handleBack = () => router.push('/suite360/tube360/start');
  const handleContinue = () => {
    if (!config.method) return;
    router.push('/suite360/tube360/tube-specs');
  };

  return (
    <>
      <Head>
        <title>Tube360 | FluidPower Group</title>
        <meta name="robots" content="noindex, follow" />
      </Head>
      <OptionsGate>
        {() => (
          <Tube360Layout currentStep={1}>
            <BackButton onClick={handleBack} />
            <div className="max-w-2xl mx-auto px-2 sm:px-4">
              {/* Logo */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
                className="flex justify-center"
              >
                <div className="relative w-40 h-40 sm:w-60 sm:h-60">
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

              <PagePill>HOW WOULD YOU LIKE TO START?</PagePill>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {METHODS.map((m) => {
                  const disabled = m.id === 'manual' && !TUBE360_MANUAL_METHOD_ENABLED;
                  return (
                    <div key={m.id} className="relative">
                      <div
                        style={
                          disabled
                            ? { opacity: 0.55, filter: 'grayscale(70%)', pointerEvents: 'none' }
                            : undefined
                        }
                      >
                        <SelectionCard
                          id={m.id}
                          title={m.title}
                          description={m.description}
                          image={m.image}
                          selected={config.method === m.id}
                          onClick={() => setMethod(m.id)}
                        />
                      </div>
                      {disabled && (
                        <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
                          <div
                            className="absolute text-center font-extrabold uppercase"
                            style={{
                              top: '42%',
                              left: '-15%',
                              width: '130%',
                              transform: 'rotate(-10deg)',
                              background: COLORS.grey.dark,
                              color: '#ffffff',
                              padding: '10px 0',
                              letterSpacing: '2px',
                              fontSize: '15px',
                              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.35)',
                            }}
                          >
                            Coming Soon
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-col items-center mt-8 space-y-3">
                <ContinueButton onClick={handleContinue} disabled={!config.method} />
                {!config.method && (
                  <p className="text-sm" style={{ color: COLORS.grey.medium }}>
                    Choose an option to continue
                  </p>
                )}
              </div>
            </div>
          </Tube360Layout>
        )}
      </OptionsGate>
    </>
  );
}
