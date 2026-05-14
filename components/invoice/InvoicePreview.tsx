// components/invoice/InvoicePreview.tsx

import React from 'react';
import { SupplierInvoiceData } from '../../lib/invoice';
import { COMPANY_INFO } from '../../lib/invoice';

interface InvoicePreviewProps {
  invoiceData: SupplierInvoiceData;
}

export default function InvoicePreview({ invoiceData }: InvoicePreviewProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Invoice Preview</h2>
      
      <div className="border border-gray-300 rounded p-6 bg-gray-50">
        {/* Header */}
        <div className="flex justify-between mb-6 pb-4 border-b-2 border-gray-300">
          <div>
            <h3 className="text-xl font-bold text-gray-900">{COMPANY_INFO.name}</h3>
            <p className="text-sm text-gray-700 mt-1">{COMPANY_INFO.address.street}</p>
            <p className="text-sm text-gray-700">{COMPANY_INFO.address.suburb}, {COMPANY_INFO.address.state} {COMPANY_INFO.address.postcode}</p>
            <p className="text-sm text-gray-700 mt-1">ABN: {COMPANY_INFO.abn}</p>
          </div>
          <div className="text-right">
            <h3 className="text-3xl font-bold text-gray-900">INVOICE</h3>
            <p className="text-sm text-gray-700 mt-2">#{invoiceData.invoiceNumber}</p>
            <p className="text-sm text-gray-700">Date: {invoiceData.invoiceDate}</p>
            <p className="text-sm text-gray-700">Due: {invoiceData.dueDate}</p>
            {invoiceData.poNumber && invoiceData.poNumber !== 'N/A' && (
              <p className="text-sm text-gray-700">P.O.: {invoiceData.poNumber}</p>
            )}
          </div>
        </div>

        {/* Customer Details */}
        <div className="mb-6">
          <h4 className="text-sm font-bold text-gray-800 mb-2">BILL TO:</h4>
          <p className="text-sm text-gray-700">{invoiceData.customer.name}</p>
          {invoiceData.customer.company && <p className="text-sm text-gray-700">{invoiceData.customer.company}</p>}
          <p className="text-sm text-gray-700">{invoiceData.customer.address}</p>
          <p className="text-sm text-gray-700">{invoiceData.customer.suburb}, {invoiceData.customer.state} {invoiceData.customer.postcode}</p>
        </div>

        {/* Items Table */}
        <table className="w-full mb-6">
          <thead className="bg-yellow-100 border-b-2 border-yellow-500">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-800">Product</th>
              <th className="px-4 py-2 text-center text-sm font-semibold text-gray-800">Qty</th>
              <th className="px-4 py-2 text-right text-sm font-semibold text-gray-800">Price</th>
              <th className="px-4 py-2 text-right text-sm font-semibold text-gray-800">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {invoiceData.items.map((item, index) => (
              <React.Fragment key={index}>
                <tr className="border-b border-gray-200">
                  <td className="px-4 py-2 align-top">
                    <div className="text-sm font-medium text-gray-800">{item.name}</div>
                    {item.description && item.description.trim() && (
                      <div className="text-xs text-gray-500 italic mt-1 whitespace-pre-wrap">
                        {item.description}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2 text-center text-sm text-gray-700 align-top">{item.quantity}</td>
                  <td className="px-4 py-2 text-right text-sm text-gray-700 align-top">${item.unitPrice.toFixed(2)}</td>
                  <td className="px-4 py-2 text-right text-sm text-gray-700 align-top">${item.subtotal.toFixed(2)}</td>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-64">
            <div className="flex justify-between py-1 text-sm">
              <span className="text-gray-700">Subtotal:</span>
              <span className="font-semibold text-gray-900">${invoiceData.subtotal.toFixed(2)}</span>
            </div>
            {invoiceData.discount > 0 && (
              <div className="flex justify-between py-1 text-sm">
                <span className="text-gray-700">Discount ({invoiceData.discount}%):</span>
                <span className="font-semibold text-red-600">-${invoiceData.discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between py-1 text-sm">
              <span className="text-gray-700">Shipping:</span>
              <span className="font-semibold text-gray-900">
                {invoiceData.shippingCharge === 0 ? 'Free' : `$${invoiceData.shippingCharge.toFixed(2)}`}
              </span>
            </div>
            <div className="flex justify-between py-1 text-sm">
              <span className="text-gray-700">GST (10%):</span>
              <span className="font-semibold text-gray-900">${invoiceData.gst.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2 border-t-2 border-gray-300 mt-2 text-lg">
              <span className="font-bold text-gray-900">TOTAL:</span>
              <span className="font-bold text-gray-900">${invoiceData.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-300 grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-bold text-gray-800 mb-1">Payment Details:</h4>
            <p className="text-xs text-gray-700">Account: {COMPANY_INFO.bankDetails.accountName}</p>
            <p className="text-xs text-gray-700">BSB: {COMPANY_INFO.bankDetails.bsb}</p>
            <p className="text-xs text-gray-700">Account: {COMPANY_INFO.bankDetails.accountNumber}</p>
            <p className="text-xs text-gray-700 mt-1">Terms: {invoiceData.paymentTerms}</p>
          </div>
          {invoiceData.notes && (
            <div>
              <h4 className="text-sm font-bold text-gray-800 mb-1">Notes:</h4>
              <p className="text-xs text-gray-700">{invoiceData.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}