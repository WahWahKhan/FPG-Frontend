/**
 * FUNCTION360 Context Provider
 * Manages global state for the configurator with localStorage persistence
 */

'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Function360Config,
  Function360ContextValue,
  Function360Step,
  EquipmentSelection,
  SelectedComponents,
} from '../types/function360';
import { calculateTotalPrice, collectProductIds } from '../utils/function360/pricing';

// ============================================================================
// CONSTANTS
// ============================================================================

const STORAGE_KEY = 'function360-config';
const STORAGE_TIMESTAMP_KEY = 'function360-timestamp';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialConfig: Function360Config = {
  equipment: {
    horsepower: null,
    functionType: null,
  },
  selectedComponents: {
    diverterValve: false,
    quickCouplings: false,
    adaptors: false,
    hydraulicHoses: false,
    electrical: false,
    mountingBrackets: false,
  },
  componentPrices: {
    diverterValve: 0,
    quickCouplings: 0,
    adaptors: 0,
    hydraulicHoses: 0,
    electrical: 0,
    mountingBrackets: 0,
  },
  additionalNotes: '',
  totalPrice: 0,
  swellProductIds: [],
};

// ============================================================================
// CONTEXT CREATION
// ============================================================================

const Function360Context = createContext<Function360ContextValue | undefined>(undefined);

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

interface Function360ProviderProps {
  children: React.ReactNode;
}

export function Function360Provider({ children }: Function360ProviderProps) {
  const [config, setConfig] = useState<Function360Config>(initialConfig);
  const [isHydrated, setIsHydrated] = useState(false);

  // ============================================================================
  // LOCALSTORAGE SYNC
  // ============================================================================

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const isPageReload = performance.navigation.type === 1;
      const isNewSession = !sessionStorage.getItem('function360-session-active');

      if (isNewSession && !isPageReload) {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(STORAGE_TIMESTAMP_KEY);
        sessionStorage.setItem('function360-session-active', 'true');
        setIsHydrated(true);
        return;
      }

      sessionStorage.setItem('function360-session-active', 'true');

      const savedConfig = localStorage.getItem(STORAGE_KEY);
      const timestamp = localStorage.getItem(STORAGE_TIMESTAMP_KEY);

      if (savedConfig && timestamp) {
        const now = Date.now();
        const saved = parseInt(timestamp);

        if (now - saved < SESSION_DURATION) {
          const parsedConfig = JSON.parse(savedConfig);
          setConfig(parsedConfig);
        } else {
          localStorage.removeItem(STORAGE_KEY);
          localStorage.removeItem(STORAGE_TIMESTAMP_KEY);
        }
      }
    } catch (error) {
      console.error('[FUNCTION360] Error loading from localStorage:', error);
    }

    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      localStorage.setItem(STORAGE_TIMESTAMP_KEY, Date.now().toString());
    } catch (error) {
      console.error('[FUNCTION360] Error saving to localStorage:', error);
    }
  }, [config, isHydrated]);

  // ============================================================================
  // AUTO-CALCULATE PRICE
  // ============================================================================

  useEffect(() => {
    const newTotalPrice = calculateTotalPrice(config);
    const newProductIds = collectProductIds(config);

    if (
      config.totalPrice !== newTotalPrice ||
      JSON.stringify(config.swellProductIds) !== JSON.stringify(newProductIds)
    ) {
      setConfig(prev => ({
        ...prev,
        totalPrice: newTotalPrice,
        swellProductIds: newProductIds,
      }));
    }
  }, [config]);

  // ============================================================================
  // UPDATE FUNCTIONS
  // ============================================================================

  const updateEquipment = useCallback((equipment: Partial<EquipmentSelection>) => {
    setConfig(prev => ({
      ...prev,
      equipment: {
        ...prev.equipment,
        ...equipment,
      },
    }));
  }, []);

  const toggleComponent = useCallback((
    componentKey: keyof SelectedComponents, 
    price: number = 0  // ✅ Add price parameter
  ) => {
    setConfig(prev => ({
      ...prev,
      selectedComponents: {
        ...prev.selectedComponents,
        [componentKey]: !prev.selectedComponents[componentKey],
      },
      componentPrices: {  // ✅ Store the price
        ...prev.componentPrices,
        [componentKey]: !prev.selectedComponents[componentKey] ? price : 0,
      },
    }));
  }, []);

  const updateAdditionalNotes = useCallback((notes: string) => {
    setConfig(prev => ({
      ...prev,
      additionalNotes: notes,
    }));
  }, []);

  const resetConfig = useCallback(() => {
    setConfig(initialConfig);

    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_TIMESTAMP_KEY);
    }
  }, []);

  const canProceed = useCallback((step: Function360Step): boolean => {
    switch (step) {
      case 'start':
        return true;
      case 'equipment':
        return Boolean(config.equipment.horsepower && config.equipment.functionType);
      case 'diverter-valve':
      case 'quick-couplings':
      case 'adaptors':
      case 'hydraulic-hoses':
      case 'electrical':
      case 'mounting-brackets':
        return true; // Components are optional
      case 'additional-notes':
        return true; // Notes are optional
      case 'summary':
        return Boolean(config.equipment.horsepower && config.equipment.functionType);
      default:
        return false;
    }
  }, [config]);

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const contextValue: Function360ContextValue = {
    config,
    updateEquipment,
    toggleComponent,
    updateAdditionalNotes,
    resetConfig,
    canProceed,
  };

  return (
    <Function360Context.Provider value={contextValue}>
      {children}
    </Function360Context.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

export function useFunction360(): Function360ContextValue {
  const context = useContext(Function360Context);

  if (context === undefined) {
    throw new Error('useFunction360 must be used within Function360Provider');
  }

  return context;
}