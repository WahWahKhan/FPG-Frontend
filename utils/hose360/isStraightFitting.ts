/**
 * The corrected Orientation-gate rule (DECISIONS.md §3): show the Orientation
 * screen if and only if NEITHER end's fitting is a "Straight" shape. Two
 * variants are needed because SAE shape labels don't contain "Male
 * Straight"/"Female Straight" like BSP/JIC/Metric/ORFS do — they're literally
 * "Straight SAE Flange NNNNpsi". Mixing these up silently breaks SAE
 * orientation gating, so callers must pick the right one per family.
 */
export function isStraightFitting(shape: string | null | undefined): boolean {
  if (!shape) return false;
  return shape.includes('Male Straight') || shape.includes('Female Straight');
}

export function isSAEStraightFitting(shape: string | null | undefined): boolean {
  if (!shape) return false;
  return shape.includes('Straight'); // SAE shapes are 'Straight SAE Flange NNNNpsi'
}

/**
 * Family-aware straightness check — picks the right helper based on whether
 * the shape label looks like an SAE flange label or a BSP/JIC/Metric/ORFS
 * label. Used on end2 pages so the gate is correct regardless of whether
 * end1 and end2 came from different families (e.g. BSP end1 + SAE end2).
 */
export function isStraightFittingAnyFamily(shape: string | null | undefined): boolean {
  if (!shape) return false;
  if (shape.includes('SAE Flange')) return isSAEStraightFitting(shape);
  return isStraightFitting(shape);
}
