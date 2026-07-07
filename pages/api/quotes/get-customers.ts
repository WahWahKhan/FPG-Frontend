// pages/api/quotes/get-customers.ts
// Fetches unique customers from the Quotations Google Sheet tab via CSV export for autocomplete.
// Reads columns B, C, N-R and deduplicates by email, keeping the most recent row.

import type { NextApiRequest, NextApiResponse } from 'next';
import type { CustomerSuggestion } from '../invoices/get-customers';

// Simple in-memory cache: { data, fetchedAt }
let cache: { data: CustomerSuggestion[]; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Quotations tab gid
const QUOTATIONS_GID = '1082518051';

function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

async function fetchCustomersFromSheet(sheetId: string): Promise<CustomerSuggestion[]> {
  const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${QUOTATIONS_GID}`;
  const response = await fetch(csvUrl);

  if (!response.ok) {
    throw new Error(`Failed to fetch sheet CSV: ${response.status}`);
  }

  const csvText = await response.text();
  const lines = csvText.split('\n').filter(line => line.trim());

  if (lines.length < 2) return [];

  // Map: email (lowercase) -> most recent CustomerSuggestion
  const customerMap = new Map<string, CustomerSuggestion>();

  // Skip header row (index 0)
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);

    const customerName = values[1] || '';   // B: Customer Name
    const email        = values[2] || '';   // C: Customer Email
    const phone        = values[13] || '';  // N: Phone
    const address      = values[14] || '';  // O: Address
    const suburb       = values[15] || '';  // P: Suburb
    const state        = values[16] || '';  // Q: State
    const postcode     = values[17] || '';  // R: Postcode

    // Skip rows without at least an email or customer name
    if (!email && !customerName) continue;

    const key = email.toLowerCase() || customerName.toLowerCase();

    customerMap.set(key, {
      name: customerName,
      company: customerName, // No separate company column in Quotations sheet
      email,
      phone,
      address,
      suburb,
      state,
      postcode,
    });
  }

  return Array.from(customerMap.values());
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { q } = req.query;

  if (!q || typeof q !== 'string' || q.trim().length < 2) {
    return res.status(400).json({ error: 'Query must be at least 2 characters' });
  }

  const sheetId = process.env.NEXT_PUBLIC_INVOICE_SHEET_ID;
  if (!sheetId) {
    return res.status(500).json({ error: 'Sheet ID not configured' });
  }

  try {
    const now = Date.now();
    if (!cache || now - cache.fetchedAt > CACHE_TTL_MS) {
      const customers = await fetchCustomersFromSheet(sheetId);
      cache = { data: customers, fetchedAt: now };
    }

    const query = q.trim().toLowerCase();

    const matches = cache.data
      .filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.email.toLowerCase().includes(query)
      )
      .slice(0, 5);

    return res.status(200).json({ customers: matches });
  } catch (error: any) {
    console.error('❌ quotes/get-customers error:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch customers' });
  }
}