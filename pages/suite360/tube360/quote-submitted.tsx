/**
 * TUBE360 Quote Submitted Page - confirmation (no progress bar, no back button)
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import Head from 'next/head';
import { useTube360 } from '../../../context/Tube360Context';
import { COLORS } from '../../../components/Trac360/styles';
import type { Tube360QuoteResult } from '../../../types/tube360';

export default function QuoteSubmitted() {
  const router = useRouter();
  const { resetConfig } = useTube360();
  const [result, setResult] = useState<Tube360QuoteResult | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem('tube360-quote-result');
    if (!raw) {
      router.replace('/suite360/tube360/start');
      return;
    }
    try {
      setResult(JSON.parse(raw));
    } catch {
      router.replace('/suite360/tube360/start');
      return;
    }
    resetConfig();
    setChecked(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!checked || !result) return null;

  return (
    <>
      <Head>
        <title>Tube360 | FluidPower Group</title>
        <meta name="robots" content="noindex, follow" />
      </Head>
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-6 py-20">
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
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="max-w-xl w-full rounded-3xl text-center"
          style={{
            padding: '48px',
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.9)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
          }}
        >
          <div className="flex justify-center mb-6">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ background: '#22c55e' }}
            >
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17L4 12" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold mb-4" style={{ color: '#4a4a4a' }}>
            Thank you, {result.name}!
          </h1>
          <p className="mb-6" style={{ color: COLORS.grey.medium }}>
            Your file has been uploaded successfully.
          </p>

          <div
            className="inline-block px-6 py-3 rounded-xl mb-6 font-mono text-lg"
            style={{ border: `2px solid ${COLORS.yellow.primary}`, color: '#4a4a4a' }}
          >
            Reference: {result.ref}
          </div>

          <p className="mb-4" style={{ color: COLORS.grey.medium }}>
            {result.customerEmailed
              ? `We've sent a confirmation to ${result.email}.`
              : `Your request reached our team, but we couldn't send the confirmation email to ${result.email}. Please keep your reference number.`}
          </p>

          <p className="mb-8" style={{ color: COLORS.grey.medium }}>
            Our team will review your drawing and contact you, usually within 1 business day, with a quote.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push('/suite360')}
              className="px-8 py-3 rounded-full font-semibold"
              style={{ background: COLORS.yellow.primary, color: '#000' }}
            >
              Back to Suite360
            </button>
            <button
              onClick={() => router.push('/catalogue')}
              className="px-8 py-3 rounded-full font-semibold text-white"
              style={{ background: '#000' }}
            >
              Browse Products
            </button>
          </div>
        </motion.div>
      </div>
    </>
  );
}
