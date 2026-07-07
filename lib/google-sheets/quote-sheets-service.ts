// lib/google-sheets/quote-sheets-service.ts
// Google Sheets integration for quotation tracking — writes to "Quotations" tab

import { google } from 'googleapis';

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
 * Append a new quote row to the "Quotations" tab in Google Sheets.
 *
 * Columns:
 * A: Quote Number
 * B: Customer Name
 * C: Customer Email
 * D: Quote Date
 * E: Expiry Date
 * F: Total Amount
 * G: Status (Open / Accepted / Expired)
 * H: PO Number
 * I: Quote Valid For
 * J: Created At
 * K: Last Modified
 * L: Notes
 * M: Contact Name
 * N: Phone
 * O: Address
 * P: Suburb
 * Q: State
 * R: Postcode
 */
export async function appendQuoteToSheet(
  quoteData: any,
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
      quoteData.quoteNumber,                          // A: Quote Number
      quoteData.customer.name,                        // B: Customer Name
      quoteData.customer.email,                       // C: Customer Email
      formatDate(quoteData.quoteDate),                // D: Quote Date
      formatDate(quoteData.expiryDate),                // E: Expiry Date
      quoteData.total,                                // F: Total Amount
      'Open',                                         // G: Status
      quoteData.poNumber || '',                       // H: PO Number
      quoteData.manualExpiryDate ? 'Custom' : quoteData.quoteValidFor, // I: Quote Valid For
      now,                                            // J: Created At
      now,                                            // K: Last Modified
      quoteData.notes || '',                          // L: Notes
      quoteData.customer.name || '',                  // M: Contact Name
      quoteData.customer.phone || '',                 // N: Phone
      quoteData.customer.address || '',               // O: Address
      quoteData.customer.suburb || '',                // P: Suburb
      quoteData.customer.state || '',                 // Q: State
      quoteData.customer.postcode || '',              // R: Postcode
    ];

    // Explicitly find the next empty row in column A rather than relying on
    // the Sheets API's append table auto-detection — auto-detection can drift
    // to the wrong starting column if any row has data shaped irregularly.
    const existing = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'Quotations!A:A',
    });
    const existingRows = existing.data.values || [];
    const nextRow = existingRows.length + 1; // 1-indexed; next empty row

    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `Quotations!A${nextRow}:R${nextRow}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [row],
      },
    });

    console.log(`✅ Quote ${quoteData.quoteNumber} added to Quotations sheet at row ${nextRow}`);
    return { success: true };
  } catch (error: any) {
    console.error('❌ Error appending quote to Google Sheets:', error);
    return {
      success: false,
      error: error.message || 'Failed to write quote to Google Sheets'
    };
  }
}

/**
 * Update the status of a quote (Open / Accepted / Expired)
 */
export async function updateQuoteStatus(
  quoteNumber: string,
  status: 'Open' | 'Accepted' | 'Expired',
  sheetId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const sheets = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'Quotations!A:R',
    });

    const rows = response.data.values || [];
    const rowIndex = rows.findIndex((row, index) =>
      index > 0 && row[0] === quoteNumber
    );

    if (rowIndex === -1) {
      return { success: false, error: 'Quote not found in sheet' };
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

    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: sheetId,
      requestBody: {
        valueInputOption: 'USER_ENTERED',
        data: [
          {
            range: `Quotations!G${actualRowNumber}`,
            values: [[status]]
          },
          {
            range: `Quotations!K${actualRowNumber}`,
            values: [[now]]
          }
        ],
      },
    });

    console.log(`✅ Quote ${quoteNumber} status updated to ${status}`);
    return { success: true };
  } catch (error: any) {
    console.error('❌ Error updating quote status:', error);
    return {
      success: false,
      error: error.message || 'Failed to update quote status'
    };
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-AU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}