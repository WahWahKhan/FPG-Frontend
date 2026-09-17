/**
 * FUNCTION360 API client — talks to the backend's /api/function360/* endpoints.
 * Mirrors lib/tube360/api.ts / lib/trac360/api.ts. The backend is the single
 * source of truth for the customer-facing price.
 */

import { useCallback, useEffect, useState } from 'react';
import { API_BASE_URL } from '../checkout/checkout-config';
import type { EquipmentSelection, SelectedComponents } from '../../types/function360';

export interface Function360PricePart {
  component: string;
  variantKey: string;
  price: number;
  swellProductId: string | null;
}

export interface Function360PriceResponse {
  currency: string;
  amount: number;
  breakdown: { parts: Function360PricePart[] };
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

export async function fetchFunction360Price(
  selectedComponents: SelectedComponents,
  equipment: EquipmentSelection,
  signal?: AbortSignal
): Promise<Function360PriceResponse> {
  const res = await fetch(`${API_BASE_URL}/api/function360/price`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ selectedComponents, equipment }),
    signal,
  });
  if (!res.ok) throw new Error(await readError(res, `Could not calculate the price (${res.status})`));
  return res.json();
}

// ============================================================================
// OPTIONS (cached for the lifetime of the tab) — consumed by the configurator
// pages via useFunction360Options()/Function360OptionsGate instead of
// importing the local data/function360/*.json files directly.
// ============================================================================

let optionsCache: any = null;
let optionsInflight: Promise<any> | null = null;

export async function fetchFunction360Options(): Promise<any> {
  if (optionsCache) return optionsCache;
  if (!optionsInflight) {
    optionsInflight = (async () => {
      const res = await fetch(`${API_BASE_URL}/api/function360/options`);
      if (!res.ok) throw new Error(await readError(res, `Could not load Function360 options (${res.status})`));
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
export function useFunction360Options() {
  const [options, setOptions] = useState<any>(optionsCache);
  const [loading, setLoading] = useState<boolean>(!optionsCache);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchFunction360Options()
      .then((data) => setOptions(data))
      .catch((err: Error) => setError(err.message || 'Could not load Function360 options'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!optionsCache) load();
  }, [load]);

  return { options, loading, error, retry: load };
}
