// components/invoice/QuoteControls.tsx

import React, { useState } from 'react';
import { useRouter } from 'next/router';

interface QuoteControlsProps {
  onGenerate: () => void;
  onGenerateAnother: () => void;
  canGenerate: boolean;
  hasGenerated: boolean;
  customerEmail: string;
  lastGeneratedQuote?: any;
  onSyncToTracker: () => Promise<void>;
}

export default function QuoteControls({
  onGenerate,
  onGenerateAnother,
  canGenerate,
  hasGenerated,
  customerEmail,
  lastGeneratedQuote,
  onSyncToTracker
}: QuoteControlsProps) {
  const router = useRouter();
  const [isEmailSending, setIsEmailSending] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const canEmail = hasGenerated && isValidEmail(customerEmail) && lastGeneratedQuote;

  const handleSyncClick = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      await onSyncToTracker();
    } finally {
      setIsSyncing(false);
    }
  };

  const handleEmailClick = () => {
    if (!canEmail) {
      alert('Please ensure a valid email address is provided in customer details.');
      return;
    }
    setShowConfirmModal(true);
  };

  const handleConfirmEmail = async () => {
    setShowConfirmModal(false);
    setIsEmailSending(true);

    try {
      const { generateQuotePDF } = await import('../../lib/invoice');
      const pdf = generateQuotePDF(lastGeneratedQuote);

      const pdfBlob = pdf.output('blob');
      const reader = new FileReader();

      reader.onloadend = async () => {
        const base64data = reader.result as string;

        const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

        const emailPayload = {
          type: 'quote',
          quoteData: lastGeneratedQuote,
          pdfData: base64data,
          customerEmail: customerEmail,
        };

        const response = await fetch(`${API_BASE_URL}/api/send-cart-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(emailPayload)
        });

        const result = await response.json();

        if (response.ok && result.success) {
          // Write quote to Google Sheets tracking
          try {
            const sheetResponse = await fetch('/api/quotes/create', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ quoteData: lastGeneratedQuote })
            });
            const sheetResult = await sheetResponse.json();
            if (!sheetResponse.ok || !sheetResult.success) {
              alert('⚠️ Quote emailed successfully, but failed to save to the tracking sheet. Please add it manually.');
            }
          } catch {
            alert('⚠️ Quote emailed successfully, but failed to save to the tracking sheet. Please add it manually.');
          }
          router.push('/email-success?type=quote');
        } else {
          throw new Error(result.error || 'Failed to send quote email');
        }
      };

      reader.readAsDataURL(pdfBlob);

    } catch (error: any) {
      console.error('Quote email error:', error);
      alert(`Failed to send quote email: ${error.message}`);
      setIsEmailSending(false);
    }
  };

  // Shared button style helpers
  const activeStyle = (r: number, g: number, b: number) => ({
    padding: '14px 24px',
    borderRadius: '40px',
    flex: '1 1 0' as const,
    minWidth: '0',
    background: `radial-gradient(ellipse at center, rgba(${r},${g},${b},0.9) 20%, rgba(${r},${g},${b},0.7) 60%, rgba(${r},${g},${b},0.8) 100%)`,
    backdropFilter: 'blur(15px)',
    border: `1px solid rgba(${r},${g},${b},0.9)`,
    color: r > 200 ? '#000' : '#fff',
    boxShadow: `0 10px 30px rgba(${r},${g},${b},0.5), inset 0 2px 0 rgba(255,255,255,0.3), inset 0 3px 10px rgba(255,255,255,0.2)`
  });

  const disabledStyle = {
    padding: '14px 24px',
    borderRadius: '40px',
    flex: '1 1 0' as const,
    minWidth: '0',
    background: 'rgba(229, 231, 235, 0.5)',
    backdropFilter: 'none',
    border: '1px solid rgba(209, 213, 219, 0.5)',
    color: '#9CA3AF',
    boxShadow: 'none'
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {!hasGenerated ? (
            <button
              onClick={onGenerate}
              disabled={!canGenerate}
              className={`cursor-pointer transition-all duration-300 inline-block font-bold text-base ${!canGenerate ? 'opacity-50 cursor-not-allowed' : ''}`}
              style={canGenerate ? activeStyle(250, 204, 21) : disabledStyle}
              onMouseEnter={e => {
                if (canGenerate) {
                  e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                }
              }}
              onMouseLeave={e => {
                if (canGenerate) {
                  e.currentTarget.style.transform = 'translateY(0px) scale(1)';
                }
              }}
            >
              Generate Quote PDF
            </button>
          ) : (
            <>
              <button
                onClick={onGenerateAnother}
                className="cursor-pointer transition-all duration-300 inline-block font-bold text-base"
                style={activeStyle(250, 204, 21)}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0px) scale(1)'; }}
              >
                Generate Another Quote
              </button>

              <button
                onClick={handleSyncClick}
                disabled={isSyncing || !lastGeneratedQuote}
                className={`cursor-pointer transition-all duration-300 inline-block font-bold text-base ${(isSyncing || !lastGeneratedQuote) ? 'opacity-50 cursor-not-allowed' : ''}`}
                style={(!isSyncing && lastGeneratedQuote) ? activeStyle(16, 185, 129) : disabledStyle}
                onMouseEnter={e => {
                  if (!isSyncing && lastGeneratedQuote) e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                }}
                onMouseLeave={e => {
                  if (!isSyncing && lastGeneratedQuote) e.currentTarget.style.transform = 'translateY(0px) scale(1)';
                }}
              >
                {isSyncing ? '🔄 Syncing...' : '🔄 Sync to Quote Tracker'}
              </button>

              <button
                onClick={handleEmailClick}
                disabled={!canEmail || isEmailSending}
                className={`cursor-pointer transition-all duration-300 inline-block font-bold text-base ${(!canEmail || isEmailSending) ? 'opacity-50 cursor-not-allowed' : ''}`}
                style={(canEmail && !isEmailSending) ? activeStyle(59, 130, 246) : disabledStyle}
                onMouseEnter={e => {
                  if (canEmail && !isEmailSending) e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                }}
                onMouseLeave={e => {
                  if (canEmail && !isEmailSending) e.currentTarget.style.transform = 'translateY(0px) scale(1)';
                }}
              >
                {isEmailSending ? '📧 Sending...' : '📧 Email Quote to Customer'}
              </button>
            </>
          )}
        </div>

        {!canGenerate && !hasGenerated && (
          <p className="text-center text-sm text-red-600 mt-4">
            Please fill in all required customer details to generate quote
          </p>
        )}

        {hasGenerated && !isValidEmail(customerEmail) && (
          <p className="text-center text-sm text-orange-600 mt-4">
            ⚠️ Please provide a valid email address to enable quote emailing
          </p>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              📧 Confirm Quote Delivery
            </h3>
            <p className="text-gray-700 mb-2">Send quotation to:</p>
            <p className="text-blue-600 font-semibold mb-4 text-lg">{customerEmail}</p>
            <p className="text-sm text-gray-600 mb-6">
              A copy will also be sent to your business email for record keeping.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmEmail}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                ✅ Send Quote
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}