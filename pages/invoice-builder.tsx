// pages/invoice-builder.tsx
// MODIFIED VERSION with Invoice Tracking Integration

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { IItemCart } from '../types/cart';
import { separateCartItems } from '../utils/cart-helpers';
import {
  InvoiceCustomer,
  InvoiceShippingAddress,
  InvoiceLineItem,
  SupplierInvoiceData,
  PaymentTerm,
  generateInvoicePDF,
  calculateDueDate,
  INVOICE_CONFIG
} from '../lib/invoice';
import CustomerDetailsForm from '../components/invoice/CustomerDetailsForm';
import InvoiceItemsEditor from '../components/invoice/InvoiceItemsEditor';
import InvoicePreview from '../components/invoice/InvoicePreview';
import InvoiceControls from '../components/invoice/InvoiceControls';
import ProductSearchWidget from '../components/invoice/ProductSearchWidget';
import InvoiceTrackingTable from '../components/invoice/InvoiceTrackingTable';
import { appendInvoiceToSheet } from '../lib/google-sheets/google-sheets-service';

// Get Google Sheet ID from environment variable
const INVOICE_SHEET_ID = process.env.NEXT_PUBLIC_INVOICE_SHEET_ID || '';

export default function InvoiceBuilder() {
  const [items, setItems] = useState<InvoiceLineItem[]>([]);
  const [customer, setCustomer] = useState<InvoiceCustomer>({
    name: '',
    company: '',
    email: '',
    phone: '',
    address: '',
    suburb: '',
    state: '',
    postcode: ''
  });
  const [shippingAddress, setShippingAddress] = useState<InvoiceShippingAddress | null>(null);
  const [poNumber, setPONumber] = useState('');
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerm>('EOM 30');
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState('');
  const [hasGenerated, setHasGenerated] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [lastGeneratedInvoice, setLastGeneratedInvoice] = useState<SupplierInvoiceData | null>(null);
  
  // New state for tracking table
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [sheetWriteError, setSheetWriteError] = useState<string | null>(null);

  // Handle adding product from sidebar
  const handleAddProduct = (product: any) => {
    console.log('[InvoiceBuilder] Adding product:', product);
    
    const productPrice = product.price || 0;
    const productId = product.id || product.slug || `temp-${Date.now()}`;
    const productName = product.name || product.title || 'Unnamed Product';
    
    const newItem: InvoiceLineItem = {
      id: productId,
      name: productName,
      description: '',
      quantity: 1,
      unitPrice: productPrice,
      subtotal: productPrice
    };
    
    const existingIndex = items.findIndex(item => item.id === productId);
    
    if (existingIndex >= 0) {
      const updated = [...items];
      updated[existingIndex].quantity += 1;
      updated[existingIndex].subtotal = updated[existingIndex].quantity * updated[existingIndex].unitPrice;
      setItems(updated);
      showToast(`Quantity increased to ${updated[existingIndex].quantity}`);
    } else {
      setItems([...items, newItem]);
      showToast(`${productName} added to invoice`);
    }
  };

  // Toast notification helper
  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Load cart items on mount
  useEffect(() => {
    const cartData = localStorage.getItem('shopping-cart');
    if (cartData) {
      try {
        const cartObject = JSON.parse(cartData);
        const cartItems: IItemCart[] = cartObject.items || [];
        const { pwaItems, websiteItems, trac360Items, function360Items } = separateCartItems(cartItems);

        const invoiceItems: InvoiceLineItem[] = [];

        websiteItems.forEach(item => {
          invoiceItems.push({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.price || 0,
            subtotal: (item.price || 0) * item.quantity
          });
        });

        pwaItems.forEach(item => {
          invoiceItems.push({
            id: item.id,
            name: 'HOSE360 Custom Assembly',
            quantity: item.quantity,
            unitPrice: item.totalPrice || 0,
            subtotal: item.totalPrice || 0
          });
        });

        trac360Items.forEach(item => {
          invoiceItems.push({
            id: item.id,
            name: item.name || 'TRAC360 Custom Configuration',
            quantity: item.quantity,
            unitPrice: item.totalPrice || 0,
            subtotal: item.totalPrice || 0
          });
        });

        function360Items.forEach(item => {
          invoiceItems.push({
            id: item.id,
            name: 'FUNCTION360 Custom Kit',
            quantity: item.quantity,
            unitPrice: item.totalPrice || 0,
            subtotal: item.totalPrice || 0
          });
        });

        if (invoiceItems.length > 0) {
          setItems(invoiceItems);
        }
      } catch (error) {
        console.error('Error loading cart:', error);
      }
    }
  }, []);

  // Calculate totals
  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const discountAmount = subtotal * (discount / 100);
    const subtotalAfterDiscount = subtotal - discountAmount;
    const gst = subtotalAfterDiscount * INVOICE_CONFIG.gstRate;
    const total = subtotalAfterDiscount + gst;

    return { subtotal, discountAmount, gst, total };
  };

  const totals = calculateTotals();

  // Validate form
  const canGenerate = 
    customer.name.trim() !== '' &&
    customer.email.trim() !== '' &&
    customer.phone.trim() !== '' &&
    customer.address.trim() !== '' &&
    customer.suburb.trim() !== '' &&
    customer.state.trim() !== '' &&
    customer.postcode.trim() !== '' &&
    items.length > 0;

  // Generate invoice with Google Sheets integration
  const handleGenerate = async () => {
    if (!canGenerate) return;

    const invoiceNumber = `INV-${Date.now()}`;
    const invoiceDate = new Date().toISOString().split('T')[0];
    const dueDate = calculateDueDate(invoiceDate, paymentTerms);

    const invoiceData: SupplierInvoiceData = {
      invoiceNumber,
      invoiceDate,
      dueDate,
      customer,
      shippingAddress,
      poNumber: poNumber.trim() || 'N/A',
      paymentTerms,
      discount,
      notes,
      items,
      subtotal: totals.subtotal,
      discountAmount: totals.discountAmount,
      gst: totals.gst,
      total: totals.total
    };

    try {
      const pdf = generateInvoicePDF(invoiceData);
      
      // Save to localStorage as backup
      localStorage.setItem('last-invoice', JSON.stringify(invoiceData));
      
      // Download PDF
      pdf.save(`${invoiceNumber}.pdf`);
      
      setHasGenerated(true);
      setLastGeneratedInvoice(invoiceData);
      
      // Write to Google Sheets (non-blocking)
      if (INVOICE_SHEET_ID) {
        const response = await fetch('/api/invoices/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ invoiceData, sheetId: INVOICE_SHEET_ID })
        });
        const sheetResult = await response.json();
        
        if (!sheetResult.success) {
          setSheetWriteError(sheetResult.error);
        } else {
          setRefreshTrigger(prev => prev + 1);
        }
      }
      
      showToast('Invoice generated successfully!');
      
      // Auto-scroll to tracking table after generation
      setTimeout(() => {
        document.getElementById('tracking-table')?.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }, 500);
      
    } catch (error) {
      console.error('Error generating invoice:', error);
      alert('Error generating invoice. Please try again.');
    }
  };

  // Generate another invoice
  const handleGenerateAnother = () => {
    setCustomer({
      name: '',
      company: '',
      email: '',
      phone: '',
      address: '',
      suburb: '',
      state: '',
      postcode: ''
    });
    setShippingAddress(null);
    setPONumber('');
    setDiscount(0);
    setNotes('');
    setHasGenerated(false);
    setLastGeneratedInvoice(null);
    setSheetWriteError(null);
    setShowCreateForm(true); // Expand form for new invoice
  };

  // Handle sending reminder
  const handleSendReminder = async (invoiceNumber: string) => {
    try {
      // Find invoice data from localStorage or fetch from sheet
      const response = await fetch('/api/invoices/send-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceData: lastGeneratedInvoice, // You may need to fetch this by invoice number
          sheetId: INVOICE_SHEET_ID
        })
      });

      const result = await response.json();
      
      if (result.success) {
        showToast(`Reminder sent for ${invoiceNumber}`);
        setRefreshTrigger(prev => prev + 1); // Refresh table
      } else {
        alert(`Failed to send reminder: ${result.error}`);
      }
    } catch (error) {
      console.error('Error sending reminder:', error);
      alert('Failed to send reminder. Please try again.');
    }
  };

  // Handle marking invoices as paid
  const handleMarkAsPaid = async (invoiceNumbers: string[]) => {
    try {
      const response = await fetch('/api/invoices/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceNumbers,
          status: 'Paid',
          sheetId: INVOICE_SHEET_ID
        })
      });

      const result = await response.json();
      
      if (result.success) {
        showToast(`${invoiceNumbers.length} invoice(s) marked as paid`);
        setRefreshTrigger(prev => prev + 1); // Refresh table
      } else {
        alert(`Failed to update status: ${result.error}`);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update invoice status. Please try again.');
    }
  };

  // Create preview data
  const previewData: SupplierInvoiceData = {
    invoiceNumber: `INV-${Date.now()}`,
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: calculateDueDate(new Date().toISOString().split('T')[0], paymentTerms),
    customer,
    shippingAddress,
    poNumber: poNumber.trim() || 'N/A',
    paymentTerms,
    discount,
    notes,
    items,
    subtotal: totals.subtotal,
    discountAmount: totals.discountAmount,
    gst: totals.gst,
    total: totals.total
  };

  return (
    <>
      <Head>
        <title>Invoice Builder - FluidPower Group</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed top-4 right-4 z-50 animate-fade-in">
            <div className="bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-medium">{toastMessage}</span>
            </div>
          </div>
        )}

        {/* Split Screen Layout */}
        <div className="flex gap-0 min-h-screen">
          {/* LEFT SIDEBAR: Product Browser - 35% width */}
          <div className="w-[35%] border-r border-gray-300 bg-white sticky top-0 h-screen overflow-y-auto">
            <div className="p-6">
              <ProductSearchWidget onAddProduct={handleAddProduct} />
            </div>
          </div>

          {/* RIGHT SECTION: Invoice Builder & Tracking - 65% width */}
          <div className="w-[65%] overflow-y-auto">
            <div className="py-8 px-4">
              <div className="max-w-5xl mx-auto">
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold text-gray-800">FluidPower Group</h1>
                  <p className="text-2xl font-semibold text-gray-700 mt-1">Supplier Invoice Builder</p>
                  <p className="text-sm text-gray-600 mt-2">Create custom invoices for customers</p>
                </div>

                {/* Invoice Tracking Table - Shown by default */}
                {INVOICE_SHEET_ID ? (
                  <div id="tracking-table" className="mb-8">
                    <InvoiceTrackingTable
                      sheetId={INVOICE_SHEET_ID}
                      onSendReminder={handleSendReminder}
                      onMarkAsPaid={handleMarkAsPaid}
                      refreshTrigger={refreshTrigger}
                    />
                    
                    {/* Sheet Write Error Warning */}
                    {sheetWriteError && (
                      <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-start">
                          <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <div className="ml-3">
                            <h3 className="text-yellow-800 font-semibold text-sm">Invoice generated but not recorded in tracking system</h3>
                            <p className="text-yellow-700 text-sm mt-1">{sheetWriteError}</p>
                            <p className="text-yellow-600 text-xs mt-2">Please add this invoice manually to your tracking spreadsheet.</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mb-8 bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800 text-sm">
                      ⚠️ Invoice tracking is not configured. Please set NEXT_PUBLIC_INVOICE_SHEET_ID in your environment variables.
                    </p>
                  </div>
                )}

                {/* Collapsible Create New Invoice Section */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
                  <button
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 transition"
                  >
                    <span className="text-xl font-bold flex items-center gap-2">
                      {showCreateForm ? '➖' : '➕'} Create New Invoice
                    </span>
                    <svg 
                      className={`w-6 h-6 transition-transform ${showCreateForm ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showCreateForm && (
                    <div className="p-6">
                      <CustomerDetailsForm
                        customer={customer}
                        shippingAddress={shippingAddress}
                        poNumber={poNumber}
                        paymentTerms={paymentTerms}
                        discount={discount}
                        notes={notes}
                        onCustomerChange={setCustomer}
                        onShippingAddressChange={setShippingAddress}
                        onPONumberChange={setPONumber}
                        onPaymentTermsChange={setPaymentTerms}
                        onDiscountChange={setDiscount}
                        onNotesChange={setNotes}
                      />

                      <InvoiceItemsEditor
                        items={items}
                        onItemsChange={setItems}
                      />

                      <InvoicePreview invoiceData={previewData} />

                      <InvoiceControls
                        onGenerate={handleGenerate}
                        onGenerateAnother={handleGenerateAnother}
                        canGenerate={canGenerate}
                        hasGenerated={hasGenerated}
                        customerEmail={customer.email}
                        lastGeneratedInvoice={lastGeneratedInvoice}
                      />

                      {hasGenerated && (
                        <div className="bg-green-50 border-2 border-green-500 rounded-lg p-6 text-center mt-6">
                          <h3 className="text-xl font-bold text-green-800 mb-2">✅ Invoice Generated Successfully!</h3>
                          <p className="text-green-700 mb-4">PDF has been downloaded. Invoice added to tracking table above ↑</p>
                          <p className="text-sm text-green-600">You can now email it to your customer or create another invoice.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}