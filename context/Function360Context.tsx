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
import { collectProductIds } from '../utils/function360/pricing';
import { fetchFunction360Price } from '../lib/function360/api';

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
  const [priceLoading, setPriceLoading] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);

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

  /**
   * Re-price whenever selections change, by calling the backend's
   * POST /api/function360/price — the SAME function checkout uses
   * (priceFunction360Line). Debounced so it's safe on every toggle.
   */
  useEffect(() => {
    if (!isHydrated) return;

    const anySelected = Object.values(config.selectedComponents).some(Boolean);
    if (!anySelected || !config.equipment.horsepower || !config.equipment.functionType) {
      if (config.totalPrice !== 0) setConfig(prev => ({ ...prev, totalPrice: 0, swellProductIds: [] }));
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => {
      setPriceLoading(true);
      setPriceError(null);
      fetchFunction360Price(config.selectedComponents, config.equipment, controller.signal)
        .then(res => {
          const newProductIds = res.swellProductIds && res.swellProductIds.length
            ? res.swellProductIds
            : collectProductIds(config);
          // Rebuild componentPrices from the fresh, equipment-aware breakdown
          // instead of trusting the toggle-time cache — otherwise a line item's
          // displayed price goes stale if the user changes equipment after
          // selecting it (price is variant-keyed by horsepower/functionType),
          // and the total stops matching the sum of the line items on screen.
          const freshPrices: Partial<Function360Config['componentPrices']> = {};
          res.breakdown.parts.forEach(part => {
            freshPrices[part.component as keyof SelectedComponents] = part.price;
          });
          setConfig(prev => {
            const nextComponentPrices = { ...prev.componentPrices, ...freshPrices };
            if (
              prev.totalPrice === res.amount &&
              JSON.stringify(prev.swellProductIds) === JSON.stringify(newProductIds) &&
              JSON.stringify(prev.componentPrices) === JSON.stringify(nextComponentPrices)
            ) {
              return prev;
            }
            return { ...prev, totalPrice: res.amount, swellProductIds: newProductIds, componentPrices: nextComponentPrices };
          });
        })
        .catch(err => {
          if (err?.name === 'AbortError') return;
          console.error('[FUNCTION360] price fetch failed:', err);
          setPriceError(err?.message || 'Could not calculate the price');
        })
        .finally(() => setPriceLoading(false));
    }, 200);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated, config.selectedComponents, config.equipment]);

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
    priceLoading,
    priceError,
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