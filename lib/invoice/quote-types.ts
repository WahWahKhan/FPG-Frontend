// lib/invoice/quote-types.ts

import { InvoiceCustomer, InvoiceShippingAddress, InvoiceLineItem } from './invoice-types';

export interface QuoteData {
  quoteNumber: string;
  quoteDate: string;
  expiryDate: string;
  manualExpiryDate?: string; // when set, overrides the auto-calculated expiry date
  customer: InvoiceCustomer;
  shippingAddress?: InvoiceShippingAddress | null;
  poNumber: string;
  quoteValidFor: QuoteValidityTerm;
  discount: number;
  notes: string;
  items: InvoiceLineItem[];
  subtotal: number;
  discountAmount: number;
  shippingCharge: number;
  gst: number;
  total: number;
}

export type QuoteValidityTerm = '30 Days' | '60 Days' | '90 Days';

export const QUOTE_VALIDITY_TERMS: QuoteValidityTerm[] = ['30 Days', '60 Days', '90 Days'];

export const calculateExpiryDate = (quoteDate: string, validFor: QuoteValidityTerm): string => {
  const date = new Date(quoteDate);
  switch (validFor) {
    case '30 Days':
      date.setDate(date.getDate() + 30);
      break;
    case '60 Days':
      date.setDate(date.getDate() + 60);
      break;
    case '90 Days':
      date.setDate(date.getDate() + 90);
      break;
  }
  return date.toISOString().split('T')[0];
};