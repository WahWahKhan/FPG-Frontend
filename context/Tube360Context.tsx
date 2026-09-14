/**
 * TUBE360 Context Provider
 * Global configurator state with localStorage persistence.
 * Session/expiry semantics copied from context/Function360Context.tsx.
 *
 * PRIVACY: customer contact details are NEVER stored here (the contact form
 * keeps them in component state only) — matching the site's no-PII-at-rest
 * posture (see the save-cart design).
 */

'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type {
  Tube360BendsInput,
  Tube360Config,
  Tube360Method,
  Tube360SpecInput,
  Tube360UploadedFile,
} from '../types/tube360';

const STORAGE_KEY = 'tube360-config';
const STORAGE_TIMESTAMP_KEY = 'tube360-timestamp';
const SESSION_FLAG = 'tube360-session-active';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export const initialTube360Config: Tube360Config = {
  method: null,
  spec: {
    material: null,
    sizeSystem: null,
    odLabel: null,
    catalogId: null,
    endA: null,
    endB: null,
    totalLengthMm: '',
    quantity: '1',
  },
  bends: {
    count: '',
    radiusMm: '',
    sectionsMm: [],
    anglesDeg: [],
    notes: '',
  },
  upload: {
    files: [],
    notes: '',
  },
};

interface Tube360ContextValue {
  config: Tube360Config;
  /** true once localStorage has been read — pages must wait for this. */
  isHydrated: boolean;
  setMethod: (method: Tube360Method) => void;
  updateSpec: (patch: Partial<Tube360SpecInput>) => void;
  updateBends: (patch: Partial<Tube360BendsInput>) => void;
  setUploadFiles: (files: Tube360UploadedFile[]) => void;
  updateUploadNotes: (notes: string) => void;
  resetConfig: () => void;
}

const Tube360Context = createContext<Tube360ContextValue | undefined>(undefined);

export function Tube360Provider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<Tube360Config>(initialTube360Config);
  const [isHydrated, setIsHydrated] = useState(false);

  // ---- Load from localStorage (same rules as Function360Context) ----
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const isPageReload = performance.navigation.type === 1;
      const isNewSession = !sessionStorage.getItem(SESSION_FLAG);

      if (isNewSession && !isPageReload) {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(STORAGE_TIMESTAMP_KEY);
        sessionStorage.setItem(SESSION_FLAG, 'true');
        setIsHydrated(true);
        return;
      }
      sessionStorage.setItem(SESSION_FLAG, 'true');

      const saved = localStorage.getItem(STORAGE_KEY);
      const timestamp = localStorage.getItem(STORAGE_TIMESTAMP_KEY);
      if (saved && timestamp && Date.now() - parseInt(timestamp, 10) < SESSION_DURATION) {
        const parsed = JSON.parse(saved);
        // Merge onto the initial shape so older saved configs never crash a page.
        setConfig({
          ...initialTube360Config,
          ...parsed,
          spec: { ...initialTube360Config.spec, ...(parsed.spec || {}) },
          bends: { ...initialTube360Config.bends, ...(parsed.bends || {}) },
          upload: { ...initialTube360Config.upload, ...(parsed.upload || {}) },
        });
      } else {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(STORAGE_TIMESTAMP_KEY);
      }
    } catch (error) {
      console.error('[TUBE360] Error loading from localStorage:', error);
    }
    setIsHydrated(true);
  }, []);

  // ---- Save to localStorage ----
  useEffect(() => {
    if (!isHydrated || typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      localStorage.setItem(STORAGE_TIMESTAMP_KEY, Date.now().toString());
    } catch (error) {
      console.error('[TUBE360] Error saving to localStorage:', error);
    }
  }, [config, isHydrated]);

  const setMethod = useCallback((method: Tube360Method) => {
    setConfig((prev) => ({ ...prev, method }));
  }, []);

  const updateSpec = useCallback((patch: Partial<Tube360SpecInput>) => {
    setConfig((prev) => ({ ...prev, spec: { ...prev.spec, ...patch } }));
  }, []);

  const updateBends = useCallback((patch: Partial<Tube360BendsInput>) => {
    setConfig((prev) => ({ ...prev, bends: { ...prev.bends, ...patch } }));
  }, []);

  const setUploadFiles = useCallback((files: Tube360UploadedFile[]) => {
    setConfig((prev) => ({ ...prev, upload: { ...prev.upload, files } }));
  }, []);

  const updateUploadNotes = useCallback((notes: string) => {
    setConfig((prev) => ({ ...prev, upload: { ...prev.upload, notes } }));
  }, []);

  const resetConfig = useCallback(() => {
    setConfig(initialTube360Config);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_TIMESTAMP_KEY);
    }
  }, []);

  return (
    <Tube360Context.Provider
      value={{ config, isHydrated, setMethod, updateSpec, updateBends, setUploadFiles, updateUploadNotes, resetConfig }}
    >
      {children}
    </Tube360Context.Provider>
  );
}

export function useTube360(): Tube360ContextValue {
  const context = useContext(Tube360Context);
  if (context === undefined) {
    throw new Error('useTube360 must be used within Tube360Provider');
  }
  return context;
}
