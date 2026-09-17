/**
 * TRAC360 pricing helpers.
 *
 * The actual price calculation lives on the backend (lib/pricing/trac360.js,
 * called via POST /api/trac360/price) — see context/Trac360Context.tsx. This
 * file only keeps the display-only helpers that don't compute a price.
 */

import { Trac360Config } from '../../types/trac360';

/**
 * Format price for display (with currency symbol)
 *
 * @param price - Price in AUD
 * @param includeSymbol - Whether to include "A$" prefix (default: true)
 * @returns Formatted price string
 *
 * @example
 * formatPrice(1040) // "A$1,040"
 * formatPrice(1040, false) // "1,040"
 */
export function formatPrice(price: number, includeSymbol: boolean = true): string {
  const formatted = price.toLocaleString('en-AU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  return includeSymbol ? `A$${formatted}` : formatted;
}

/**
 * Collect all Swell product IDs from the configuration
 * Used for backend inventory tracking
 *
 * @param config - The current TRAC360 configuration
 * @returns Array of Swell product IDs
 */
export function collectProductIds(config: Trac360Config): string[] {
  const productIds: string[] = [];

  // Add circuit product ID
  if (config.circuits?.swellProductId) {
    productIds.push(config.circuits.swellProductId);
  }

  // Add addon product IDs
  config.addons.forEach(addon => {
    if (addon.swellProductId) {
      productIds.push(addon.swellProductId);
    }
  });

  return productIds;
}
