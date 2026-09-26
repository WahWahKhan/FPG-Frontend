// components/Tube360/GlassSecondaryButton.tsx
// Black 3D-glass secondary button — matches the site's established glass
// theme (see components/modules/Cart/FooterCart.tsx's "Go to Checkout"
// button, the reference for this style). Inverts to white/black text on
// hover, same as that button.
//
// onTouchStart is a deliberate, required no-op: a button that only has
// onMouseEnter/onMouseLeave (no touch handler) makes iOS Safari treat the
// first tap as simulating :hover and only fires the actual click on a
// SECOND tap - see the "Click to View PDF" fix in pages/checkout.tsx /
// pages/order-confirmation.tsx for the full writeup of this exact bug.
// Every new glass button needs this, not just a copy of the visual styles.

import React, { useState } from 'react';

interface GlassSecondaryButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  /** black (default) | yellow (site theme) | white (inverted black: white at rest, black on hover) */
  variant?: 'black' | 'yellow' | 'white';
}

const BLACK_REST = {
  color: '#fff',
  background: 'radial-gradient(ellipse at center, rgba(0, 0, 0, 0.9) 20%, rgba(0, 0, 0, 0.8) 70%, rgba(20, 20, 20, 0.85) 100%), rgba(0, 0, 0, 0.8)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.3), inset 0 2px 8px rgba(255, 255, 255, 0.1), inset 0 -1px 0 rgba(0, 0, 0, 0.2)',
};
const WHITE_REST = {
  color: '#000',
  background: 'radial-gradient(ellipse at center, rgba(255, 255, 255, 0.95) 20%, rgba(255, 255, 255, 0.9) 70%, rgba(245, 245, 245, 0.95) 100%), rgba(255, 255, 255, 0.9)',
  border: '1px solid rgba(200, 200, 200, 0.8)',
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2), inset 0 2px 0 rgba(255, 255, 255, 1), inset 0 3px 10px rgba(255, 255, 255, 0.8), inset 0 -1px 0 rgba(200, 200, 200, 0.4)',
};
const YELLOW_REST = {
  color: '#000',
  background: 'radial-gradient(ellipse at center, rgba(250, 204, 21, 0.9) 20%, rgba(250, 204, 21, 0.7) 60%, rgba(255, 215, 0, 0.8) 100%), rgba(250, 204, 21, 0.6)',
  border: '1px solid rgba(255, 215, 0, 0.9)',
  boxShadow: '0 6px 20px rgba(250, 204, 21, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.8)',
};
const YELLOW_HOVER = {
  ...YELLOW_REST,
  background: 'radial-gradient(ellipse at center, rgba(252, 211, 77, 1) 20%, rgba(250, 204, 21, 0.95) 60%, rgba(255, 215, 0, 1) 100%), rgba(250, 204, 21, 0.9)',
  boxShadow: '0 10px 30px rgba(250, 204, 21, 0.5), inset 0 2px 0 rgba(255, 255, 255, 0.9)',
};

export default function GlassSecondaryButton({ onClick, children, disabled = false, variant = 'black' }: GlassSecondaryButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const hovered = isHovered && !disabled;
  const theme =
    variant === 'yellow' ? (hovered ? YELLOW_HOVER : YELLOW_REST)
    : variant === 'white' ? (hovered ? BLACK_REST : WHITE_REST)
    : hovered ? WHITE_REST : BLACK_REST;

  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      onMouseEnter={() => !disabled && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={() => {}}
      className="relative overflow-hidden transition-all duration-300 ease-out"
      style={{
        all: 'unset',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '10px 24px',
        borderRadius: '40px',
        fontSize: '0.875rem',
        fontWeight: 600,
        position: 'relative',
        whiteSpace: 'nowrap',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isHovered && !disabled ? 'translateY(-2px) scale(1.02)' : 'translateY(0px) scale(1)',
        ...theme,
        backdropFilter: 'blur(15px)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '1px',
          left: '8px',
          right: '8px',
          height: '50%',
          background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%)',
          borderRadius: '40px 40px 20px 20px',
          pointerEvents: 'none',
          transition: 'all 0.4s ease',
        }}
      />
      {children}
    </button>
  );
}
