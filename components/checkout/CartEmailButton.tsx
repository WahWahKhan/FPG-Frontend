// components/checkout/CartEmailButton.tsx

import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { API_BASE_URL } from '../../lib/checkout/checkout-config';

interface CartEmailButtonProps {
  items: any[];  // Simplified - no need for IItemCart in frontend
  userDetails: {
    name: string;
    email: string;
    phone: string;
    address: string;
    suburb: string;
    state: string;
    postcode: string;
    companyName?: string;
  };
}

export default function CartEmailButton({ items, userDetails }: CartEmailButtonProps) {
  const router = useRouter();
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [sendCopyToCustomer, setSendCopyToCustomer] = useState(false);
  const [message, setMessage] = useState('');

  const handleSendCart = async () => {
    setIsSending(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/send-cart-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
          // âœ… NO server key - backend will check CORS like capture-order does
        },
        body: JSON.stringify({
          items,
          userDetails,
          sendCopyToCustomer,
          message
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        localStorage.removeItem('shopping-cart');
        router.push('/email-success?type=cart');
      } else {
        throw new Error(result.error || 'Failed to send cart email');
      }
    } catch (err: any) {
      console.error('Cart email error:', err);
      setError(err.message || 'Failed to send cart. Please try again.');
      setIsSending(false);
    }
  };

  return (
    <div>
      {/* Message Field */}
      <div className="mb-4">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          What do you need help with? (Optional)
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="E.g., I need assistance with pricing, product selection, or have questions about my cart..."
          rows={4}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none"
          disabled={isSending}
        />
        <p className="text-xs text-gray-500 mt-1">
          Let us know how we can help you complete this order
        </p>
      </div>

      {/* Checkbox */}
      <div className="mb-6">
        <label className="flex items-center space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={sendCopyToCustomer}
            onChange={(e) => setSendCopyToCustomer(e.target.checked)}
            disabled={isSending}
            className="w-5 h-5 text-yellow-500 border-gray-300 rounded focus:ring-yellow-500 cursor-pointer"
          />
          <span className="text-sm font-medium text-gray-700">
            Send me a copy of this cart email
          </span>
        </label>
      </div>

      {/* Send Button */}
      <button
        onClick={handleSendCart}
        disabled={isSending}
        className="w-full cursor-pointer transition-all duration-300 inline-block font-bold text-lg"
        style={{
          padding: "16px 32px",
          borderRadius: "40px",
          background: isSending
            ? "rgba(229, 231, 235, 0.5)"
            : "radial-gradient(ellipse at center, rgba(250, 204, 21, 0.9) 20%, rgba(250, 204, 21, 0.7) 60%, rgba(255, 215, 0, 0.8) 100%), rgba(250, 204, 21, 0.6)",
          backdropFilter: isSending ? "none" : "blur(15px)",
          border: isSending 
            ? "1px solid rgba(209, 213, 219, 0.5)" 
            : "1px solid rgba(255, 215, 0, 0.9)",
          color: isSending ? "#9CA3AF" : "#000",
          boxShadow: isSending
            ? "none"
            : "0 10px 30px rgba(250, 204, 21, 0.6), inset 0 2px 0 rgba(255, 255, 255, 0.8), inset 0 3px 10px rgba(255, 255, 255, 0.4), inset 0 -1px 0 rgba(255, 215, 0, 0.4)",
          opacity: isSending ? 0.5 : 1
        }}
        onMouseEnter={(e) => {
          if (!isSending) {
            e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
            e.currentTarget.style.boxShadow = "0 15px 40px rgba(250, 204, 21, 0.7), inset 0 2px 0 rgba(255, 255, 255, 0.9), inset 0 4px 12px rgba(255, 255, 255, 0.5), inset 0 -1px 0 rgba(255, 215, 0, 0.5)";
          }
        }}
        onMouseLeave={(e) => {
          if (!isSending) {
            e.currentTarget.style.transform = "translateY(0px) scale(1)";
            e.currentTarget.style.boxShadow = "0 10px 30px rgba(250, 204, 21, 0.6), inset 0 2px 0 rgba(255, 255, 255, 0.8), inset 0 3px 10px rgba(255, 255, 255, 0.4), inset 0 -1px 0 rgba(255, 215, 0, 0.4)";
          }
        }}
      >
        {isSending ? 'Sending Cart...' : 'Send Cart to Supplier'}
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-300 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}