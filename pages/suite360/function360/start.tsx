/**
 * FUNCTION360 Start Page
 * Landing page with hero, features, and call-to-action
 */

import React, {useEffect} from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { useFunction360 } from '../../../context/Function360Context';
import Head from 'next/head';

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function Start() {
  const router = useRouter();
  const { resetConfig } = useFunction360();

  // Clear Function360 context when user lands on start page
  useEffect(() => {
    console.log('🧹 [FUNCTION360] Clearing context - user starting fresh');
    resetConfig();
    
    // Clear any session flags
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('function360-setup-reminder-position');
    }
  }, [resetConfig]);

  const handleGetStarted = () => {
    router.push('/suite360/function360/equipment');
  };

  return (
    <>
    <Head>
      <title>Function360 | FluidPower Group</title>
      <meta name="description" content="Configure your custom hydraulic function kit online. Choose from diverter valves, quick couplings, adaptors, hoses and electrical systems for your equipment." />
    </Head>
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-6 py-20">
      {/* Background gradient */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)',
          zIndex: -1,
        }}
      />

      {/* Main Content Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="max-w-2xl w-full"
        style={{
          padding: '48px',
          borderRadius: '24px',
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.9)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
        }}
      >
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="space-y-8"
        >
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

          {/* Heading with Animated 0 */}
          <motion.div variants={fadeInUp} className="text-center space-y-4">
            <h1 className="flex items-center justify-center gap-1">
              <span
                className="text-4xl md:text-5xl font-bold tracking-tight"
                style={{ color: '#4a4a4a' }}
              >
                Function36
              </span>
              <motion.span
                key="rotating-zero"
                initial={{ rotate: 0 }}
                animate={{ rotate: 720 }}
                transition={{
                  duration: 1,
                  ease: 'easeInOut',
                  delay: 0.8,
                }}
                whileHover={{
                  rotate: [0, 720],
                  transition: { duration: 0.6, ease: 'easeInOut' },
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  marginLeft: '-2px',
                }}
              >
                <svg
                  width="44"
                  height="44"
                  viewBox="0 0 32 32"
                  fill="none"
                >
                  <path
                    d="M 16 4 A 12 12 0 1 1 11 5.5"
                    stroke="#facc15"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <path
                    d="M9.5 4.5 L17.5 6.8 L13 12 Z"
                    fill="#facc15"
                  />
                </svg>
              </motion.span>
            </h1>

            {/* Placeholder Image */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex justify-center mb-8"
            >
              <div className="relative w-120 h-80 flex items-center justify-center">
                <div style={{ opacity: 1 }}>
                <Image
                  src="/Function360.png"  // ← USE LOGO DIRECTLY
                  alt="Hydraulic Function Kit"
                  width={340}
                  height={340}
                  unoptimized
                />
                </div>
              </div>
            </motion.div>

            <p
              className="text-base md:text-lg leading-relaxed"
              style={{ color: '#6b7280' }}
            >
              Build your custom hydraulic function kit by selecting the components you need.
              Choose from diverter valves, quick couplings, adaptors, hoses, electrical systems,
              and mounting brackets — all precisely configured for your equipment.
            </p>
          </motion.div>

          {/* Start Button */}
          <motion.div
            variants={fadeInUp}
            transition={{ delay: 0.3 }}
            className="pt-4 flex justify-center"
          >
            <motion.button
              onClick={handleGetStarted}
              className="group"
              style={{
                height: '56px',
                padding: '0 48px',
                borderRadius: '28px',
                border: '1px solid rgba(250, 204, 21, 0.3)',
                background: 'linear-gradient(135deg, rgba(250, 204, 21, 0.9) 0%, rgba(250, 204, 21, 1) 100%)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                color: '#4a4a4a',
                fontSize: '16px',
                fontWeight: '600',
                letterSpacing: '0.5px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                boxShadow: '0 4px 20px rgba(250, 204, 21, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              whileHover={{
                scale: 1.03,
                boxShadow: '0 6px 25px rgba(250, 204, 21, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
                background: 'linear-gradient(135deg, rgba(250, 204, 21, 1) 0%, rgba(252, 211, 77, 1) 100%)',
              }}
              whileTap={{ scale: 0.97 }}
            >
              START
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                className="transition-transform group-hover:translate-x-1"
              >
                <path
                  d="M5 12h14M12 5l7 7-7 7"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </motion.button>
          </motion.div>

          {/* Helper Text */}
          <motion.p
            variants={fadeInUp}
            transition={{ delay: 0.4 }}
            className="text-center text-sm"
            style={{ color: '#9ca3af' }}
          >
            Takes approximately 3 minutes to complete
          </motion.p>
        </motion.div>
      </motion.div>

      {/* Decorative elements */}
      <div
        style={{
          position: 'fixed',
          top: '15%',
          right: '10%',
          width: '250px',
          height: '250px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(250, 204, 21, 0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: -1,
        }}
      />
      <div
        style={{
          position: 'fixed',
          bottom: '15%',
          left: '10%',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(250, 204, 21, 0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: -1,
        }}
      />
    </div>
    </>
  );
}