/**
 * FUNCTION360 Back Button Component
 * Floating back button (top-left) - positioned below header
 */

import React from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';

interface BackButtonProps {
  onClick?: () => void;
}

export default function BackButton({ onClick }: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.back();
    }
  };

  return (
    <motion.button
      onClick={handleClick}
      whileTap={{ scale: 0.95 }}
      aria-label="Go back to previous step"
      style={{
        position: 'fixed',
        top: '140px',
        left: '30px',
        zIndex: 49,
        backgroundColor: '#4a4a4a',
        width: '68px',
        height: '68px',
        borderRadius: '34px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1.5px solid #4a4a4a',
        boxShadow: '0 3px 6px rgba(0,0,0,0.4)',
        cursor: 'pointer',
      }}
    >
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <path
          d="M19 12H5M12 19L5 12L12 5"
          stroke="#ffffff"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </motion.button>
  );
}
