/**
 * TRAC360 API client — talks to the backend's /api/trac360/* endpoints.
 * Mirrors lib/tube360/api.ts. The backend is the single source of truth for
 * the customer-facing price; the frontend only sends selection ids.
 */

import { useCallback, useEffect, useState } from 'react';
import { API_BASE_URL } from '../checkout/checkout-config';

export interface Trac360PriceConfig {
  operationTypeId: string | null;
  circuitId: string | null;
  addons: Array<{ id: string; selectedSubOptionId: string | null }>;
}

export interface Trac360PriceBreakdown {
  baseOperationPrice: number;
  circuitPrice: number;
  addonsTotal: number;
  addons: Array<{ id: string; subOptionId: string | null; price: number }>;
}

export interface Trac360PriceResponse {
  currency: string;
  amount: number;
  breakdown: Trac360PriceBreakdown;
  swellProductIds: string[];
}

async function readError(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json();
    return (data && data.error) || fallback;
  } catch {
    return fallback;
  }
}

export async function fetchTrac360Price(
  config: Trac360PriceConfig,
  signal?: AbortSignal
): Promise<Trac360PriceResponse> {
  const res = await fetch(`${API_BASE_URL}/api/trac360/price`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ config }),
    signal,
  });
  if (!res.ok) throw new Error(await readError(res, `Could not calculate the price (${res.status})`));
  return res.json();
}

// ============================================================================
// OPTIONS (cached for the lifetime of the tab) — consumed by the configurator
// pages via useTrac360Options()/Trac360OptionsGate instead of importing the
// local data/trac360/*.json files directly.
// ============================================================================

let optionsCache: any = null;
let optionsInflight: Promise<any> | null = null;

export async function fetchTrac360Options(): Promise<any> {
  if (optionsCache) return optionsCache;
  if (!optionsInflight) {
    optionsInflight = (async () => {
      const res = await fetch(`${API_BASE_URL}/api/trac360/options`);
      if (!res.ok) throw new Error(await readError(res, `Could not load Trac360 options (${res.status})`));
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
export function useTrac360Options() {
  const [options, setOptions] = useState<any>(optionsCache);
  const [loading, setLoading] = useState<boolean>(!optionsCache);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchTrac360Options()
      .then((data) => setOptions(data))
      .catch((err: Error) => setError(err.message || 'Could not load Trac360 options'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!optionsCache) load();
  }, [load]);

  return { options, loading, error, retry: load };
}
