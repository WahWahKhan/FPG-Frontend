// Meta (Facebook) Pixel helpers.
//
// The pixel is OFF unless NEXT_PUBLIC_META_PIXEL_ID is set, so local testing and
// any preview without the variable never loads Meta's script or sends events.
// Never pass customer names, emails or phone numbers to these helpers: events
// carry only product names/ids, quantities, value and currency.

export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || '';

type FbqFn = (...args: unknown[]) => void;

const getFbq = (): FbqFn | null => {
  if (typeof window === 'undefined' || !META_PIXEL_ID) return null;
  const fbq = (window as unknown as { fbq?: FbqFn }).fbq;
  return typeof fbq === 'function' ? fbq : null;
};

export const trackPageView = () => {
  getFbq()?.('track', 'PageView');
};

export const trackEvent = (event: string, params?: Record<string, unknown>) => {
  const fbq = getFbq();
  if (!fbq) return;
  try {
    if (params) fbq('track', event, params);
    else fbq('track', event);
  } catch {
    // Tracking must never break the site.
  }
};

// Value of a cart line in AUD: custom orders carry a final totalPrice,
// website products are price x quantity.
export const cartItemValue = (item: {
  price?: number;
  totalPrice?: number;
  quantity?: number;
}): number => {
  const qty = item.quantity && item.quantity > 0 ? item.quantity : 1;
  if (typeof item.totalPrice === 'number') return item.totalPrice;
  return (item.price || 0) * qty;
};
