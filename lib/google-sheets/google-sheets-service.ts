// lib/google-sheets/google-sheets-service.ts
// Google Sheets API integration for invoice tracking

import { google } from 'googleapis';

// Types
export interface InvoiceSheetRow {
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  invoiceDate: string;
  dueDate: string;
  totalAmount: number;
  paymentStatus: 'Paid' | 'Unpaid' | 'Pending';
  paymentDate: string;
  poNumber: string;
  paymentTerms: string;
  emailSent: string;
  remindersSent: number;
  lastModified: string;
  notes: string;
  // Columns O-T (added for autocomplete)
  contactName: string;
  phone: string;
  address: string;
  suburb: string;
  state: string;
  postcode: string;
}

// Initialize Google Sheets API with service account
const getGoogleSheetsClient = async () => {
  const credentials = {
    type: 'service_account',
    project_id: process.env.GOOGLE_PROJECT_ID,
    private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    client_id: process.env.GOOGLE_CLIENT_ID,
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  };

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  return sheets;
};

/**
 * Append a new invoice row to Google Sheets
 * Columns A-N: existing tracking data
 * Columns O-T: customer detail fields for autocomplete
 */
export async function appendInvoiceToSheet(
  invoiceData: any,
  sheetId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const sheets = await getGoogleSheetsClient();

    const now = new Date().toLocaleString('en-AU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    const row = [
      // A-N: existing columns
      invoiceData.invoiceNumber,                              // A: Invoice Number
      invoiceData.customer.name,                                  // B: Customer Name (contact name, matches invoice)
      invoiceData.customer.email,                             // C: Customer Email
      formatDate(invoiceData.invoiceDate),                    // D: Invoice Date
      formatDate(invoiceData.dueDate),                        // E: Due Date
      invoiceData.total,                                      // F: Total Amount
      'Unpaid',                                               // G: Payment Status
      '',                                                     // H: Payment Date
      invoiceData.poNumber || '',                             // I: PO Number
      invoiceData.paymentTerms,                               // J: Payment Terms
      now,                                                    // K: Email Sent
      0,                                                      // L: Reminders Sent
      now,                                                    // M: Last Modified
      invoiceData.notes || '',                                // N: Notes
      // O-T: new customer detail columns
      invoiceData.customer.name || '',                        // O: Contact Name
      invoiceData.customer.phone || '',                       // P: Phone
      invoiceData.customer.address || '',                     // Q: Address
      invoiceData.customer.suburb || '',                      // R: Suburb
      invoiceData.customer.state || '',                       // S: State
      invoiceData.customer.postcode || '',                    // T: Postcode
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: 'Sheet1!A:T',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [row],
      },
    });

    console.log(`✅ Invoice ${invoiceData.invoiceNumber} added to Google Sheets`);
    return { success: true };
  } catch (error: any) {
    console.error('❌ Error appending to Google Sheets:', error);
    return {
      success: false,
      error: error.message || 'Failed to write to Google Sheets'
    };
  }
}

/**
 * Update payment status of an invoice
 */
export async function updateInvoiceStatus(
  invoiceNumber: string,
  status: 'Paid' | 'Unpaid' | 'Pending',
  sheetId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const sheets = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'Sheet1!A:N',
    });

    const rows = response.data.values || [];
    const rowIndex = rows.findIndex((row, index) =>
      index > 0 && row[0] === invoiceNumber
    );

    if (rowIndex === -1) {
      return { success: false, error: 'Invoice not found in sheet' };
    }

    const actualRowNumber = rowIndex + 1;
    const now = new Date().toLocaleString('en-AU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    const updates = [
      {
        range: `Sheet1!G${actualRowNumber}`,
        values: [[status]]
      },
      {
        range: `Sheet1!H${actualRowNumber}`,
        values: [[status === 'Paid' ? now : '']]
      },
      {
        range: `Sheet1!M${actualRowNumber}`,
        values: [[now]]
      }
    ];

    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: sheetId,
      requestBody: {
        valueInputOption: 'USER_ENTERED',
        data: updates,
      },
    });

    console.log(`✅ Invoice ${invoiceNumber} status updated to ${status}`);
    return { success: true };
  } catch (error: any) {
    console.error('❌ Error updating invoice status:', error);
    return {
      success: false,
      error: error.message || 'Failed to update invoice status'
    };
  }
}

/**
 * Increment reminder count for an invoice
 */
export async function incrementReminderCount(
  invoiceNumber: string,
  sheetId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const sheets = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'Sheet1!A:N',
    });

    const rows = response.data.values || [];
    const rowIndex = rows.findIndex((row, index) =>
      index > 0 && row[0] === invoiceNumber
    );

    if (rowIndex === -1) {
      return { success: false, error: 'Invoice not found in sheet' };
    }

    const actualRowNumber = rowIndex + 1;
    const currentCount = parseInt(rows[rowIndex][11]) || 0; // Column L (index 11)
    const newCount = currentCount + 1;

    const now = new Date().toLocaleString('en-AU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: sheetId,
      requestBody: {
        valueInputOption: 'USER_ENTERED',
        data: [
          {
            range: `Sheet1!L${actualRowNumber}`,
            values: [[newCount]]
          },
          {
            range: `Sheet1!M${actualRowNumber}`,
            values: [[now]]
          }
        ],
      },
    });

    console.log(`✅ Reminder count for ${invoiceNumber} incremented to ${newCount}`);
    return { success: true };
  } catch (error: any) {
    console.error('❌ Error incrementing reminder count:', error);
    return {
      success: false,
      error: error.message || 'Failed to increment reminder count'
    };
  }
}

/**
 * Batch update multiple invoices to "Paid" status
 */
export async function batchUpdateInvoicesAsPaid(
  invoiceNumbers: string[],
  sheetId: string
): Promise<{ success: boolean; updatedCount: number; error?: string }> {
  try {
    const sheets = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'Sheet1!A:N',
    });

    const rows = response.data.values || [];
    const now = new Date().toLocaleString('en-AU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    const updates: any[] = [];
    let updatedCount = 0;

    rows.forEach((row, index) => {
      if (index === 0) return; // Skip header

      const invoiceNumber = row[0];
      if (invoiceNumbers.includes(invoiceNumber)) {
        const actualRowNumber = index + 1;

        updates.push(
          {
            range: `Sheet1!G${actualRowNumber}`,
            values: [['Paid']]
          },
          {
            range: `Sheet1!H${actualRowNumber}`,
            values: [[now]]
          },
          {
            range: `Sheet1!M${actualRowNumber}`,
            values: [[now]]
          }
        );

        updatedCount++;
      }
    });

    if (updates.length > 0) {
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: sheetId,
        requestBody: {
          valueInputOption: 'USER_ENTERED',
          data: updates,
        },
      });
    }

    console.log(`✅ Batch updated ${updatedCount} invoices to Paid`);
    return { success: true, updatedCount };
  } catch (error: any) {
    console.error('❌ Error batch updating invoices:', error);
    return {
      success: false,
      updatedCount: 0,
      error: error.message || 'Failed to batch update invoices'
    };
  }
}

// Helper function to format dates consistently
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-AU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}