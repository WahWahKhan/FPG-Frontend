/**
 * TRAC360 Pricing Calculator (UPDATED)
 * Handles all price calculations for the configurator
 * 
 * Pricing Structure:
 * - Base: A$800 (when operation type selected)
 * - Circuits: A$800-A$1800 (optional add-on)
 * - Add-ons: A$120 each (optional)
 */

import { Trac360Config, PriceBreakdown, Addon } from '../../types/trac360';

/**
 * Calculate the total price for the current configuration
 * 
 * @param config - The current TRAC360 configuration
 * @returns Total price in AUD
 * 
 * @example
 * const total = calculateTotalPrice(config);
 * console.log(`Total: A$${total}`);
 */
export function calculateTotalPrice(config: Trac360Config): number {
  const breakdown = calculatePriceBreakdown(config);
  return breakdown.total;
}

/**
 * Get detailed price breakdown for display/debugging
 * 
 * @param config - The current TRAC360 configuration
 * @returns Detailed price breakdown object
 * 
 * @example
 * const breakdown = calculatePriceBreakdown(config);
 * console.log(`Base: A$${breakdown.baseCircuitPrice}`);
 * console.log(`Add-ons: A$${breakdown.addonsTotal}`);
 * console.log(`Total: A$${breakdown.total}`);
 */
export function calculatePriceBreakdown(config: Trac360Config): PriceBreakdown {
  // Base price from operation type selection (A$800)
  const baseOperationPrice = config.operationType ? 1250 : 0;
  
  // Circuit price (optional add-on, adds to base)
  const circuitPrice = config.circuits?.price || 0;
  
  // Total base price = operation + circuits
  const baseCircuitPrice = baseOperationPrice + circuitPrice;
  
  // Calculate add-ons total (base price + sub-option price)
  const addonsTotal = config.addons.reduce((sum, addon) => {
    // Safety check: ensure basePrice is a valid number
    let addonPrice = typeof addon.basePrice === 'number' && !isNaN(addon.basePrice) ? addon.basePrice : 0;
    
    // Add sub-option price if selected
    if (addon.selectedSubOption && addon.subOptions) {
      const selectedSubOption = addon.subOptions.find(
        sub => sub.id === addon.selectedSubOption
      );
      if (selectedSubOption && typeof selectedSubOption.additionalPrice === 'number') {
        addonPrice += selectedSubOption.additionalPrice;
      }
    }
    
    return sum + addonPrice;
  }, 0);
  
  // Calculate sub-options total separately (for breakdown display)
  const subOptionsTotal = config.addons.reduce((sum, addon) => {
    if (addon.selectedSubOption && addon.subOptions) {
      const selectedSubOption = addon.subOptions.find(
        sub => sub.id === addon.selectedSubOption
      );
      const additionalPrice = selectedSubOption?.additionalPrice || 0;
      return sum + (typeof additionalPrice === 'number' && !isNaN(additionalPrice) ? additionalPrice : 0);
    }
    return sum;
  }, 0);
  
  const total = baseCircuitPrice + addonsTotal;
  
  return {
    baseCircuitPrice: isNaN(baseCircuitPrice) ? 0 : baseCircuitPrice,
    addonsTotal: isNaN(addonsTotal) ? 0 : addonsTotal,
    subOptionsTotal: isNaN(subOptionsTotal) ? 0 : subOptionsTotal,
    total: isNaN(total) ? 0 : total,
  };
}

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
 * Get price for a single addon (including selected sub-option)
 * 
 * @param addon - The addon object
 * @returns Total price for this addon
 * 
 * @example
 * const price = getAddonPrice(addon);
 * console.log(`Addon total: A$${price}`);
 */
export function getAddonPrice(addon: Addon): number {
  let total = addon.basePrice;
  
  // Add sub-option price if selected
  if (addon.selectedSubOption && addon.subOptions) {
    const selectedSubOption = addon.subOptions.find(
      sub => sub.id === addon.selectedSubOption
    );
    if (selectedSubOption) {
      total += selectedSubOption.additionalPrice;
    }
  }
  
  return total;
}

/**
 * Collect all Swell product IDs from the configuration
 * Used for backend inventory tracking
 * 
 * @param config - The current TRAC360 configuration
 * @returns Array of Swell product IDs
 * 
 * @example
 * const productIds = collectProductIds(config);
 * // ['placeholder-2circuit', 'placeholder-valve-adaptors', ...]
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

/**
 * Calculate price change when adding/removing an addon
 * Useful for real-time price updates
 * 
 * @param currentPrice - Current total price
 * @param addon - Addon being added/removed
 * @param isAdding - True if adding, false if removing
 * @returns New total price
 * 
 * @example
 * const newPrice = calculatePriceChange(1040, addon, true);
 */
export function calculatePriceChange(
  currentPrice: number,
  addon: Addon,
  isAdding: boolean
): number {
  const addonPrice = getAddonPrice(addon);
  return isAdding ? currentPrice + addonPrice : currentPrice - addonPrice;
}

/**
 * Get price display for addon card
 * Shows base price + sub-option price if selected
 * 
 * @param addon - The addon object
 * @returns Formatted price string with breakdown
 * 
 * @example
 * getAddonPriceDisplay(addon)
 * // "A$120" or "A$120 + A$50"
 */
export function getAddonPriceDisplay(addon: Addon): string {
  const basePrice = formatPrice(addon.basePrice);
  
  if (addon.selectedSubOption && addon.subOptions) {
    const selectedSubOption = addon.subOptions.find(
      sub => sub.id === addon.selectedSubOption
    );
    if (selectedSubOption && selectedSubOption.additionalPrice > 0) {
      const subPrice = formatPrice(selectedSubOption.additionalPrice);
      return `${basePrice} + ${subPrice}`;
    }
  }
  
  return basePrice;
}

/**
 * Validate that price is within acceptable range
 * Prevents negative prices or unreasonably high prices
 * 
 * @param price - Price to validate
 * @returns True if price is valid
 */
export function isValidPrice(price: number): boolean {
  return price >= 0 && price <= 50000; // Max $50k for tractor valve
}

/**
 * Calculate estimated shipping cost (if needed in future)
 * Currently returns 0 as per requirements
 * 
 * @param config - The current TRAC360 configuration
 * @returns Shipping cost (currently always 0)
 */
export function calculateShipping(config: Trac360Config): number {
  // Shipping calculated at checkout, not in configurator
  return 0;
}

/**
 * Get summary of all prices for the summary page
 * 
 * @param config - The current TRAC360 configuration
 * @returns Object with itemized prices
 * 
 * @example
 * const summary = getPriceSummary(config);
 * console.log(summary.items); // [{ name: '2-Circuit Valve', price: 800 }, ...]
 */
export function getPriceSummary(config: Trac360Config) {
  const items: Array<{ name: string; price: number }> = [];
  
  // Add base operation price
  if (config.operationType) {
    items.push({
      name: `${config.operationType.name}`,
      price: 800,
    });
  }
  
  // Add circuit if selected
  if (config.circuits) {
    items.push({
      name: `${config.circuits.circuits}-Circuit Valve`,
      price: config.circuits.price,
    });
  }
  
  // Add addons
  config.addons.forEach(addon => {
    const addonPrice = getAddonPrice(addon);
    let name = addon.name;
    
    // Add sub-option name if selected
    if (addon.selectedSubOption && addon.subOptions) {
      const selectedSubOption = addon.subOptions.find(
        sub => sub.id === addon.selectedSubOption
      );
      if (selectedSubOption) {
        name += ` (${selectedSubOption.name})`;
      }
    }
    
    items.push({ name, price: addonPrice });
  });
  
  const breakdown = calculatePriceBreakdown(config);
  
  return {
    items,
    subtotal: breakdown.total,
    shipping: 0,
    total: breakdown.total,
  };
}