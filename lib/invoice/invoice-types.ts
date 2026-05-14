// lib/invoice/invoice-types.ts

export interface InvoiceCustomer {
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  suburb: string;
  state: string;
  postcode: string;
}

export interface InvoiceShippingAddress {
  company: string;
  address: string;
  suburb: string;
  state: string;
  postcode: string;
  phone: string;
}

export interface InvoiceLineItem {
  id: string;
  name: string;
  description?: string; // Optional product description
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface SupplierInvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  customer: InvoiceCustomer;
  shippingAddress?: InvoiceShippingAddress | null; // Optional separate shipping
  poNumber: string;
  paymentTerms: string;
  discount: number;
  notes: string;
  items: InvoiceLineItem[];
  subtotal: number;
  discountAmount: number;
  shippingCharge: number;
  gst: number;
  total: number;
}

export type PaymentTerm = 'EOM 30' | 'Net 15' | 'Net 30' | 'Net 60' | 'Cash' | 'Custom';

export const PAYMENT_TERMS: PaymentTerm[] = ['EOM 30', 'Net 15', 'Net 30', 'Net 60', 'Cash', 'Custom'];