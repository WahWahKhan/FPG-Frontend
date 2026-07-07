// lib/invoice/quote-generator.ts

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { QuoteData } from './quote-types';
import { COMPANY_INFO } from './invoice-config';
import { COMPANY_LOGO_BASE64 } from './logo-base64';

export const generateQuotePDF = (quoteData: QuoteData): jsPDF => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const margin = 15;
  const colWidth = (pageWidth - 2 * margin) / 2;

  const safeText = (value: any): string => {
    if (value === null || value === undefined) return '';
    return String(value);
  };

  // ============================================================================
  // HEADER SECTION
  // ============================================================================

  const logoWidth = 30;
  const logoHeight = 34;
  doc.addImage(COMPANY_LOGO_BASE64, 'PNG', margin, 8, logoWidth, logoHeight);

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

  // Right side — Quotation title + details
  const rightX = pageWidth - margin;

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Quotation', rightX, 20, { align: 'right' });

  doc.setFontSize(9);
  const detailsY = 28;
  const labelX = rightX - 80;

  doc.setFont('helvetica', 'bold');
  doc.text('Quote Number', labelX, detailsY);
  doc.text('Quote Date', labelX, detailsY + 5);
  doc.text('Valid Until', labelX, detailsY + 10);

  doc.setFont('helvetica', 'normal');
  doc.text(safeText(quoteData.quoteNumber), rightX, detailsY, { align: 'right' });
  doc.text(formatDate(quoteData.quoteDate), rightX, detailsY + 5, { align: 'right' });
  doc.text(formatDate(quoteData.expiryDate), rightX, detailsY + 10, { align: 'right' });

  // ============================================================================
  // CUSTOMER INFORMATION - TWO COLUMNS
  // ============================================================================

  const customerY = 55;

  const shippingInfo = quoteData.shippingAddress || {
    company: quoteData.customer.company,
    address: quoteData.customer.address,
    suburb: quoteData.customer.suburb,
    state: quoteData.customer.state,
    postcode: quoteData.customer.postcode,
    phone: quoteData.customer.phone
  };

  // Left Column - Billing Address
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Billing Address', margin, customerY);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  let leftY = customerY + 5;
  doc.text(safeText(quoteData.customer.company || quoteData.customer.name), margin, leftY);
  leftY += 4;
  doc.text(safeText(quoteData.customer.address), margin, leftY);
  leftY += 4;
  doc.text(safeText(`${quoteData.customer.suburb}, ${quoteData.customer.state}`), margin, leftY);
  leftY += 4;
  doc.text(safeText(quoteData.customer.postcode), margin, leftY);
  leftY += 4;
  doc.text('Australia', margin, leftY);

  leftY += 8;
  doc.setFont('helvetica', 'bold');
  doc.text('Contact', margin, leftY);
  doc.setFont('helvetica', 'normal');
  doc.text(safeText(quoteData.customer.name), margin, leftY + 4);

  leftY += 10;
  doc.setFont('helvetica', 'bold');
  doc.text('Email', margin, leftY);
  doc.setFont('helvetica', 'normal');
  doc.text(safeText(quoteData.customer.email), margin, leftY + 4);

  leftY += 10;
  doc.setFont('helvetica', 'bold');
  doc.text('P.O. #', margin, leftY);
  doc.setFont('helvetica', 'normal');
  doc.text(safeText(quoteData.poNumber || 'N/A'), margin, leftY + 4);

  // Right Column - Shipping Address
  const rightColX = margin + colWidth + 5;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Shipping Address', rightColX, customerY);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  let rightY = customerY + 5;
  doc.text(safeText(shippingInfo.company || quoteData.customer.name), rightColX, rightY);
  rightY += 4;
  doc.text(safeText(shippingInfo.address), rightColX, rightY);
  rightY += 4;
  doc.text(safeText(`${shippingInfo.suburb}, ${shippingInfo.state}`), rightColX, rightY);
  rightY += 4;
  doc.text(safeText(shippingInfo.postcode), rightColX, rightY);
  rightY += 4;
  doc.text('Australia', rightColX, rightY);

  rightY += 8;
  doc.setFont('helvetica', 'bold');
  doc.text('Phone:', rightColX, rightY);
  doc.setFont('helvetica', 'normal');
  doc.text(safeText(shippingInfo.phone), rightColX, rightY + 4);

  rightY += 10;
  doc.setFont('helvetica', 'bold');
  doc.text('Valid For', rightColX, rightY);
  doc.setFont('helvetica', 'normal');
  doc.text(safeText(quoteData.manualExpiryDate ? 'Custom' : quoteData.quoteValidFor), rightColX, rightY + 4);

  // ============================================================================
  // ITEMS TABLE
  // ============================================================================

  const tableStartY = Math.max(leftY, rightY) + 10;

  const tableBody: any[] = quoteData.items.map(item => {
    const hasDescription = item.description && item.description.trim();
    return [
      {
        content: safeText(item.name),
        styles: {
          fontSize: 9,
          fontStyle: 'bold',
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
      0: { cellWidth: 'auto', halign: 'left' },
      1: { cellWidth: 30, halign: 'center' },
      2: { cellWidth: 35, halign: 'center' },
      3: { cellWidth: 35, halign: 'center' }
    },
    didParseCell: function (data) {
      if (data.section === 'head') {
        if (data.column.index === 1 || data.column.index === 2 || data.column.index === 3) {
          data.cell.styles.halign = 'center';
        }
      }
    },
    margin: { left: margin, right: margin },
    didDrawCell: function (data) {
      if (data.section === 'body' && data.column.index === 0) {
        const item = quoteData.items[data.row.index];
        if (item?.description && item.description.trim()) {
          const originalFontSize = doc.getFontSize();
          const originalTextColor = doc.getTextColor();
          doc.setFontSize(7.5);
          doc.setTextColor(120, 120, 120);
          doc.setFont('helvetica', 'italic');
          const descLines = doc.splitTextToSize(item.description, data.cell.width - 6);
          let descY = data.cell.y + 10;
          descLines.forEach((line: string) => {
            doc.text(line, data.cell.x + 3, descY);
            descY += 3.5;
          });
          doc.setFontSize(originalFontSize);
          doc.setTextColor(originalTextColor);
          doc.setFont('helvetica', 'normal');
        }
      }
    }
  });

  // ============================================================================
  // FOOTER SECTION — Validity Note (Left) + Totals (Right)
  // ============================================================================

  const footerY = (doc as any).lastAutoTable.finalY + 10;

  const boxWidth = colWidth - 5;
  const boxHeight = quoteData.discount > 0 ? 62 : 56;

  // Left side — Quotation validity note box (instead of bank details)
  doc.setFillColor(245, 245, 245);
  doc.rect(margin, footerY, boxWidth, boxHeight, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.rect(margin, footerY, boxWidth, boxHeight, 'S');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Quotation Terms', margin + 3, footerY + 6);

  doc.setFont('helvetica', 'normal');
  doc.text(`This quotation is valid until`, margin + 3, footerY + 13);
  doc.setFont('helvetica', 'bold');
  doc.text(formatDate(quoteData.expiryDate) + '.', margin + 3, footerY + 18);
  doc.setFont('helvetica', 'normal');
  doc.text('Prices are subject to change after', margin + 3, footerY + 25);
  doc.text('this date. GST is included in the', margin + 3, footerY + 30);
  doc.text('total amount shown.', margin + 3, footerY + 35);
  doc.text('To accept this quote, please', margin + 3, footerY + 42);
  doc.text(`contact us at ${COMPANY_INFO.email}`, margin + 3, footerY + 47);

  // Right side — Totals box
  const totalsBoxX = margin + colWidth + 5;
  const totalsBoxWidth = colWidth - 5;

  doc.setFillColor(50, 50, 50);
  doc.rect(totalsBoxX, footerY, totalsBoxWidth, boxHeight, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);

  const totalsTextX = totalsBoxX + 10;
  let totalsY = footerY + 12;

  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal', totalsTextX, totalsY);
  doc.text(`$${quoteData.subtotal.toFixed(2)}`, totalsBoxX + totalsBoxWidth - 10, totalsY, { align: 'right' });

  if (quoteData.discount > 0) {
    totalsY += 6;
    doc.text(`Discount (${Math.round(quoteData.discount)}%)`, totalsTextX, totalsY);
    doc.text(`-$${quoteData.discountAmount.toFixed(2)}`, totalsBoxX + totalsBoxWidth - 10, totalsY, { align: 'right' });
  }

  totalsY += 6;
  doc.text('Shipping', totalsTextX, totalsY);
  doc.text(
    quoteData.shippingCharge === 0 ? 'Free' : `$${quoteData.shippingCharge.toFixed(2)}`,
    totalsBoxX + totalsBoxWidth - 10, totalsY, { align: 'right' }
  );

  totalsY += 6;
  doc.text('GST', totalsTextX, totalsY);
  doc.text(`$${quoteData.gst.toFixed(2)}`, totalsBoxX + totalsBoxWidth - 10, totalsY, { align: 'right' });

  totalsY += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Total', totalsTextX, totalsY);
  doc.text(`$${quoteData.total.toFixed(2)}`, totalsBoxX + totalsBoxWidth - 10, totalsY, { align: 'right' });

  doc.setTextColor(0, 0, 0);

  if (quoteData.notes) {
    const notesY = footerY + boxHeight + 8;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Notes:', margin, notesY);
    doc.setFont('helvetica', 'normal');
    const splitNotes = doc.splitTextToSize(safeText(quoteData.notes), pageWidth - 2 * margin);
    doc.text(splitNotes, margin, notesY + 5);
  }

  return doc;
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };
  return date.toLocaleDateString('en-US', options);
};