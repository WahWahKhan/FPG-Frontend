/**
 * TRAC360 Shared Styles & Animations
 * Common constants and Framer Motion variants
 */

import { Variants } from 'framer-motion';

// ==================== GLASSMORPHISM STYLES ====================

export const GLASS_BASE = {
  background: 'rgba(255, 255, 255, 0.7)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.3)',
};

export const GLASS_CARD = {
  ...GLASS_BASE,
  borderRadius: '16px',
  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
};

export const GLASS_CARD_SELECTED = {
  ...GLASS_CARD,
  border: '2px solid #facc15',
  boxShadow: '0 0 20px rgba(250, 204, 21, 0.4), 0 4px 15px rgba(0, 0, 0, 0.1)',
};

export const GLASS_MODAL = {
  background: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.5)',
  borderRadius: '24px',
  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
};

// ==================== COLOR CONSTANTS ====================

export const COLORS = {
  // Yellow accents
  yellow: {
    primary: '#facc15',
    light: '#ffd700',
    glow: 'rgba(250, 204, 21, 0.4)',
  },
  
  // Grey shades
  grey: {
    dark: '#4a4a4a',
    medium: '#6b7280',
    light: '#d1d5db',
    lighter: '#f3f4f6',
  },
  
  // Functional colors
  success: '#10b981',
  error: '#ef4444',
  info: '#3b82f6',
};

// ==================== ANIMATION VARIANTS ====================

export const fadeIn: Variants = {
  initial: { 
    opacity: 0, 
    y: 20 
  },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut'
    }
  },
  exit: { 
    opacity: 0, 
    y: -20,
    transition: {
      duration: 0.2,
      ease: 'easeIn'
    }
  }
};

export const scaleUp: Variants = {
  initial: { 
    scale: 0.95, 
    opacity: 0 
  },
  animate: { 
    scale: 1, 
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: 'easeOut'
    }
  },
  exit: { 
    scale: 0.95, 
    opacity: 0,
    transition: {
      duration: 0.2,
      ease: 'easeIn'
    }
  }
};

export const slideUp: Variants = {
  initial: { 
    y: '100%', 
    opacity: 0 
  },
  animate: { 
    y: 0, 
    opacity: 1,
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1]
    }
  },
  exit: { 
    y: '100%', 
    opacity: 0,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1]
    }
  }
};

export const modalBackdrop: Variants = {
  initial: { 
    opacity: 0 
  },
  animate: { 
    opacity: 1,
    transition: {
      duration: 0.2
    }
  },
  exit: { 
    opacity: 0,
    transition: {
      duration: 0.2
    }
  }
};

// ==================== HOVER EFFECTS ====================

export const hoverScale = {
  scale: 1.02,
  transition: {
    duration: 0.2,
    ease: 'easeOut' as const
  }
};

export const hoverGlow = {
  boxShadow: '0 0 20px rgba(250, 204, 21, 0.3), 0 4px 15px rgba(0, 0, 0, 0.1)',
  transition: {
    duration: 0.3,
    ease: 'easeOut'
  }
};

// ==================== RESPONSIVE BREAKPOINTS ====================

export const BREAKPOINTS = {
  mobile: 640,
  tablet: 768,
  desktop: 1024,
  wide: 1280,
};

// ==================== GRID COLUMNS ====================

export const getGridColumns = (columns: number = 3) => ({
  gridTemplateColumns: {
    base: '1fr',
    md: `repeat(2, 1fr)`,
    lg: `repeat(${columns}, 1fr)`,
  }
});