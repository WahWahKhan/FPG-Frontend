/**
 * HOSE360 Context Provider
 * Manages global state for the custom hose assembly configurator with
 * localStorage persistence. Adapted from Function360Context (simpler base)
 * with Trac360Context's more complete resetConfig (clears sessionStorage flag
 * too), per DECISIONS.md §8 / 02_FRONTEND_PLAN.md Step F3.
 */

'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Hose360Config,
  Hose360ContextValue,
  Hose360Step,
  Hose360CutLength,
} from '../types/hose360';
import { fetchHose360Price } from '../lib/hose360/api';

// ============================================================================
// CONSTANTS
// ============================================================================

const STORAGE_KEY = 'hose360-config';
const STORAGE_TIMESTAMP_KEY = 'hose360-timestamp';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialConfig: Hose360Config = {
  selectedHose: null,
  end1Shape: null,
  end1Size: null,
  end1Price: null,
  end1Route: null,
  end2Shape: null,
  end2Size: null,
  end2Price: null,
  end2Route: null,
  selectedAngle: null,
  quantity: 1,
  cutLengths: [],
  selectedProtection: 'NOT REQUIRED',
  selectedPressure: 'Not Required',
  protectionChosen: false,
  pressureChosen: false,
  totalPrice: 0,
  breakdown: null,
  swellProductIds: [],
};

// ============================================================================
// CONTEXT CREATION
// ============================================================================

const Hose360Context = createContext<Hose360ContextValue | undefined>(undefined);

interface Hose360ProviderProps {
  children: React.ReactNode;
}

/** Forget the floating fittings tab's dragged position / minimised state. */
function clearFittingsReminderState() {
  try {
    sessionStorage.removeItem('hose360-fittings-reminder-pos-v2');
    sessionStorage.removeItem('hose360-fittings-reminder-minimized');
  } catch {
    /* ignore */
  }
}

export function Hose360Provider({ children }: Hose360ProviderProps) {
  const [config, setConfig] = useState<Hose360Config>(initialConfig);
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
      const isNewSession = !sessionStorage.getItem('hose360-session-active');

      if (isNewSession && !isPageReload) {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(STORAGE_TIMESTAMP_KEY);
        clearFittingsReminderState();
        sessionStorage.setItem('hose360-session-active', 'true');
        setIsHydrated(true);
        return;
      }

      sessionStorage.setItem('hose360-session-active', 'true');

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
      console.error('[HOSE360] Error loading from localStorage:', error);
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
      console.error('[HOSE360] Error saving to localStorage:', error);
    }
  }, [config, isHydrated]);

  // ============================================================================
  // AUTO-CALCULATE PRICE
  // ============================================================================

  useEffect(() => {
    if (!isHydrated) return;

    if (!config.selectedHose || !config.end1Shape || !config.end2Shape) {
      if (config.totalPrice !== 0) {
        setConfig((prev) => ({ ...prev, totalPrice: 0, breakdown: null, swellProductIds: [] }));
      }
      return;
    }

    const controller = new AbortController();
    // U7 loading-timing fix: set priceLoading synchronously the moment the
    // triggering field changes (not inside the debounce's setTimeout), so
    // there's no ~200ms+ window where the price bar shows the stale total
    // under "Total:" instead of "Updating…".
    setPriceLoading(true);
    setPriceError(null);
    const timer = setTimeout(() => {
      fetchHose360Price(
        {
          selectedHose: config.selectedHose,
          end1Shape: config.end1Shape,
          end1Size: config.end1Size,
          end2Shape: config.end2Shape,
          end2Size: config.end2Size,
          cutLengths: config.cutLengths,
          selectedProtection: config.selectedProtection,
          selectedPressure: config.selectedPressure,
          quantity: config.quantity,
          isOrderFittingMode: false,
        },
        controller.signal
      )
        .then((res) => {
          setConfig((prev) => {
            if (
              prev.totalPrice === res.amount &&
              JSON.stringify(prev.swellProductIds) === JSON.stringify(res.swellProductIds || [])
            ) {
              return prev;
            }
            return {
              ...prev,
              totalPrice: res.amount,
              breakdown: res.breakdown || null,
              swellProductIds: res.swellProductIds || [],
            };
          });
        })
        .catch((err) => {
          if (err?.name === 'AbortError') return;
          console.error('[HOSE360] price fetch failed:', err);
          setPriceError(err?.message || 'Could not calculate the price');
        })
        .finally(() => setPriceLoading(false));
    }, 200);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isHydrated,
    config.selectedHose,
    config.end1Shape,
    config.end1Size,
    config.end2Shape,
    config.end2Size,
    config.cutLengths,
    config.selectedProtection,
    config.selectedPressure,
    config.quantity,
  ]);

  // ============================================================================
  // SETTERS
  // ============================================================================

  /**
   * Changing the hose size after end fittings were already picked invalidates
   * both ends' fitting selections (fitting compatibility is keyed by hose
   * size) — defensive cascading invalidation per DECISIONS.md/Step F3. Since
   * navigation is strictly linear (re-entering hose-selection only happens
   * via Back), this mostly guards against a user hitting Back to
   * hose-selection and picking a different size.
   */
  const setSelectedHose = useCallback((size: string) => {
    setConfig((prev) => {
      // Re-picking the same size must not wipe downstream choices.
      if (prev.selectedHose?.size === size) return prev;
      return {
      ...prev,
      selectedHose: { size },
      end1Shape: null,
      end1Size: null,
      end1Price: null,
      end1Route: null,
      end2Shape: null,
      end2Size: null,
      end2Price: null,
      end2Route: null,
      selectedAngle: null,
      cutLengths: [],
      selectedProtection: 'NOT REQUIRED',
      selectedPressure: 'Not Required',
      protectionChosen: false,
      pressureChosen: false,
      };
    });
  }, []);

  /**
   * DECISIONS_ADDENDUM_2.md §7 / 04_UX_FIDELITY_FIX_PLAN.md Step U7 — the
   * real price-bar bug. Several Back buttons are route-only (never touch
   * this state), and setEnd1Fitting/setEnd2Fitting previously only cleared
   * their *immediate* downstream fields — never cutLengths/
   * selectedProtection/selectedPressure. So: forward through the whole
   * flow -> Back to re-pick an end1/end2 fitting -> pick a DIFFERENT one ->
   * the auto-price effect fired correctly but combined the NEW fitting
   * with the OLD, abandoned cutLengths/protection/pressure from the path
   * backed out of, silently pricing a hybrid configuration never actually
   * chosen. Fix: also reset cutLengths/selectedProtection/selectedPressure
   * back to their defaults here, so canProceed()'s presence checks on
   * cut-lengths/hose-protection/pressure-testing/summary correctly force
   * the user back through those steps instead of reusing stale values.
   *
   * Round 3.6: this reset used to fire unconditionally on every call, even
   * when the user backed up and re-picked the EXACT SAME shape+size they'd
   * already had. That wiped `selectedAngle` regardless, which — now that
   * Orientation has its own Continue button gated on `selectedAngle` being
   * set — meant re-confirming an unchanged fitting still forced the user to
   * re-pick an angle they'd already chosen. Only reset the downstream
   * fields when the shape or size actually differs from what was already
   * there; an unchanged re-pick just refreshes price/route in place.
   */
  const setEnd1Fitting = useCallback((shape: string, size: string, price: number, route: string) => {
    setConfig((prev) => {
      if (prev.end1Shape === shape && prev.end1Size === size) {
        return { ...prev, end1Price: price, end1Route: route };
      }
      return {
        ...prev,
        end1Shape: shape,
        end1Size: size,
        end1Price: price,
        end1Route: route,
        // Changing end1 after end2/orientation were picked invalidates them
        // (orientation gate and end2's own compatibility depend on end1).
        end2Shape: null,
        end2Size: null,
        end2Price: null,
        end2Route: null,
        selectedAngle: null,
        cutLengths: [],
        selectedProtection: 'NOT REQUIRED',
        selectedPressure: 'Not Required',
        protectionChosen: false,
        pressureChosen: false,
      };
    });
  }, []);

  const setEnd2Fitting = useCallback((shape: string, size: string, price: number, route: string) => {
    setConfig((prev) => {
      if (prev.end2Shape === shape && prev.end2Size === size) {
        return { ...prev, end2Price: price, end2Route: route };
      }
      return {
        ...prev,
        end2Shape: shape,
        end2Size: size,
        end2Price: price,
        end2Route: route,
        selectedAngle: null,
        cutLengths: [],
        selectedProtection: 'NOT REQUIRED',
        selectedPressure: 'Not Required',
        protectionChosen: false,
        pressureChosen: false,
      };
    });
  }, []);

  const setOrientation = useCallback((angle: string) => {
    setConfig((prev) => ({ ...prev, selectedAngle: angle }));
  }, []);

  const setCutLengths = useCallback((quantity: number, cutLengths: Hose360CutLength[]) => {
    setConfig((prev) => ({ ...prev, quantity, cutLengths }));
  }, []);

  /**
   * Round 3.6 — the real "price not shown before navigating" bug. The
   * auto-price effect above is debounced (200ms) and then does its own
   * network round trip, both AFTER config.cutLengths actually changes. A
   * page that calls setCutLengths and immediately router.push()es (e.g.
   * cut-lengths.tsx's old handleContinue) navigates away long before that
   * debounce+fetch ever resolves, so the customer never actually sees the
   * price reflecting what they just typed — the number on the NEXT page's
   * price bar could even still be stale from before this step, since the
   * in-flight fetch may get aborted by this component unmounting.
   * applyPriceResult lets a page directly await its own
   * fetchHose360Price(...) call and commit the real result into config
   * BEFORE navigating, so the displayed total is always the one that was
   * actually just calculated, not a promise of one that never got to run.
   */
  const applyPriceResult = useCallback((amount: number, breakdown: Record<string, any> | null, swellProductIds: string[]) => {
    setConfig((prev) => ({ ...prev, totalPrice: amount, breakdown, swellProductIds }));
  }, []);

  const setProtection = useCallback((label: string) => {
    setConfig((prev) => ({ ...prev, selectedProtection: label, protectionChosen: true }));
  }, []);

  const setPressure = useCallback((label: string) => {
    setConfig((prev) => ({ ...prev, selectedPressure: label, pressureChosen: true }));
  }, []);

  const resetConfig = useCallback(() => {
    setConfig(initialConfig);

    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_TIMESTAMP_KEY);
      clearFittingsReminderState();
    }
  }, []);

  const canProceed = useCallback(
    (step: Hose360Step): boolean => {
      switch (step) {
        case 'start':
          return true;
        case 'hose-selection':
          return Boolean(config.selectedHose);
        case 'end1-fitting':
        case 'end1-family':
          return Boolean(config.selectedHose);
        case 'end2-fitting':
        case 'end2-family':
          return Boolean(config.selectedHose && config.end1Shape && config.end1Size);
        case 'orientation':
          return Boolean(config.end2Shape && config.end2Size);
        case 'cut-lengths':
          return Boolean(config.end2Shape && config.end2Size);
        case 'hose-protection':
          return config.cutLengths.length > 0;
        case 'pressure-testing':
          return Boolean(config.selectedProtection);
        case 'summary':
          return Boolean(config.selectedPressure);
        default:
          return false;
      }
    },
    [config]
  );

  const contextValue: Hose360ContextValue = {
    config,
    priceLoading,
    priceError,
    setSelectedHose,
    setEnd1Fitting,
    setEnd2Fitting,
    setOrientation,
    setCutLengths,
    applyPriceResult,
    setProtection,
    setPressure,
    resetConfig,
    canProceed,
  };

  return <Hose360Context.Provider value={contextValue}>{children}</Hose360Context.Provider>;
}

export function useHose360(): Hose360ContextValue {
  const context = useContext(Hose360Context);

  if (context === undefined) {
    throw new Error('useHose360 must be used within Hose360Provider');
  }

  return context;
}
