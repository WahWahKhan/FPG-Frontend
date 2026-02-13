// lib/google-sheets/google-sheets-service.ts
// Google Sheets API integration for invoice tracking

import { google } from 'googleapis';

// Types
export interface InvoiceSheetRow {
  invoiceNumber: string;
  customerName: string;
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
}

// Initialize Google Sheets API with service account
const getGoogleSheetsClient = async () => {
  // Service account credentials should be stored in environment variables
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

    // Prepare row data matching the column structure
    const row = [
        invoiceData.invoiceNumber,
        invoiceData.customer.company || invoiceData.customer.name,
        invoiceData.customer.email,  // ADD THIS LINE
        formatDate(invoiceData.invoiceDate),
        formatDate(invoiceData.dueDate),
        invoiceData.total,
        'Unpaid',
        '',
        invoiceData.poNumber || '',
        invoiceData.paymentTerms,
        now,
        0,
        now,
        invoiceData.notes || ''
      ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: 'Sheet1!A:M', // Adjust range based on your sheet name
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

    // Find the row with matching invoice number
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'Sheet1!A:M',
    });

    const rows = response.data.values || [];
    const rowIndex = rows.findIndex((row, index) => 
      index > 0 && row[0] === invoiceNumber // Skip header row
    );

    if (rowIndex === -1) {
      return { success: false, error: 'Invoice not found in sheet' };
    }

    const actualRowNumber = rowIndex + 1; // +1 for 1-based indexing
    const now = new Date().toLocaleString('en-AU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    // Update payment status (column F), payment date (column G), and last modified (column L)
    const updates = [
      {
        range: `Sheet1!F${actualRowNumber}`,
        values: [[status]]
      },
      {
        range: `Sheet1!G${actualRowNumber}`,
        values: [[status === 'Paid' ? now : '']]
      },
      {
        range: `Sheet1!L${actualRowNumber}`,
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

    // Find the row with matching invoice number
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'Sheet1!A:M',
    });

    const rows = response.data.values || [];
    const rowIndex = rows.findIndex((row, index) => 
      index > 0 && row[0] === invoiceNumber
    );

    if (rowIndex === -1) {
      return { success: false, error: 'Invoice not found in sheet' };
    }

    const actualRowNumber = rowIndex + 1;
    const currentCount = parseInt(rows[rowIndex][10]) || 0; // Column K (index 10)
    const newCount = currentCount + 1;

    const now = new Date().toLocaleString('en-AU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    // Update reminder count (column K) and last modified (column L)
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: sheetId,
      requestBody: {
        valueInputOption: 'USER_ENTERED',
        data: [
          {
            range: `Sheet1!K${actualRowNumber}`,
            values: [[newCount]]
          },
          {
            range: `Sheet1!L${actualRowNumber}`,
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

    // Get all rows
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'Sheet1!A:M',
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

    // Find all matching invoices and prepare batch updates
    rows.forEach((row, index) => {
      if (index === 0) return; // Skip header

      const invoiceNumber = row[0];
      if (invoiceNumbers.includes(invoiceNumber)) {
        const actualRowNumber = index + 1;
        
        updates.push(
          {
            range: `Sheet1!F${actualRowNumber}`,
            values: [['Paid']]
          },
          {
            range: `Sheet1!G${actualRowNumber}`,
            values: [[now]]
          },
          {
            range: `Sheet1!L${actualRowNumber}`,
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