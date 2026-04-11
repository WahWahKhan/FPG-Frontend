// pages/order-confirmation.tsx

import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { createPortal } from 'react-dom';
import { FiX } from 'react-icons/fi';
import { IItemCart } from '../types/cart';

// ========================================
// TYPE DEFINITIONS
// ========================================
interface UserDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  companyName?: string;
}

interface WebsiteProduct {
  id: string;
  name: string;
  quantity: number;
  price: number;
  image?: string;
}

interface PWAOrder {
  id: string;
  name: string;
  totalPrice: number;
  quantity: number;
  image?: string;
  pdfDataUrl?: string;
  pwaOrderNumber?: string;
  cartId?: number;
}

interface OrderTotals {
  subtotal: number;
  shipping: number;
  gst: number;
  total: number;
}

interface Trac360Order {
  id: string;
  name: string;
  totalPrice: number;
  quantity: number;
  image?: string;
  pdfDataUrl?: string;
  trac360OrderNumber?: string;
  cartId?: number;
}

interface Function360Order {
  id: string;
  name: string;
  totalPrice: number;
  quantity: number;
  image?: string;
  pdfDataUrl?: string;
  function360OrderNumber?: string;
  cartId?: number;
  configuration?: any;
}

interface OrderData {
  orderNumber: string;
  orderDate: string;
  paypalCaptureID: string;
  userDetails: UserDetails;
  websiteProducts: WebsiteProduct[];
  pwaOrders: PWAOrder[];
  trac360Orders: Trac360Order[];
  function360Orders: Function360Order[];
  totals: OrderTotals;
}

// ========================================
// MAIN COMPONENT
// ========================================
export default function OrderConfirmation() {
  const router = useRouter();
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [testingMode, setTestingMode] = useState(false);

  // PDF Modal state
  const [showPDFModal, setShowPDFModal] = useState(false);
  const [currentPDFUrl, setCurrentPDFUrl] = useState<string>('');
  const [isMobile, setIsMobile] = useState(false);
  const [showReviewPopup, setShowReviewPopup] = useState(false);

  // ✅ UPDATED: Direct link to Google review compose screen
  const GOOGLE_REVIEW_URL = 'https://search.google.com/local/writereview?placeid=ChIJfy1tJfHbJmsRpwIYaODkxxo';

  // Detect mobile on mount
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // ✅ UPDATED: Delay increased to 5000ms so customers can review their order first
  useEffect(() => {
    if (!orderData) return;
    const timer = window.setTimeout(() => setShowReviewPopup(true), 5000);
    return () => window.clearTimeout(timer);
  }, [orderData]);

  // CRITICAL: Prevent cart-based redirects on this page
  useEffect(() => {
    sessionStorage.setItem('viewingOrderConfirmation', 'true');
    console.log('Order confirmation page loaded - redirect protection enabled');

    return () => {
      sessionStorage.removeItem('viewingOrderConfirmation');
      localStorage.removeItem('lastOrder');
      console.log('Leaving order confirmation page - cleared lastOrder');
    };
  }, []);

  // ============================================================================
  // Load order data by merging metadata + PDFs from cart
  // ============================================================================
  useEffect(() => {
    const loadOrderData = () => {
      try {
        sessionStorage.removeItem('orderCompleting');

        const storedOrder = localStorage.getItem('lastOrder');
        if (!storedOrder) {
          console.warn('⚠️ No order metadata found');
          setIsLoading(false);
          return;
        }

        const parsedOrder: OrderData = JSON.parse(storedOrder);
        console.log('📋 Order metadata loaded:', parsedOrder.orderNumber);

        const storedCart = localStorage.getItem('shopping-cart');

        if (storedCart) {
          const cartObject = JSON.parse(storedCart);
          const cartItems: IItemCart[] = cartObject.items || [];

          console.log('📦 Shopping cart loaded with', cartItems.length, 'items');

          if (parsedOrder.pwaOrders && parsedOrder.pwaOrders.length > 0) {
            parsedOrder.pwaOrders = parsedOrder.pwaOrders.map((order: PWAOrder) => {
              const cartItem = cartItems.find((item: IItemCart) =>
                item.cartId === order.cartId || item.id === order.id
              );
              if (cartItem && cartItem.pdfDataUrl) {
                console.log('✅ PDF found for PWA:', order.name);
                return { ...order, pdfDataUrl: cartItem.pdfDataUrl };
              }
              console.warn('⚠️ No PDF found for PWA:', order.name);
              return order;
            });
          }

          if (parsedOrder.trac360Orders && parsedOrder.trac360Orders.length > 0) {
            parsedOrder.trac360Orders = parsedOrder.trac360Orders.map((order: Trac360Order) => {
              const cartItem = cartItems.find((item: IItemCart) =>
                item.cartId === order.cartId || item.id === order.id
              );
              if (cartItem && cartItem.pdfDataUrl) {
                console.log('✅ PDF found for Trac360:', order.name);
                return { ...order, pdfDataUrl: cartItem.pdfDataUrl };
              }
              console.warn('⚠️ No PDF found for Trac360:', order.name);
              return order;
            });
          }

          if (parsedOrder.function360Orders && parsedOrder.function360Orders.length > 0) {
            parsedOrder.function360Orders = parsedOrder.function360Orders.map((order: Function360Order) => {
              const cartItem = cartItems.find((item: IItemCart) =>
                item.cartId === order.cartId || item.id === order.id
              );
              if (cartItem && cartItem.pdfDataUrl) {
                console.log('✅ PDF found for Function360:', order.name);
                return { ...order, pdfDataUrl: cartItem.pdfDataUrl };
              }
              console.warn('⚠️ No PDF found for Function360:', order.name);
              return order;
            });
          }
        }

        setOrderData(parsedOrder);

        const currentTestingMode = process.env.NEXT_PUBLIC_TESTING_MODE === 'true';
        setTestingMode(currentTestingMode);

        console.log('✅ Order data merged and ready for display');
      } catch (error) {
        console.error('❌ Error loading order data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadOrderData();
  }, []);

  // ============================================================================
  // Cleanup localStorage when leaving order-confirmation page
  // ============================================================================
  useEffect(() => {
    return () => {
      console.log('🧹 Cleaning up: User leaving order-confirmation page');
      localStorage.removeItem('shopping-cart');
      localStorage.removeItem('lastOrder');
      localStorage.removeItem('cart-timestamp');
      console.log('✅ localStorage cleaned');
    };
  }, []);

  // ============================================================================
  // Also handle browser/tab close
  // ============================================================================
  useEffect(() => {
    const handleBeforeUnload = () => {
      console.log('🧹 Cleaning up: Browser/tab closing');
      localStorage.removeItem('shopping-cart');
      localStorage.removeItem('lastOrder');
      localStorage.removeItem('cart-timestamp');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Format currency
  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Handle PDF viewing
  const handleViewPDF = (pdfDataUrl: string | undefined, orderNumber: string | undefined) => {
    if (!pdfDataUrl) {
      alert('PDF not available');
      return;
    }

    if (isMobile) {
      try {
        const newWindow = window.open('', '_blank');
        if (newWindow) {
          newWindow.document.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>Order ${orderNumber || 'PDF'}</title>
                <style>
                  body { margin: 0; padding: 0; }
                  iframe { width: 100vw; height: 100vh; border: none; }
                </style>
              </head>
              <body>
                <iframe src="${pdfDataUrl}"></iframe>
              </body>
            </html>
          `);
          newWindow.document.close();
        }
      } catch (error) {
        console.error('Error opening PDF:', error);
        alert('Unable to open PDF. Please try again.');
      }
    } else {
      setCurrentPDFUrl(pdfDataUrl);
      setShowPDFModal(true);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading your order...</p>
        </div>
      </div>
    );
  }

  // No order data found
  if (!orderData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Head>
          <title>Order Not Found - FluidPower Group</title>
        </Head>
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h1>
          <p className="text-gray-600 mb-6">
            We couldn&apos;t find your order details. This may happen if you&apos;ve cleared your browser data.
          </p>
          <button
            onClick={() => router.push('/catalogue')}
            className="cursor-pointer transition-all duration-300 inline-block font-semibold"
            style={{
              padding: "12px 24px",
              borderRadius: "12px",
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
            Return to Catalogue
          </button>
        </div>
      </div>
    );
  }

  // ========================================
  // RENDER ORDER CONFIRMATION
  // ========================================
  return (
    <>
      <Head>
        <title>Order Confirmed - FluidPower Group</title>
        <meta name="description" content="Your order has been confirmed" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        {/* Testing Mode Banner */}
        {testingMode && (
          <div className="max-w-4xl mx-auto mb-4">
            <div className="bg-orange-100 border-l-4 border-orange-500 text-orange-700 p-4 rounded">
              <div className="flex items-center">
                <span className="text-2xl mr-3">🧪</span>
                <div>
                  <p className="font-bold">TEST ORDER</p>
                  <p className="text-sm">This is a test order and will not be processed</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-4xl mx-auto">
          {/* Main Card */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">

            {/* Header Section */}
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 px-6 py-8 sm:px-10 sm:py-12 text-center">
              <div className="mx-auto mb-6 flex justify-center">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center">
                  <svg
                    className="w-12 h-12 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-black mb-2">
                Order Confirmed!
              </h1>
              <p className="text-black text-lg">
                Thank you for your order
              </p>
            </div>

            {/* Order Details Section */}
            <div className="px-6 py-8 sm:px-10 border-b border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Order Number</p>
                  <p className="text-lg font-bold text-gray-900">{orderData.orderNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Order Date</p>
                  <p className="text-lg font-bold text-gray-900">{formatDate(orderData.orderDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Email</p>
                  <p className="text-lg font-bold text-gray-900">{orderData.userDetails.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">PayPal Transaction ID</p>
                  <p className="text-sm font-mono text-gray-700 break-all">{orderData.paypalCaptureID}</p>
                </div>
              </div>
            </div>

            {/* Products Section */}
            <div className="px-6 py-8 sm:px-10 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Items</h2>

              {/* Website Products */}
              {orderData.websiteProducts && orderData.websiteProducts.length > 0 && (
                <div className="space-y-4 mb-6">
                  {orderData.websiteProducts.map((product, index) => (
                    <div key={`website-${index}`} className="border-b border-gray-200 pb-4 last:border-0">
                      <div className="flex items-center space-x-4">
                        {product.image && (
                          <div className="flex-shrink-0">
                            <Image
                              src={product.image}
                              alt={product.name}
                              width={80}
                              height={80}
                              className="rounded object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900">{product.name}</h3>
                          <p className="text-sm text-gray-600">
                            Quantity: {product.quantity} × {formatCurrency(product.price)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">
                            {formatCurrency(product.price * product.quantity)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* PWA Orders */}
              {orderData.pwaOrders && orderData.pwaOrders.length > 0 && (
                <div className="space-y-4">
                  {orderData.pwaOrders.map((pwaOrder, index) => (
                    <div key={`pwa-${index}`} className="border-b border-gray-200 pb-4 last:border-0">
                      <div className="flex items-center space-x-4">
                        {pwaOrder.image && (
                          <div className="flex-shrink-0">
                            <Image
                              src={pwaOrder.image}
                              alt={pwaOrder.name}
                              width={80}
                              height={80}
                              className="rounded object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900">{pwaOrder.name}</h3>
                          <p className="text-sm text-gray-600">Quantity: {pwaOrder.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900 mb-2">
                            {formatCurrency(pwaOrder.totalPrice)}
                          </p>
                          {pwaOrder.pdfDataUrl ? (
                            <button
                              onClick={() => handleViewPDF(pwaOrder.pdfDataUrl, pwaOrder.pwaOrderNumber)}
                              className="text-xs cursor-pointer block mt-2 text-left transition-all duration-300"
                              style={{
                                padding: "6px 14px",
                                borderRadius: "20px",
                                background: "rgba(255, 255, 255, 0.9)",
                                backdropFilter: "blur(15px)",
                                border: "1px solid rgba(200, 200, 200, 0.3)",
                                color: "#2563eb",
                                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
                                fontWeight: "600"
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
                                e.currentTarget.style.background = "radial-gradient(ellipse at center, rgba(250, 204, 21, 0.9) 20%, rgba(250, 204, 21, 0.7) 60%, rgba(255, 215, 0, 0.8) 100%), rgba(250, 204, 21, 0.6)";
                                e.currentTarget.style.border = "1px solid rgba(255, 215, 0, 0.9)";
                                e.currentTarget.style.color = "#000";
                                e.currentTarget.style.boxShadow = "0 10px 30px rgba(250, 204, 21, 0.6), inset 0 2px 0 rgba(255, 255, 255, 0.8), inset 0 3px 10px rgba(255, 255, 255, 0.4), inset 0 -1px 0 rgba(255, 215, 0, 0.4)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = "translateY(0px) scale(1)";
                                e.currentTarget.style.background = "rgba(255, 255, 255, 0.9)";
                                e.currentTarget.style.border = "1px solid rgba(200, 200, 200, 0.3)";
                                e.currentTarget.style.color = "#2563eb";
                                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.08)";
                              }}
                            >
                              {isMobile ? 'View PDF' : 'Click to View PDF'}
                            </button>
                          ) : (
                            <p className="text-sm text-gray-600 italic mt-2">
                              📧 PDF attached in your confirmation email
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Trac 360 Orders */}
              {orderData.trac360Orders && orderData.trac360Orders.length > 0 && (
                <div className="space-y-4 mt-6">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                    Custom Tractor Configurations
                  </h3>
                  {orderData.trac360Orders.map((trac360Order, index) => (
                    <div key={`trac360-${index}`} className="border-b border-gray-200 pb-4 last:border-0">
                      <div className="flex items-center space-x-4">
                        {trac360Order.image && (
                          <div className="flex-shrink-0">
                            <Image
                              src={trac360Order.image}
                              alt={trac360Order.name}
                              width={80}
                              height={80}
                              className="rounded object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900">{trac360Order.name}</h3>
                          <p className="text-sm text-gray-600">Quantity: {trac360Order.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900 mb-2">
                            {formatCurrency(trac360Order.totalPrice)}
                          </p>
                          {trac360Order.pdfDataUrl ? (
                            <button
                              onClick={() => handleViewPDF(trac360Order.pdfDataUrl, trac360Order.trac360OrderNumber)}
                              className="text-xs cursor-pointer block mt-2 text-left transition-all duration-300"
                              style={{
                                padding: "6px 14px",
                                borderRadius: "20px",
                                background: "rgba(255, 255, 255, 0.9)",
                                backdropFilter: "blur(15px)",
                                border: "1px solid rgba(200, 200, 200, 0.3)",
                                color: "#2563eb",
                                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
                                fontWeight: "600"
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
                                e.currentTarget.style.background = "radial-gradient(ellipse at center, rgba(250, 204, 21, 0.9) 20%, rgba(250, 204, 21, 0.7) 60%, rgba(255, 215, 0, 0.8) 100%), rgba(250, 204, 21, 0.6)";
                                e.currentTarget.style.border = "1px solid rgba(255, 215, 0, 0.9)";
                                e.currentTarget.style.color = "#000";
                                e.currentTarget.style.boxShadow = "0 10px 30px rgba(250, 204, 21, 0.6), inset 0 2px 0 rgba(255, 255, 255, 0.8), inset 0 3px 10px rgba(255, 255, 255, 0.4), inset 0 -1px 0 rgba(255, 215, 0, 0.4)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = "translateY(0px) scale(1)";
                                e.currentTarget.style.background = "rgba(255, 255, 255, 0.9)";
                                e.currentTarget.style.border = "1px solid rgba(200, 200, 200, 0.3)";
                                e.currentTarget.style.color = "#2563eb";
                                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.08)";
                              }}
                            >
                              {isMobile ? 'View Configuration' : 'Click to View Configuration'}
                            </button>
                          ) : (
                            <p className="text-sm text-gray-600 italic mt-2">
                              📧 PDF attached in your confirmation email
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Function 360 Orders */}
              {orderData.function360Orders && orderData.function360Orders.length > 0 && (
                <div className="space-y-4 mt-6">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                    Custom Hydraulic Function Kits
                  </h3>
                  {orderData.function360Orders.map((function360Order, index) => (
                    <div key={`function360-${index}`} className="border-b border-gray-200 pb-4 last:border-0">
                      <div className="flex items-center space-x-4">
                        {function360Order.image && (
                          <div className="flex-shrink-0">
                            <Image
                              src={function360Order.image}
                              alt={function360Order.name}
                              width={80}
                              height={80}
                              className="rounded object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900">{function360Order.name}</h3>
                          <p className="text-sm text-gray-600">
                            {function360Order.configuration?.equipment?.horsepower === 'above_50hp' ? 'Above 50HP' : 'Below 50HP'} • {' '}
                            {function360Order.configuration?.equipment?.functionType === 'electric_3rd' ? 'Electric 3rd Function' :
                             function360Order.configuration?.equipment?.functionType === 'live_3rd' ? 'Live 3rd Function' :
                             'Electric 3rd & 4th Function'}
                          </p>
                          <p className="text-xs text-gray-500">
                            Components: {function360Order.configuration?.selectedComponents
                              ? Object.values(function360Order.configuration.selectedComponents).filter(Boolean).length
                              : 0}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900 mb-2">
                            {formatCurrency(function360Order.totalPrice)}
                          </p>
                          {function360Order.pdfDataUrl ? (
                            <button
                              onClick={() => handleViewPDF(function360Order.pdfDataUrl, function360Order.function360OrderNumber)}
                              className="text-xs cursor-pointer block mt-2 text-left transition-all duration-300"
                              style={{
                                padding: "6px 14px",
                                borderRadius: "20px",
                                background: "rgba(255, 255, 255, 0.9)",
                                backdropFilter: "blur(15px)",
                                border: "1px solid rgba(200, 200, 200, 0.3)",
                                color: "#2563eb",
                                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
                                fontWeight: "600"
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
                                e.currentTarget.style.background = "radial-gradient(ellipse at center, rgba(250, 204, 21, 0.9) 20%, rgba(250, 204, 21, 0.7) 60%, rgba(255, 215, 0, 0.8) 100%), rgba(250, 204, 21, 0.6)";
                                e.currentTarget.style.border = "1px solid rgba(255, 215, 0, 0.9)";
                                e.currentTarget.style.color = "#000";
                                e.currentTarget.style.boxShadow = "0 10px 30px rgba(250, 204, 21, 0.6), inset 0 2px 0 rgba(255, 255, 255, 0.8), inset 0 3px 10px rgba(255, 255, 255, 0.4), inset 0 -1px 0 rgba(255, 215, 0, 0.4)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = "translateY(0px) scale(1)";
                                e.currentTarget.style.background = "rgba(255, 255, 255, 0.9)";
                                e.currentTarget.style.border = "1px solid rgba(200, 200, 200, 0.3)";
                                e.currentTarget.style.color = "#2563eb";
                                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.08)";
                              }}
                            >
                              {isMobile ? 'View Configuration' : 'Click to View Configuration'}
                            </button>
                          ) : (
                            <p className="text-sm text-gray-600 italic mt-2">
                              📧 PDF attached in your confirmation email
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Order Summary Section */}
            <div className="px-6 py-8 sm:px-10 bg-gray-50 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">{formatCurrency(orderData.totals.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="text-gray-900">{formatCurrency(orderData.totals.shipping)}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-gray-300">
                  <span className="text-gray-600">GST (10%)</span>
                  <span className="text-gray-900">{formatCurrency(orderData.totals.gst)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2">
                  <span className="text-gray-900">Total</span>
                  <span className="text-gray-900">{formatCurrency(orderData.totals.total)}</span>
                </div>
              </div>
            </div>

            {/* Shipping Address Section */}
            <div className="px-6 py-8 sm:px-10 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Shipping Address</h2>
              <div className="text-sm text-gray-700 space-y-1">
                <p className="font-semibold">
                  {orderData.userDetails.firstName} {orderData.userDetails.lastName}
                </p>
                {orderData.userDetails.companyName && (
                  <p>{orderData.userDetails.companyName}</p>
                )}
                <p>{orderData.userDetails.address}</p>
                <p>
                  {orderData.userDetails.city}, {orderData.userDetails.state} {orderData.userDetails.postcode}
                </p>
                <p>{orderData.userDetails.country}</p>
                <p className="pt-2">Phone: {orderData.userDetails.phone}</p>
              </div>
            </div>

            {/* What's Next Section */}
            <div className="px-6 py-8 sm:px-10 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">What&apos;s Next?</h2>
              <div className="space-y-3 text-sm text-gray-700">
                <div className="flex items-start">
                  <span className="text-yellow-500 font-bold mr-3 text-lg">1.</span>
                  <p>We&apos;re preparing your order for shipment</p>
                </div>
                <div className="flex items-start">
                  <span className="text-yellow-500 font-bold mr-3 text-lg">2.</span>
                  <p>You&apos;ll receive tracking information via email once your order ships</p>
                </div>
                <div className="flex items-start">
                  <span className="text-yellow-500 font-bold mr-3 text-lg">3.</span>
                  <p>Questions? Contact us at{' '}
                    <a
                      href={`mailto:${testingMode
                        ? (process.env.NEXT_PUBLIC_BUSINESS_EMAIL_TEST || 'info@agcomponents.com.au')
                        : (process.env.NEXT_PUBLIC_BUSINESS_EMAIL || 'info@agcomponents.com.au')
                      }`}
                      className="text-blue-600 hover:underline font-semibold"
                    >
                      {testingMode
                        ? (process.env.NEXT_PUBLIC_BUSINESS_EMAIL_TEST || 'info@agcomponents.com.au')
                        : (process.env.NEXT_PUBLIC_BUSINESS_EMAIL || 'info@agcomponents.com.au')
                      }
                    </a>
                    {' '}or call{' '}
                    <a href="tel:+61409517333" className="text-blue-600 hover:underline font-semibold">
                      +61 409 517 333
                    </a>
                  </p>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="px-6 py-8 sm:px-10 text-center">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
                <button
                  onClick={() => router.push('/suite360')}
                  className="cursor-pointer transition-all duration-300 inline-block font-bold text-lg"
                  style={{
                    padding: "16px 32px",
                    borderRadius: "40px",
                    width: "220px",
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
                  Suite360
                </button>

                <button
                  onClick={() => router.push('/catalogue')}
                  className="cursor-pointer transition-all duration-300 inline-block font-bold text-lg"
                  style={{
                    padding: "16px 32px",
                    borderRadius: "40px",
                    width: "220px",
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
                  Browse Products
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer className="mt-8 text-center text-sm text-gray-600 pb-8">
            <div className="mb-4">
              <p className="font-semibold text-gray-900 mb-2">FluidPower Group</p>
              <p>
                <a
                  href={`mailto:${testingMode
                    ? (process.env.NEXT_PUBLIC_BUSINESS_EMAIL_TEST || 'info@agcomponents.com.au')
                    : (process.env.NEXT_PUBLIC_BUSINESS_EMAIL || 'info@agcomponents.com.au')
                  }`}
                  className="text-blue-600 hover:underline"
                >
                  {testingMode
                    ? (process.env.NEXT_PUBLIC_BUSINESS_EMAIL_TEST || 'info@agcomponents.com.au')
                    : (process.env.NEXT_PUBLIC_BUSINESS_EMAIL || 'info@agcomponents.com.au')
                  }
                </a>
                {' | '}
                <a href="tel:+61409517333" className="text-blue-600 hover:underline">
                  +61 409 517 333
                </a>
              </p>
              <p>
                <a
                  href="https://fluidpowergroup.com.au"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  fluidpowergroup.com.au
                </a>
              </p>
            </div>
            <p className="text-xs">
              © {new Date().getFullYear()} FluidPower Group. All rights reserved.
            </p>
          </footer>
        </div>
      </div>

      {/* ✅ UPDATED: Google Review Modal - centered overlay, much more prominent */}
      {showReviewPopup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.55)' }}
          onClick={() => setShowReviewPopup(false)}
        >
          <div
            className="relative w-full max-w-md bg-white rounded-3xl p-8 text-center"
            style={{ boxShadow: '0 24px 60px rgba(0,0,0,0.2)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setShowReviewPopup(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition text-2xl leading-none"
              aria-label="Close"
            >
              ×
            </button>

            {/* Google G logo */}
            <div className="flex justify-center mb-4">
              <svg width="48" height="48" viewBox="0 0 48 48">
                <path fill="#4285F4" d="M44.5 20H24v8h11.7C34.2 33.6 29.7 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 2.9l6-6C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.2-4z"/>
                <path fill="#34A853" d="M6.3 14.7l6.6 4.8C14.5 16 19 13 24 13c3 0 5.8 1.1 7.9 2.9l6-6C34.5 6.1 29.5 4 24 4c-7.7 0-14.4 4.4-17.7 10.7z"/>
                <path fill="#FBBC05" d="M24 44c5.4 0 10.3-1.9 14.1-5l-6.5-5.3C29.8 35.5 27 36.5 24 36.5c-5.7 0-10.5-3.8-12.2-9l-6.6 5.1C8.9 39.8 15.9 44 24 44z"/>
                <path fill="#EA4335" d="M44.5 20H24v8h11.7c-.8 2.3-2.3 4.3-4.3 5.7l6.5 5.3C42 35.3 44.5 30 44.5 24c0-1.3-.1-2.7-.2-4z"/>
              </svg>
            </div>

            {/* Stars */}
            <div className="flex justify-center gap-1 mb-4">
              {[1, 2, 3, 4, 5].map((s) => (
                <svg key={s} width="32" height="32" viewBox="0 0 24 24" fill="#FACC15">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              ))}
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-2">Enjoyed your ordering experience?</h2>
            <p className="text-gray-500 text-sm mb-6">
              Help other customers find us by leaving a quick Google review. It takes less than 30 seconds!
            </p>

            <a
              href={GOOGLE_REVIEW_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-3 rounded-full font-bold text-black text-base transition-all duration-200 mb-3"
              style={{
                background: "radial-gradient(ellipse at center, rgba(250,204,21,0.9) 20%, rgba(250,204,21,0.7) 60%, rgba(255,215,0,0.8) 100%)",
                border: "1px solid rgba(255,215,0,0.9)",
                boxShadow: "0 10px 30px rgba(250,204,21,0.4)",
                textDecoration: "none"
              }}
            >
              Leave a Google Review
            </a>

            <button
              onClick={() => setShowReviewPopup(false)}
              className="block w-full py-2 rounded-full text-sm text-gray-400 hover:text-gray-600 transition bg-transparent border-0 cursor-pointer"
            >
              Maybe later
            </button>
          </div>
        </div>
      )}

      {/* PDF Modal - Only for desktop */}
      {!isMobile && showPDFModal && currentPDFUrl && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{
            background: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(4px)"
          }}
          onClick={() => setShowPDFModal(false)}
        >
          <div
            className="relative w-11/12 h-5/6 bg-white rounded-lg shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setShowPDFModal(false)}
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
            >
              <div style={{ width: "20px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <FiX style={{ width: "100%", height: "100%", minWidth: "20px", minHeight: "20px" }} />
              </div>
            </button>

            <object
              data={currentPDFUrl}
              type="application/pdf"
              className="w-full h-full"
              style={{ border: "none" }}
            >
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <p className="mb-4 text-gray-700">Unable to display PDF in browser.</p>
                <a
                  href={currentPDFUrl}
                  download="custom-hose-assembly.pdf"
                  className="px-6 py-3 rounded-lg font-semibold transition-all"
                  style={{
                    background: "radial-gradient(ellipse at center, rgba(250, 204, 21, 0.9) 20%, rgba(250, 204, 21, 0.7) 60%, rgba(255, 215, 0, 0.8) 100%), rgba(250, 204, 21, 0.6)",
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
      )}
    </>
  );
}