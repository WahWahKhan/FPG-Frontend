// components/shared/PDFModal.tsx
// REFACTOR PHASE 1 - EXTRACTED FROM checkout.tsx
// Desktop-only in-page PDF viewer modal.
//
// Mobile is deliberately NOT handled here. It used to be (a useEffect here
// called window.open() when isMobile), but window.open() only reliably
// bypasses the browser's popup blocker when called SYNCHRONOUSLY inside the
// click handler that triggered it - routing it through setState + a
// useEffect (as this component did) put it outside that synchronous
// user-gesture call stack, so Safari silently blocked it on iOS with no
// visible error (looked like "needs a second tap" - it never actually
// opened the first time). The caller (pages/checkout.tsx::handleViewPDF)
// now opens the PDF directly, synchronously, on mobile, and never opens
// this modal in that case - same pattern already used correctly in
// ItemCart.tsx and order-confirmation.tsx. This component only needs to
// handle the desktop path now.

import { createPortal } from 'react-dom';
import { FiX } from 'react-icons/fi';

interface PDFModalProps {
  isOpen: boolean;
  pdfUrl: string;
  onClose: () => void;
  title?: string;
}

export default function PDFModal({
  isOpen,
  pdfUrl,
  onClose,
  title = 'Custom Hose Assembly PDF'
}: PDFModalProps) {
  // Don't render if not open or no PDF
  if (!isOpen || !pdfUrl) return null;

  // Only render modal on desktop
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{
        background: "rgba(0, 0, 0, 0.7)",
        backdropFilter: "blur(4px)"
      }}
      onClick={onClose}
    >
      <div
        className="relative w-11/12 h-5/6 bg-white rounded-lg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 transition-all duration-200 flex items-center justify-center"
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "8px",
            border: "1px solid rgba(220, 38, 38, 0.3)",
            background: "rgba(254, 226, 226, 0.8)",
            color: "#dc2626",
            cursor: "pointer"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)";
            e.currentTarget.style.borderColor = "rgba(220, 38, 38, 0.5)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(254, 226, 226, 0.8)";
            e.currentTarget.style.borderColor = "rgba(220, 38, 38, 0.3)";
          }}
          aria-label="Close PDF viewer"
        >
          <div
            style={{
              width: "20px",
              height: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <FiX style={{ width: "100%", height: "100%" }} />
          </div>
        </button>

        {/* PDF viewer */}
        <object
          data={pdfUrl}
          type="application/pdf"
          className="w-full h-full"
          style={{ border: "none" }}
        >
          {/* Fallback for browsers that can't display PDFs */}
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <p className="mb-4 text-gray-700">
              Unable to display PDF in browser.
            </p>

            <a
              href={pdfUrl}
              download={title.toLowerCase().replace(/\s+/g, '-') + '.pdf'}
              className="px-6 py-3 rounded-lg font-semibold transition-all"
              style={{
                background:
                  "radial-gradient(ellipse at center, rgba(250, 204, 21, 0.9) 20%, rgba(250, 204, 21, 0.7) 60%, rgba(255, 215, 0, 0.8) 100%), rgba(250, 204, 21, 0.6)",
                border: "1px solid rgba(255, 215, 0, 0.9)",
                color: "#000"
              }}
            >
              Download PDF
            </a>
          </div>
        </object>
      </div>
    </div>,
    document.body
  );
}