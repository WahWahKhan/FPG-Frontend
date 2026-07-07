// pages/api/quotes/create.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { appendQuoteToSheet } from '../../../lib/google-sheets/quote-sheets-service';

const SHEET_ID = process.env.NEXT_PUBLIC_INVOICE_SHEET_ID || '';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { quoteData } = req.body;

  if (!quoteData) {
    return res.status(400).json({ error: 'quoteData is required' });
  }

  if (!SHEET_ID) {
    return res.status(500).json({ error: 'Google Sheet ID not configured' });
  }

  const result = await appendQuoteToSheet(quoteData, SHEET_ID);

  if (result.success) {
    return res.status(200).json({ success: true });
  } else {
    return res.status(500).json({ success: false, error: result.error });
  }
}