// pages/api/invoices/send-reminder.ts
// Simplified version - sends reminder email without PDF attachment

import type { NextApiRequest, NextApiResponse } from 'next';
import { incrementReminderCount } from '../../../lib/google-sheets/google-sheets-service';
import { generateReminderEmailTemplates } from '../../../lib/email/reminder-email-templates';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { invoiceData, sheetId } = req.body;

    // Validation
    if (!invoiceData || !invoiceData.invoiceNumber) {
      return res.status(400).json({ error: 'Invoice data is required' });
    }

    if (!sheetId) {
      return res.status(400).json({ error: 'Sheet ID is required' });
    }

    // Calculate days overdue
    const dueDate = new Date(invoiceData.dueDate);
    const today = new Date();
    const diffTime = today.getTime() - dueDate.getTime();
    const daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (daysOverdue <= 0) {
      return res.status(400).json({ 
        error: 'Invoice is not overdue yet. Reminders can only be sent for overdue invoices.' 
      });
    }

    // Generate reminder email templates
    const { customerEmailContent, businessEmailContent } = generateReminderEmailTemplates(
      invoiceData,
      daysOverdue,
      0 // No custom PDFs
    );

    // Prepare email data for your existing email system
    const emailData = {
      to: invoiceData.customer.email,
      subject: `PAYMENT REMINDER: Invoice ${invoiceData.invoiceNumber} - Due ${new Date(invoiceData.dueDate).toLocaleDateString('en-AU')} (${daysOverdue} days overdue)`,
      html: customerEmailContent,
      // Business copy
      bcc: process.env.BUSINESS_EMAIL,
      businessHtml: businessEmailContent
    };

    // Send email using your existing email infrastructure
    // Adjust this to match your email sending setup (Resend, SendGrid, etc.)
    const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || `https://${req.headers.host}`}/api/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(emailData)
    });

    if (!emailResponse.ok) {
      throw new Error('Failed to send reminder email');
    }

    // Increment reminder count in Google Sheets
    const updateResult = await incrementReminderCount(invoiceData.invoiceNumber, sheetId);

    if (!updateResult.success) {
      console.error('Warning: Reminder sent but failed to update sheet:', updateResult.error);
    }

    return res.status(200).json({
      success: true,
      message: `Payment reminder sent to ${invoiceData.customer.email}`,
      daysOverdue
    });

  } catch (error: any) {
    console.error('Error in send-reminder API:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}