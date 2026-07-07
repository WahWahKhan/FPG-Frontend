// pages/invoice-builder.tsx

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
import { QuoteData, QuoteValidityTerm, calculateExpiryDate } from '../lib/invoice/quote-types';
import { generateQuotePDF } from '../lib/invoice/quote-generator';
import CustomerDetailsForm from '../components/invoice/CustomerDetailsForm';
import InvoiceItemsEditor from '../components/invoice/InvoiceItemsEditor';
import InvoicePreview from '../components/invoice/InvoicePreview';
import InvoiceControls from '../components/invoice/InvoiceControls';
import QuoteControls from '../components/invoice/QuoteControls';
import ProductSearchWidget from '../components/invoice/ProductSearchWidget';
import InvoiceTrackingTable from '../components/invoice/InvoiceTrackingTable';
import CustomerDirectory from '../components/invoice/CustomerDirectory';

const SHEET_ID = process.env.NEXT_PUBLIC_INVOICE_SHEET_ID || '';

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
  const [shippingCharge, setShippingCharge] = useState(-1);
  const [notes, setNotes] = useState('');
  const [hasGenerated, setHasGenerated] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [lastGeneratedInvoice, setLastGeneratedInvoice] = useState<SupplierInvoiceData | null>(null);

  // Invoice builder collapsible
  const [builderOpen, setBuilderOpen] = useState(false);

  // Refresh trigger for tracking table after invoice is created
  const [trackingRefresh, setTrackingRefresh] = useState(0);

  // ── Feature 1: Manual Date ──
  // undefined = use today automatically; string = supplier-entered date
  const [manualDate, setManualDate] = useState<string | undefined>(undefined);

  // ── Feature 2: Quote Mode ──
  const [isQuoteMode, setIsQuoteMode] = useState(false);
  const [quoteValidFor, setQuoteValidFor] = useState<QuoteValidityTerm>('30 Days');
  const [manualExpiryDate, setManualExpiryDate] = useState<string | undefined>(undefined);
  const [lastGeneratedQuote, setLastGeneratedQuote] = useState<QuoteData | null>(null);

  // Resolve the active date (manual override or today)
  const getActiveDate = (): string => {
    if (manualDate) return manualDate;
    return new Date().toISOString().split('T')[0];
  };

  // Handle adding product from sidebar
  const handleAddProduct = (product: any) => {
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
      showToast(`${productName} added to ${isQuoteMode ? 'quote' : 'invoice'}`);
    }
  };

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

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const discountAmount = subtotal * (discount / 100);
    const subtotalAfterDiscount = subtotal - discountAmount;
    const charge = shippingCharge <= 0 ? 0 : shippingCharge;
    const gst = (subtotalAfterDiscount + charge) * INVOICE_CONFIG.gstRate;
    const total = subtotalAfterDiscount + charge + gst;
    return { subtotal, discountAmount, gst, total };
  };

  const totals = calculateTotals();

  const canGenerate =
    customer.name.trim() !== '' &&
    customer.email.trim() !== '' &&
    customer.phone.trim() !== '' &&
    customer.address.trim() !== '' &&
    customer.suburb.trim() !== '' &&
    customer.state.trim() !== '' &&
    customer.postcode.trim() !== '' &&
    shippingCharge >= 0 &&
    items.length > 0;

  // ── Invoice generation ──
  const handleGenerate = () => {
    if (!canGenerate) return;

    const activeDate = getActiveDate();

    if (isQuoteMode) {
      const quoteNumber = `QUO-${Date.now()}`;
      const expiryDate = manualExpiryDate || calculateExpiryDate(activeDate, quoteValidFor);

      const quoteData: QuoteData = {
        quoteNumber,
        quoteDate: activeDate,
        expiryDate,
        manualExpiryDate,
        customer,
        shippingAddress,
        poNumber: poNumber.trim() || 'N/A',
        quoteValidFor,
        discount,
        notes,
        items,
        subtotal: totals.subtotal,
        discountAmount: totals.discountAmount,
        shippingCharge: shippingCharge <= 0 ? 0 : shippingCharge,
        gst: totals.gst,
        total: totals.total
      };

      try {
        const pdf = generateQuotePDF(quoteData);
        localStorage.setItem('last-quote', JSON.stringify(quoteData));
        pdf.save(`${quoteNumber}.pdf`);
        setHasGenerated(true);
        setLastGeneratedQuote(quoteData);
        alert('Quotation generated successfully! PDF downloaded.');
      } catch (error) {
        console.error('Error generating quote:', error);
        alert('Error generating quotation. Please try again.');
      }
    } else {
      const invoiceNumber = `INV-${Date.now()}`;
      const dueDate = calculateDueDate(activeDate, paymentTerms);

      const invoiceData: SupplierInvoiceData = {
        invoiceNumber,
        invoiceDate: activeDate,
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
        shippingCharge: shippingCharge <= 0 ? 0 : shippingCharge,
        gst: totals.gst,
        total: totals.total
      };

      try {
        const pdf = generateInvoicePDF(invoiceData);
        localStorage.setItem('last-invoice', JSON.stringify(invoiceData));
        pdf.save(`${invoiceNumber}.pdf`);
        setHasGenerated(true);
        setLastGeneratedInvoice(invoiceData);
        setTrackingRefresh(n => n + 1);
        alert('Invoice generated successfully! PDF downloaded.');
      } catch (error) {
        console.error('Error generating invoice:', error);
        alert('Error generating invoice. Please try again.');
      }
    }
  };

  const handleGenerateAnother = () => {
    setCustomer({ name: '', company: '', email: '', phone: '', address: '', suburb: '', state: '', postcode: '' });
    setShippingAddress(null);
    setPONumber('');
    setDiscount(0);
    setShippingCharge(-1);
    setNotes('');
    setHasGenerated(false);
    setLastGeneratedInvoice(null);
    setLastGeneratedQuote(null);
    setManualDate(undefined);
    setManualExpiryDate(undefined);
  };

  const handleSyncToTracker = async () => {
    if (!lastGeneratedInvoice) return;
    try {
      const res = await fetch('/api/invoices/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceData: lastGeneratedInvoice })
      });
      const result = await res.json();
      if (res.ok && result.success) {
        alert('✅ Invoice synced to tracker successfully.');
        setTrackingRefresh(n => n + 1);
      } else {
        alert('⚠️ Failed to sync invoice to tracker. Please try again.');
      }
    } catch {
      alert('⚠️ Failed to sync invoice to tracker. Please try again.');
    }
  };

  const handleSyncQuoteToTracker = async () => {
    if (!lastGeneratedQuote) return;
    try {
      const res = await fetch('/api/quotes/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quoteData: lastGeneratedQuote })
      });
      const result = await res.json();
      if (res.ok && result.success) {
        alert('✅ Quote synced to tracker successfully.');
      } else {
        alert('⚠️ Failed to sync quote to tracker. Please try again.');
      }
    } catch {
      alert('⚠️ Failed to sync quote to tracker. Please try again.');
    }
  };

  // ── Feature 4: Pre-fill from Customer Directory ──
  const handleSelectForInvoice = (directoryCustomer: Partial<InvoiceCustomer>) => {
    setCustomer(prev => ({
      ...prev,
      ...directoryCustomer
    }));
    // Open the builder if it's collapsed
    setBuilderOpen(true);
    showToast('Customer details pre-filled from directory');
  };

  // Preview data — used by InvoicePreview (invoice mode only; quote mode uses same structure)
  const activeDate = getActiveDate();
  const previewData: SupplierInvoiceData = {
    invoiceNumber: isQuoteMode ? `QUO-${Date.now()}` : `INV-${Date.now()}`,
    invoiceDate: activeDate,
    dueDate: isQuoteMode
      ? (manualExpiryDate || calculateExpiryDate(activeDate, quoteValidFor))
      : calculateDueDate(activeDate, paymentTerms),
    customer,
    shippingAddress,
    poNumber: poNumber.trim() || 'N/A',
    paymentTerms,
    discount,
    notes,
    items,
    subtotal: totals.subtotal,
    discountAmount: totals.discountAmount,
    shippingCharge: shippingCharge <= 0 ? 0 : shippingCharge,
    gst: totals.gst,
    total: totals.total
  };

  // Header label changes based on mode
  const builderTitle = isQuoteMode ? '📋 Create New Quotation' : '📄 Create New Invoice';
  const builderSubtitle = isQuoteMode
    ? 'Fill in customer details and line items for a quote'
    : 'Fill in customer details and line items';

  return (
    <>
      <Head>
        <title>Invoice Builder - FluidPower Group</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Toast */}
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

          {/* LEFT SIDEBAR: Product Browser */}
          <div className="w-[35%] border-r border-gray-300 bg-white sticky top-0 h-screen overflow-y-auto">
            <div className="p-6">
              <ProductSearchWidget onAddProduct={handleAddProduct} />
            </div>
          </div>

          {/* RIGHT SECTION */}
          <div className="w-[65%] overflow-y-auto">
            <div className="py-8 px-4">
              <div className="max-w-5xl mx-auto">

                {/* Page title */}
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold text-gray-800">FluidPower Group</h1>
                  <p className="text-2xl font-semibold text-gray-700 mt-1">Supplier Invoice Builder</p>
                  <p className="text-sm text-gray-600 mt-2">Create custom invoices and quotations for customers</p>
                </div>

                {/* ── 1. Invoice Tracking Table (always visible at top) ── */}
                {SHEET_ID && (
                  <div className="mb-6">
                    <InvoiceTrackingTable
                      sheetId={SHEET_ID}
                      onSendReminder={() => {}}
                      onMarkAsPaid={() => {}}
                      refreshTrigger={trackingRefresh}
                    />
                  </div>
                )}

                {/* ── 2. Invoice / Quote Builder — collapsible ── */}
                <div className="rounded-2xl shadow-md overflow-hidden mb-6">
                  <button
                    onClick={() => setBuilderOpen(o => !o)}
                    className="w-full px-6 py-2.5 flex items-center justify-between text-left relative transition-all"
                    style={{
                      background: isQuoteMode
                        ? "radial-gradient(ellipse at top, rgba(167, 139, 250, 0.95) 0%, rgba(139, 92, 246, 0.92) 50%, rgba(109, 40, 217, 0.96) 100%)"
                        : "radial-gradient(ellipse at top, rgba(255, 222, 110, 0.95) 0%, rgba(236, 180, 68, 0.92) 50%, rgba(210, 155, 50, 0.96) 100%)",
                      backdropFilter: "blur(12px)",
                      WebkitBackdropFilter: "blur(12px)",
                      border: isQuoteMode
                        ? "1px solid rgba(196, 181, 253, 0.7)"
                        : "1px solid rgba(255, 235, 130, 0.7)",
                      boxShadow: isQuoteMode
                        ? "inset 0 2px 0 rgba(255,255,255,0.75), inset 0 4px 12px rgba(255,255,255,0.3), inset 0 -2px 0 rgba(109,40,217,0.4)"
                        : "inset 0 2px 0 rgba(255,255,255,0.75), inset 0 4px 12px rgba(255,255,255,0.3), inset 0 -2px 0 rgba(170,120,20,0.4)"
                    }}
                    onMouseEnter={e => {
                      const b = e.currentTarget as HTMLButtonElement;
                      b.style.filter = "brightness(1.06)";
                    }}
                    onMouseLeave={e => {
                      const b = e.currentTarget as HTMLButtonElement;
                      b.style.filter = "";
                    }}
                    aria-expanded={builderOpen}
                  >
                    <span style={{ position:"absolute", top:"2px", left:"16px", right:"16px", height:"45%", background:"linear-gradient(180deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.2) 50%, transparent 100%)", borderRadius:"40px 40px 20px 20px", pointerEvents:"none" }} />
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{builderTitle}</h2>
                      <p className="text-gray-700 text-sm mt-1">{builderSubtitle}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {/* Quote Mode Toggle */}
                      <label
                        className="flex items-center gap-2 cursor-pointer z-10"
                        onClick={e => e.stopPropagation()}
                        title="Switch between Invoice and Quotation mode"
                      >
                        <input
                          type="checkbox"
                          checked={isQuoteMode}
                          onChange={e => {
                            setIsQuoteMode(e.target.checked);
                            setHasGenerated(false);
                            setLastGeneratedInvoice(null);
                            setLastGeneratedQuote(null);
                          }}
                          className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 cursor-pointer"
                        />
                        <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                          Generate as Quotation
                        </span>
                      </label>
                      <svg
                        className={`w-6 h-6 text-gray-900 transition-transform ${builderOpen ? 'rotate-180' : ''}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {builderOpen && (
                    <div className="bg-white p-4">
                      <CustomerDetailsForm
                        customer={customer}
                        shippingAddress={shippingAddress}
                        poNumber={poNumber}
                        paymentTerms={paymentTerms}
                        discount={discount}
                        shippingCharge={shippingCharge}
                        notes={notes}
                        onCustomerChange={setCustomer}
                        onShippingAddressChange={setShippingAddress}
                        onPONumberChange={setPONumber}
                        onPaymentTermsChange={setPaymentTerms}
                        onDiscountChange={setDiscount}
                        onShippingChargeChange={setShippingCharge}
                        onNotesChange={setNotes}
                        isQuoteMode={isQuoteMode}
                        manualDate={manualDate}
                        onManualDateChange={setManualDate}
                        quoteValidFor={quoteValidFor}
                        onQuoteValidForChange={setQuoteValidFor}
                        manualExpiryDate={manualExpiryDate}
                        onManualExpiryDateChange={setManualExpiryDate}
                      />

                      <InvoiceItemsEditor
                        items={items}
                        onItemsChange={setItems}
                      />

                      <InvoicePreview invoiceData={previewData} />

                      {isQuoteMode ? (
                        <QuoteControls
                          onGenerate={handleGenerate}
                          onGenerateAnother={handleGenerateAnother}
                          canGenerate={canGenerate}
                          hasGenerated={hasGenerated}
                          customerEmail={customer.email}
                          lastGeneratedQuote={lastGeneratedQuote}
                          onSyncToTracker={handleSyncQuoteToTracker}
                        />
                      ) : (
                        <InvoiceControls
                          onGenerate={handleGenerate}
                          onGenerateAnother={handleGenerateAnother}
                          canGenerate={canGenerate}
                          hasGenerated={hasGenerated}
                          customerEmail={customer.email}
                          lastGeneratedInvoice={lastGeneratedInvoice}
                          onSyncToTracker={handleSyncToTracker}
                        />
                      )}

                      {hasGenerated && (
                        <div className={`border-2 rounded-lg p-6 text-center mt-4 ${
                          isQuoteMode
                            ? 'bg-purple-50 border-purple-500'
                            : 'bg-green-50 border-green-500'
                        }`}>
                          <h3 className={`text-xl font-bold mb-2 ${isQuoteMode ? 'text-purple-800' : 'text-green-800'}`}>
                            {isQuoteMode ? 'Quotation Generated' : 'Invoice Generated'}
                          </h3>
                          <p className={`mb-4 ${isQuoteMode ? 'text-purple-700' : 'text-green-700'}`}>
                            PDF has been downloaded. You can now email it to your customer.
                          </p>
                          <p className={`text-sm ${isQuoteMode ? 'text-purple-600' : 'text-green-600'}`}>
                            Ready to create another {isQuoteMode ? 'quotation' : 'invoice'}?
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* ── 3. Customer Directory ── */}
                <CustomerDirectory onSelectForInvoice={handleSelectForInvoice} />

              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}