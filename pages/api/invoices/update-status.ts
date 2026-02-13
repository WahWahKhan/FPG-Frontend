// pages/api/invoices/update-status.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { updateInvoiceStatus, batchUpdateInvoicesAsPaid } from '../../../lib/google-sheets/google-sheets-service';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { invoiceNumbers, status, sheetId } = req.body;

    // Validation
    if (!sheetId) {
      return res.status(400).json({ error: 'Sheet ID is required' });
    }

    if (!status || !['Paid', 'Unpaid', 'Pending'].includes(status)) {
      return res.status(400).json({ error: 'Valid status is required (Paid/Unpaid/Pending)' });
    }

    // Handle batch update
    if (Array.isArray(invoiceNumbers) && invoiceNumbers.length > 1) {
      if (status !== 'Paid') {
        return res.status(400).json({ error: 'Batch updates only support "Paid" status' });
      }

      const result = await batchUpdateInvoicesAsPaid(invoiceNumbers, sheetId);
      
      if (result.success) {
        return res.status(200).json({
          success: true,
          message: `${result.updatedCount} invoice(s) marked as paid`,
          updatedCount: result.updatedCount
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error || 'Failed to update invoices'
        });
      }
    }

    // Handle single update
    const invoiceNumber = Array.isArray(invoiceNumbers) ? invoiceNumbers[0] : invoiceNumbers;
    
    if (!invoiceNumber) {
      return res.status(400).json({ error: 'Invoice number is required' });
    }

    const result = await updateInvoiceStatus(invoiceNumber, status, sheetId);

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: `Invoice ${invoiceNumber} status updated to ${status}`
      });
    } else {
      return res.status(500).json({
        success: false,
        error: result.error || 'Failed to update invoice status'
      });
    }

  } catch (error: any) {
    console.error('Error in update-status API:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}