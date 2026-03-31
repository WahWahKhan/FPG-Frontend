// pages/api/customers/send-outreach.ts
// Sends a targeted marketing/outreach email to up to 20 selected contacts
// via Microsoft Graph (reuses same auth pattern as send-email.js).
// Hard limit: 20 recipients. Warning threshold: 10.

import type { NextApiRequest, NextApiResponse } from 'next';
import fetch from 'node-fetch';

const AZURE_TENANT_ID    = process.env.AZURE_TENANT_ID;
const AZURE_CLIENT_ID    = process.env.AZURE_CLIENT_ID;
const AZURE_CLIENT_SECRET= process.env.AZURE_CLIENT_SECRET;
const SENDER_EMAIL       = process.env.SENDER_EMAIL;
const VALID_SERVER_KEY   = process.env.VALID_SERVER_KEY;
const TESTING_MODE       = process.env.TESTING_MODE === 'true';
const BUSINESS_EMAIL_TEST= process.env.BUSINESS_EMAIL_TEST || 'info@agcomponents.com.au';

const MAX_RECIPIENTS = 20;

async function getGraphAccessToken(): Promise<string> {
  const endpoint = `https://login.microsoftonline.com/${AZURE_TENANT_ID}/oauth2/v2.0/token`;
  const params = new URLSearchParams({
    client_id:     AZURE_CLIENT_ID!,
    client_secret: AZURE_CLIENT_SECRET!,
    scope:         'https://graph.microsoft.com/.default',
    grant_type:    'client_credentials',
  });
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  });
  if (!res.ok) throw new Error(`Token request failed: ${res.status}`);
  const data = await res.json() as any;
  return data.access_token;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Auth
  if (!VALID_SERVER_KEY || req.headers['x-server-key'] !== VALID_SERVER_KEY) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const { recipients, subject, htmlBody } = req.body as {
    recipients: { name: string; email: string }[];
    subject: string;
    htmlBody: string;
  };

  // Validation
  if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
    return res.status(400).json({ error: 'No recipients provided' });
  }
  if (recipients.length > MAX_RECIPIENTS) {
    return res.status(400).json({
      error: `Maximum ${MAX_RECIPIENTS} recipients allowed. You selected ${recipients.length}.`
    });
  }
  if (!subject?.trim()) {
    return res.status(400).json({ error: 'Subject is required' });
  }
  if (!htmlBody?.trim()) {
    return res.status(400).json({ error: 'Message body is required' });
  }

  // In testing mode, redirect all recipients to test address
  const effectiveRecipients = TESTING_MODE
    ? [{ name: 'Test', email: BUSINESS_EMAIL_TEST }]
    : recipients.filter(r => r.email?.includes('@'));

  if (effectiveRecipients.length === 0) {
    return res.status(400).json({ error: 'No valid email addresses in recipient list' });
  }

  try {
    const accessToken = await getGraphAccessToken();

    const results: { email: string; success: boolean; error?: string }[] = [];

    // Send individually (not BCC blast) — better deliverability, personalised greeting possible
    for (const recipient of effectiveRecipients) {
      const emailData = {
        message: {
          subject: TESTING_MODE ? `[TEST] ${subject}` : subject,
          body: {
            contentType: 'HTML',
            content: htmlBody,
          },
          toRecipients: [
            { emailAddress: { address: recipient.email, name: recipient.name } }
          ],
        },
        saveToSentItems: true,
      };

      try {
        const graphRes = await fetch(
          `https://graph.microsoft.com/v1.0/users/${SENDER_EMAIL}/sendMail`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(emailData),
          }
        );

        if (graphRes.status === 202) {
          results.push({ email: recipient.email, success: true });
        } else {
          const errText = await graphRes.text();
          results.push({ email: recipient.email, success: false, error: errText });
        }
      } catch (err: any) {
        results.push({ email: recipient.email, success: false, error: err.message });
      }

      // Small delay between sends to avoid throttling (30/min Graph limit)
      await new Promise(r => setTimeout(r, 200));
    }

    const sentCount   = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;

    return res.status(200).json({
      success: failedCount === 0,
      sentCount,
      failedCount,
      testingMode: TESTING_MODE,
      results,
    });
  } catch (err: any) {
    console.error('send-outreach error:', err);
    return res.status(500).json({ error: err.message || 'Failed to send emails' });
  }
}

export const config = {
  api: { bodyParser: { sizeLimit: '1mb' } },
};