/**
 * TUBE360 types
 * Custom bent steel tube configurator (manual entry + upload-for-quote).
 *
 * The catalogue, machine limits and upload rules are NOT hardcoded in the
 * frontend: they arrive from GET /api/tube360/options (Tube360Options). Every
 * displayed price comes from POST /api/tube360/price (Tube360PriceResponse).
 */

export type Tube360Method = 'manual' | 'upload';
export type Tube360EndType = 'none' | 'flare' | 'ring';
export type Tube360SizeSystem = 'imperial' | 'metric';
export type Tube360MaterialId = 'carbon' | 'stainless';

// ============================================================================
// OPTIONS (from the backend)
// ============================================================================

export interface Tube360CatalogEntry {
  /** Swell SKU, e.g. "FPG-CSTM-12-15" — the tube's id everywhere. */
  id: string;
  material: Tube360MaterialId;
  sizeSystem: Tube360SizeSystem;
  /** e.g. "12 mm" or '3/4"' — also the value of the OD dropdown. */
  odLabel: string;
  odMm: number;
  wallMm: number;
  grade: string;
  allowedEnds: Tube360EndType[];
  minClrMm: number;
  maxClrMm: number;
  minSectionMm: number;
}

export interface Tube360Options {
  version: number;
  materials: Array<{ id: Tube360MaterialId; label: string }>;
  sizeSystems: Array<{ id: Tube360SizeSystem; label: string }>;
  endTypes: Array<{ id: Tube360EndType; label: string; description?: string }>;
  tubes: Tube360CatalogEntry[];
  machine: {
    minBendAngleDeg: number;
    maxBendAngleDeg: number;
    minTotalLengthMm: number;
    maxTotalLengthMm: number;
    maxBends: number;
    maxQuantity: number;
    maxNotesLength: number;
  };
  uploads: {
    maxFiles: number;
    maxFileSizeBytes: number;
    /** Bytes per upload-chunk request (a multiple of 320 KiB, < 4.5 MB). */
    chunkSizeBytes: number;
    groups: Array<{ id: string; label: string; hint?: string }>;
    fileTypes: Array<{ ext: string; group: string }>;
  };
  freight: { oversizeThresholdMm: number; oversizeShipping: number };
}

// ============================================================================
// CONFIGURATOR STATE (persisted to localStorage by Tube360Context)
// Numeric inputs are kept as the RAW STRINGS the user typed so validation
// messages can be shown exactly like Hose360 ("Please enter numbers only").
// ============================================================================

export interface Tube360SpecInput {
  material: Tube360MaterialId | null;
  sizeSystem: Tube360SizeSystem | null;
  odLabel: string | null;
  /** Catalogue id (Swell SKU) — chosen via the wall-thickness dropdown. */
  catalogId: string | null;
  endA: Tube360EndType | null;
  endB: Tube360EndType | null;
  totalLengthMm: string;
  quantity: string;
}

export interface Tube360BendsInput {
  /** Number of bends as typed ('' until entered). */
  count: string;
  /** Bend radius (CLR) in mm for the whole tube — one die set per job. */
  radiusMm: string;
  /** count + 1 entries (ignored when count is '0' — the single section is the total length). */
  sectionsMm: string[];
  /** count entries. */
  anglesDeg: string[];
  notes: string;
}

/**
 * A file the customer has uploaded (bytes are already in the business
 * SharePoint `_incoming` folder). Only the opaque uploadId goes back to the
 * server on submit - the browser never sees a SharePoint URL.
 */
export interface Tube360UploadedFile {
  uploadId: string;
  name: string;
  size: number;
}

export interface Tube360Config {
  method: Tube360Method | null;
  spec: Tube360SpecInput;
  bends: Tube360BendsInput;
  upload: {
    files: Tube360UploadedFile[];
    notes: string;
  };
}

// ============================================================================
// WIRE SHAPES
// ============================================================================

/** Price-less spec sent to the backend (price endpoint + checkout). */
export interface Tube360ServerSpec {
  catalogId: string;
  endA: Tube360EndType;
  endB: Tube360EndType;
  totalLengthMm: number;
  quantity: number;
  bendRadiusMm: number | null;
  sectionsMm: number[];
  anglesDeg: number[];
}

export interface Tube360Labels {
  material: string;
  sizeSystem: string;
  od: string;
  wallMm: number;
  grade: string;
  endA: string;
  endB: string;
}

/** Mirrors the backend priceTube360Line().breakdown exactly. */
export interface Tube360PriceBreakdown {
  spec: Tube360ServerSpec;
  labels: Tube360Labels;
  band: string;
  material: { sku: string; pricePerMetre: number; billedLengthMm: number; cost: number };
  bending: { count: number; ratePerBend: number; multiplier: number; cost: number };
  ends: {
    endA: { type: Tube360EndType; cost: number };
    endB: { type: Tube360EndType; cost: number };
  };
  perTube: number;
  quantity: number;
  tubesSubtotal: number;
  setupFee: number;
  total: number;
}

export interface Tube360PriceResponse {
  currency: string;
  amount: number;
  breakdown: Tube360PriceBreakdown;
}

/** Stored on the cart item as `tube360Config`. */
export interface Tube360CartConfig {
  spec: Tube360ServerSpec;
  labels: Tube360Labels;
  notes: string;
  breakdown: Tube360PriceBreakdown;
}

/** POST /api/tube360/submit-quote body. Contact uses the checkout ShippingDetails shape. */
export interface Tube360QuoteRequest {
  contact: {
    name: string;
    companyName: string;
    address: string;
    suburb: string;
    state: string;
    postcode: string;
    email: string;
    contactNumber: string;
  };
  spec: Pick<Tube360ServerSpec, 'catalogId' | 'endA' | 'endB' | 'totalLengthMm' | 'quantity'>;
  files: Array<{ uploadId: string; name: string }>;
  notes: string;
}

export interface Tube360QuoteResult {
  ref: string;
  email: string;
  name: string;
  customerEmailed: boolean;
}
