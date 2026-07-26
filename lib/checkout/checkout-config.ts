// lib/checkout/checkout-config.ts
// REFACTOR PHASE 2 - EXTRACTED FROM checkout.tsx
// Centralized configuration for checkout process

// ============================================================================
// ENVIRONMENT & TESTING
// ============================================================================

export const TESTING_MODE = process.env.NEXT_PUBLIC_TESTING_MODE === 'true';

// ============================================================================
// SERVER-AUTHORITY PRICING FEATURE FLAG (price tampering fix)
// ============================================================================

/**
 * Controls the checkout price-authority flow (see lib/checkout/order-contract.ts).
 *
 * - false (default / legacy): the browser builds the PayPal order client-side
 *   and sends the full priced payload to capture-order. Compatible with the
 *   CURRENT backend. Keep this until the backend server-pricing changes ship.
 *
 * - true (new): the backend is the price authority. `createOrder` calls
 *   POST /api/paypal/create-order with price-less identifiers/config; the
 *   server recomputes every price, creates the PayPal order for its own total,
 *   and capture-order reconciles against the persisted quote. Flip this ON
 *   only once the backend accepts the new contract.
 *
 * Enable via NEXT_PUBLIC_SERVER_PRICING=true.
 */
export const SERVER_PRICING_ENABLED = process.env.NEXT_PUBLIC_SERVER_PRICING === 'true';

// ============================================================================
// API BASE URL CONFIGURATION
// ============================================================================

/**
 * Determines the correct API base URL based on environment
 * Priority:
 * 1. Vercel preview deployments (NEXT_PUBLIC_API_BASE_URL_PREVIEW)
 * 2. Testing mode (NEXT_PUBLIC_API_BASE_URL_TEST or localhost:3001)
 * 3. Production (NEXT_PUBLIC_API_BASE_URL or fluidpowergroup.com.au)
 */
export const API_BASE_URL = (() => {
  // Priority 1: If on Vercel preview deployment, use preview API
  if (process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview' && process.env.NEXT_PUBLIC_API_BASE_URL_PREVIEW) {
    console.log('🔍 Using Preview API:', process.env.NEXT_PUBLIC_API_BASE_URL_PREVIEW);
    return process.env.NEXT_PUBLIC_API_BASE_URL_PREVIEW;
  }
  
  // Priority 2: Use testing mode logic (for localhost development)
  if (TESTING_MODE) {
    console.log('🧪 Testing Mode - Using:', process.env.NEXT_PUBLIC_API_BASE_URL_TEST || 'fallback');
    return process.env.NEXT_PUBLIC_API_BASE_URL_TEST || 'http://localhost:3001';
  }
  
  // Priority 3: Production mode (live site)
  console.log('🚀 Production Mode - Using:', process.env.NEXT_PUBLIC_API_BASE_URL || 'fallback');
  return process.env.NEXT_PUBLIC_API_BASE_URL || 'https://fluidpowergroup.com.au';
})();

console.log('📍 Final API_BASE_URL:', API_BASE_URL);

// ============================================================================
// AUSTRALIA STATES
// ============================================================================

/**
 * Australian states and territories for shipping form dropdown
 * First option is placeholder
 */
export const STATES = [
  'Select State',
  'ACT',
  'NSW',
  'NT',
  'QLD',
  'SA',
  'TAS',
  'VIC',
  'WA'
] as const;

export type AustralianState = typeof STATES[number];

// ============================================================================
// ORDER STATUS
// ============================================================================

/**
 * Order processing status states
 * - idle: No order processing in progress
 * - processing: Order is being captured and confirmed
 * - completed: Order successfully completed
 * - failed: Order failed (4xx errors, validation issues)
 * - timeout: Order status unknown (5xx errors, network timeout)
 */
export type OrderStatus = 'idle' | 'processing' | 'completed' | 'failed' | 'timeout';

// ============================================================================
// PAYPAL CONFIGURATION
// ============================================================================

/**
 * PayPal SDK options
 * Note: clientId should be loaded from environment variables
 */
export const getPayPalOptions = () => ({
  clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '',
  currency: 'AUD' as const,
  intent: 'capture' as const
});

// ============================================================================
// ORDER POLLING CONFIGURATION
// ============================================================================

/**
 * Configuration for order status polling
 * Used when initial capture times out or returns 5xx error
 */
export const ORDER_POLLING_CONFIG = {
  /** Maximum number of polling attempts */
  MAX_ATTEMPTS: 20,
  /** Delay between polling attempts (milliseconds) */
  POLL_INTERVAL_MS: 2000,
  /** Maximum number of retry attempts for failed payments */
  MAX_RETRIES: 3
} as const;

// ============================================================================
// TIMEOUT CONFIGURATION
// ============================================================================

/**
 * Network timeout for API requests
 */
export const API_TIMEOUT_MS = 45000; // 45 seconds

/**
 * Cart hydration delay (to prevent redirect glitch)
 */
export const CART_HYDRATION_DELAY_MS = 100;

// ============================================================================
// DEVELOPER MODE
// ============================================================================

/**
 * Non-secret PREFIX that reveals the developer-mode mechanism in the name field.
 *
 * Type `<prefix><your-secret>` in the name field (e.g. "dev:myServerSecret"),
 * then press Enter or click away from the field to activate. Activation is
 * deliberately deferred to that explicit commit so the whole secret can be
 * typed — checking on every keystroke would fire on the first character.
 * The prefix is intentionally NOT a secret — it only signals "activate the dev
 * UI". The text AFTER the prefix is the secret and is NEVER baked into the
 * bundle: it is captured from what the user types and sent to the backend as
 * `devMode.code`, where it is validated against the server-only
 * PAYPAL_TEST_MODE_SECRET. A wrong/guessed secret still activates the local UI
 * (autofill/banner) but the server charges full price — pricing is server-gated.
 */
export const DEVELOPER_MODE_PREFIX = 'dev:';

/**
 * Demo data auto-filled when developer mode is activated
 */
export const DEVELOPER_MODE_DEMO_DATA = {
  name: 'Developer Test',
  companyName: 'Test Company',
  address: '123 Test Street',
  suburb: 'Melbourne',
  state: 'VIC' as const,
  postcode: '3000',
  email: 'absardexter@gmail.com',
  contactNumber: '0400000000'
} as const;

/**
 * Developer mode test payment amount (AUD)
 */
export const DEVELOPER_MODE_PAYMENT_AMOUNT = '0.20';

// ============================================================================
// SUPPLIER FEATURES - ACTIVATION CODES
// ============================================================================

/**
 * Invoice builder activation code
 * Enter this in the name field to:
 * - Open invoice builder in new window
 * - Pre-load cart items for invoice generation
 */
export const INVOICE_BUILDER_CODE = '20162026';

/**
 * Cart email activation code
 * Enter "FPG" or "fpg" in the name field to:
 * - Replace "Proceed to Payment" with "Send Cart to Supplier"
 * - Send cart details to supplier email
 */
export const CART_EMAIL_CODE = 'FPG';
