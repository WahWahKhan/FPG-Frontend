/**
 * HOSE360 Step 11 (final) — Order Summary / Add to Cart.
 * Structure copied from pages/suite360/function360/summary.tsx
 * (html2canvas+jsPDF capture, 2-phase button UI), adapted to Hose360's
 * fields per 02_FRONTEND_PLAN.md Step F7 / DECISIONS.md §6.
 */

import React, { useState, useContext, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import Image from 'next/image';
import BackButton from '../../../components/Trac360/Shared/BackButton';
import GlassSecondaryButton from '../../../components/Tube360/GlassSecondaryButton';
import { useHose360 } from '../../../context/Hose360Context';
import { CartContext } from '../../../context/CartWrapper';
import { COLORS } from '../../../components/Trac360/styles';
import Hose360OptionsGate from '../../../components/Hose360/Layout/Hose360OptionsGate';
import OrderSummaryDisplay from '../../../components/Hose360/Shared/OrderSummaryDisplay';
import type { Hose360Options, Hose360PriceOrderConfig } from '../../../types/hose360';

function Hose360SummaryInner({ options }: { options: Hose360Options }) {
  const router = useRouter();
  const { config, resetConfig } = useHose360();
  const { addItem } = useContext(CartContext);
  const targetRef = useRef<HTMLDivElement>(null);

  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsHydrated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isHydrated) {
      const hasEssentialConfig = Boolean(config.selectedHose && config.end1Shape && config.end2Shape && config.cutLengths.length > 0);
      if (!hasEssentialConfig) {
        router.replace('/suite360/hose360');
      }
    }
  }, [config, router, isHydrated]);

  const handleBack = () => router.push('/suite360/hose360/pressure-testing');
  const handleBrowseProducts = () => router.push('/catalogue');
  const handleSuite360 = () => router.push('/suite360');
  const handlePlaceNewOrder = () => {
    resetConfig();
    router.push('/suite360/hose360');
  };

  const handleAddToCart = async () => {
    setIsAddingToCart(true);

    try {
      const originalElement = targetRef.current;
      if (!originalElement) throw new Error('PDF content element not found');

      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;

      // Round 3.8 — PDF quality. The OG (HoseCalculator/components/
      // PDFGenerator/WebPDFGenerator.js) captures the summary at its natural
      // size and makes a SINGLE page exactly that size, so nothing is ever
      // shrunk. We previously squeezed the capture onto an A4 page at 1.3x /
      // JPEG 0.7, which made long summaries small and soft. Now: same
      // natural-size single page as the OG, but rasterised at 2x and JPEG
      // 0.85 for crisp text (the OG's own scale-1/0.75 was chosen purely to
      // keep the file small; 2x/0.85 stays well under cart/email limits —
      // the resulting size is logged below).
      const CAPTURE_WIDTH = 560; // 520px card + 20px side padding each side
      const CAPTURE_SCALE = 2;
      const clone = originalElement.cloneNode(true) as HTMLElement;
      clone.style.position = 'fixed';
      clone.style.left = '-9999px';
      clone.style.top = '0';
      clone.style.minWidth = `${CAPTURE_WIDTH}px`;
      clone.style.width = `${CAPTURE_WIDTH}px`;
      clone.style.background = '#ffffff';
      clone.style.padding = '30px 20px';
      clone.style.zIndex = '-1000';
      clone.style.boxSizing = 'border-box';

      const hideInClone = clone.querySelectorAll('.pdf-hide-button');
      hideInClone.forEach((btn) => ((btn as HTMLElement).style.display = 'none'));

      document.body.appendChild(clone);
      await new Promise((resolve) => setTimeout(resolve, 100));

      const canvas = await html2canvas(clone, {
        scale: CAPTURE_SCALE,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowHeight: clone.scrollHeight,
        windowWidth: CAPTURE_WIDTH,
      });

      document.body.removeChild(clone);

      // Page = logical (1x) size of the capture; the image inside is the 2x
      // raster, so it stays sharp when zoomed/printed.
      const pageW = canvas.width / CAPTURE_SCALE;
      const pageH = canvas.height / CAPTURE_SCALE;
      const pdf = new jsPDF({
        orientation: pageH >= pageW ? 'portrait' : 'landscape',
        unit: 'px',
        format: [pageW, pageH],
        compress: true,
        hotfixes: ['px_scaling'],
      });
      const imgData = canvas.toDataURL('image/jpeg', 0.85);
      pdf.addImage(imgData, 'JPEG', 0, 0, pageW, pageH, undefined, 'FAST');
      const pdfDataUrl = pdf.output('dataurlstring');
      console.log(`[HOSE360] PDF built: ${canvas.width}x${canvas.height}px raster, ${(pdfDataUrl.length / 1024).toFixed(0)} KB`);

      // orderConfig carries both the price-less selections (whitelisted at
      // wire time by pickPwaSelections in lib/checkout/order-contract.ts)
      // AND display-only price fields, matching IItemCart['orderConfig'].
      const orderConfig: any = {
        selectedHose: config.selectedHose,
        end1Shape: config.end1Shape,
        end1Size: config.end1Size,
        end1Price: config.end1Price,
        end2Shape: config.end2Shape,
        end2Size: config.end2Size,
        end2Price: config.end2Price,
        selectedAngle: config.selectedAngle,
        quantity: config.quantity,
        cutLengths: config.cutLengths,
        selectedProtection: config.selectedProtection,
        selectedPressure: config.selectedPressure,
        isOrderFittingMode: false,
      };

      const cartItem = {
        id: 'hose-360',
        type: 'hose360_order' as const,
        name: 'HOSE360 Custom Order',
        totalPrice: config.totalPrice,
        quantity: 1,
        stock: 999,
        // Was hardcoded to a byte-identical copy of Function360's own Swell
        // image URL (only the filename was relabeled) — DECISIONS_ADDENDUM_2.md
        // §6. Fixed to point at the real local Hose360 asset already used on
        // the Suite360 landing tile.
        image: '/Hose360.png',
        pdfDataUrl,
        orderConfig,
        cartId: Date.now(),
      };

      addItem(cartItem);

      setAddedToCart(true);
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (error) {
      console.error('[HOSE360] Error adding to cart:', error);
      const clones = document.querySelectorAll('[style*="-9999px"]');
      clones.forEach((clone) => clone.parentNode && clone.parentNode.removeChild(clone));
      alert(`Failed to add item to cart: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsAddingToCart(false);
    }
  };

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p style={{ color: COLORS.grey.medium }}>Loading configuration...</p>
        </div>
      </div>
    );
  }

  const hasEssentialConfig = config.selectedHose && config.end1Shape && config.end2Shape && config.cutLengths.length > 0;
  if (!hasEssentialConfig) return null;

  return (
    <div className="min-h-screen pb-12">
      <BackButton onClick={handleBack} />

      <div className="max-w-4xl mx-auto px-4 pt-8">
        {/* PDF CAPTURE STARTS HERE */}
        <div ref={targetRef} style={{ background: '#ffffff', padding: '30px 20px' }}>
          <div className="flex justify-center mb-6">
            <div className="relative" style={{ width: '240px', height: '120px' }}>
              <Image src="/fluidpower_logo_transparent.gif" alt="Fluid Power Group" width={240} height={120} className="object-contain" unoptimized />
            </div>
          </div>

          <div className="mb-8" style={{ display: 'flex', justifyContent: 'center' }}>
            <div className="rounded-full text-white text-lg font-semibold" style={{ background: COLORS.grey.dark, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 52, padding: '0 32px', lineHeight: 1 }}>
              ORDER CONFIRMATION
            </div>
          </div>

          <OrderSummaryDisplay config={config} />
        </div>
        {/* PDF CAPTURE ENDS HERE */}

        {showSuccessMessage && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mt-6 mb-6">
            <div
              className="flex items-center justify-center gap-3 py-4 px-6 rounded-xl"
              style={{
                background: 'rgba(34, 197, 94, 0.9)',
                backdropFilter: 'blur(15px)',
                border: '1px solid rgba(22, 163, 74, 0.9)',
                boxShadow: '0 4px 15px rgba(34, 197, 94, 0.3)',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17L4 12" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-lg font-bold text-white">Item added to cart successfully!</span>
            </div>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-8 mb-12">
          {!addedToCart ? (
            <div className="flex justify-center">
              <motion.button
                onClick={handleAddToCart}
                disabled={isAddingToCart}
                className="relative overflow-hidden transition-all duration-300 ease-out"
                style={{
                  cursor: isAddingToCart ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '16px 40px',
                  borderRadius: '40px',
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: isAddingToCart ? COLORS.grey.medium : '#000',
                  minWidth: '200px',
                  background: isAddingToCart
                    ? 'rgba(200, 200, 200, 0.5)'
                    : `radial-gradient(ellipse at center, rgba(250, 204, 21, 0.9) 20%, rgba(250, 204, 21, 0.7) 60%, rgba(255, 215, 0, 0.8) 100%), rgba(250, 204, 21, 0.6)`,
                  backdropFilter: 'blur(15px)',
                  border: isAddingToCart ? '1px solid rgba(200, 200, 200, 0.3)' : '1px solid rgba(255, 215, 0, 0.9)',
                  boxShadow: isAddingToCart ? 'none' : `0 6px 20px rgba(250, 204, 21, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.8)`,
                  opacity: isAddingToCart ? 0.6 : 1,
                }}
                whileHover={!isAddingToCart ? { scale: 1.02 } : {}}
                whileTap={!isAddingToCart ? { scale: 0.98 } : {}}
              >
                {isAddingToCart ? (
                  <span className="flex items-center gap-3">
                    <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Adding to Cart...
                  </span>
                ) : (
                  'Add to Cart'
                )}
              </motion.button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row flex-wrap gap-4 justify-center items-center">
              <GlassSecondaryButton onClick={handleBrowseProducts}>Browse Products</GlassSecondaryButton>

              <GlassSecondaryButton variant="yellow" onClick={handleSuite360}>Suite360</GlassSecondaryButton>
              <GlassSecondaryButton variant="white" onClick={handlePlaceNewOrder}>Place New Order</GlassSecondaryButton>
            </div>
          )}
        </motion.div>

        {!addedToCart && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-center text-sm mb-8" style={{ color: COLORS.grey.medium }}>
            Review your configuration above and choose an action to proceed.
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default function Hose360Summary() {
  return <Hose360OptionsGate>{(options) => <Hose360SummaryInner options={options} />}</Hose360OptionsGate>;
}
