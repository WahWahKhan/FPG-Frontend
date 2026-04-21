import type { NextApiRequest, NextApiResponse } from 'next';
import { appendInvoiceToSheet } from '../../../lib/google-sheets/google-sheets-service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { invoiceData } = req.body;

  if (!invoiceData) {
    return res.status(400).json({ success: false, error: 'Invoice data is required' });
  }

  const sheetId = process.env.NEXT_PUBLIC_INVOICE_SHEET_ID || '';

  if (!sheetId) {
    return res.status(500).json({ success: false, error: 'Sheet ID not configured' });
  }

  const result = await appendInvoiceToSheet(invoiceData, sheetId);
  return res.status(result.success ? 200 : 500).json(result);
}