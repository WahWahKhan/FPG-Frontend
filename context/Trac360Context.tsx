/**
 * TRAC360 Context Provider
 * Manages global state for the configurator with localStorage persistence
 */

'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Trac360Config,
  Trac360ContextValue,
  Trac360Step,
  TractorInfo,
  ValveSetup,
  OperationType,
  Circuit,
  Addon,
} from '../types/trac360';
import { calculateTotalPrice, collectProductIds } from '../utils/trac360/pricing';
import { canProceedFromStep } from '../utils/trac360/validation';

// ============================================================================
// CONSTANTS
// ============================================================================

const STORAGE_KEY = 'trac360-config';
const STORAGE_TIMESTAMP_KEY = 'trac360-timestamp';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialConfig: Trac360Config = {
  tractorInfo: {
    brand: null,
    model: null,
    driveType: null,
    protectionType: null,
  },
  valveSetup: null,
  operationType: null,
  circuits: null,
  addons: [],
  additionalInfo: '',
  totalPrice: 0,
  productIds: [],
};

// ============================================================================
// CONTEXT CREATION
// ============================================================================

const Trac360Context = createContext<Trac360ContextValue | undefined>(undefined);

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

interface Trac360ProviderProps {
  children: React.ReactNode;
}

export function Trac360Provider({ children }: Trac360ProviderProps) {
  const [config, setConfig] = useState<Trac360Config>(initialConfig);
  const [currentStep, setCurrentStep] = useState<Trac360Step>('start');
  const [isHydrated, setIsHydrated] = useState(false);

  // ============================================================================
  // LOCALSTORAGE SYNC
  // ============================================================================

  /**
   * Load configuration from localStorage on mount
   */
  useEffect(() => {
    if (typeof window === 'undefined') return;
  
    try {
      // ✅ NEW: Check if this is a fresh page load (app restart)
      const isPageReload = performance.navigation.type === 1; // 1 = reload, 0 = navigate
      const isNewSession = !sessionStorage.getItem('trac360-session-active');
      
      // If new session (app restart, not just page reload), clear everything
      if (isNewSession && !isPageReload) {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(STORAGE_TIMESTAMP_KEY);
        sessionStorage.removeItem('trac360-setup-reminder-position');
        sessionStorage.setItem('trac360-session-active', 'true');
        setIsHydrated(true);
        return;
      }
      
      // Mark session as active
      sessionStorage.setItem('trac360-session-active', 'true');
  
      const savedConfig = localStorage.getItem(STORAGE_KEY);
      const timestamp = localStorage.getItem(STORAGE_TIMESTAMP_KEY);
  
      if (savedConfig && timestamp) {
        const now = Date.now();
        const saved = parseInt(timestamp);
  
        // Check if session is still valid (within 24 hours)
        if (now - saved < SESSION_DURATION) {
          const parsedConfig = JSON.parse(savedConfig);
          setConfig(parsedConfig);
        } else {
          // Session expired, clear localStorage
          localStorage.removeItem(STORAGE_KEY);
          localStorage.removeItem(STORAGE_TIMESTAMP_KEY);
          sessionStorage.removeItem('trac360-setup-reminder-position');
        }
      }
    } catch (error) {
      console.error('[TRAC360] Error loading from localStorage:', error);
    }
  
    setIsHydrated(true);
  }, []);

  /**
   * Save configuration to localStorage whenever it changes
   */
  useEffect(() => {
    if (!isHydrated) return; // Don't save until after initial hydration
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      localStorage.setItem(STORAGE_TIMESTAMP_KEY, Date.now().toString());
    } catch (error) {
      console.error('[TRAC360] Error saving to localStorage:', error);
    }
  }, [config, isHydrated]);

  // ============================================================================
  // AUTO-CALCULATE PRICE
  // ============================================================================

  /**
   * Recalculate total price whenever config changes
   */
  useEffect(() => {
    const newTotalPrice = calculateTotalPrice(config);
    const newProductIds = collectProductIds(config);

    // Only update if price or product IDs changed
    if (
      config.totalPrice !== newTotalPrice ||
      JSON.stringify(config.productIds) !== JSON.stringify(newProductIds)
    ) {
      setConfig(prev => ({
        ...prev,
        totalPrice: newTotalPrice,
        productIds: newProductIds,
      }));
    }
  }, [config]); // ✅ FIX: Watch entire config object

  // ============================================================================
  // UPDATE FUNCTIONS
  // ============================================================================

  /**
   * Update tractor information (Step 1)
   */
  const updateTractorInfo = useCallback((info: Partial<TractorInfo>) => {
    setConfig(prev => ({
      ...prev,
      tractorInfo: {
        ...prev.tractorInfo,
        ...info,
      },
    }));
  }, []);

  /**
   * Update valve setup (Step 2)
   * Clears future steps if valve changes
   */
  const updateValveSetup = useCallback((setup: ValveSetup | null) => {
    setConfig(prev => ({
      ...prev,
      valveSetup: setup,
      // Clear future steps
      operationType: null,
      circuits: null,
      addons: [],
    }));
  }, []);

  /**
   * Update operation type (Step 3)
   * Clears future steps if operation type changes
   */
  const updateOperationType = useCallback((type: OperationType | null) => {
    setConfig(prev => ({
      ...prev,
      operationType: type,
      // Clear future steps
      circuits: null,
      addons: [],
    }));
  }, []);

  /**
   * Update circuits (Step 4)
   * Clears future steps if circuits change
   */
  const updateCircuits = useCallback((circuits: Circuit | null) => {
    setConfig(prev => ({
      ...prev,
      circuits,
      // Clear future steps
      addons: [],
    }));
  }, []);

  /**
   * Add an addon (Step 5)
   */
  const addAddon = useCallback((addon: Addon) => {
    setConfig(prev => {
      // Check if addon already exists
      const exists = prev.addons.some(a => a.id === addon.id);
      if (exists) {
        console.warn(`[TRAC360] Addon ${addon.id} already added`);
        return prev;
      }

      return {
        ...prev,
        addons: [...prev.addons, addon],
      };
    });
  }, []);

  /**
   * Remove an addon (Step 5)
   */
  const removeAddon = useCallback((addonId: string) => {
    setConfig(prev => ({
      ...prev,
      addons: prev.addons.filter(a => a.id !== addonId),
    }));
  }, []);

  /**
   * Update addon sub-option selection
   */
  const updateAddonSubOption = useCallback((addonId: string, subOptionId: string | null) => {
    setConfig(prev => ({
      ...prev,
      addons: prev.addons.map(addon =>
        addon.id === addonId
          ? { ...addon, selectedSubOption: subOptionId }
          : addon
      ),
    }));
  }, []);

  /**
   * Update additional info (Step 6)
   */
  const updateAdditionalInfo = useCallback((info: string) => {
    setConfig(prev => ({
      ...prev,
      additionalInfo: info,
    }));
  }, []);

  // ============================================================================
  // NAVIGATION HELPERS
  // ============================================================================

  /**
   * Clear all steps after the specified step
   * Used when user goes back and changes a selection
   */
  const clearFutureSteps = useCallback((fromStep: Trac360Step) => {
    const stepOrder: Trac360Step[] = [
      'start',
      'tractor-info',
      'valve-setup',
      'operation-type',
      'circuits',
      'addons',
      'summary',
    ];

    const currentIndex = stepOrder.indexOf(fromStep);

    setConfig(prev => {
      const newConfig = { ...prev };

      // Clear steps after current step
      if (currentIndex < stepOrder.indexOf('valve-setup')) {
        newConfig.valveSetup = null;
      }
      if (currentIndex < stepOrder.indexOf('operation-type')) {
        newConfig.operationType = null;
      }
      if (currentIndex < stepOrder.indexOf('circuits')) {
        newConfig.circuits = null;
      }
      if (currentIndex < stepOrder.indexOf('addons')) {
        newConfig.addons = [];
      }

      return newConfig;
    });
  }, []);

  /**
   * Reset entire configuration to initial state
   */
  const resetConfig = useCallback(() => {
    setConfig(initialConfig);
    setCurrentStep('start');
    
    // Clear localStorage AND sessionStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_TIMESTAMP_KEY);
      sessionStorage.removeItem('trac360-setup-reminder-position'); // ← ADD THIS
    }
  }, []);

  /**
   * Check if user can proceed from current step
   */
  const canProceed = useCallback((step: Trac360Step): boolean => {
    return canProceedFromStep(step, config);
  }, [config]);

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const contextValue: Trac360ContextValue = {
    // State
    config,
    currentStep,

    // Actions
    updateTractorInfo,
    updateValveSetup,
    updateOperationType,
    updateCircuits,
    addAddon,
    removeAddon,
    updateAddonSubOption,
    updateAdditionalInfo,

    // Navigation helpers
    clearFutureSteps,
    resetConfig,

    // Validation
    canProceed,
  };

  return (
    <Trac360Context.Provider value={contextValue}>
      {children}
    </Trac360Context.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook to access TRAC360 context
 * 
 * @throws Error if used outside Trac360Provider
 * 
 * @example
 * const { config, updateTractorInfo } = useTrac360();
 */
export function useTrac360(): Trac360ContextValue {
  const context = useContext(Trac360Context);

  if (context === undefined) {
    throw new Error('useTrac360 must be used within Trac360Provider');
  }

  return context;
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Hook to get just the config (no actions)
 * Useful for read-only components
 */
export function useTrac360Config(): Trac360Config {
  const { config } = useTrac360();
  return config;
}

/**
 * Hook to check if a specific step is complete
 */
export function useIsStepComplete(step: Trac360Step): boolean {
  const { canProceed } = useTrac360();
  return canProceed(step);
}

/**
 * Hook to get current total price
 */
export function useTrac360Price(): number {
  const { config } = useTrac360();
  return config.totalPrice;
}