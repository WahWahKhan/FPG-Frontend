// pages/checkout.tsx - PHASE 3 REFACTOR
// Changes from Phase 1:
// 1. ✅ Extracted CheckoutProgress component
// 2. ✅ Extracted PDFModal to shared component
// Changes from Phase 2:
// 3. ✅ Extracted all configuration to checkout-config.ts
// 4. ✅ Replaced hardcoded constants with imports
// Changes in Phase 3:
// 5. Extracted form validation logic to form-validation.ts
// 6. Extracted ShippingForm component
// 7. Removed all form rendering and validation from this file

import { useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import { CartContext } from '../context/CartWrapper';
import { separateCartItems, calculateCartTotals, isCustomOrder } from '../utils/cart-helpers';
import { IItemCart } from '../types/cart';

// Server-authority checkout contract (price tampering fix)
import {
  buildServerOrderItems,
  buildOrderAttachments,
  CreateOrderRequest,
  CreateOrderResponse,
  CaptureOrderRequest,
} from '../lib/checkout/order-contract';

// PHASE 1 - Component imports
import CheckoutProgress from '../components/checkout/CheckoutProgress';
import PDFModal from '../components/shared/PDFModal';

// PHASE 3 - ShippingForm component
import ShippingForm from '../components/checkout/ShippingForm';

import CartEmailButton from '../components/checkout/CartEmailButton';

// PHASE 2 - Configuration imports
import {
  TESTING_MODE,
  API_BASE_URL,
  STATES,
  OrderStatus,
  getPayPalOptions,
  ORDER_POLLING_CONFIG,
  API_TIMEOUT_MS,
  CART_HYDRATION_DELAY_MS,
  DEVELOPER_MODE_DEMO_DATA,
  DEVELOPER_MODE_PAYMENT_AMOUNT,
  SERVER_PRICING_ENABLED
} from '../lib/checkout/checkout-config';

// PHASE 3 - Validation types
import { ShippingDetails } from '../lib/checkout/form-validation';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart, deleteItem } = useContext(CartContext);
  
  // Existing state
  const [isCompletingOrder, setIsCompletingOrder] = useState(false);
  const [step, setStep] = useState<'shipping' | 'payment'>('shipping');
  const [isDeveloperMode, setIsDeveloperMode] = useState(false);
  // The developer/test secret the user typed (after the prefix). Sent to the
  // backend as devMode.code for server-side validation. Never a baked constant.
  const [devModeCode, setDevModeCode] = useState('');
  // Server-authority flow: the authoritative quote (total + breakdown) returned
  // by the backend create-order. Null until the buyer initiates payment.
  const [serverQuote, setServerQuote] = useState<CreateOrderResponse | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string>('');
  const [paymentSuccessful, setPaymentSuccessful] = useState(false);

  const [isCartEmailMode, setIsCartEmailMode] = useState(false);

  const handleCartEmailActivated = () => { setIsCartEmailMode(true); };
  
  // Order processing state
  const [orderStatus, setOrderStatus] = useState<OrderStatus>('idle');
  const [orderNumber, setOrderNumber] = useState<string>('');
  const [retryCount, setRetryCount] = useState(0);

  // Hydration state
  const [isHydrated, setIsHydrated] = useState(false);
  
  // PHASE 3: Shipping details now managed by ShippingForm component
  // Parent only needs to store the validated details for payment step
  const [shippingDetails, setShippingDetails] = useState<ShippingDetails | null>(null);
  
  // PDF Modal state
  const [showPDFModal, setShowPDFModal] = useState(false);
  const [currentPDFUrl, setCurrentPDFUrl] = useState<string>('');

  // PHASE 1 - REMOVED: isMobile state and useEffect (now in PDFModal component)

  // Wait for hydration before checking cart
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsHydrated(true);
    }, CART_HYDRATION_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);
  
  // Redirect if cart is empty - but only after hydration
  useEffect(() => {
    if (!isHydrated) {
      console.log('🔍 [CHECKOUT] Skipping redirect check - not hydrated yet');
      return;
    }
    
    // Calculate separated items inside the effect to avoid stale closure
    const { pwaItems: currentPwaItems, websiteItems: currentWebsiteItems, trac360Items: currentTrac360Items, function360Items: currentFunction360Items } = separateCartItems(items);
    
    console.log('🔍 [CHECKOUT] Redirect check triggered');
    console.log('📦 Items length:', items.length);
    console.log('📦 Items:', items);
    console.log('🏗️ PWA items:', currentPwaItems.length);
    console.log('🚜 TRAC360 items:', currentTrac360Items.length);
    console.log('🛒 Website items:', currentWebsiteItems.length);
    console.log('🔧 FUNCTION360 items:', currentFunction360Items.length);
    console.log('⏰ isCompletingOrder:', isCompletingOrder);
    
    const isCompletingOrderSession = sessionStorage.getItem('orderCompleting') === 'true';
    console.log('⏰ Session completing:', isCompletingOrderSession);

    // Don't bounce to home while a saved-cart link is still resuming: the
    // ?cart=<token> param is present until CartWrapper has rehydrated the cart.
    const isResumingSavedCart =
      typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).has('cart');

    if (items.length === 0 && !isCompletingOrder && !isCompletingOrderSession && !isResumingSavedCart) {
      console.log('❌ [CHECKOUT] Redirecting to home - cart appears empty');
      router.push('/');
    } else {
      console.log('✅ [CHECKOUT] Cart has items, staying on page');
    }
  }, [items, router, isCompletingOrder, isHydrated]);
  
  const { pwaItems, websiteItems, trac360Items, function360Items } = separateCartItems(items);
  console.log('📊 [CHECKOUT] Cart separation:', {
    total: items.length,
    pwa: pwaItems.length,
    website: websiteItems.length,
    trac360: trac360Items.length,
    function360: function360Items.length
  });
  const totals = calculateCartTotals(items);

  // Display totals: prefer the SERVER-computed breakdown once a quote exists
  // (server-authority flow), otherwise fall back to the client-side estimate.
  // Client math stays for display only; it never drives what PayPal charges.
  const displayTotals = (SERVER_PRICING_ENABLED && serverQuote?.breakdown)
    ? {
        subtotal: serverQuote.breakdown.subtotal,
        shipping: serverQuote.breakdown.shipping,
        gst: serverQuote.breakdown.gst,
        total: serverQuote.breakdown.total,
      }
    : {
        subtotal: totals.subtotal,
        shipping: totals.shipping,
        gst: totals.gst,
        total: totals.total,
      };

  // Defensive display consistency (price-drift guard):
  // Once the server has priced the cart (a quote exists), display the SERVER's
  // per-line amounts too — not just the totals — so the line items always add up
  // to the subtotal the customer is actually charged. Before a quote exists,
  // line items and totals are both client-side, so they already agree. Keyed by
  // cartId (present on every custom order); website lines without a cartId fall
  // back to their cart price, which is the same Swell price the server uses.
  const serverLineAmountByCartId = new Map<number, number>();
  if (SERVER_PRICING_ENABLED && serverQuote?.breakdown?.lines) {
    for (const l of serverQuote.breakdown.lines) {
      if (l && l.cartId != null) serverLineAmountByCartId.set(l.cartId, l.amount);
    }
  }
  const lineDisplayTotal = (item: IItemCart): number => {
    if (item.cartId != null && serverLineAmountByCartId.has(item.cartId)) {
      return serverLineAmountByCartId.get(item.cartId) as number;
    }
    // Fallback: client cart value (custom orders use totalPrice; website price*qty).
    return isCustomOrder(item)
      ? (item.totalPrice || 0)
      : (item.price || 0) * (item.quantity || 1);
  };

  // PHASE 3: Using config function for PayPal options
  const paypalOptions = getPayPalOptions();

  // ============================================================================
  // PHASE 3: SHIPPING FORM HANDLERS
  // ============================================================================

  /**
   * Called when ShippingForm is completed and validated
   * Stores shipping details and advances to payment step
   */
  const handleShippingComplete = (details: ShippingDetails) => {
    console.log('Shipping form valid, proceeding to payment');
    setShippingDetails(details);
    setStep('payment');
  };

  /**
   * Called when developer mode is activated in ShippingForm
   */
  const handleDeveloperModeActivated = (code: string) => {
    setIsDeveloperMode(true);
    setDevModeCode(code);
  };

  // ============================================================================
  // Order Status Polling Function
  // ============================================================================
  
  const pollOrderStatus = async (orderId: string, maxAttempts: number = ORDER_POLLING_CONFIG.MAX_ATTEMPTS): Promise<boolean> => {
    console.log(`📊 Starting order status polling for ${orderId}`);
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`📊 Poll attempt ${attempt}/${maxAttempts}`);
        
        const response = await fetch(`${API_BASE_URL}/api/paypal/order-status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderNumber: orderId })
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log(`📊 Order status: ${result.status}`);
          
          if (result.status === 'completed') {
            console.log('✅ Order confirmed as completed');
            return true;
          } else if (result.status === 'failed') {
            console.error('❌ Order confirmed as failed');
            return false;
          }
          // Status is still 'processing', continue polling
        }
        
        // Wait before next attempt (using config value)
        await new Promise(resolve => setTimeout(resolve, ORDER_POLLING_CONFIG.POLL_INTERVAL_MS));
        
      } catch (error) {
        console.error(`❌ Poll attempt ${attempt} failed:`, error);
      }
    }
    
    console.warn('⏰ Polling timed out - order status unknown');
    return false;
  };

  // ============================================================================
  // PayPal Approval Handler
  // ============================================================================

  const handlePayPalApprove = async (data: any, actions: any) => {
    console.log('💳 PayPal approved:', data);
    
    if (!data || !data.orderID) {
      console.error('❌ PayPal approval missing orderID');
      setPaymentError('Payment error: Missing order ID');
      return;
    }

    // PHASE 3: Ensure shipping details exist before proceeding
    if (!shippingDetails) {
      console.error('❌ No shipping details available');
      setPaymentError('Shipping details missing. Please go back and complete the form.');
      return;
    }
    
    // Set processing states
    setIsProcessing(true);
    setIsCompletingOrder(true);
    setPaymentError('');
    setOrderStatus('processing');
    
    const internalOrderNumber = `FPG-${Date.now()}`;
    setOrderNumber(internalOrderNumber);
    
    try {
      console.log('🚀 Capturing payment for order:', internalOrderNumber);
      
      // Prepare payload
      const nameParts = shippingDetails.name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      const payload = {
        orderID: data.orderID,
        payerID: data.payerID,
        orderNumber: internalOrderNumber,
        isDeveloperMode: isDeveloperMode,
        userDetails: {
          firstName: firstName,
          lastName: lastName,
          email: shippingDetails.email,
          phone: shippingDetails.contactNumber,
          address: shippingDetails.address,
          city: shippingDetails.suburb,
          state: shippingDetails.state,
          postcode: shippingDetails.postcode,
          country: 'Australia',
          companyName: shippingDetails.companyName || ''
        },
        websiteProducts: websiteItems.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price || 0,
          stock: item.stock || 0,
          image: item.image || ''
        })),
        pwaOrders: pwaItems.map(item => ({
          id: item.id,
          type: item.type, 
          name: 'HOSE360 Custom Order',
          totalPrice: item.totalPrice || 0,
          quantity: 1,
          image: item.image || '',
          pdfDataUrl: item.pdfDataUrl,
          orderConfig: item.orderConfig,
          cartId: item.cartId || Date.now(),
          pwaOrderNumber: `PWA-${item.cartId || Date.now()}`
        })),
        trac360Orders: trac360Items.map(item => ({
          id: item.id,
          type: item.type, 
          name: item.name,
          totalPrice: item.totalPrice || 0,
          quantity: 1,
          image: item.image || '',
          pdfDataUrl: item.pdfDataUrl,
          tractorConfig: item.tractorConfig,
          cartId: item.cartId || Date.now(),
          trac360OrderNumber: `TRAC-${item.cartId || Date.now()}`
        })),
        function360Orders: function360Items.map(item => ({
          id: item.id,
          type: item.type, 
          name: item.name,
          totalPrice: item.totalPrice || 0,
          quantity: 1,
          image: item.image || '',
          pdfDataUrl: item.pdfDataUrl,
          configuration: (item as any).configuration,
          cartId: item.cartId || Date.now(),
          function360OrderNumber: `FUNC-${item.cartId || Date.now()}`
        })),
        totals: {
          subtotal: displayTotals.subtotal,
          shipping: displayTotals.shipping,
          gst: displayTotals.gst,
          total: displayTotals.total
        }
      };

      // ============================================================================
      // CAPTURE PAYLOAD — server-authority vs legacy
      // ----------------------------------------------------------------------------
      // Legacy backend expects the full priced payload above. The new
      // server-authority flow sends ONLY price-less identifiers; the backend
      // rebuilds line items from the quote it persisted at create-order time and
      // reconciles PayPal's captured amount against that quote. `payload` (above)
      // is still used locally to render the order-confirmation page.
      // ============================================================================
      const capturePayload: any = SERVER_PRICING_ENABLED
        ? ({
            orderID: data.orderID,
            payerID: data.payerID,
            orderNumber: internalOrderNumber,
            userDetails: payload.userDetails,
            items: buildServerOrderItems(items),
            attachments: buildOrderAttachments(items),
            devMode: {
              requested: isDeveloperMode,
              code: isDeveloperMode ? devModeCode : undefined,
              amount: isDeveloperMode ? DEVELOPER_MODE_PAYMENT_AMOUNT : undefined,
            },
          } as CaptureOrderRequest)
        : payload;

      console.log('📤 Calling capture-order API...');
      
      // ============================================================================
      // Proper timeout handling with AbortController
      // ============================================================================
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
      
      let response;
      try {
        response = await fetch(`${API_BASE_URL}/api/paypal/capture-order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(capturePayload),
          signal: controller.signal
        });
        clearTimeout(timeoutId);
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        
        if (fetchError.name === 'AbortError') {
          // ============================================================================
          // PROPER TIMEOUT HANDLING - No optimistic success!
          // ============================================================================
          console.warn(`⏰ Request timed out after ${API_TIMEOUT_MS / 1000} seconds`);
          setOrderStatus('timeout');
          
          // Start polling to check if order actually completed
          console.log('📊 Starting status polling due to timeout...');
          const orderCompleted = await pollOrderStatus(internalOrderNumber);
          
          if (orderCompleted) {
            console.log('✅ Order confirmed via polling despite timeout');
            await handleOrderSuccess(internalOrderNumber, data.orderID, payload);
          } else {
            console.error('❌ Order could not be confirmed after timeout');
            setOrderStatus('failed');
            setPaymentError(
              'Payment processing timed out. Please check your email for confirmation or contact support with order number: ' + 
              internalOrderNumber
            );
            setIsProcessing(false);
            setIsCompletingOrder(false);
          }
          return;
        }
        
        throw fetchError; // Re-throw other fetch errors
      }
      
      // ============================================================================
      // Proper error handling - NO optimistic success on 500/502
      // ============================================================================
      
      if (!response.ok) {
        console.error(`❌ Capture API returned status ${response.status}`);
        
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: 'Server error' };
        }
        
        // CRITICAL FIX: NO optimistic handling for server errors
        if (response.status >= 500) {
          console.error('❌ Server error occurred - order status unknown');
          setOrderStatus('timeout');
          
          // Poll to check actual order status
          console.log('📊 Starting status polling due to server error...');
          const orderCompleted = await pollOrderStatus(internalOrderNumber);
          
          if (orderCompleted) {
            console.log('✅ Order confirmed via polling despite server error');
            await handleOrderSuccess(internalOrderNumber, data.orderID, payload);
          } else {
            console.error('❌ Order could not be confirmed after server error');
            setOrderStatus('failed');
            setPaymentError(
              'Payment processing encountered an error. Please check your email for confirmation or contact support with order number: ' + 
              internalOrderNumber
            );
            setIsProcessing(false);
            setIsCompletingOrder(false);
          }
          return;
        }
        
        // For 4xx errors, show error immediately
        setOrderStatus('failed');
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }
      
      // ============================================================================
      // SUCCESS FLOW
      // ============================================================================
      
      const result = await response.json();
      console.log('✅ Capture result:', result);
      
      if (result.success) {
        await handleOrderSuccess(internalOrderNumber, result.paypalCaptureID, payload);
      } else {
        throw new Error(result.error || 'Payment processing failed');
      }
      
    } catch (error: any) {
      console.error('❌ Payment processing error:', error);
      setOrderStatus('failed');
      setPaymentError(error.message || 'Payment failed. Please try again.');
      setIsProcessing(false);
      setIsCompletingOrder(false);
    }
  };

  // ============================================================================
  // Success Handler - Strips PDFs to avoid localStorage quota
  // ============================================================================

  const handleOrderSuccess = async (
    orderNum: string, 
    captureId: string, 
    payload: any
  ) => {
    console.log('🎉 Processing successful order:', orderNum);
    setOrderStatus('completed');
    
    // Create lightweight order metadata WITHOUT PDFs
    // PDFs remain in shopping-cart localStorage for order-confirmation to read
    const orderData = {
      orderNumber: orderNum,
      orderDate: new Date().toISOString(),
      paypalCaptureID: captureId,
      userDetails: payload.userDetails,
      websiteProducts: payload.websiteProducts,
      pwaOrders: payload.pwaOrders.map((order: any) => ({
        id: order.id,
        name: order.name,
        totalPrice: serverLineAmountByCartId.get(order.cartId) ?? order.totalPrice,
        quantity: order.quantity,
        image: order.image,
        pwaOrderNumber: order.pwaOrderNumber,
        cartId: order.cartId
        // Stripped: pdfDataUrl (will be read from shopping-cart)
        // Stripped: orderConfig (not needed for display)
      })),
      trac360Orders: payload.trac360Orders.map((order: any) => ({
        id: order.id,
        name: order.name,
        totalPrice: serverLineAmountByCartId.get(order.cartId) ?? order.totalPrice,
        quantity: order.quantity,
        image: order.image,
        trac360OrderNumber: order.trac360OrderNumber,
        cartId: order.cartId
        // Stripped: pdfDataUrl (will be read from shopping-cart)
        // Stripped: tractorConfig (not needed for display)
      })),
      function360Orders: payload.function360Orders.map((order: any) => ({  // ← ADD THIS BLOCK
        id: order.id,
        name: order.name,
        totalPrice: serverLineAmountByCartId.get(order.cartId) ?? order.totalPrice,
        quantity: order.quantity,
        image: order.image,
        function360OrderNumber: order.function360OrderNumber,
        cartId: order.cartId,
        configuration: order.configuration  // ← Keep configuration for display
        // Stripped: pdfDataUrl (will be read from shopping-cart)
      })),
      totals: payload.totals,
      testingMode: TESTING_MODE
    };
    
    // Save lightweight metadata to localStorage
    try {
      localStorage.setItem('lastOrder', JSON.stringify(orderData));
      console.log('💾 Order metadata saved successfully (~10KB)');
    } catch (error) {
      console.error('⚠️ Failed to save order metadata:', error);
      // Continue anyway - order still succeeded on backend
    }
    
    // Set session flag
    sessionStorage.setItem('orderCompleting', 'true');
    
    // Clear cart UI (but DON'T remove shopping-cart from localStorage yet)
    // The order-confirmation page needs to read PDFs from it
    clearCart(); // This only clears React state, not localStorage
    
    console.log('📦 Cart UI cleared, localStorage preserved for order-confirmation');
    
    // Redirect to confirmation page
    console.log('🚀 Redirecting to order confirmation...');
    setTimeout(() => {
      router.push('/order-confirmation');
    }, 100);
  };

  // ============================================================================
  // PayPal Cancel/Error Handlers
  // ============================================================================

  const handlePayPalCancel = (data: any) => {
    console.log('🚫 Payment cancelled:', data);
    setOrderStatus('idle');
    setPaymentError('Payment was cancelled. Your cart is still saved.');
  };

  const handlePayPalError = (error: any) => {
    console.error('❌ PayPal error:', error);
    setOrderStatus('failed');
    setPaymentError('There was a problem with PayPal. Please try again.');
  };

  const handleRetryPayment = () => {
    setPaymentError('');
    setIsProcessing(false);
    setOrderStatus('idle');
    setRetryCount(0); // Reset retry count
  };

  // ============================================================================
  // RENDER: Processing Overlay
  // ============================================================================
  
  const renderProcessingOverlay = () => {
    if (orderStatus === 'timeout') {
      return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 max-w-md text-center shadow-2xl">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-yellow-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2 text-gray-900">Verifying Payment...</h3>
            <p className="text-gray-700 mb-2">
              Payment processing is taking longer than usual.
            </p>
            <p className="text-sm text-gray-600">
              We&apos;re checking the status with PayPal. Please don&apos;t close this window.
            </p>
            {orderNumber && (
              <p className="text-xs text-gray-500 mt-4">
                Order #: {orderNumber}
              </p>
            )}
          </div>
        </div>
      );
    }
    
    if (isProcessing && orderStatus === 'processing') {
      return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 max-w-md text-center shadow-2xl">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-yellow-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Processing Payment...</h3>
            <p className="text-gray-600">Please wait while we confirm your payment.</p>
            <p className="text-sm text-gray-500 mt-2">Do not close this window.</p>
          </div>
        </div>
      );
    }
    
    return null;
  };

  // ============================================================================
  // PDF VIEWER HANDLER - PHASE 1: Simplified (modal handles mobile detection)
  // ============================================================================
  
  const handleViewPDF = (pdfDataUrl: string | undefined) => {
    if (!pdfDataUrl) {
      alert('PDF not available');
      return;
    }
    
    // PHASE 1: Simplified - just set state, PDFModal component handles mobile logic
    setCurrentPDFUrl(pdfDataUrl);
    setShowPDFModal(true);
  };

  // ============================================================================
  // PHASE 3: Form validation moved to form-validation.ts
  // Form rendering moved to ShippingForm.tsx component
  // ============================================================================

  // ============================================================================
  // RENDER: Order Summary
  // ============================================================================
  
  const renderOrderSummary = () => {
    console.log('🎨 [RENDER] Order Summary rendering');
    console.log('🚜 TRAC360 items in render:', trac360Items);
    console.log('📦 All items:', items);
  
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">
          Order Summary
        </h2>
  
        {/* Website Products */}
        {websiteItems.length > 0 && (
          <div className="mb-4">
            <h3 className="font-semibold text-gray-700 mb-2">Products</h3>
            {websiteItems.map((item, index) => (
              <div
                key={index}
                className="flex justify-between items-center py-2 border-b border-gray-200"
              >
                <div className="flex items-center gap-3 flex-1">
                  {item.image && (
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={50}
                      height={50}
                      className="rounded object-cover"
                    />
                  )}
                  <div>
                    <p className="font-medium text-gray-800">{item.name}</p>
                    <p className="text-sm text-gray-600">
                      Qty: {item.quantity}
                    </p>
                  </div>
                </div>
  
                <div className="flex items-center gap-3">
                  <p
                    className="font-semibold text-gray-800"
                    style={{
                      minWidth: "80px",
                      textAlign: "right",
                      paddingRight: "8px"
                    }}
                  >
                    A${lineDisplayTotal(item).toFixed(2)}
                  </p>
  
                  <button
                    onClick={() => deleteItem(item)}
                    className="p-1.5 rounded-lg border border-red-600/30 bg-red-50/80 text-red-600 hover:bg-red-400/20 hover:border-red-600/50 transition-colors"
                    aria-label="Remove item"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      
      {/* PWA Orders */}
      {pwaItems.length > 0 && (
        <div className="mb-4">
          <h3 className="font-semibold text-gray-700 mb-2">Custom Hose Assemblies</h3>
          {pwaItems.map((item, index) => (
            <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 bg-blue-50 px-2 rounded">
              <div className="flex items-center gap-3 flex-1">
                {item.image && (
                  <Image 
                    src='/Hose360.png'
                    alt={item.name} 
                    width={50} 
                    height={50}
                    className="rounded object-cover"
                  />
                )}
                <div>
                  <p className="font-medium text-gray-800">HOSE360 Custom Order</p>
                  <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                  {item.pdfDataUrl && (
                    <button
                      onClick={() => handleViewPDF(item.pdfDataUrl)}
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
                      Click to View PDF
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <p className="font-semibold text-gray-800" style={{ minWidth: "80px", textAlign: "right", paddingRight: "8px" }}>
                  A${lineDisplayTotal(item).toFixed(2)}
                </p>
                <button
                  onClick={() => deleteItem(item)}
                  className="p-1.5 rounded-lg border border-red-600/30 bg-red-50/80 text-red-600 hover:bg-red-400/20 hover:border-red-600/50 transition-colors"
                  aria-label="Remove item"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

        {/* Trac360 Orders */}
        {trac360Items.length > 0 && (
          <div className="mb-4">
            <h3 className="font-semibold text-gray-700 mb-2">Custom Tractor Configurations</h3>
            {trac360Items.map((item, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 bg-green-50 px-2 rounded">
                <div className="flex items-center gap-3 flex-1">
                  {item.image && (
                    <Image 
                      src={item.image} 
                      alt={item.name} 
                      width={50} 
                      height={50}
                      className="rounded object-cover"
                    />
                  )}
                  <div>
                    <p className="font-medium text-gray-800">{item.name}</p>
                    <p className="text-sm text-gray-600">
                      {item.tractorConfig?.modelNumber || 'Model N/A'} • {item.tractorConfig?.driveType || ''} • {item.tractorConfig?.cabinType || ''}
                    </p>
                    <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                    {item.pdfDataUrl && (
                      <button
                        onClick={() => handleViewPDF(item.pdfDataUrl)}
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
                        Click to View PDF
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-semibold text-gray-800" style={{ minWidth: "80px", textAlign: "right", paddingRight: "8px" }}>
                    A${lineDisplayTotal(item).toFixed(2)}
                  </p>
                  <button
                    onClick={() => deleteItem(item)}
                    className="p-1.5 rounded-lg border border-red-600/30 bg-red-50/80 text-red-600 hover:bg-red-400/20 hover:border-red-600/50 transition-colors"
                    aria-label="Remove item"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Function360 Orders */}
        {function360Items.length > 0 && (
          <div className="mb-4">
            <h3 className="font-semibold text-gray-700 mb-2">Custom Hydraulic Function Kits</h3>
            {function360Items.map((item, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 bg-yellow-50 px-2 rounded">
                <div className="flex items-center gap-3 flex-1">
                  {item.image && (
                    <Image 
                      src='/Function360.png' 
                      alt={item.name} 
                      width={50} 
                      height={50}
                      className="rounded object-cover"
                    />
                  )}
                  <div>
                    <p className="font-medium text-gray-800">FUNCTION360 Custom Order</p>
                    <p className="text-sm text-gray-600">
                      {(item as any).configuration?.equipment?.functionType?.replace(/_/g, ' ')?.toUpperCase() || 'Custom Kit'}
                    </p>
                    <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                    {item.pdfDataUrl && (
                      <button
                        onClick={() => handleViewPDF(item.pdfDataUrl)}
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
                        Click to View PDF
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-semibold text-gray-800" style={{ minWidth: "80px", textAlign: "right", paddingRight: "8px" }}>
                    A${lineDisplayTotal(item).toFixed(2)}
                  </p>
                  <button
                    onClick={() => deleteItem(item)}
                    className="p-1.5 rounded-lg border border-red-600/30 bg-red-50/80 text-red-600 hover:bg-red-400/20 hover:border-red-600/50 transition-colors"
                    aria-label="Remove item"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      
      {/* Totals */}
      <div className="mt-6 space-y-2 text-sm">
        <div className="flex justify-between text-gray-700">
          <span>Subtotal:</span>
          <span style={{ minWidth: "80px", textAlign: "right", paddingRight: "48px" }}>A${displayTotals.subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-gray-700">
          <span>Shipping:</span>
          <span style={{ minWidth: "80px", textAlign: "right", paddingRight: "48px" }}>A${displayTotals.shipping.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-gray-700">
          <span>GST (10%):</span>
          <span style={{ minWidth: "80px", textAlign: "right", paddingRight: "48px" }}>A${displayTotals.gst.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-xl font-bold pt-3 border-t-2 border-yellow-500">
          <span>Total:</span>
          <span style={{ minWidth: "80px", textAlign: "right", paddingRight: "48px" }}>A${displayTotals.total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

  // ============================================================================
  // RENDER: Shipping Form
  // ============================================================================
  
  // ============================================================================
  // PHASE 3: Shipping form rendering moved to ShippingForm.tsx component
  // ============================================================================

  // ============================================================================
  // RENDER: Payment Section
  // ============================================================================
  
  const renderPaymentSection = () => {
    // PHASE 3: Safety check - shouldn't reach payment without shipping details
    if (!shippingDetails) {
      return (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Error</h2>
          <p className="text-red-600">Shipping details are missing. Please go back and complete the shipping form.</p>
          <button
            onClick={() => setStep('shipping')}
            className="mt-4 py-2 px-6 bg-yellow-500 text-black font-semibold rounded-lg hover:bg-yellow-600"
          >
            Back to Shipping
          </button>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Payment</h2>
        
        {/* Shipping Details Review */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">Shipping To:</h3>
          <p>{shippingDetails.name}</p>
          {shippingDetails.companyName && <p>{shippingDetails.companyName}</p>}
          <p>{shippingDetails.address}</p>
          <p>{shippingDetails.suburb}, {shippingDetails.state} {shippingDetails.postcode}</p>
          <p className="text-sm text-gray-600 mt-2">{shippingDetails.email}</p>
          <p className="text-sm text-gray-600">{shippingDetails.contactNumber}</p>
        <button
          onClick={() => setStep('shipping')}
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
          Edit Shipping Details
        </button>
      </div>
      
      {/* Order Total Reminder */}
      <div className="mb-6 p-4 bg-yellow-50 border-2 border-yellow-500 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-lg">Total Amount:</span>
          <span className="font-bold text-2xl text-yellow-600">
            A${displayTotals.total.toFixed(2)}
          </span>
        </div>
      </div>
      
      {/* Payment Error Display */}
      {paymentError && (
        <div className="mb-6 p-4 bg-red-50 border-2 border-red-500 rounded-lg">
          <p className="text-red-700 font-semibold">❌ {paymentError}</p>
          <button
            onClick={handleRetryPayment}
            className="mt-2 text-sm text-red-600 underline hover:text-red-800"
          >
            Try Again
          </button>
        </div>
      )}
      
      {/* Conditional: Cart Email Button OR PayPal Button */}
      {isCartEmailMode ? (
        <CartEmailButton
          items={items}
          userDetails={{
            name: shippingDetails.name,
            email: shippingDetails.email,
            phone: shippingDetails.contactNumber,
            address: shippingDetails.address,
            suburb: shippingDetails.suburb,
            state: shippingDetails.state,
            postcode: shippingDetails.postcode,
            companyName: shippingDetails.companyName
          }}
        />
      ) : (
        <>
          {/* PayPal Button */}
          {!isProcessing && paypalOptions.clientId && (
            <div className="mb-6 flex justify-center">
              <div style={{ width: "100%", maxWidth: "450px" }}>
                <PayPalScriptProvider options={paypalOptions}>
                  <PayPalButtons
                    style={{
                      layout: 'vertical',
                      color: 'gold',
                      shape: 'pill',
                      label: 'paypal',
                      height: 55
                    }}
                    className="paypal-buttons-custom"
                    createOrder={async (data, actions) => {
                      // ============================================================
                      // SERVER-AUTHORITY FLOW: the backend is the price authority.
                      // Send price-less identifiers/config; the server recomputes
                      // the total, creates the PayPal order, and returns its id.
                      // ============================================================
                      if (SERVER_PRICING_ENABLED) {
                        const controller = new AbortController();
                        const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

                        const requestBody: CreateOrderRequest = {
                          items: buildServerOrderItems(items),
                          shipping: shippingDetails
                            ? {
                                firstName: shippingDetails.name.trim().split(' ')[0] || '',
                                lastName: shippingDetails.name.trim().split(' ').slice(1).join(' ') || '',
                                email: shippingDetails.email,
                                phone: shippingDetails.contactNumber,
                                address: shippingDetails.address,
                                city: shippingDetails.suburb,
                                state: shippingDetails.state,
                                postcode: shippingDetails.postcode,
                                country: 'Australia',
                                companyName: shippingDetails.companyName || '',
                              }
                            : undefined,
                          devMode: {
                            requested: isDeveloperMode,
                            code: isDeveloperMode ? devModeCode : undefined,
                            amount: isDeveloperMode ? DEVELOPER_MODE_PAYMENT_AMOUNT : undefined,
                          },
                          orderNumber: `FPG-${Date.now()}`,
                          // If this checkout was resumed from a saved-cart link,
                          // pass the token so the server can honour the 7-day
                          // price hold (it verifies the cart is unchanged).
                          savedCartToken:
                            typeof window !== 'undefined'
                              ? localStorage.getItem('fpg-saved-cart-token') || undefined
                              : undefined,
                        };

                        try {
                          const res = await fetch(`${API_BASE_URL}/api/paypal/create-order`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(requestBody),
                            signal: controller.signal,
                          });
                          clearTimeout(timeoutId);

                          if (!res.ok) {
                            const err = await res.json().catch(() => ({}));
                            throw new Error(err.error || `Could not start payment (status ${res.status})`);
                          }

                          const quote: CreateOrderResponse = await res.json();
                          if (!quote.orderID) {
                            throw new Error('Server did not return an order ID');
                          }

                          console.log('🧾 Server quote:', quote.amount, quote.breakdown);
                          setServerQuote(quote);
                          setPaymentError('');
                          return quote.orderID;
                        } catch (err: any) {
                          clearTimeout(timeoutId);
                          console.error('❌ create-order failed:', err);
                          setPaymentError(
                            err?.name === 'AbortError'
                              ? 'Starting payment timed out. Please try again.'
                              : (err?.message || 'Could not start payment. Please try again.')
                          );
                          throw err;
                        }
                      }

                      // ============================================================
                      // LEGACY FLOW (client-side amount). Unchanged. Compatible
                      // with the current backend until SERVER_PRICING_ENABLED flips.
                      // ============================================================
                      const orderAmount = isDeveloperMode ? DEVELOPER_MODE_PAYMENT_AMOUNT : totals.total.toFixed(2);

                      console.log(isDeveloperMode ? '🔧 Developer Mode: Using test amount $0.20' : `Creating order for $${orderAmount}`);

                      return actions.order.create({
                        intent: 'CAPTURE',
                        purchase_units: [{
                          description: isDeveloperMode
                            ? `FluidPower Order - DEVELOPER TEST - A$${orderAmount}`
                            : `FluidPower Order - A$${orderAmount}`,
                          amount: {
                            currency_code: 'AUD',
                            value: orderAmount
                          }
                        }]
                      });
                    }}
                    onApprove={handlePayPalApprove}
                    onCancel={handlePayPalCancel}
                    onError={handlePayPalError}
                  />
                </PayPalScriptProvider>
              </div>
            </div>
          )}
        </>
      )}
      
      {/* No Client ID Warning */}
      {!paypalOptions.clientId && !isProcessing && (
        <div className="mb-6 p-4 bg-red-50 border-2 border-red-500 rounded-lg">
          <p className="text-red-700 font-semibold">⚠️ PayPal is not configured</p>
          <p className="text-sm text-red-600 mt-2">
            Please add NEXT_PUBLIC_PAYPAL_CLIENT_ID to your .env.local file and restart the server.
          </p>
        </div>
      )}
      
      {/* Processing State */}
      {isProcessing && (
        <div className="mb-6 p-8 bg-blue-50 border-2 border-blue-500 rounded-lg text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-500 mx-auto mb-4"></div>
          <p className="text-blue-700 font-semibold text-lg">Processing Payment...</p>
          <p className="text-blue-600 text-sm mt-2">Please wait, do not close this window.</p>
        </div>
      )}
      
      <p className="text-sm text-gray-600 text-center mb-4">
        Secure payment processed by PayPal. You dont need a PayPal account to pay.
      </p>
      
      {/* Back Button */}
      <div className="flex justify-center">
        <button
          onClick={() => setStep('shipping')}
          disabled={isProcessing}
          className="relative overflow-hidden transition-all duration-300 ease-out"
          style={{
            cursor: isProcessing ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "14px 28px",
            borderRadius: "40px",
            fontSize: "1.125rem",
            fontWeight: "600",
            color: isProcessing ? "#9CA3AF" : "#fff",
            textDecoration: "none",
            transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
            position: "relative",
            whiteSpace: "nowrap",
            minWidth: "180px",
            width: "auto",
            background: isProcessing 
              ? "rgba(229, 231, 235, 0.5)"
              : `radial-gradient(ellipse at center, rgba(0, 0, 0, 0.9) 20%, rgba(0, 0, 0, 0.8) 70%, rgba(20, 20, 20, 0.85) 100%), rgba(0, 0, 0, 0.8)`,
            backdropFilter: isProcessing ? "none" : "blur(15px)",
            border: isProcessing 
              ? "1px solid rgba(209, 213, 219, 0.5)"
              : "1px solid rgba(255, 255, 255, 0.2)",
            boxShadow: isProcessing
              ? "none"
              : `
                0 4px 15px rgba(0, 0, 0, 0.3),
                inset 0 1px 0 rgba(255, 255, 255, 0.3),
                inset 0 2px 8px rgba(255, 255, 255, 0.1),
                inset 0 -1px 0 rgba(0, 0, 0, 0.2)
              `,
            opacity: isProcessing ? 0.5 : 1
          }}
          onMouseEnter={(e) => {
            if (!isProcessing) {
              e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
              e.currentTarget.style.background = `radial-gradient(ellipse at center, rgba(255, 255, 255, 0.95) 20%, rgba(255, 255, 255, 0.9) 70%, rgba(245, 245, 245, 0.95) 100%), rgba(255, 255, 255, 0.9)`;
              e.currentTarget.style.border = "1px solid rgba(200, 200, 200, 0.8)";
              e.currentTarget.style.color = "#000";
              e.currentTarget.style.boxShadow = `
                0 10px 30px rgba(0, 0, 0, 0.2),
                inset 0 2px 0 rgba(255, 255, 255, 1),
                inset 0 3px 10px rgba(255, 255, 255, 0.8),
                inset 0 -1px 0 rgba(200, 200, 200, 0.4)
              `;
            }
          }}
          onMouseLeave={(e) => {
            if (!isProcessing) {
              e.currentTarget.style.transform = "translateY(0px) scale(1)";
              e.currentTarget.style.background = `radial-gradient(ellipse at center, rgba(0, 0, 0, 0.9) 20%, rgba(0, 0, 0, 0.8) 70%, rgba(20, 20, 20, 0.85) 100%), rgba(0, 0, 0, 0.8)`;
              e.currentTarget.style.border = "1px solid rgba(255, 255, 255, 0.2)";
              e.currentTarget.style.color = "#fff";
              e.currentTarget.style.boxShadow = `
                0 4px 15px rgba(0, 0, 0, 0.3),
                inset 0 1px 0 rgba(255, 255, 255, 0.3),
                inset 0 2px 8px rgba(255, 255, 255, 0.1),
                inset 0 -1px 0 rgba(0, 0, 0, 0.2)
              `;
            }
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "1px",
              left: "8px",
              right: "8px",
              height: "50%",
              background: "linear-gradient(180deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%)",
              borderRadius: "40px 40px 20px 20px",
              pointerEvents: "none",
              transition: "all 0.4s ease"
            }}
          />
          ← Back to Shipping
        </button>
      </div>
</div>
  );
  }

  // ============================================================================
  // MAIN RENDER
  // ============================================================================
  
  return (
    <>
      {/* Loading state during hydration */}
      {!isHydrated && (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading checkout...</p>
          </div>
        </div>
      )}
  
      {/* Only show checkout content after hydration */}
      {isHydrated && (
        <>
          <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-4xl mx-auto">
              {/* Logo */}
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800">FluidPower Group</h1>
                <p className="text-2xl font-semibold text-gray-700 mt-1">Checkout</p>
              </div>
              
              {/* PHASE 1: Using CheckoutProgress component */}
              <CheckoutProgress currentStep={step} />

              {/* Developer Mode Banner */}
              {isDeveloperMode && (
                <div className="mb-4 p-4 bg-orange-100 border-2 border-orange-500 rounded-lg">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-2xl">🔧</span>
                    <div className="text-center">
                      <p className="font-bold text-orange-700">Developer Mode Active</p>
                      <p className="text-sm text-orange-600">Payment amount: A$0.20 | Demo data loaded</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Order Summary (Always Visible) */}
              {renderOrderSummary()}
              
              {/* PHASE 3: Conditional Content Based on Step */}
              {step === 'shipping' ? (
                <ShippingForm
                onContinue={handleShippingComplete}
                onDeveloperModeActivated={handleDeveloperModeActivated}
                onCartEmailActivated={handleCartEmailActivated}  // NEW
                initialDetails={shippingDetails || undefined}
              />
              ) : (
                renderPaymentSection()
              )}
            </div>
            
            {/* Global Processing Overlay */}
            {renderProcessingOverlay()}
          </div>

          {/* PHASE 1: Using PDFModal component */}
          <PDFModal
            isOpen={showPDFModal}
            pdfUrl={currentPDFUrl}
            onClose={() => setShowPDFModal(false)}
            title="Custom Hose Assembly PDF"
          />
        </>
      )}
    </>
  );
}