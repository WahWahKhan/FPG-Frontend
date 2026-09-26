/**
 * HOSE360 API client — talks to the backend's /api/hose360/* endpoints.
 * Mirrors lib/function360/api.ts / lib/trac360/api.ts. The backend is the
 * single source of truth for the customer-facing price.
 */

import { useCallback, useEffect, useState } from 'react';
import { API_BASE_URL } from '../checkout/checkout-config';
import type { Hose360Options, Hose360PriceOrderConfig, Hose360PriceResponse } from '../../types/hose360';

async function readError(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json();
    return (data && data.error) || fallback;
  } catch {
    return fallback;
  }
}

export async function fetchHose360Price(
  orderConfig: Hose360PriceOrderConfig,
  signal?: AbortSignal
): Promise<Hose360PriceResponse> {
  const res = await fetch(`${API_BASE_URL}/api/hose360/price`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderConfig }),
    signal,
  });
  if (!res.ok) throw new Error(await readError(res, `Could not calculate the price (${res.status})`));
  return res.json();
}

// ============================================================================
// OPTIONS (cached for the lifetime of the tab) — consumed by the configurator
// pages via useHose360Options()/Hose360OptionsGate instead of importing the
// local plan-folder data/*.json files directly.
// ============================================================================

let optionsCache: Hose360Options | null = null;
let optionsInflight: Promise<Hose360Options> | null = null;

export async function fetchHose360Options(): Promise<Hose360Options> {
  if (optionsCache) return optionsCache;
  if (!optionsInflight) {
    optionsInflight = (async () => {
      const res = await fetch(`${API_BASE_URL}/api/hose360/options`);
      if (!res.ok) throw new Error(await readError(res, `Could not load Hose360 options (${res.status})`));
      const data = await res.json();
      optionsCache = data;
      return data;
    })().finally(() => {
      optionsInflight = null;
    });
  }
  return optionsInflight;
}

/** React hook: { options, loading, error, retry } */
export function useHose360Options() {
  const [options, setOptions] = useState<Hose360Options | null>(optionsCache);
  const [loading, setLoading] = useState<boolean>(!optionsCache);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchHose360Options()
      .then((data) => setOptions(data))
      .catch((err: Error) => setError(err.message || 'Could not load Hose360 options'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!optionsCache) load();
  }, [load]);

  return { options, loading, error, retry: load };
}
