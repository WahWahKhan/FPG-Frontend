// components/invoice/CustomerDetailsForm.tsx

import React, { useState } from 'react';
import { InvoiceCustomer, InvoiceShippingAddress, PAYMENT_TERMS, PaymentTerm } from '../../lib/invoice';
import AutocompleteInput from './AutocompleteInput';
import { CustomerSuggestion } from '../../pages/api/invoices/get-customers';

interface CustomerDetailsFormProps {
  customer: InvoiceCustomer;
  shippingAddress?: InvoiceShippingAddress | null;
  poNumber: string;
  paymentTerms: PaymentTerm;
  discount: number;
  notes: string;
  onCustomerChange: (customer: InvoiceCustomer) => void;
  onShippingAddressChange?: (shipping: InvoiceShippingAddress | null) => void;
  onPONumberChange: (po: string) => void;
  onPaymentTermsChange: (terms: PaymentTerm) => void;
  onDiscountChange: (discount: number) => void;
  onNotesChange: (notes: string) => void;
}

const INPUT_CLASS =
  'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent';

export default function CustomerDetailsForm({
  customer,
  shippingAddress: propShippingAddress,
  poNumber,
  paymentTerms,
  discount,
  notes,
  onCustomerChange,
  onShippingAddressChange,
  onPONumberChange,
  onPaymentTermsChange,
  onDiscountChange,
  onNotesChange
}: CustomerDetailsFormProps) {
  const [sameAsBilling, setSameAsBilling] = useState(!propShippingAddress);

  const [internalShipping, setInternalShipping] = useState<InvoiceShippingAddress | null>(null);

  const effectiveShipping = onShippingAddressChange ? propShippingAddress : internalShipping;
  const setShipping = onShippingAddressChange || setInternalShipping;

  const handleInputChange = (field: keyof InvoiceCustomer, value: string) => {
    onCustomerChange({ ...customer, [field]: value });
  };

  // Called when user selects a suggestion — fills all customer fields at once
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
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email *
          </label>
          <input
            type="email"
            value={customer.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className={INPUT_CLASS}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone *
          </label>
          <input
            type="tel"
            value={customer.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            className={INPUT_CLASS}
            required
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Address *
          </label>
          <input
            type="text"
            value={customer.address}
            onChange={(e) => handleInputChange('address', e.target.value)}
            className={INPUT_CLASS}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Suburb *
          </label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              State *
            </label>
            <input
              type="text"
              value={customer.state}
              onChange={(e) => handleInputChange('state', e.target.value)}
              className={INPUT_CLASS}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Postcode *
            </label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Name
              </label>
              <input
                type="text"
                value={effectiveShipping?.company || ''}
                onChange={(e) => handleShippingChange('company', e.target.value)}
                className={INPUT_CLASS}
                placeholder="Enter company name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={effectiveShipping?.phone || ''}
                onChange={(e) => handleShippingChange('phone', e.target.value)}
                className={INPUT_CLASS}
                placeholder="Enter phone number"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address *
              </label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Suburb *
              </label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State *
                </label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Postcode *
                </label>
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

        {/* Invoice Details */}
        <div className="md:col-span-2 mt-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-3 border-b pb-2">Invoice Details</h3>
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

        <div className="col-span-1 md:col-span-1">
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
            {PAYMENT_TERMS.map(term => (
              <option key={term} value={term} style={{ fontSize: '16px' }}>{term}</option>
            ))}
          </select>
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