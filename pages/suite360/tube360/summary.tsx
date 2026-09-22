/**
 * TUBE360 Order Summary Page - Step 4 (manual method)
 * Price comes ONLY from the server (POST /api/tube360/price). Based on the
 * Function360 summary page's structure (PDF capture, Add to Cart flow).
 */

import React, { useContext, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Head from 'next/head';
import { usePDF } from 'react-to-pdf';
import Tube360Layout from '../../../components/Tube360/Tube360Layout';
import OptionsGate from '../../../components/Tube360/OptionsGate';
import GlassSecondaryButton from '../../../components/Tube360/GlassSecondaryButton';
import FreightNotice from '../../../components/Tube360/FreightNotice';
import BackButton from '../../../components/Trac360/Shared/BackButton';
import { PagePill } from '../../../components/Tube360/Fields';
import { useTube360 } from '../../../context/Tube360Context';
import { CartContext } from '../../../context/CartWrapper';
import { COLORS } from '../../../components/Trac360/styles';
import { buildServerSpec, formatPrice } from '../../../utils/tube360/validation';
import { fetchTube360Price } from '../../../lib/tube360/api';
import type { IItemCart } from '../../../types/cart';
import type { Tube360Options, Tube360PriceResponse, Tube360ServerSpec } from '../../../types/tube360';

function SummaryInner({ options }: { options: Tube360Options }) {
  const router = useRouter();
  const { config } = useTube360();
  const { addItem } = useContext(CartContext);

  const spec = buildServerSpec(config, options);

  const [price, setPrice] = useState<Tube360PriceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fetchToken, setFetchToken] = useState(0);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const { toPDF, targetRef } = usePDF({
    filename: `TUBE360-Order-${Date.now()}.pdf`,
    page: { margin: 10, format: 'a4', orientation: 'portrait' },
  });

  useEffect(() => {
    if (!spec) {
      router.replace('/suite360/tube360/bends');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spec === null]);

  useEffect(() => {
    if (!spec) return;
    const controller = new AbortController();
    setLoading(true);
    setError('');
    fetchTube360Price(spec, controller.signal)
      .then((res) => setPrice(res))
      .catch((err: Error) => {
        if (err.name !== 'AbortError') setError(err.message || 'Could not calculate the price');
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spec ? JSON.stringify(spec) : null, fetchToken]);

  if (!spec) {
    return (
      <Tube360Layout currentStep={4}>
        <div className="flex items-center justify-center min-h-[400px]" />
      </Tube360Layout>
    );
  }

  const handleBack = () => router.push('/suite360/tube360/bends');

  const handleAddToCart = async () => {
    if (!price) return;
    setIsAddingToCart(true);
    try {
      const originalElement = targetRef.current;
      if (!originalElement) throw new Error('PDF content element not found');

      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;

      const clone = originalElement.cloneNode(true) as HTMLElement;
      clone.style.position = 'fixed';
      clone.style.left = '-9999px';
      clone.style.top = '0';
      clone.style.minWidth = '800px';
      clone.style.width = '800px';
      clone.style.background = '#ffffff';
      clone.style.padding = '30px 20px';
      clone.style.zIndex = '-1000';
      document.body.appendChild(clone);
      await new Promise((resolve) => setTimeout(resolve, 100));

      const canvas = await html2canvas(clone, {
        scale: 1.3,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowHeight: clone.scrollHeight,
        windowWidth: 800,
      });
      document.body.removeChild(clone);

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
      const pdfWidth = 210;
      const pdfHeight = 297;
      const margin = 5;
      const imgWidth = pdfWidth - margin * 2;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let finalWidth = imgWidth;
      let finalHeight = imgHeight;
      if (imgHeight > pdfHeight - margin * 2) {
        const scale = (pdfHeight - margin * 2) / imgHeight;
        finalHeight = pdfHeight - margin * 2;
        finalWidth = imgWidth * scale;
      }
      const imgData = canvas.toDataURL('image/jpeg', 0.7);
      const xOffset = (pdfWidth - finalWidth) / 2;
      pdf.addImage(imgData, 'JPEG', xOffset, margin, finalWidth, finalHeight, undefined, 'FAST');
      const pdfDataUrl = pdf.output('dataurlstring');

      const cartItem: IItemCart = {
        id: 'tube-360',
        type: 'tube360_order',
        name: 'TUBE360 Custom Tube',
        totalPrice: price.amount,
        quantity: 1,
        stock: 999,
        image: '/Tube360.png',
        pdfDataUrl,
        cartId: Date.now(),
        tube360Config: {
          spec,
          labels: price.breakdown.labels,
          notes: config.bends.notes,
          breakdown: price.breakdown,
        },
      };
      addItem(cartItem);

      setAddedToCart(true);
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (err) {
      const clones = document.querySelectorAll('[style*="-9999px"]');
      clones.forEach((c) => c.parentNode && c.parentNode.removeChild(c));
      alert(`Failed to add item to cart: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const bendCount = config.bends.count ? parseInt(config.bends.count, 10) : 0;
  const b = price?.breakdown;

  return (
    <>
      <Tube360Layout currentStep={4}>
        <BackButton onClick={handleBack} />
        <div className="max-w-2xl mx-auto px-2 sm:px-4">
          <div ref={targetRef} style={{ background: '#ffffff', padding: '30px 20px' }}>
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <div className="relative" style={{ width: '160px', height: '80px' }}>
                <Image
                  src="/fluidpower_logo_transparent.gif"
                  alt="Fluid Power Group"
                  width={160}
                  height={80}
                  className="object-contain"
                  unoptimized
                />
              </div>
            </div>

            <PagePill>ORDER SUMMARY</PagePill>

            {loading && (
              <div className="flex items-center justify-center min-h-[200px]">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
                  <p style={{ color: COLORS.grey.medium }}>Calculating your price...</p>
                </div>
              </div>
            )}

            {!loading && error && (
              <div className="rounded-2xl p-6 text-center" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.4)' }}>
                <p className="font-semibold mb-4" style={{ color: '#dc2626' }}>{error}</p>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => setFetchToken((t) => t + 1)}
                    className="px-6 py-2 rounded-full font-semibold"
                    style={{ background: COLORS.yellow.primary, color: '#000' }}
                  >
                    Try again
                  </button>
                  <button
                    onClick={() => router.push('/suite360/tube360/bends')}
                    className="px-6 py-2 rounded-full font-semibold text-white"
                    style={{ background: COLORS.grey.dark }}
                  >
                    Edit bends
                  </button>
                </div>
              </div>
            )}

            {!loading && !error && b && (
              <div
                className="rounded-2xl overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(200,200,200,0.3)', boxShadow: '0 4px 10px rgba(0,0,0,0.08)' }}
              >
                {/* Tube specification */}
                <div className="p-5 border-b border-gray-200">
                  <h3 className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: COLORS.yellow.primary }}>
                    Tube specification
                  </h3>
                  <div className="space-y-1.5 text-xs">
                    {[
                      ['Material', b.labels.material],
                      ['Size system', b.labels.sizeSystem],
                      ['Outer diameter', b.labels.od],
                      ['Wall thickness', `${b.labels.wallMm} mm`],
                      ['End A', b.labels.endA],
                      ['End B', b.labels.endB],
                      ['Total length', `${spec.totalLengthMm} mm`],
                      ['Quantity', String(spec.quantity)],
                      ['Tube SKU', b.material.sku],
                    ].map(([k, v]) => (
                      <div className="flex justify-between" key={k}>
                        <span style={{ color: COLORS.grey.medium }}>{k}:</span>
                        <span className="font-semibold" style={{ color: COLORS.grey.dark }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bend schedule */}
                <div className="p-5 border-b border-gray-200">
                  <h3 className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: COLORS.yellow.primary }}>
                    Bend schedule
                  </h3>
                  {bendCount > 0 ? (
                    <>
                      <p className="text-xs mb-2" style={{ color: COLORS.grey.dark }}>
                        Bend radius (CLR): {spec.bendRadiusMm} mm - all bends in one plane
                      </p>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr>
                              <th className="text-left py-1 pr-2" style={{ color: COLORS.grey.medium }}>#</th>
                              <th className="text-left py-1 pr-2" style={{ color: COLORS.grey.medium }}>Section (mm)</th>
                              <th className="text-left py-1" style={{ color: COLORS.grey.medium }}>Bend angle (&deg;)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {spec.sectionsMm.map((s, i) => (
                              <tr key={i}>
                                <td className="py-1 pr-2" style={{ color: COLORS.grey.dark }}>{i + 1}</td>
                                <td className="py-1 pr-2" style={{ color: COLORS.grey.dark }}>{s}</td>
                                <td className="py-1" style={{ color: COLORS.grey.dark }}>{spec.anglesDeg[i] ?? ''}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  ) : (
                    <p className="text-xs" style={{ color: COLORS.grey.dark }}>Straight tube - no bends</p>
                  )}
                </div>

                {/* Notes */}
                {config.bends.notes && (
                  <div className="p-5 border-b border-gray-200">
                    <h3 className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: COLORS.yellow.primary }}>
                      Notes
                    </h3>
                    <div
                      className="p-3 rounded-lg text-xs whitespace-pre-wrap"
                      style={{ background: 'rgba(250, 204, 21, 0.05)', border: '1px solid rgba(250, 204, 21, 0.2)', color: COLORS.grey.dark }}
                    >
                      {config.bends.notes}
                    </div>
                  </div>
                )}

                {/* Price breakdown */}
                <div className="p-5 bg-gray-50">
                  <h3 className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: COLORS.grey.dark }}>
                    Price breakdown
                  </h3>
                  <div className="space-y-1.5 text-xs mb-3">
                    <div className="flex justify-between">
                      <span style={{ color: COLORS.grey.medium }}>
                        Tube material ({b.material.sku}, {formatPrice(b.material.pricePerMetre)}/m &times; {(b.material.billedLengthMm / 1000).toFixed(1)} m):
                      </span>
                      <span className="font-semibold" style={{ color: COLORS.grey.dark }}>{formatPrice(b.material.cost)}</span>
                    </div>
                    {bendCount > 0 && (
                      <div className="flex justify-between">
                        <span style={{ color: COLORS.grey.medium }}>
                          Bending ({b.bending.count} &times; {formatPrice(b.bending.ratePerBend)}{b.bending.multiplier > 1 ? ` × ${b.bending.multiplier} complexity` : ''}):
                        </span>
                        <span className="font-semibold" style={{ color: COLORS.grey.dark }}>{formatPrice(b.bending.cost)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span style={{ color: COLORS.grey.medium }}>End A - {b.labels.endA}:</span>
                      <span className="font-semibold" style={{ color: COLORS.grey.dark }}>{formatPrice(b.ends.endA.cost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: COLORS.grey.medium }}>End B - {b.labels.endB}:</span>
                      <span className="font-semibold" style={{ color: COLORS.grey.dark }}>{formatPrice(b.ends.endB.cost)}</span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span style={{ color: COLORS.grey.dark }}>Price per tube:</span>
                      <span style={{ color: COLORS.grey.dark }}>{formatPrice(b.perTube)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: COLORS.grey.medium }}>&times; {b.quantity} tube(s):</span>
                      <span className="font-semibold" style={{ color: COLORS.grey.dark }}>{formatPrice(b.tubesSubtotal)}</span>
                    </div>
                    {b.setupFee > 0 && (
                      <div className="flex justify-between">
                        <span style={{ color: COLORS.grey.medium }}>CNC set-up (once per order line):</span>
                        <span className="font-semibold" style={{ color: COLORS.grey.dark }}>{formatPrice(b.setupFee)}</span>
                      </div>
                    )}
                  </div>
                  <div className="pt-3 border-t-2" style={{ borderColor: COLORS.yellow.primary }}>
                    <div className="flex justify-between items-center">
                      <span className="text-base font-bold" style={{ color: COLORS.grey.dark }}>TOTAL (ex GST):</span>
                      <span className="text-xl font-bold" style={{ color: COLORS.yellow.primary }}>{formatPrice(price.amount)}</span>
                    </div>
                    <p className="text-xs mt-1" style={{ color: COLORS.grey.medium }}>GST and shipping are added at checkout.</p>
                  </div>
                </div>

                <div className="p-5">
                  <FreightNotice options={options} totalLengthMm={spec.totalLengthMm} />
                </div>
              </div>
            )}
          </div>

          {showSuccessMessage && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mt-6 mb-6">
              <div
                className="flex items-center justify-center gap-3 py-4 px-6 rounded-xl"
                style={{ background: 'rgba(34, 197, 94, 0.9)', backdropFilter: 'blur(15px)', border: '1px solid rgba(22, 163, 74, 0.9)', boxShadow: '0 4px 15px rgba(34, 197, 94, 0.3)' }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M20 6L9 17L4 12" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-lg font-bold text-white">Item added to cart successfully!</span>
              </div>
            </motion.div>
          )}

          <div className="mt-8 mb-12">
            {!addedToCart ? (
              <div className="flex flex-col items-center gap-4">
                <motion.button
                  onClick={handleAddToCart}
                  disabled={isAddingToCart || loading || !!error || !price}
                  className="relative overflow-hidden transition-all duration-300 ease-out"
                  style={{
                    cursor: isAddingToCart || loading || !!error || !price ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '16px 40px',
                    borderRadius: '40px',
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    color: isAddingToCart || loading || !!error || !price ? COLORS.grey.medium : '#000',
                    minWidth: '200px',
                    background:
                      isAddingToCart || loading || !!error || !price
                        ? 'rgba(200, 200, 200, 0.5)'
                        : 'radial-gradient(ellipse at center, rgba(250, 204, 21, 0.9) 20%, rgba(250, 204, 21, 0.7) 60%, rgba(255, 215, 0, 0.8) 100%), rgba(250, 204, 21, 0.6)',
                    backdropFilter: 'blur(15px)',
                    border: isAddingToCart || loading || !!error || !price ? '1px solid rgba(200, 200, 200, 0.3)' : '1px solid rgba(255, 215, 0, 0.9)',
                    boxShadow: isAddingToCart || loading || !!error || !price ? 'none' : '0 6px 20px rgba(250, 204, 21, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.8)',
                  }}
                  whileHover={!isAddingToCart && price ? { scale: 1.02 } : {}}
                  whileTap={!isAddingToCart && price ? { scale: 0.98 } : {}}
                >
                  {isAddingToCart ? 'Adding to Cart...' : 'Add to Cart'}
                </motion.button>

                <div className="flex gap-3">
                  <GlassSecondaryButton onClick={() => router.push('/suite360/tube360/tube-specs')}>
                    Edit Tube
                  </GlassSecondaryButton>
                  <GlassSecondaryButton onClick={() => router.push('/suite360/tube360/bends')}>
                    Edit Bends
                  </GlassSecondaryButton>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <motion.button
                  onClick={() => { window.location.href = '/suite360'; }}
                  className="relative overflow-hidden transition-all duration-300 ease-out"
                  style={{
                    cursor: 'pointer',
                    padding: '14px 32px',
                    borderRadius: '40px',
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    color: '#000',
                    minWidth: '180px',
                    background: 'radial-gradient(ellipse at center, rgba(250, 204, 21, 0.9) 20%, rgba(250, 204, 21, 0.7) 60%, rgba(255, 215, 0, 0.8) 100%), rgba(250, 204, 21, 0.6)',
                    backdropFilter: 'blur(15px)',
                    border: '1px solid rgba(255, 215, 0, 0.9)',
                    boxShadow: '0 6px 20px rgba(250, 204, 21, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.8)',
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Place New Order
                </motion.button>
                <motion.button
                  onClick={() => router.push('/catalogue')}
                  className="relative overflow-hidden transition-all duration-300 ease-out"
                  style={{
                    cursor: 'pointer',
                    padding: '14px 32px',
                    borderRadius: '40px',
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    color: '#fff',
                    minWidth: '180px',
                    background: 'radial-gradient(ellipse at center, rgba(0, 0, 0, 0.9) 20%, rgba(0, 0, 0, 0.8) 70%, rgba(20, 20, 20, 0.85) 100%), rgba(0, 0, 0, 0.8)',
                    backdropFilter: 'blur(15px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Browse Products
                </motion.button>
              </div>
            )}
          </div>
        </div>
      </Tube360Layout>
    </>
  );
}

export default function Summary() {
  return (
    <>
      <Head>
        <title>Tube360 | FluidPower Group</title>
        <meta name="robots" content="noindex, follow" />
      </Head>
      <OptionsGate>{(options) => <SummaryInner options={options} />}</OptionsGate>
    </>
  );
}
