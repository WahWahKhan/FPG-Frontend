// components/invoice/CustomerDetailsForm.tsx

import React, { useState } from 'react';
import { InvoiceCustomer, InvoiceShippingAddress, PAYMENT_TERMS, PaymentTerm } from '../../lib/invoice';
import { QUOTE_VALIDITY_TERMS, QuoteValidityTerm } from '../../lib/invoice/quote-types';
import AutocompleteInput from './AutocompleteInput';
import { CustomerSuggestion } from '../../pages/api/invoices/get-customers';

interface CustomerDetailsFormProps {
  customer: InvoiceCustomer;
  shippingAddress?: InvoiceShippingAddress | null;
  poNumber: string;
  paymentTerms: PaymentTerm;
  discount: number;
  shippingCharge: number;
  notes: string;
  onCustomerChange: (customer: InvoiceCustomer) => void;
  onShippingAddressChange?: (shipping: InvoiceShippingAddress | null) => void;
  onPONumberChange: (po: string) => void;
  onPaymentTermsChange: (terms: PaymentTerm) => void;
  onDiscountChange: (discount: number) => void;
  onShippingChargeChange: (charge: number) => void;
  onNotesChange: (notes: string) => void;
  // Mode flags passed down from invoice-builder
  isQuoteMode?: boolean;
  manualDate?: string;           // undefined = use today's date automatically
  onManualDateChange?: (date: string | undefined) => void;
  quoteValidFor?: QuoteValidityTerm;
  onQuoteValidForChange?: (term: QuoteValidityTerm) => void;
  manualExpiryDate?: string;     // undefined = auto-calculate from quoteValidFor
  onManualExpiryDateChange?: (date: string | undefined) => void;
}

const INPUT_CLASS =
  'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent';

export default function CustomerDetailsForm({
  customer,
  shippingAddress: propShippingAddress,
  poNumber,
  paymentTerms,
  discount,
  shippingCharge,
  notes,
  onCustomerChange,
  onShippingAddressChange,
  onPONumberChange,
  onPaymentTermsChange,
  onDiscountChange,
  onShippingChargeChange,
  onNotesChange,
  isQuoteMode = false,
  manualDate,
  onManualDateChange,
  quoteValidFor = '30 Days',
  onQuoteValidForChange,
  manualExpiryDate,
  onManualExpiryDateChange
}: CustomerDetailsFormProps) {
  const [sameAsBilling, setSameAsBilling] = useState(!propShippingAddress);
  const [internalShipping, setInternalShipping] = useState<InvoiceShippingAddress | null>(null);

  const effectiveShipping = onShippingAddressChange ? propShippingAddress : internalShipping;
  const setShipping = onShippingAddressChange || setInternalShipping;

  const isManualDateEnabled = manualDate !== undefined;
  const isManualExpiryEnabled = manualExpiryDate !== undefined;

  const handleInputChange = (field: keyof InvoiceCustomer, value: string) => {
    onCustomerChange({ ...customer, [field]: value });
  };

  const handleAutofill = (suggestion: CustomerSuggestion) => {
    onCustomerChange({
      name: suggestion.name,
      company: suggestion.company,
      email: suggestion.email,
      phone: suggestion.phone,
      address: suggestion.address,
      suburb: suggestion.suburb,
      state: suggestion.state,
      postcode: suggestion.postcode,
    });
  };

  const handleShippingChange = (field: keyof InvoiceShippingAddress, value: string) => {
    const current = effectiveShipping || {
      company: customer.company || '',
      address: customer.address || '',
      suburb: customer.suburb || '',
      state: customer.state || '',
      postcode: customer.postcode || '',
      phone: customer.phone || ''
    };
    setShipping({ ...current, [field]: value });
  };

  const handleSameAsBillingToggle = (checked: boolean) => {
    setSameAsBilling(checked);
    if (checked) {
      setShipping(null);
    } else {
      setShipping({
        company: customer.company || '',
        address: customer.address || '',
        suburb: customer.suburb || '',
        state: customer.state || '',
        postcode: customer.postcode || '',
        phone: customer.phone || ''
      });
    }
  };

  const handleManualDateToggle = (checked: boolean) => {
    if (!onManualDateChange) return;
    if (checked) {
      // Default to today's date when enabling
      onManualDateChange(new Date().toISOString().split('T')[0]);
    } else {
      onManualDateChange(undefined);
    }
  };

  const handleManualExpiryToggle = (checked: boolean) => {
    if (!onManualExpiryDateChange) return;
    if (checked) {
      // Default to today's date when enabling — supplier will adjust
      onManualExpiryDateChange(new Date().toISOString().split('T')[0]);
    } else {
      onManualExpiryDateChange(undefined);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Customer Details</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Billing Address Section */}
        <div className="md:col-span-2">
          <h3 className="text-lg font-semibold text-gray-700 mb-3 border-b pb-2">Billing Address</h3>
        </div>

        {/* Customer Name — autocomplete enabled */}
        <div>
          <AutocompleteInput
            label="Customer Name"
            required
            value={customer.name}
            onChange={value => handleInputChange('name', value)}
            onSelect={handleAutofill}
            placeholder="Start typing to search..."
            displayField="name"
            inputClassName={INPUT_CLASS}
            apiEndpoint={isQuoteMode ? '/api/quotes/get-customers' : '/api/invoices/get-customers'}
          />
        </div>

        {/* Company Name — autocomplete enabled */}
        <div>
          <AutocompleteInput
            label="Company Name"
            value={customer.company}
            onChange={value => handleInputChange('company', value)}
            onSelect={handleAutofill}
            placeholder="Start typing to search..."
            displayField="company"
            inputClassName={INPUT_CLASS}
            apiEndpoint={isQuoteMode ? '/api/quotes/get-customers' : '/api/invoices/get-customers'}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
          <input
            type="email"
            value={customer.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className={INPUT_CLASS}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
          <input
            type="tel"
            value={customer.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            className={INPUT_CLASS}
            required
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
          <input
            type="text"
            value={customer.address}
            onChange={(e) => handleInputChange('address', e.target.value)}
            className={INPUT_CLASS}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Suburb *</label>
          <input
            type="text"
            value={customer.suburb}
            onChange={(e) => handleInputChange('suburb', e.target.value)}
            className={INPUT_CLASS}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
            <input
              type="text"
              value={customer.state}
              onChange={(e) => handleInputChange('state', e.target.value)}
              className={INPUT_CLASS}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Postcode *</label>
            <input
              type="text"
              value={customer.postcode}
              onChange={(e) => handleInputChange('postcode', e.target.value)}
              className={INPUT_CLASS}
              required
            />
          </div>
        </div>

        {/* Shipping Address Toggle */}
        <div className="md:col-span-2 mt-4 mb-2">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={sameAsBilling}
              onChange={(e) => handleSameAsBillingToggle(e.target.checked)}
              className="w-5 h-5 text-yellow-500 border-gray-300 rounded focus:ring-yellow-500 cursor-pointer"
            />
            <span className="text-sm font-medium text-gray-700">
              Shipping address is the same as billing address
            </span>
          </label>
        </div>

        {/* Shipping Address Section (Conditional) */}
        {!sameAsBilling && (
          <>
            <div className="md:col-span-2 mt-4">
              <h3 className="text-lg font-semibold text-gray-700 mb-3 border-b pb-2">Shipping Address</h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
              <input
                type="text"
                value={effectiveShipping?.company || ''}
                onChange={(e) => handleShippingChange('company', e.target.value)}
                className={INPUT_CLASS}
                placeholder="Enter company name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={effectiveShipping?.phone || ''}
                onChange={(e) => handleShippingChange('phone', e.target.value)}
                className={INPUT_CLASS}
                placeholder="Enter phone number"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
              <input
                type="text"
                value={effectiveShipping?.address || ''}
                onChange={(e) => handleShippingChange('address', e.target.value)}
                className={INPUT_CLASS}
                placeholder="Enter street address"
                required={!sameAsBilling}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Suburb *</label>
              <input
                type="text"
                value={effectiveShipping?.suburb || ''}
                onChange={(e) => handleShippingChange('suburb', e.target.value)}
                className={INPUT_CLASS}
                placeholder="Enter suburb"
                required={!sameAsBilling}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                <input
                  type="text"
                  value={effectiveShipping?.state || ''}
                  onChange={(e) => handleShippingChange('state', e.target.value)}
                  className={INPUT_CLASS}
                  placeholder="State"
                  required={!sameAsBilling}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Postcode *</label>
                <input
                  type="text"
                  value={effectiveShipping?.postcode || ''}
                  onChange={(e) => handleShippingChange('postcode', e.target.value)}
                  className={INPUT_CLASS}
                  placeholder="Postcode"
                  required={!sameAsBilling}
                />
              </div>
            </div>
          </>
        )}

        {/* Invoice / Quote Details */}
        <div className="md:col-span-2 mt-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-3 border-b pb-2">
            {isQuoteMode ? 'Quote Details' : 'Invoice Details'}
          </h3>
        </div>

        {/* Manual Date Entry */}
        <div className="md:col-span-2">
          <label className="flex items-center space-x-3 cursor-pointer mb-3">
            <input
              type="checkbox"
              checked={isManualDateEnabled}
              onChange={(e) => handleManualDateToggle(e.target.checked)}
              className="w-5 h-5 text-yellow-500 border-gray-300 rounded focus:ring-yellow-500 cursor-pointer"
            />
            <span className="text-sm font-medium text-gray-700">
              Enter {isQuoteMode ? 'quote' : 'invoice'} date manually
            </span>
          </label>
          {isManualDateEnabled && (
            <div className="ml-8">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isQuoteMode ? 'Quote' : 'Invoice'} Date *
              </label>
              <input
                type="date"
                value={manualDate || ''}
                onChange={(e) => onManualDateChange && onManualDateChange(e.target.value)}
                className={INPUT_CLASS}
                required
              />
            </div>
          )}
        </div>

        <div className="col-span-1 md:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            P.O. Number (Optional)
          </label>
          <input
            type="text"
            value={poNumber}
            onChange={(e) => onPONumberChange(e.target.value)}
            placeholder="Leave empty for N/A"
            className={INPUT_CLASS}
          />
        </div>

        {/* Payment Terms (invoice) OR Quote Valid For (quote) */}
        <div className="col-span-1 md:col-span-1">
          {isQuoteMode ? (
            <>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quote Valid For *
              </label>
              <select
                value={quoteValidFor}
                onChange={(e) => onQuoteValidForChange && onQuoteValidForChange(e.target.value as QuoteValidityTerm)}
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent bg-white"
                style={{ minHeight: '52px', fontSize: '16px' }}
                required
              >
                {QUOTE_VALIDITY_TERMS.map((term: QuoteValidityTerm) => (
                  <option key={term} value={term} style={{ fontSize: '16px' }}>{term}</option>
                ))}
              </select>

              <div className="mt-3">
                <label className="flex items-center space-x-3 cursor-pointer mb-2">
                  <input
                    type="checkbox"
                    checked={isManualExpiryEnabled}
                    onChange={(e) => handleManualExpiryToggle(e.target.checked)}
                    className="w-5 h-5 text-yellow-500 border-gray-300 rounded focus:ring-yellow-500 cursor-pointer"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Enter expiry date manually
                  </span>
                </label>
                {isManualExpiryEnabled && (
                  <div className="ml-8">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expiry Date *
                    </label>
                    <input
                      type="date"
                      value={manualExpiryDate || ''}
                      onChange={(e) => onManualExpiryDateChange && onManualExpiryDateChange(e.target.value)}
                      className={INPUT_CLASS}
                      required
                    />
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Terms *
              </label>
              <select
                value={paymentTerms}
                onChange={(e) => onPaymentTermsChange(e.target.value as PaymentTerm)}
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent bg-white"
                style={{ minHeight: '52px', fontSize: '16px' }}
                required
              >
                {PAYMENT_TERMS.map((term: PaymentTerm) => (
                  <option key={term} value={term} style={{ fontSize: '16px' }}>{term}</option>
                ))}
              </select>
            </>
          )}
        </div>

        <div className="col-span-1 md:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Discount % (Optional)
          </label>
          <input
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={discount === 0 ? '' : discount}
            onChange={(e) =>
              onDiscountChange(
                e.target.value === '' ? 0 : Math.min(100, Math.max(0, parseFloat(e.target.value)))
              )
            }
            placeholder="Enter discount percentage (e.g., 10)"
            className={INPUT_CLASS}
          />
        </div>

        <div className="col-span-1 md:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Shipping Charges *
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={shippingCharge < 0 ? '' : shippingCharge}
            onChange={(e) =>
              onShippingChargeChange(e.target.value === '' ? -1 : Math.max(0, parseFloat(e.target.value)))
            }
            placeholder="Enter 0 for Free"
            className={INPUT_CLASS}
            required
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            rows={3}
            placeholder="Additional notes, special instructions, etc."
            className={INPUT_CLASS}
          />
        </div>
      </div>
    </div>
  );
}