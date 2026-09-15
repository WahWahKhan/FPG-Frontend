/**
 * TUBE360 validation + derivation helpers (pure functions, no React).
 *
 * These are UX-only. The backend (lib/pricing/tube360.js validateTube360Spec)
 * re-validates everything and is authoritative. Error wording mirrors Hose360
 * (HoseCalculator screens/CutLengthsScreen.js): red border + short red message.
 */

import type {
  Tube360BendsInput,
  Tube360CatalogEntry,
  Tube360Config,
  Tube360Labels,
  Tube360Options,
  Tube360ServerSpec,
} from '../../types/tube360';

export const MSG = {
  required: 'This field is required',
  numbersOnly: 'Please enter numbers only',
  angleFormat: 'Please enter a number (up to 1 decimal place)',
};

const INT_RE = /^\d+$/;
const ANGLE_RE = /^\d{1,3}(\.\d)?$/;

/** Whole number from a raw input string, or null. */
export function toInt(value: string): number | null {
  return INT_RE.test(value) ? parseInt(value, 10) : null;
}

/** Angle (max 1 decimal place) from a raw input string, or null. */
export function toAngle(value: string): number | null {
  return ANGLE_RE.test(value) ? parseFloat(value) : null;
}

// ============================================================================
// CATALOGUE LOOKUPS
// ============================================================================

export function getEntry(options: Tube360Options, catalogId: string | null): Tube360CatalogEntry | null {
  if (!catalogId) return null;
  return options.tubes.find((t) => t.id === catalogId) || null;
}

/** Distinct OD labels for a material + size system, in catalogue order. */
export function odOptionsFor(options: Tube360Options, material: string | null, sizeSystem: string | null): string[] {
  if (!material || !sizeSystem) return [];
  const seen: string[] = [];
  options.tubes.forEach((t) => {
    if (t.material === material && t.sizeSystem === sizeSystem && !seen.includes(t.odLabel)) seen.push(t.odLabel);
  });
  return seen;
}

/** Catalogue rows (one per wall thickness) for a material + system + OD. */
export function wallOptionsFor(
  options: Tube360Options,
  material: string | null,
  sizeSystem: string | null,
  odLabel: string | null
): Tube360CatalogEntry[] {
  if (!material || !sizeSystem || !odLabel) return [];
  return options.tubes.filter((t) => t.material === material && t.sizeSystem === sizeSystem && t.odLabel === odLabel);
}

// ============================================================================
// FIELD VALIDATORS — each returns '' when valid, otherwise the message to show.
// ============================================================================

export function validateTotalLength(value: string, options: Tube360Options): string {
  const { minTotalLengthMm: min, maxTotalLengthMm: max } = options.machine;
  if (value.trim() === '') return MSG.required;
  const n = toInt(value);
  if (n === null) return MSG.numbersOnly;
  if (n < min) return `Minimum length is ${min}mm`;
  if (n > max) return `Maximum length is ${max}mm`;
  return '';
}

export function validateQuantity(value: string, options: Tube360Options): string {
  if (value.trim() === '') return MSG.required;
  const n = toInt(value);
  if (n === null) return MSG.numbersOnly;
  if (n < 1) return 'Minimum quantity is 1';
  if (n > options.machine.maxQuantity) return `Maximum quantity is ${options.machine.maxQuantity}`;
  return '';
}

export function validateBendCount(value: string, options: Tube360Options): string {
  if (value.trim() === '') return MSG.required;
  const n = toInt(value);
  if (n === null) return MSG.numbersOnly;
  if (n > options.machine.maxBends) return `Maximum ${options.machine.maxBends} bends`;
  return '';
}

export function validateRadius(value: string, entry: Tube360CatalogEntry): string {
  if (value.trim() === '') return MSG.required;
  const n = toInt(value);
  if (n === null) return MSG.numbersOnly;
  if (n !== entry.minClrMm) {
    return `Bend radius must be ${entry.minClrMm}mm (2 x the tube's outer diameter)`;
  }
  return '';
}

export function validateSection(value: string, entry: Tube360CatalogEntry): string {
  if (value.trim() === '') return MSG.required;
  const n = toInt(value);
  if (n === null) return MSG.numbersOnly;
  if (n < entry.minSectionMm) return `Minimum section length is ${entry.minSectionMm}mm`;
  return '';
}

export function validateAngle(value: string, options: Tube360Options): string {
  const { minBendAngleDeg: min, maxBendAngleDeg: max } = options.machine;
  if (value.trim() === '') return MSG.required;
  const n = toAngle(value);
  if (n === null) return MSG.angleFormat;
  if (n < min || n > max) return `Bend angle must be between ${min}° and ${max}°`;
  return '';
}

// ============================================================================
// BEND SCHEDULE HELPERS
// ============================================================================

/**
 * Resize the sections/angles arrays when the number of bends changes,
 * keeping values the user already typed (by index).
 */
export function resizeBendArrays(bends: Tube360BendsInput, newCount: number): Pick<Tube360BendsInput, 'sectionsMm' | 'anglesDeg'> {
  const sectionsMm = Array.from({ length: newCount + 1 }, (_, i) => bends.sectionsMm[i] ?? '');
  const anglesDeg = Array.from({ length: newCount }, (_, i) => bends.anglesDeg[i] ?? '');
  return { sectionsMm, anglesDeg };
}

/** Effective section strings: with 0 bends the single section IS the total length. */
export function effectiveSections(config: Tube360Config): string[] {
  const count = toInt(config.bends.count);
  if (count === 0) return [config.spec.totalLengthMm];
  return config.bends.sectionsMm;
}

export interface SectionsSumStatus {
  sum: number;
  total: number | null;
  /** total - sum (positive = still to allocate, negative = over). */
  remaining: number;
  matches: boolean;
  message: string;
}

export function sectionsSumStatus(sections: string[], totalLength: string): SectionsSumStatus {
  const total = toInt(totalLength);
  const sum = sections.reduce((acc, s) => acc + (toInt(s) ?? 0), 0);
  const remaining = total === null ? 0 : total - sum;
  const matches = total !== null && remaining === 0 && sections.every((s) => toInt(s) !== null);
  let message = '';
  if (total !== null && !matches) {
    message =
      remaining > 0
        ? `Sections add up to ${sum}mm - ${remaining}mm still to allocate (total length ${total}mm)`
        : `Sections add up to ${sum}mm - ${-remaining}mm over the total length of ${total}mm`;
  }
  return { sum, total, remaining, matches, message };
}

// ============================================================================
// STEP COMPLETENESS (drives Continue buttons and page guards)
// ============================================================================

export function isSpecValid(config: Tube360Config, options: Tube360Options): boolean {
  const s = config.spec;
  const entry = getEntry(options, s.catalogId);
  if (!s.material || !s.sizeSystem || !s.odLabel || !entry) return false;
  if (entry.material !== s.material || entry.sizeSystem !== s.sizeSystem || entry.odLabel !== s.odLabel) return false;
  if (!s.endA || !s.endB || !entry.allowedEnds.includes(s.endA) || !entry.allowedEnds.includes(s.endB)) return false;
  if (validateTotalLength(s.totalLengthMm, options)) return false;
  if (validateQuantity(s.quantity, options)) return false;
  return true;
}

export function isBendsValid(config: Tube360Config, options: Tube360Options): boolean {
  if (!isSpecValid(config, options)) return false;
  const entry = getEntry(options, config.spec.catalogId) as Tube360CatalogEntry;
  const b = config.bends;
  if (validateBendCount(b.count, options)) return false;
  const count = toInt(b.count) as number;
  if (count > 0) {
    if (validateRadius(b.radiusMm, entry)) return false;
    if (b.anglesDeg.length !== count || b.anglesDeg.some((a) => validateAngle(a, options))) return false;
    if (b.sectionsMm.length !== count + 1) return false;
  }
  const sections = effectiveSections(config);
  if (sections.some((s) => validateSection(s, entry))) return false;
  if (!sectionsSumStatus(sections, config.spec.totalLengthMm).matches) return false;
  if (b.notes.length > options.machine.maxNotesLength) return false;
  return true;
}

/** Full price-less spec for the price endpoint / cart. Null if not valid yet. */
export function buildServerSpec(config: Tube360Config, options: Tube360Options): Tube360ServerSpec | null {
  if (!isBendsValid(config, options)) return null;
  const count = toInt(config.bends.count) as number;
  return {
    catalogId: config.spec.catalogId as string,
    endA: config.spec.endA as Tube360ServerSpec['endA'],
    endB: config.spec.endB as Tube360ServerSpec['endB'],
    totalLengthMm: toInt(config.spec.totalLengthMm) as number,
    quantity: toInt(config.spec.quantity) as number,
    bendRadiusMm: count > 0 ? (toInt(config.bends.radiusMm) as number) : null,
    sectionsMm: effectiveSections(config).map((s) => toInt(s) as number),
    anglesDeg: count > 0 ? config.bends.anglesDeg.map((a) => toAngle(a) as number) : [],
  };
}

/** Spec subset for the upload-for-quote flow (no bend schedule). Null if not valid yet. */
export function buildQuoteSpec(config: Tube360Config, options: Tube360Options) {
  if (!isSpecValid(config, options)) return null;
  return {
    catalogId: config.spec.catalogId as string,
    endA: config.spec.endA as Tube360ServerSpec['endA'],
    endB: config.spec.endB as Tube360ServerSpec['endB'],
    totalLengthMm: toInt(config.spec.totalLengthMm) as number,
    quantity: toInt(config.spec.quantity) as number,
  };
}

/** Display labels for the current selection (spec chip, summary, PDF). */
export function buildLabels(config: Tube360Config, options: Tube360Options): Tube360Labels | null {
  const entry = getEntry(options, config.spec.catalogId);
  if (!entry) return null;
  const label = <T extends { id: string; label: string }>(list: T[], id: string | null) =>
    list.find((x) => x.id === id)?.label || '';
  const endLabel = (id: string | null) => {
    const end = options.endTypes.find((e) => e.id === id);
    if (!end) return '';
    return end.id === 'none' || !end.description ? end.label : `${end.label} (${end.description})`;
  };
  return {
    material: label(options.materials, entry.material),
    sizeSystem: label(options.sizeSystems, entry.sizeSystem),
    od: entry.odLabel,
    wallMm: entry.wallMm,
    grade: entry.grade,
    endA: endLabel(config.spec.endA),
    endB: endLabel(config.spec.endB),
  };
}

/** "2.4 MB" / "830 KB" */
export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export const formatPrice = (n: number) => `A$${n.toFixed(2)}`;
