/**
 * TUBE360 API client — every call the configurator makes to the backend.
 * Base URL comes from the checkout config so Tube360 always talks to the same
 * backend as checkout (localhost:3001 in the sandbox).
 */

import { useCallback, useEffect, useState } from 'react';
import { API_BASE_URL } from '../checkout/checkout-config';
import type {
  Tube360Options,
  Tube360PriceResponse,
  Tube360QuoteRequest,
  Tube360ServerSpec,
  Tube360UploadedFile,
} from '../../types/tube360';

// ============================================================================
// OPTIONS (cached for the lifetime of the tab)
// ============================================================================

let optionsCache: Tube360Options | null = null;
let optionsInflight: Promise<Tube360Options> | null = null;

async function readError(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json();
    return (data && data.error) || fallback;
  } catch {
    return fallback;
  }
}

export async function fetchTube360Options(): Promise<Tube360Options> {
  if (optionsCache) return optionsCache;
  if (!optionsInflight) {
    optionsInflight = (async () => {
      const res = await fetch(`${API_BASE_URL}/api/tube360/options`);
      if (!res.ok) throw new Error(await readError(res, `Could not load Tube360 options (${res.status})`));
      const data: Tube360Options = await res.json();
      optionsCache = data;
      return data;
    })().finally(() => {
      optionsInflight = null;
    });
  }
  return optionsInflight;
}

/** React hook: { options, loading, error, retry } */
export function useTube360Options() {
  const [options, setOptions] = useState<Tube360Options | null>(optionsCache);
  const [loading, setLoading] = useState<boolean>(!optionsCache);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchTube360Options()
      .then((data) => setOptions(data))
      .catch((err: Error) => setError(err.message || 'Could not load Tube360 options'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!optionsCache) load();
  }, [load]);

  return { options, loading, error, retry: load };
}

// ============================================================================
// PRICE (server is the only price authority)
// ============================================================================

export async function fetchTube360Price(spec: Tube360ServerSpec, signal?: AbortSignal): Promise<Tube360PriceResponse> {
  const res = await fetch(`${API_BASE_URL}/api/tube360/price`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ spec }),
    signal,
  });
  if (!res.ok) throw new Error(await readError(res, `Could not calculate the price (${res.status})`));
  return res.json();
}

// ============================================================================
// FILE UPLOADS -> business SharePoint, via OUR backend in chunks.
// The browser only ever talks to our API (no third-party upload URLs, no
// CORS surprises); each chunk is below Vercel's ~4.5 MB request limit.
// ============================================================================

export function extensionOf(fileName: string): string {
  const dot = fileName.lastIndexOf('.');
  return dot === -1 ? '' : fileName.slice(dot + 1).toLowerCase();
}

/** '' if the file is acceptable, otherwise a customer-facing message. */
export function checkFile(file: File, options: Tube360Options): string {
  const ext = extensionOf(file.name);
  if (!options.uploads.fileTypes.some((t) => t.ext === ext)) {
    return `.${ext || '?'} files are not supported`;
  }
  if (file.size > options.uploads.maxFileSizeBytes) {
    return `File is larger than ${Math.round(options.uploads.maxFileSizeBytes / (1024 * 1024))} MB`;
  }
  if (file.size === 0) return 'File is empty';
  return '';
}

interface ChunkResponse {
  done: boolean;
  nextOffset?: number;
  uploadId?: string;
  error?: string;
}

/** PUT one chunk with XMLHttpRequest so we get byte-level progress. */
function putChunk(url: string, blob: Blob, onProgress: (loaded: number) => void): Promise<{ status: number; data: ChunkResponse }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-Type', 'application/octet-stream');
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(e.loaded);
    };
    xhr.onload = () => {
      let data: ChunkResponse = { done: false };
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        /* keep default */
      }
      resolve({ status: xhr.status, data });
    };
    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.send(blob);
  });
}

/**
 * Upload one file: upload-start, then sequential chunks to upload-chunk.
 * Retries a failed chunk up to 2 times; resumes from the server's nextOffset
 * if a chunk was already received (409).
 */
export async function uploadTube360File(
  file: File,
  options: Tube360Options,
  onProgress: (percentage: number) => void
): Promise<Tube360UploadedFile> {
  const problem = checkFile(file, options);
  if (problem) throw new Error(problem);

  const startRes = await fetch(`${API_BASE_URL}/api/tube360/upload-start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileName: file.name, size: file.size }),
  });
  if (!startRes.ok) throw new Error(await readError(startRes, `Could not start the upload (${startRes.status})`));
  const { uploadId, chunkSize } = (await startRes.json()) as { uploadId: string; chunkSize: number };

  let offset = 0;
  let attempts = 0;
  while (offset < file.size) {
    const end = Math.min(offset + chunkSize, file.size);
    const url = `${API_BASE_URL}/api/tube360/upload-chunk?uploadId=${encodeURIComponent(uploadId)}&offset=${offset}`;
    let result: { status: number; data: ChunkResponse };
    try {
      result = await putChunk(url, file.slice(offset, end), (loaded) =>
        onProgress(Math.min(99, Math.round(((offset + loaded) / file.size) * 100)))
      );
    } catch (err) {
      if (++attempts > 2) throw err;
      continue; // retry the same chunk
    }
    const { status, data } = result;
    if (status === 409 && typeof data.nextOffset === 'number') {
      offset = data.nextOffset; // server already has this chunk - resume
      continue;
    }
    if (status < 200 || status >= 300) {
      if (status >= 500 && ++attempts <= 2) continue;
      throw new Error(data.error || `Upload failed (${status})`);
    }
    attempts = 0;
    if (data.done) {
      onProgress(100);
      return { uploadId, name: file.name, size: file.size };
    }
    offset = typeof data.nextOffset === 'number' ? data.nextOffset : end;
  }
  throw new Error('Upload did not complete. Please try again.');
}

// ============================================================================
// QUOTE REQUEST
// ============================================================================

export interface SubmitQuoteResult {
  ok: boolean;
  ref?: string;
  customerEmailed?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

export async function submitTube360Quote(body: Tube360QuoteRequest): Promise<SubmitQuoteResult> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/tube360/submit-quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      return {
        ok: false,
        error: data.error || `Could not submit your request (${res.status}). Please try again.`,
        fieldErrors: data.fieldErrors,
      };
    }
    return { ok: true, ref: data.ref, customerEmailed: Boolean(data.customerEmailed) };
  } catch {
    return { ok: false, error: 'Network error - please check your connection and try again.' };
  }
}
