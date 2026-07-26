// lib/checkout/order-contract.ts
// ============================================================================
// SERVER-AUTHORITY ORDER CONTRACT (price tampering fix — frontend half)
// ============================================================================
//
// This module defines the *price-less* request/response contract between the
// browser and the backend PayPal endpoints for the new "server is the price
// authority" flow (feature-flagged by SERVER_PRICING_ENABLED).
//
// SECURITY PRINCIPLE
// ------------------
// The browser sends only WHAT was ordered — product ids, configurator
// selection ids, quantities. It NEVER sends an authoritative price, subtotal,
// shipping, GST, discount, or total. The backend recomputes every line from
// trusted sources (Swell + server-held rule tables) and drives the PayPal
// charge from its own number.
//
// This file is the single source of truth for the wire shape. When the backend
// `create-order.js` / `capture-order.js` are rewritten (later session), they
// MUST match the types below.
// ============================================================================

import { IItemCart } from '../../types/cart';
import type { SelectedComponents, EquipmentSelection } from '../../types/function360';

// ============================================================================
// REQUEST LINE ITEMS (browser -> backend, NO prices)
// ============================================================================

/** A website catalog product priced by the backend via Swell. */
export interface WebsiteOrderItem {
  kind: 'website';
  /** Swell product id (UUID). The backend prices from this, never from the client. */
  productId: string;
  /** Optional Swell variant id, if the product model ever supports variants. */
  variantId?: string;
  quantity: number;
  /** Correlation only — used to match back to the cart line for display/inventory. */
  cartId?: number;
}

/**
 * A FUNCTION360 fixed-component kit. Backend sums the selected components from
 * its own server-held price table (do NOT trust any client component price).
 */
export interface Function360OrderItem {
  kind: 'function360';
  cartId: number;
  /** Boolean map of which of the six components are selected. */
  selectedComponents: SelectedComponents;
  /** Equipment selection (horsepower / function type) — context, not price. */
  equipment: EquipmentSelection;
}

/** Selection ids for a single TRAC360 add-on (no prices). */
export interface Trac360AddonSelection {
  id: string;
  selectedSubOptionId: string | null;
}

/**
 * TRAC360 configurator selections as IDENTIFIERS ONLY. The backend reprices
 * base + circuit + add-ons + sub-options from its own rule table using these
 * ids (mirrors utils/trac360/pricing.ts::calculatePriceBreakdown).
 */
export interface Trac360LineConfig {
  operationTypeId: string | null;
  circuitId: string | null;
  addons: Trac360AddonSelection[];
}

export interface Trac360OrderItem {
  kind: 'trac360';
  cartId: number;
  config: Trac360LineConfig;
}

/**
 * HOSE360 / PWA custom hose assembly. Sends the raw configurator SELECTIONS
 * (hose id, end shapes/sizes, angle, cut lengths, protection, pressure test,
 * quantity) WITHOUT any of the *Price / *Cost / total* fields. The backend
 * reprices from the values already held server-side in get-prices.js.
 */
export interface PwaLineConfig {
  selectedHose?: any;
  end1Shape?: string;
  end1Size?: string;
  end2Shape?: string;
  end2Size?: string;
  selectedAngle?: string;
  quantity?: number;
  cutLengths?: Array<{ length: string; unit?: string }>;
  selectedProtection?: string;
  selectedPressure?: string;
  isOrderFittingMode?: boolean;
  selectedMethod?: string;
  selectedService?: string;
}

export interface PwaOrderItem {
  kind: 'pwa';
  cartId: number;
  orderConfig: PwaLineConfig;
}

/** Discriminated union of every order line the backend must reprice. */
export type ServerOrderItem =
  | WebsiteOrderItem
  | Function360OrderItem
  | Trac360OrderItem
  | PwaOrderItem;

// ============================================================================
// DEVELOPER / TEST MODE (server-gated)
// ============================================================================
//
// The client can *request* developer/test pricing, but it can NEVER set the
// amount. The backend validates `code` against a server-only secret and, only
// if it matches (and the deployment permits it), applies a server-configured
// test amount. A raw boolean from the browser must do nothing on its own.
export interface DevModeSignal {
  requested: boolean;
  /** Activation code; backend validates against a server-held secret. */
  code?: string;
  /**
   * Requested test amount (string, e.g. "0.20"). Only honoured by the server if
   * `code` matches the server secret; the server also clamps it. Never a way to
   * set the real charge.
   */
  amount?: string;
}

/**
 * Non-price data for a line, matched to the server quote by cartId at capture
 * time: the generated PDF (custom orders) plus display name/image for
 * invoice/email. Contains NO authoritative price — money comes from the quote.
 */
export interface OrderAttachment {
  cartId?: number;
  type?: string;
  name?: string;
  image?: string;
  pdfDataUrl?: string;
}

// ============================================================================
// REQUEST / RESPONSE ENVELOPES
// ============================================================================

export interface ShippingAddress {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
  companyName?: string;
}

/** POST /api/paypal/create-order request body (new flow). NO prices/totals. */
export interface CreateOrderRequest {
  items: ServerOrderItem[];
  /** Address only — never a shipping cost. */
  shipping?: ShippingAddress;
  devMode?: DevModeSignal;
  /** Internal order number for correlation/logging (not used for pricing). */
  orderNumber?: string;
  /**
   * Present only when this checkout was resumed from a "save cart for later"
   * link. The server honours the price quoted when the cart was saved (for up
   * to 7 days) ONLY if the token is valid and the cart is unchanged. It can
   * never raise the price and can never be used to force a lower price — the
   * server verifies everything against its own stored quote.
   */
  savedCartToken?: string;
}

/** Server-computed money breakdown returned to the browser for DISPLAY only. */
export interface ServerBreakdown {
  currency: string;
  subtotal: number;
  shipping: number;
  gst: number;
  total: number;
  lines?: Array<{ cartId?: number; kind: string; amount: number; name?: string }>;
}

/** POST /api/paypal/create-order response body (new flow). */
export interface CreateOrderResponse {
  orderID: string;
  amount: { currency: string; value: string };
  breakdown?: ServerBreakdown;
}

/**
 * POST /api/paypal/capture-order request body (new flow). NO prices/totals.
 * The backend rebuilds line items for inventory/invoice/email from the quote
 * it persisted at create time (keyed by orderID), NOT from this payload.
 * `items` is included for correlation/defense-in-depth only.
 */
export interface CaptureOrderRequest {
  orderID: string;
  payerID?: string;
  orderNumber: string;
  userDetails: ShippingAddress;
  items: ServerOrderItem[];
  /** Non-price PDFs + labels for invoice/email, matched to the quote by cartId. */
  attachments: OrderAttachment[];
  devMode?: DevModeSignal;
}

// ============================================================================
// BUILDER — cart items -> price-less order lines
// ============================================================================

/**
 * Whitelist the SELECTION fields from a PWA orderConfig, dropping every
 * price/cost/total field so no authoritative price crosses the wire.
 */
function pickPwaSelections(orderConfig: any): PwaLineConfig {
  if (!orderConfig || typeof orderConfig !== 'object') return {};
  const {
    selectedHose,
    end1Shape,
    end1Size,
    end2Shape,
    end2Size,
    selectedAngle,
    quantity,
    cutLengths,
    selectedProtection,
    selectedPressure,
    isOrderFittingMode,
    selectedMethod,
    selectedService,
  } = orderConfig;

  return {
    selectedHose,
    end1Shape,
    end1Size,
    end2Shape,
    end2Size,
    selectedAngle,
    quantity,
    cutLengths,
    selectedProtection,
    selectedPressure,
    isOrderFittingMode,
    selectedMethod,
    selectedService,
  };
}

/**
 * Derive TRAC360 selection ids from a cart item's tractorConfig.
 *
 * Prefer the explicit `selections` block persisted at add-to-cart time
 * (convertConfigForCart). Fall back gracefully if an OLD cart item (added
 * before this change) lacks it — in that case ids are unknown and the backend
 * should reject/flag the line rather than guess a price.
 */
function buildTrac360Config(item: IItemCart): Trac360LineConfig {
  const selections = (item.tractorConfig as any)?.selections;
  if (selections) {
    return {
      operationTypeId: selections.operationTypeId ?? null,
      circuitId: selections.circuitId ?? null,
      addons: Array.isArray(selections.addons)
        ? selections.addons.map((a: any) => ({
            id: a.id,
            selectedSubOptionId: a.selectedSubOptionId ?? null,
          }))
        : [],
    };
  }
  // Legacy fallback: selection ids were never persisted. Emit empty so the
  // backend can detect an un-repriceable line (missing ids) and reject it.
  return { operationTypeId: null, circuitId: null, addons: [] };
}

/**
 * Convert the local cart into the price-less server order contract.
 * Display pricing (calculateCartTotals, configurator pricing.ts) is untouched;
 * this only shapes what crosses the wire.
 */
/**
 * Build the non-price attachments (PDFs + labels) for the capture payload.
 * These carry no authoritative price — the server uses them only for the
 * invoice/email PDFs and display names, matched to the quote by cartId.
 */
export function buildOrderAttachments(items: IItemCart[]): OrderAttachment[] {
  return items.map((item) => ({
    cartId: item.cartId,
    type: item.type,
    name: item.name,
    image: item.image,
    pdfDataUrl: item.pdfDataUrl,
  }));
}

export function buildServerOrderItems(items: IItemCart[]): ServerOrderItem[] {
  return items.map((item): ServerOrderItem => {
    switch (item.type) {
      case 'function360_order': {
        const config = (item as any).configuration;
        return {
          kind: 'function360',
          cartId: item.cartId ?? 0,
          selectedComponents: config?.selectedComponents,
          equipment: config?.equipment,
        };
      }
      case 'trac360_order':
        return {
          kind: 'trac360',
          cartId: item.cartId ?? 0,
          config: buildTrac360Config(item),
        };
      case 'pwa_order':
        return {
          kind: 'pwa',
          cartId: item.cartId ?? 0,
          orderConfig: pickPwaSelections(item.orderConfig),
        };
      case 'website_product':
      default:
        return {
          kind: 'website',
          productId: item.id,
          variantId: (item as any).variantId,
          quantity: item.quantity ?? 1,
          cartId: item.cartId,
        };
    }
  });
}
