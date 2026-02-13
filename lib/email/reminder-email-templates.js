// lib/email/reminder-email-templates.js
// Payment reminder email templates for overdue invoices

/**
 * Generate REMINDER email templates for overdue invoices
 * Reuses invoice email structure but adds urgency and overdue information
 */
export function generateReminderEmailTemplates(invoiceData, daysOverdue, customOrderPdfsCount = 0) {
    const currentDate = new Date().toLocaleDateString('en-AU', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });

    const TESTING_MODE = process.env.TESTING_MODE === 'true';
    const businessEmailDisplay = TESTING_MODE 
        ? process.env.BUSINESS_EMAIL_TEST || 'info@agcomponents.com.au'
        : process.env.BUSINESS_EMAIL;

    // Customer Reminder Email Template
    const customerEmailContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>PAYMENT REMINDER - Invoice from FluidPower Group</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
            <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <div style="background-color: #e74c3c; padding: 30px 20px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px;">⚠️ PAYMENT REMINDER</h1>
                    <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">Invoice Payment Overdue</p>
                </div>
                <div style="padding: 30px 20px;">
                    <p style="font-size: 16px; color: #333333;">Dear ${invoiceData.customer.name},</p>
                    <p style="font-size: 16px; color: #333333;">This is a friendly reminder that payment for the following invoice is now <strong>overdue</strong>:</p>
                    
                    <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
                        <p style="margin: 5px 0; color: #856404;"><strong>Invoice Number:</strong> ${invoiceData.invoiceNumber}</p>
                        <p style="margin: 5px 0; color: #856404;"><strong>Invoice Date:</strong> ${new Date(invoiceData.invoiceDate).toLocaleDateString('en-AU')}</p>
                        <p style="margin: 5px 0; color: #856404;"><strong>Due Date:</strong> ${new Date(invoiceData.dueDate).toLocaleDateString('en-AU')}</p>
                        <p style="margin: 5px 0; color: #856404;"><strong>Amount Due:</strong> $${invoiceData.total.toFixed(2)}</p>
                        <p style="margin: 10px 0 5px 0; color: #d9534f; font-size: 18px; font-weight: bold;">
                            ⏰ Days Overdue: ${daysOverdue} days
                        </p>
                    </div>
                    
                    <div style="background-color: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0;">
                        <h3 style="color: #155724; margin-top: 0;">Payment Details</h3>
                        <p style="margin: 5px 0; color: #155724;"><strong>Account Name:</strong> FluidPower Group Pty Ltd</p>
                        <p style="margin: 5px 0; color: #155724;"><strong>BSB:</strong> 063 531</p>
                        <p style="margin: 5px 0; color: #155724;"><strong>Account Number:</strong> 1059 0324</p>
                        <p style="margin: 10px 0 5px 0; color: #155724;"><strong>Payment Reference:</strong> ${invoiceData.invoiceNumber}</p>
                    </div>
                    
                    ${customOrderPdfsCount > 0 ? `
                    <div style="background-color: #e8f4f8; border-left: 4px solid #3498db; padding: 15px; margin: 20px 0;">
                        <h3 style="color: #2c3e50; margin-top: 0;">📎 Attached Documents</h3>
                        <p style="margin: 5px 0; color: #2c3e50;">This reminder includes <strong>${customOrderPdfsCount + 1} PDF attachment(s)</strong>:</p>
                        <ul style="color: #2c3e50; margin: 10px 0; padding-left: 20px;">
                            <li>Invoice (${invoiceData.invoiceNumber}.pdf)</li>
                            <li>${customOrderPdfsCount} Custom Order Specification(s)</li>
                        </ul>
                    </div>
                    ` : `
                    <div style="background-color: #e8f4f8; border-left: 4px solid #3498db; padding: 15px; margin: 20px 0;">
                        <p style="margin: 0; color: #2c3e50;">
                            <strong>📎 Attached:</strong> Original invoice (${invoiceData.invoiceNumber}.pdf) for your reference
                        </p>
                    </div>
                    `}
                    
                    <p style="font-size: 16px; color: #333333; margin-top: 20px;">
                        Please arrange payment at your earliest convenience. If payment has already been made, 
                        please disregard this reminder and accept our thanks.
                    </p>
                    
                    <p style="font-size: 16px; color: #333333; margin-top: 15px;">
                        If you have any questions or require assistance, please don't hesitate to contact us.
                    </p>
                    
                    <p style="font-size: 14px; color: #666666; text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
                        Questions? Contact us at ${businessEmailDisplay}
                    </p>
                </div>
            </div>
        </body>
        </html>
    `;

    // Business Reminder Email Template
    const businessEmailContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Payment Reminder Sent</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
            <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
                <div style="background-color: #ff9800; padding: 30px 20px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0;">📧 Payment Reminder Sent</h1>
                </div>
                <div style="padding: 30px 20px;">
                    <p><strong>Invoice Number:</strong> ${invoiceData.invoiceNumber}</p>
                    <p><strong>Customer:</strong> ${invoiceData.customer.name} (${invoiceData.customer.email})</p>
                    <p><strong>Amount Due:</strong> $${invoiceData.total.toFixed(2)}</p>
                    <p><strong>Days Overdue:</strong> <span style="color: #e74c3c; font-weight: bold;">${daysOverdue} days</span></p>
                    <p><strong>Sent:</strong> ${currentDate}</p>
                    
                    ${customOrderPdfsCount > 0 ? `
                    <div style="background-color: #d1ecf1; border-left: 4px solid #17a2b8; padding: 15px; margin: 20px 0;">
                        <p style="margin: 0; color: #0c5460;">
                            <strong>📎 Attachments:</strong> ${customOrderPdfsCount + 1} PDF file(s) sent<br>
                            <small>Invoice + ${customOrderPdfsCount} custom order specification(s)</small>
                        </p>
                    </div>
                    ` : ''}
                    
                    <p style="font-size: 14px; color: #666666; margin-top: 20px;">
                        Reminder email copy attached to this email for your records.
                    </p>
                </div>
            </div>
        </body>
        </html>
    `;

    return {
        customerEmailContent,
        businessEmailContent
    };
}