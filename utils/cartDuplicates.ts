import { IItemCart } from 'types/cart';

// Same SKU-prefix convention as utils/cart-helpers.ts::STEEL_TUBES_SKU_PREFIXES
// (kept as a separate copy since that one is internal to cart-helpers.ts).
const STEEL_TUBES_SKU_PREFIXES = ['FPG-CSTM-', 'FPG-CSTI-', 'FPG-SSTM-', 'FPG-SSTI-'];

export const isSteelTubeName = (name?: string): boolean =>
  !!name && STEEL_TUBES_SKU_PREFIXES.some((prefix) => name.startsWith(prefix));

const isWebsiteLine = (item: IItemCart): boolean =>
  !item.type || item.type === 'website_product';

export interface DuplicateGroup {
  /** Product id shared by every line in this group. */
  id: string;
  name: string;
  totalQuantity: number;
  lineCount: number;
  isSteelTube: boolean;
}

/**
 * CartWrapper.tsx::addItem always appends a new line rather than merging into
 * an existing one for the same product id (see context/CartWrapper.tsx:300-305).
 * Adding the same product on two separate visits/clicks therefore produces two
 * separate qty-1 lines instead of one qty-2 line — for Steel Tubes specifically,
 * this is a genuine pricing fork, not just a display quirk: the shipping rule
 * (utils/cart-helpers.ts, lib/pricing/index.js on the backend) is per LINE, so
 * two separate 1m lines ship at standard rate while one combined 2m line
 * triggers the $80 surcharge. This prompt lets the customer choose which they
 * actually meant before checkout, rather than silently picking one.
 *
 * Only plain website-catalog lines are considered — PWA/Trac360/Function360
 * cart entries are each a unique configured build, not a simple quantity, so
 * they must never be merged even if they happen to share a product id.
 */
export const findDuplicateGroups = (items: IItemCart[]): DuplicateGroup[] => {
  const byId = new Map<string, IItemCart[]>();
  items.forEach((item) => {
    if (!isWebsiteLine(item)) return;
    const existing = byId.get(item.id);
    if (existing) existing.push(item);
    else byId.set(item.id, [item]);
  });

  const groups: DuplicateGroup[] = [];
  byId.forEach((lines, id) => {
    if (lines.length < 2) return;
    groups.push({
      id,
      name: lines[0].name,
      totalQuantity: lines.reduce((sum, line) => sum + (line.quantity || 0), 0),
      lineCount: lines.length,
      isSteelTube: isSteelTubeName(lines[0].name),
    });
  });
  return groups;
};

/**
 * Mirrors cart-helpers.ts's isSteelTubesLine / steelTubesShippingTriggered
 * check exactly (kept as a separate copy for the same reason
 * STEEL_TUBES_SKU_PREFIXES above is — that one is internal to
 * cart-helpers.ts). True once ANY website line in the cart is a Steel Tubes
 * line with quantity > 1 — the same condition that flips
 * calculateCartTotals's shipping from $12.85 to the flat $80 rate.
 *
 * Used to decide whether a Steel Tubes duplicate group still needs the
 * combine-or-keep-separate choice. A freshly-detected duplicate group's own
 * lines are always qty 1 each (that's what makes it a duplicate group), so
 * they never trip this on their own — only an ALREADY-merged line (from an
 * earlier group the customer combined) or a legitimately-added qty>1 line
 * elsewhere in the cart does. Once true, combining or not combining THIS
 * group changes nothing about the total: the $80 is already being charged
 * regardless. At that point it's the same "no real decision" case as any
 * non-Steel-Tube duplicate — see DuplicateItemsPrompt.tsx.
 */
export const isSteelTubesShippingActive = (items: IItemCart[]): boolean =>
  items.some(
    (item) =>
      isWebsiteLine(item) &&
      (item.quantity || 0) > 1 &&
      isSteelTubeName(item.name)
  );
