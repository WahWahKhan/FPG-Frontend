// Google Analytics 4 event helpers (the gtag snippet itself lives in pages/_app.tsx).
//
// These send the standard GA4 e-commerce events so Google Ads can import them
// as conversions: view_item, add_to_cart, begin_checkout, purchase, plus
// click_to_call / click_email / click_sms for the contact links.
// Never pass customer names, emails or phone numbers: events carry only product
// names/ids, quantities, value and currency. Safe to call anywhere: it does
// nothing on the server or before gtag has loaded, and never throws.

type GtagFn = (...args: unknown[]) => void;

export interface Ga4Item {
  item_id: string;
  item_name: string;
  price: number;
  quantity: number;
}

const getGtag = (): GtagFn | null => {
  if (typeof window === 'undefined') return null;
  const gtag = (window as unknown as { gtag?: GtagFn }).gtag;
  return typeof gtag === 'function' ? gtag : null;
};

// Only the real site reports events. Localhost and preview deployments share the
// production GA4 property, and test events (including a fake order's `purchase`)
// polluted it on 2026-11-18. To test on a preview on purpose, run
// localStorage.setItem('ga4_debug','1') in that browser's console, then reload.
const PROD_HOSTS = ['www.fluidpowergroup.com.au', 'fluidpowergroup.com.au'];

const shouldReport = (): boolean => {
  try {
    if (PROD_HOSTS.includes(window.location.hostname)) return true;
    return window.localStorage.getItem('ga4_debug') === '1';
  } catch {
    return false;
  }
};

export const gaEvent = (name: string, params?: Record<string, unknown>) => {
  const gtag = getGtag();
  if (!gtag || !shouldReport()) return;
  try {
    gtag('event', name, params || {});
  } catch {
    // Tracking must never break the site.
  }
};

// Cart line -> GA4 item. Custom orders carry a final totalPrice (quantity 1),
// website products are price x quantity.
export const toGa4Item = (item: {
  id?: string;
  name?: string;
  price?: number;
  totalPrice?: number;
  quantity?: number;
}): Ga4Item => {
  const quantity = item.quantity && item.quantity > 0 ? item.quantity : 1;
  const unit =
    typeof item.totalPrice === 'number' ? item.totalPrice / quantity : item.price || 0;
  return {
    item_id: String(item.id || ''),
    item_name: String(item.name || ''),
    price: Math.round(unit * 100) / 100,
    quantity,
  };
};

export const ga4Value = (items: Ga4Item[]): number =>
  Math.round(items.reduce((sum, i) => sum + i.price * i.quantity, 0) * 100) / 100;
