import type { NextApiRequest, NextApiResponse } from 'next';
import { appendInvoiceToSheet } from '../../../lib/google-sheets/google-sheets-service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { invoiceData, sheetId } = req.body;
  const result = await appendInvoiceToSheet(invoiceData, sheetId);
  
  return res.status(200).json(result);
}