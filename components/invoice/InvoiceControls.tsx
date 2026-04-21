// components/invoice/InvoiceControls.tsx

import React, { useState } from 'react';
import { useRouter } from 'next/router';

interface InvoiceControlsProps {
  onGenerate: () => void;
  onGenerateAnother: () => void;
  canGenerate: boolean;
  hasGenerated: boolean;
  customerEmail: string;
  lastGeneratedInvoice?: any; // The invoice data from last generation
}

export default function InvoiceControls({ 
  onGenerate, 
  onGenerateAnother, 
  canGenerate,
  hasGenerated,
  customerEmail,
  lastGeneratedInvoice
}: InvoiceControlsProps) {
  const router = useRouter();
  const [isEmailSending, setIsEmailSending] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Email validation
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const canEmail = hasGenerated && isValidEmail(customerEmail) && lastGeneratedInvoice;

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
      // Get the PDF from jsPDF
      const { generateInvoicePDF } = await import('../../lib/invoice');
      const pdf = generateInvoicePDF(lastGeneratedInvoice);
      
      // Convert PDF to base64
      const pdfBlob = pdf.output('blob');
      const reader = new FileReader();
      
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        
        // ============================================================================
        // EXTRACT CUSTOM ORDER PDFs FROM LOCALSTORAGE CART
        // ============================================================================
        const customOrderPdfs: any[] = [];
        
        try {
          const cartData = localStorage.getItem('shopping-cart');
          if (cartData) {
            const cartObject = JSON.parse(cartData);
            const cartItems = cartObject.items || [];
            
            // Extract PDFs from PWA orders (Hose360)
            const pwaOrders = cartItems.filter((item: any) => item.type === 'pwa_order' && item.pdfDataUrl);
            pwaOrders.forEach((order: any) => {
              customOrderPdfs.push({
                type: 'pwa_order',
                name: `HOSE360-${order.cartId || 'order'}.pdf`,
                pdfDataUrl: order.pdfDataUrl,
                cartId: order.cartId
              });
            });
            
            // Extract PDFs from Trac360 orders
            const trac360Orders = cartItems.filter((item: any) => item.type === 'trac360_order' && item.pdfDataUrl);
            trac360Orders.forEach((order: any) => {
              customOrderPdfs.push({
                type: 'trac360_order',
                name: `TRAC360-${order.cartId || 'order'}.pdf`,
                pdfDataUrl: order.pdfDataUrl,
                cartId: order.cartId
              });
            });
            
            // Extract PDFs from Function360 orders
            const function360Orders = cartItems.filter((item: any) => item.type === 'function360_order' && item.pdfDataUrl);
            function360Orders.forEach((order: any) => {
              customOrderPdfs.push({
                type: 'function360_order',
                name: `FUNCTION360-${order.cartId || 'order'}.pdf`,
                pdfDataUrl: order.pdfDataUrl,
                cartId: order.cartId
              });
            });
            
            if (customOrderPdfs.length > 0) {
              console.log(`📎 Found ${customOrderPdfs.length} custom order PDF(s) to attach`);
            }
          }
        } catch (error) {
          console.warn('Could not extract custom order PDFs from cart:', error);
          // Continue anyway - invoice email can still be sent without them
        }
        
        // Prepare email payload
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
        
        const emailPayload = {
          type: 'invoice',
          invoiceData: lastGeneratedInvoice,
          pdfData: base64data,
          customerEmail: customerEmail,
          customOrderPdfs: customOrderPdfs.length > 0 ? customOrderPdfs : undefined
        };

        const response = await fetch(`${API_BASE_URL}/api/send-cart-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(emailPayload)
        });

        const result = await response.json();

        if (response.ok && result.success) {
          // Redirect to success page
          router.push('/email-success?type=invoice');
        } else {
          throw new Error(result.error || 'Failed to send invoice email');
        }
      };
      
      reader.readAsDataURL(pdfBlob);
      
    } catch (error: any) {
      console.error('Invoice email error:', error);
      alert(`Failed to send invoice email: ${error.message}`);
      setIsEmailSending(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {!hasGenerated ? (
            <button
              onClick={onGenerate}
              disabled={!canGenerate}
              className={`cursor-pointer transition-all duration-300 inline-block font-bold text-lg ${
                !canGenerate ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              style={{
                padding: "16px 32px",
                borderRadius: "40px",
                minWidth: "220px",
                background: canGenerate 
                  ? "radial-gradient(ellipse at center, rgba(250, 204, 21, 0.9) 20%, rgba(250, 204, 21, 0.7) 60%, rgba(255, 215, 0, 0.8) 100%), rgba(250, 204, 21, 0.6)"
                  : "rgba(229, 231, 235, 0.5)",
                backdropFilter: canGenerate ? "blur(15px)" : "none",
                border: canGenerate ? "1px solid rgba(255, 215, 0, 0.9)" : "1px solid rgba(209, 213, 219, 0.5)",
                color: canGenerate ? "#000" : "#9CA3AF",
                boxShadow: canGenerate 
                  ? "0 10px 30px rgba(250, 204, 21, 0.6), inset 0 2px 0 rgba(255, 255, 255, 0.8), inset 0 3px 10px rgba(255, 255, 255, 0.4), inset 0 -1px 0 rgba(255, 215, 0, 0.4)"
                  : "none"
              }}
              onMouseEnter={(e) => {
                if (canGenerate) {
                  e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
                  e.currentTarget.style.boxShadow = "0 15px 40px rgba(250, 204, 21, 0.7), inset 0 2px 0 rgba(255, 255, 255, 0.9), inset 0 4px 12px rgba(255, 255, 255, 0.5), inset 0 -1px 0 rgba(255, 215, 0, 0.5)";
                }
              }}
              onMouseLeave={(e) => {
                if (canGenerate) {
                  e.currentTarget.style.transform = "translateY(0px) scale(1)";
                  e.currentTarget.style.boxShadow = "0 10px 30px rgba(250, 204, 21, 0.6), inset 0 2px 0 rgba(255, 255, 255, 0.8), inset 0 3px 10px rgba(255, 255, 255, 0.4), inset 0 -1px 0 rgba(255, 215, 0, 0.4)";
                }
              }}
            >
              Generate Invoice PDF
            </button>
          ) : (
            <>
              <button
                onClick={onGenerateAnother}
                className="cursor-pointer transition-all duration-300 inline-block font-bold text-lg"
                style={{
                  padding: "16px 32px",
                  borderRadius: "40px",
                  minWidth: "220px",
                  background: "radial-gradient(ellipse at center, rgba(250, 204, 21, 0.9) 20%, rgba(250, 204, 21, 0.7) 60%, rgba(255, 215, 0, 0.8) 100%), rgba(250, 204, 21, 0.6)",
                  backdropFilter: "blur(15px)",
                  border: "1px solid rgba(255, 215, 0, 0.9)",
                  color: "#000",
                  boxShadow: "0 10px 30px rgba(250, 204, 21, 0.6), inset 0 2px 0 rgba(255, 255, 255, 0.8), inset 0 3px 10px rgba(255, 255, 255, 0.4), inset 0 -1px 0 rgba(255, 215, 0, 0.4)"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
                  e.currentTarget.style.boxShadow = "0 15px 40px rgba(250, 204, 21, 0.7), inset 0 2px 0 rgba(255, 255, 255, 0.9), inset 0 4px 12px rgba(255, 255, 255, 0.5), inset 0 -1px 0 rgba(255, 215, 0, 0.5)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0px) scale(1)";
                  e.currentTarget.style.boxShadow = "0 10px 30px rgba(250, 204, 21, 0.6), inset 0 2px 0 rgba(255, 255, 255, 0.8), inset 0 3px 10px rgba(255, 255, 255, 0.4), inset 0 -1px 0 rgba(255, 215, 0, 0.4)";
                }}
              >
                Generate Another Invoice
              </button>

              <button
                onClick={handleEmailClick}
                disabled={!canEmail || isEmailSending}
                className={`cursor-pointer transition-all duration-300 inline-block font-bold text-lg ${
                  (!canEmail || isEmailSending) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                style={{
                  padding: "16px 32px",
                  borderRadius: "40px",
                  minWidth: "220px",
                  background: (canEmail && !isEmailSending)
                    ? "radial-gradient(ellipse at center, rgba(59, 130, 246, 0.9) 20%, rgba(59, 130, 246, 0.7) 60%, rgba(96, 165, 250, 0.8) 100%), rgba(59, 130, 246, 0.6)"
                    : "rgba(229, 231, 235, 0.5)",
                  backdropFilter: (canEmail && !isEmailSending) ? "blur(15px)" : "none",
                  border: (canEmail && !isEmailSending) ? "1px solid rgba(59, 130, 246, 0.9)" : "1px solid rgba(209, 213, 219, 0.5)",
                  color: (canEmail && !isEmailSending) ? "#fff" : "#9CA3AF",
                  boxShadow: (canEmail && !isEmailSending)
                    ? "0 10px 30px rgba(59, 130, 246, 0.6), inset 0 2px 0 rgba(255, 255, 255, 0.3), inset 0 3px 10px rgba(255, 255, 255, 0.2)"
                    : "none"
                }}
                onMouseEnter={(e) => {
                  if (canEmail && !isEmailSending) {
                    e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
                    e.currentTarget.style.boxShadow = "0 15px 40px rgba(59, 130, 246, 0.7), inset 0 2px 0 rgba(255, 255, 255, 0.4), inset 0 4px 12px rgba(255, 255, 255, 0.3)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (canEmail && !isEmailSending) {
                    e.currentTarget.style.transform = "translateY(0px) scale(1)";
                    e.currentTarget.style.boxShadow = "0 10px 30px rgba(59, 130, 246, 0.6), inset 0 2px 0 rgba(255, 255, 255, 0.3), inset 0 3px 10px rgba(255, 255, 255, 0.2)";
                  }
                }}
              >
                {isEmailSending ? '📧 Sending...' : '📧 Email Invoice to Customer'}
              </button>
            </>
          )}
        </div>

        {!canGenerate && !hasGenerated && (
          <p className="text-center text-sm text-red-600 mt-4">
            Please fill in all required customer details to generate invoice
          </p>
        )}

        {hasGenerated && !isValidEmail(customerEmail) && (
          <p className="text-center text-sm text-orange-600 mt-4">
            ⚠️ Please provide a valid email address to enable invoice emailing
          </p>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              📧 Confirm Email Delivery
            </h3>
            <p className="text-gray-700 mb-2">
              Send invoice to:
            </p>
            <p className="text-blue-600 font-semibold mb-4 text-lg">
              {customerEmail}
            </p>
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
                ✅ Send Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}