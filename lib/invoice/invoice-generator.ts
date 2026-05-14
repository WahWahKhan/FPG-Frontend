// lib/invoice/invoice-generator.ts

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SupplierInvoiceData } from './invoice-types';
import { COMPANY_INFO } from './invoice-config';
import { COMPANY_LOGO_BASE64 } from './logo-base64';

export const generateInvoicePDF = (invoiceData: SupplierInvoiceData): jsPDF => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 15;
  const colWidth = (pageWidth - 2 * margin) / 2;

  // Helper to safely convert values to strings for jsPDF
  const safeText = (value: any): string => {
    if (value === null || value === undefined) return '';
    return String(value);
  };

  // ============================================================================
  // HEADER SECTION
  // ============================================================================
  
  // Left side - Logo + Company Info
  const logoWidth = 30;
  const logoHeight = 34; // Correct aspect ratio (150/132 * 30 ≈ 34)
  doc.addImage(COMPANY_LOGO_BASE64, 'PNG', margin, 8, logoWidth, logoHeight);

  // Company details next to logo
  const companyX = margin + logoWidth + 5;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(COMPANY_INFO.name, companyX, 15);
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(COMPANY_INFO.address.street, companyX, 20);
  doc.text(`${COMPANY_INFO.address.suburb}, ${COMPANY_INFO.address.state}`, companyX, 24);
  doc.text(`${COMPANY_INFO.address.postcode} ${COMPANY_INFO.address.country}`, companyX, 28);
  doc.text(`A.B.N: ${COMPANY_INFO.abn}`, companyX, 32);
  doc.text(COMPANY_INFO.website, companyX, 36);
  doc.text(COMPANY_INFO.email, companyX, 40);

  // Right side - Invoice title + Details
  const rightX = pageWidth - margin;
  
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Invoice', rightX, 20, { align: 'right' });
  
  // Order details
  doc.setFontSize(9);
  const detailsY = 28;
  const labelX = rightX - 80;
  
  // Labels (bold)
  doc.setFont('helvetica', 'bold');
  doc.text('Invoice number', labelX, detailsY);
  doc.text('Invoiced date', labelX, detailsY + 5);
  doc.text('Due Date', labelX, detailsY + 10);
  
  // Values (normal, right-aligned)
  doc.setFont('helvetica', 'normal');
  doc.text(safeText(invoiceData.invoiceNumber), rightX, detailsY, { align: 'right' });
  doc.text(formatDate(invoiceData.invoiceDate), rightX, detailsY + 5, { align: 'right' });
  doc.text(formatDate(invoiceData.dueDate), rightX, detailsY + 10, { align: 'right' });

  // ============================================================================
  // CUSTOMER INFORMATION - TWO COLUMNS
  // ============================================================================
  
  const customerY = 55;
  
  // Determine shipping info (use separate address if provided, otherwise use billing)
  const shippingInfo = invoiceData.shippingAddress || {
    company: invoiceData.customer.company,
    address: invoiceData.customer.address,
    suburb: invoiceData.customer.suburb,
    state: invoiceData.customer.state,
    postcode: invoiceData.customer.postcode,
    phone: invoiceData.customer.phone
  };
  
  // Left Column - Billing Address
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Billing Address', margin, customerY);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  let leftY = customerY + 5;
  doc.text(safeText(invoiceData.customer.company || invoiceData.customer.name), margin, leftY);
  leftY += 4;
  doc.text(safeText(invoiceData.customer.address), margin, leftY);
  leftY += 4;
  doc.text(safeText(`${invoiceData.customer.suburb}, ${invoiceData.customer.state}`), margin, leftY);
  leftY += 4;
  doc.text(safeText(invoiceData.customer.postcode), margin, leftY);
  leftY += 4;
  doc.text('Australia', margin, leftY);
  
  // Contact details below billing
  leftY += 8;
  doc.setFont('helvetica', 'bold');
  doc.text('Contact', margin, leftY);
  doc.setFont('helvetica', 'normal');
  doc.text(safeText(invoiceData.customer.name), margin, leftY + 4);
  
  leftY += 10;
  doc.setFont('helvetica', 'bold');
  doc.text('Email', margin, leftY);
  doc.setFont('helvetica', 'normal');
  doc.text(safeText(invoiceData.customer.email), margin, leftY + 4);
  
  leftY += 10;
  doc.setFont('helvetica', 'bold');
  doc.text('P.O. #', margin, leftY);
  doc.setFont('helvetica', 'normal');
  doc.text(safeText(invoiceData.poNumber || 'N/A'), margin, leftY + 4);

  // Right Column - Shipping Address
  const rightColX = margin + colWidth + 5;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Shipping Address', rightColX, customerY);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  let rightY = customerY + 5;
  doc.text(safeText(shippingInfo.company || invoiceData.customer.name), rightColX, rightY);
  rightY += 4;
  doc.text(safeText(shippingInfo.address), rightColX, rightY);
  rightY += 4;
  doc.text(safeText(`${shippingInfo.suburb}, ${shippingInfo.state}`), rightColX, rightY);
  rightY += 4;
  doc.text(safeText(shippingInfo.postcode), rightColX, rightY);
  rightY += 4;
  doc.text('Australia', rightColX, rightY);
  
  // Contact details below shipping
  rightY += 8;
  doc.setFont('helvetica', 'bold');
  doc.text('Phone:', rightColX, rightY);
  doc.setFont('helvetica', 'normal');
  doc.text(safeText(shippingInfo.phone), rightColX, rightY + 4);
  
  rightY += 10;
  doc.setFont('helvetica', 'bold');
  doc.text('Due Date', rightColX, rightY);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDate(invoiceData.dueDate), rightColX, rightY + 4);
  
  rightY += 10;
  doc.setFont('helvetica', 'bold');
  doc.text('Payment Terms', rightColX, rightY);
  doc.setFont('helvetica', 'normal');
  doc.text(safeText(invoiceData.paymentTerms), rightColX, rightY + 4);

  // ============================================================================
  // ITEMS TABLE
  // ============================================================================
  
  const tableStartY = Math.max(leftY, rightY) + 10;
  
  // Build table body - handle descriptions properly
  const tableBody: any[] = invoiceData.items.map(item => {
    const hasDescription = item.description && item.description.trim();
    
    return [
      {
        content: safeText(item.name),
        styles: {
          fontSize: 9,
          fontStyle: 'bold',
          // If has description, increase cell height
          minCellHeight: hasDescription ? 12 : undefined
        }
      },
      safeText(item.quantity),
      `$${(item.unitPrice || 0).toFixed(2)}`,
      `$${(item.subtotal || 0).toFixed(2)}`
    ];
  });
  
  autoTable(doc, {
    startY: tableStartY,
    head: [['Product', 'Quantity', 'Unit Price', 'Subtotal']],
    body: tableBody,
    theme: 'plain',
    headStyles: { 
      fillColor: [240, 240, 240],
      textColor: 0,
      fontStyle: 'bold',
      fontSize: 9,
      cellPadding: 3
    },
    styles: { 
      fontSize: 9,
      cellPadding: 3,
      lineColor: [200, 200, 200],
      lineWidth: 0.1
    },
    columnStyles: {
      0: { cellWidth: 'auto', halign: 'left' }, // Product - left aligned
      1: { cellWidth: 30, halign: 'center' },   // Quantity - center aligned
      2: { cellWidth: 35, halign: 'center' },   // Unit Price - center aligned
      3: { cellWidth: 35, halign: 'center' }    // Subtotal - center aligned
    },
    // Apply same alignment to header cells
    didParseCell: function(data) {
      if (data.section === 'head') {
        if (data.column.index === 1 || data.column.index === 2 || data.column.index === 3) {
          data.cell.styles.halign = 'center';
        }
      }
    },
    margin: { left: margin, right: margin },
    didDrawCell: function(data) {
      // Only draw description for body cells in first column
      if (data.section === 'body' && data.column.index === 0) {
        const item = invoiceData.items[data.row.index];
        
        if (item?.description && item.description.trim()) {
          // Save current settings
          const originalFontSize = doc.getFontSize();
          const originalTextColor = doc.getTextColor();
          
          // Set description styling
          doc.setFontSize(7.5);
          doc.setTextColor(120, 120, 120);
          doc.setFont('helvetica', 'italic');
          
          const descLines = doc.splitTextToSize(item.description, data.cell.width - 6);
          
          // Draw description BELOW the product name
          // Product name is at y + 5, so start description at y + 10
          let descY = data.cell.y + 10;
          descLines.forEach((line: string) => {
            doc.text(line, data.cell.x + 3, descY);
            descY += 3.5;
          });
          
          // Restore original settings
          doc.setFontSize(originalFontSize);
          doc.setTextColor(originalTextColor);
          doc.setFont('helvetica', 'normal');
        }
      }
    }
  });

  // ============================================================================
  // FOOTER SECTION - Payment Details (Left) + Totals (Right)
  // ============================================================================
  
  const footerY = (doc as any).lastAutoTable.finalY + 10;
  
  // Left side - Payment Details Box
  const boxWidth = colWidth - 5;
  const boxHeight = invoiceData.discount > 0 ? 62 : 56;
  
  doc.setFillColor(245, 245, 245);
  doc.rect(margin, footerY, boxWidth, boxHeight, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.rect(margin, footerY, boxWidth, boxHeight, 'S');
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Preferred payment is', margin + 3, footerY + 6);
  doc.text('Electronic Fund Transfer:', margin + 3, footerY + 11);
  
  doc.setFont('helvetica', 'normal');
  doc.text(`Account: ${COMPANY_INFO.bankDetails.accountName}`, margin + 3, footerY + 18);
  doc.text(`BSB: ${COMPANY_INFO.bankDetails.bsb}`, margin + 3, footerY + 24);
  doc.text(`ACCOUNT: ${COMPANY_INFO.bankDetails.accountNumber}`, margin + 3, footerY + 30);

  // Right side - Totals Box (no QR code)
  const totalsBoxX = margin + colWidth + 5;
  const totalsBoxWidth = colWidth - 5;
  
  // Dark background for totals
  doc.setFillColor(50, 50, 50);
  doc.rect(totalsBoxX, footerY, totalsBoxWidth, boxHeight, 'F');
  
  // Totals text (white on dark background)
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  
  const totalsTextX = totalsBoxX + 10;
  let totalsY = footerY + 12;
  
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal', totalsTextX, totalsY);
  doc.text(`$${invoiceData.subtotal.toFixed(2)}`, totalsBoxX + totalsBoxWidth - 10, totalsY, { align: 'right' });
  
  if (invoiceData.discount > 0) {
    totalsY += 6;
    doc.text(`Discount (${Math.round(invoiceData.discount)}%)`, totalsTextX, totalsY);
    doc.text(`-$${invoiceData.discountAmount.toFixed(2)}`, totalsBoxX + totalsBoxWidth - 10, totalsY, { align: 'right' });
  }

  totalsY += 6;
  doc.text('Shipping', totalsTextX, totalsY);
  doc.text(
    invoiceData.shippingCharge === 0 ? 'Free' : `$${invoiceData.shippingCharge.toFixed(2)}`,
    totalsBoxX + totalsBoxWidth - 10, totalsY, { align: 'right' }
  );
  
  totalsY += 6;
  doc.text('GST', totalsTextX, totalsY);
  doc.text(`$${invoiceData.gst.toFixed(2)}`, totalsBoxX + totalsBoxWidth - 10, totalsY, { align: 'right' });
  
  totalsY += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Total', totalsTextX, totalsY);
  doc.text(`$${invoiceData.total.toFixed(2)}`, totalsBoxX + totalsBoxWidth - 10, totalsY, { align: 'right' });
  
  // Reset text color
  doc.setTextColor(0, 0, 0);

  // Optional Notes Section (if needed)
  if (invoiceData.notes) {
    const notesY = footerY + boxHeight + 8;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Notes:', margin, notesY);
    doc.setFont('helvetica', 'normal');
    const splitNotes = doc.splitTextToSize(safeText(invoiceData.notes), pageWidth - 2 * margin);
    doc.text(splitNotes, margin, notesY + 5);
  }

  return doc;
};

// Helper function to format dates
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  };
  return date.toLocaleDateString('en-US', options);
};

export const calculateDueDate = (invoiceDate: string, paymentTerms: string): string => {
  const date = new Date(invoiceDate);
  
  switch (paymentTerms) {
    case 'EOM 30':
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      endOfMonth.setDate(endOfMonth.getDate() + 30);
      return endOfMonth.toISOString().split('T')[0];
    case 'Net 15':
      date.setDate(date.getDate() + 15);
      return date.toISOString().split('T')[0];
    case 'Net 30':
      date.setDate(date.getDate() + 30);
      return date.toISOString().split('T')[0];
    case 'Net 60':
      date.setDate(date.getDate() + 60);
      return date.toISOString().split('T')[0];
    case 'COD':
      return invoiceDate;
    default:
      return invoiceDate;
  }
};