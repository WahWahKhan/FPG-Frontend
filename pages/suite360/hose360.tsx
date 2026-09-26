/**
 * HOSE360 Welcome / Start page — native replacement for the old bolted-on
 * React Native/Expo bundle loader. Keeps the exact same URL,
 * `/suite360/hose360`, per DECISIONS.md §2.
 *
 * Per 02_FRONTEND_PLAN.md Step F6 row 1: do NOT call resetConfig() on mount
 * here — this page is also the SEO/bookmark landing page, and "Place New
 * Order" (not a fresh visit here) is what's supposed to reset the config.
 *
 * Round 2 (DECISIONS_ADDENDUM_2.md §1 / 04_UX_FIDELITY_FIX_PLAN.md Step U1):
 * restored OG's three separate copy lines + "Takes less than 5 minutes"
 * line below START, and ported the "HOSE36" + spinning circular-arrow "0"
 * title treatment (WelcomeScreen.js:13-21/77-93). The welcome_hose.gif hero
 * image was already correct here (not the END-fitting diagram) — verified
 * during this round, no change needed.
 */

import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { COLORS } from '../../components/Trac360/styles';
import ContinueButton from '../../components/Trac360/Shared/ContinueButton';

export default function Hose360Welcome() {
  const router = useRouter();
  const [spinCount, setSpinCount] = useState(0);

  const handleStart = () => {
    router.push('/suite360/hose360/hose-selection');
  };

  // Port of WelcomeScreen.js's spinIcon() click-to-spin easter egg: the "0"
  // in HOSE360 is a circular-arrow icon that does a 720deg spin on tap.
  // Bumping spinCount changes the `animate` target so Framer Motion
  // re-triggers the rotation on every click (matches the RN version's
  // rotateAnim.setValue(0) + Animated.timing to 2 turns).
  const handleSpinClick = () => setSpinCount((c) => c + 1);

  // Don't spin until the page has fully loaded AND the entrance animations
  // have settled, so the customer actually sees the intro spin (it used to
  // run on mount, i.e. before anything was visible).
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const start = () => {
      timer = setTimeout(() => setSpinCount((c) => (c === 0 ? 1 : c)), 900);
    };
    if (document.readyState === 'complete') start();
    else window.addEventListener('load', start, { once: true });
    return () => {
      window.removeEventListener('load', start);
      if (timer) clearTimeout(timer);
    };
  }, []);

  return (
    <>
      <Head>
        <title>Hose360 - Fluid Power Group</title>
        <meta
          name="description"
          content="Build your own custom hydraulic hose online. Select hose size, end fittings, cut length and quantity. Done in under 5 minutes. Order direct from FluidPower Group."
        />
        <meta name="viewport" content="width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1.00001,viewport-fit=cover" />
      </Head>

      <div className="min-h-screen pb-12">
        <div className="max-w-2xl mx-auto px-4 pt-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="flex justify-center mb-8"
          >
            <div className="relative w-60 h-60">
              <Image src="/fluidpower_logo_transparent.gif" alt="Fluid Power Group" width={240} height={240} className="object-contain" unoptimized />
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex justify-center mb-8">
            <div
              className="inline-flex items-center gap-1"
              style={{ color: COLORS.grey.dark, fontSize: 48, fontWeight: 700 }}
            >
              <span>HOSE36</span>
              <button
                type="button"
                onClick={handleSpinClick}
                aria-label="Spin"
                className="inline-flex items-center justify-center"
                style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}
              >
                {/* HTML wrapper rotates about its own centre, which is the arc's
                    centre (16,16 of the 32x32 viewBox) — the arc is defined as a
                    true circle of r=12 about that point so it stays concentric. */}
                <motion.span
                  key={spinCount}
                  className="inline-flex"
                  style={{ transformOrigin: '50% 50%' }}
                  initial={{ rotate: 0 }}
                  animate={{ rotate: spinCount === 0 ? 0 : 720 }}
                  transition={{ duration: 0.6, ease: [0.45, 0, 0.55, 1] }}
                >
                <svg width="40" height="40" viewBox="0 0 32 32" fill="none">
                  <path
                    d="M 16 4 A 12 12 0 1 1 10 5.61"
                    stroke="#facc15"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <path d="M9.5 4.5 L17.5 6.8 L13 12 Z" fill="#facc15" />
                </svg>
                </motion.span>
              </button>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex justify-center mb-8">
            <div className="relative w-full max-w-md h-64 flex items-center justify-center">
              <Image src="/hose360/welcome_hose.gif" alt="Hose360 Custom Hydraulic Hose" width={400} height={250} className="object-contain" unoptimized />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-center mb-10 space-y-2"
          >
            <p className="text-base" style={{ color: COLORS.grey.medium }}>
              Build your own Hydraulic Hose.
            </p>
            <p className="text-base" style={{ color: COLORS.grey.medium }}>
              Select Hose Size, End Fittings, Cut Length and the Quantity.
            </p>
            <p className="text-base" style={{ color: COLORS.grey.medium }}>
              You are DONE, it is this SIMPLE.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="flex flex-col items-center">
            <ContinueButton onClick={handleStart} text="START" showArrow={true} />
            <p className="mt-4 text-sm" style={{ color: COLORS.grey.medium }}>
              Takes less than 5 minutes to complete
            </p>
          </motion.div>
        </div>
      </div>
    </>
  );
}
