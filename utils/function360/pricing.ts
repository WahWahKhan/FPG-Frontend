import { Function360Config, SelectedComponents } from '../../types/function360';

// Swell product IDs (matching JSON files)
const COMPONENT_SWELL_IDS: Record<keyof SelectedComponents, string> = {
  diverterValve: 'function360-diverter-valve',
  quickCouplings: 'function360-quick-couplings',
  adaptors: 'function360-adaptors',
  hydraulicHoses: 'function360-hydraulic-hoses',
  electrical: 'function360-electrical',
  mountingBrackets: 'function360-mounting-brackets',
};

/**
 * Collect Swell product IDs for inventory management
 */
export function collectProductIds(config: Function360Config): string[] {
  const productIds: string[] = [];

  Object.entries(config.selectedComponents).forEach(([key, isSelected]) => {
    if (isSelected) {
      productIds.push(COMPONENT_SWELL_IDS[key as keyof SelectedComponents]);
    }
  });

  return productIds;
}