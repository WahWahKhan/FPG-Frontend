import { IItemCart, INormalizedCartItem } from '../types/cart';

/**
 * Check if an item is a PWA order (Custom Hose Assembly)
 */
export const isPWAOrder = (item: IItemCart): boolean => {
  return item.type === 'pwa_order';
};

/**
 * Check if an item is a Trac 360 order (Custom Tractor Configuration)
 */
export const isTrac360Order = (item: IItemCart): boolean => {
  return item.type === 'trac360_order';
};

/**
 * Check if an item is a custom order (PWA or Trac 360)
 */
export const isCustomOrder = (item: IItemCart): boolean => {
  return isPWAOrder(item) || isTrac360Order(item) || item.type === 'function360_order' || item.type === 'tube360_order' || item.type === 'hose360_order';
};

/**
 * Check if an item is a website product
 */
export const isWebsiteProduct = (item: IItemCart): boolean => {
  return !item.type || item.type === 'website_product';
};

/**
 * Get item price safely - handles both price and totalPrice fields
 */
export const getItemPrice = (item: IItemCart): number => {
  // Custom orders (PWA & Trac 360) use totalPrice
  if (isCustomOrder(item)) {
    return item.totalPrice || 0;
  }
  
  // Website products use price
  return item.price || 0;
};

/**
 * Get the total price for a cart item (price * quantity)
 */
export const getItemTotal = (item: IItemCart): number => {
  const price = getItemPrice(item);
  const quantity = item.quantity || 1;
  return price * quantity;
};

/**
 * Get display name for item type
 */
export const getItemTypeName = (item: IItemCart): string => {
  if (isPWAOrder(item)) return 'Custom Hose Assembly';
  if (isTrac360Order(item)) return 'Custom Tractor Configuration';
  if (item.type === 'tube360_order') return 'Custom Bent Tube';
  if (item.type === 'hose360_order') return 'Custom Hose Order';
  return 'Product';
};

/**
 * Normalize cart item to ensure consistent price and type fields
 * Use this function at the beginning of checkout logic
 */
export const normalizeCartItem = (item: IItemCart): INormalizedCartItem => {
  return {
    ...item,
    price: getItemPrice(item), // Use our safe getter
    quantity: item.quantity || 1,
    type: item.type || 'website_product'
  } as INormalizedCartItem;
};

/**
 * Separate cart items by type
 * NOW SUPPORTS: Website Products, PWA Orders, and Trac 360 Orders
 */
export const separateCartItems = (items: IItemCart[]) => {
  const pwaItems: IItemCart[] = [];
  const websiteItems: IItemCart[] = [];
  const trac360Items: IItemCart[] = [];
  const tube360Items: IItemCart[] = [];
  const function360Items: IItemCart[] = [];
  const hose360Items: IItemCart[] = [];  // â† ADD THIS

  items.forEach((item) => {
    if (item.type === 'pwa_order') {
      pwaItems.push(item);
    } else if (item.type === 'trac360_order') {
      trac360Items.push(item);
    } else if (item.type === 'tube360_order') {
      tube360Items.push(item);
    } else if (item.type === 'hose360_order') {
      hose360Items.push(item);
    } else if (item.type === 'function360_order') {  // â† ADD THIS
      function360Items.push(item);
    } else {
      websiteItems.push(item);
    }
  });

  return { pwaItems, websiteItems, trac360Items, function360Items, tube360Items, hose360Items };  // â† ADD THIS
};

// Steel Tubes shipping rule — DISPLAY ONLY. The backend (server-authority
// pricing, lib/pricing/website.js in the backend repo) is the source of truth
// and checks the product's real Swell category_index. IItemCart carries no
// category field, so this mirrors that rule here via the SKU naming
// convention Swell already enforces for these categories (category name ==
// SKU prefix, verified live 2026-09-02: FPG-CSTM/FPG-CSTI/FPG-SSTM/FPG-SSTI).
// Keep in sync with STEEL_TUBES_CATEGORY_IDS server-side if the catalog is
// reorganised.
const STEEL_TUBES_SKU_PREFIXES = ['FPG-CSTM-', 'FPG-CSTI-', 'FPG-SSTM-', 'FPG-SSTI-'];
const STEEL_TUBES_SHIPPING = 80;

// Per-line: a cart LINE represents one continuous physical length being cut
// and shipped as a single piece, so qty > 1 on ONE line means that piece is
// longer than 1m and needs special freight — not the same thing as two
// separate 1m lines of the same tube (two ordinary parcels, standard
// shipping, even though the cart total for that product is 2). Deliberately
// does NOT sum quantity across lines — mirrors the backend (lib/pricing/
// website.js's isSteelTubesLineOverLength, lib/pricing/index.js).
const isSteelTubesLine = (item: IItemCart): boolean =>
  isWebsiteProduct(item) &&
  (item.quantity || 0) > 1 &&
  STEEL_TUBES_SKU_PREFIXES.some((prefix) => item.name?.startsWith(prefix));

// Tube360: one bent tube longer than 1 m ships by special freight - mirrors the
// backend (lib/pricing/tube360.js isSteelTubesLineOverLength, threshold from
// lib/pricing/data/tube360/rates.json oversizeFreightThresholdMm = 1000).
const TUBE360_FREIGHT_THRESHOLD_MM = 1000;
const isTube360OverLength = (item: IItemCart): boolean =>
  item.type === 'tube360_order' &&
  (item.tube360Config?.spec?.totalLengthMm || 0) > TUBE360_FREIGHT_THRESHOLD_MM;

/**
 * Calculate cart totals
 * NOW SUPPORTS: Website Products, PWA Orders, and Trac 360 Orders
 */
export const calculateCartTotals = (items: IItemCart[]) => {
  const normalizedItems = items.map(normalizeCartItem);
  const { websiteItems, pwaItems, trac360Items, function360Items, tube360Items, hose360Items } = separateCartItems(normalizedItems);
  
  // Calculate totals for each type
  const websiteTotal = websiteItems.reduce((sum, item) => 
    sum + getItemTotal(item), 0
  );
  
  const pwaTotal = pwaItems.reduce((sum, item) => 
    sum + getItemPrice(item), 0
  );
  
  const trac360Total = trac360Items.reduce((sum, item) => 
    sum + getItemPrice(item), 0
  );
  
  const function360Total = function360Items.reduce((sum, item) =>
    sum + getItemPrice(item), 0
  );

  const tube360Total = tube360Items.reduce((sum, item) =>
    sum + getItemPrice(item), 0
  );

  const hose360Total = hose360Items.reduce((sum, item) =>
    sum + getItemPrice(item), 0
  );

  const subtotal = websiteTotal + pwaTotal + trac360Total + function360Total + tube360Total + hose360Total;
  const steelTubesShippingTriggered = normalizedItems.some((i) => isSteelTubesLine(i) || isTube360OverLength(i));
  const shipping = steelTubesShippingTriggered ? STEEL_TUBES_SHIPPING : 12.85;
  const gst = (subtotal + shipping) * 0.10;
  const total = subtotal + shipping + gst;
  
  return {
    websiteTotal,
    pwaTotal,
    trac360Total,
    function360Total,
    tube360Total,
    hose360Total,
    subtotal,
    shipping,
    gst,
    total,
    itemCount: items.length,
    // Breakdown by type
    breakdown: {
      websiteItems: websiteItems.length,
      pwaItems: pwaItems.length,
      trac360Items: trac360Items.length,
      function360Items: function360Items.length,
      tube360Items: tube360Items.length,
      hose360Items: hose360Items.length
    }
  };
};

/**
 * Prepare items for PayPal checkout payload
 * Separates items into their respective arrays for backend processing
 */
export const prepareCheckoutPayload = (items: IItemCart[]) => {
  const { websiteItems, pwaItems, trac360Items } = separateCartItems(items);
  
  // Format website products for Swell inventory
  const websiteProducts = websiteItems.map(item => ({
    id: item.id,
    name: item.name,
    price: item.price || 0,
    quantity: item.quantity,
    image: item.image
  }));
  
  // PWA orders already have correct structure
  const pwaOrders = pwaItems.map(item => ({
    id: item.id,
    name: item.name,
    totalPrice: item.totalPrice || 0,
    quantity: item.quantity,
    image: item.image,
    pdfDataUrl: item.pdfDataUrl,
    cartId: item.cartId,
    orderConfig: item.orderConfig,
    type: item.type
  }));
  
  // Trac 360 orders
  const trac360Orders = trac360Items.map(item => ({
    id: item.id,
    name: item.name,
    totalPrice: item.totalPrice || 0,
    quantity: item.quantity,
    image: item.image,
    pdfDataUrl: item.pdfDataUrl,
    cartId: item.cartId,
    tractorConfig: item.tractorConfig,
    type: item.type
  }));
  
  return {
    websiteProducts,
    pwaOrders,
    trac360Orders
  };
};