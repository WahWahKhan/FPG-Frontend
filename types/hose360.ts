/**
 * HOSE360 Type Definitions
 * Custom hydraulic hose assembly configurator types
 */

// ============================================================================
// CONFIG STATE
// ============================================================================

export interface Hose360SelectedHose {
  size: string; // e.g. '3/4"'
}

export interface Hose360CutLength {
  length: string; // mm, as a string (matches PwaLineConfig cutLengths shape)
}

export interface Hose360Config {
  selectedHose: Hose360SelectedHose | null;
  end1Shape: string | null; // e.g. 'BSP Female Straight'
  end1Size: string | null; // e.g. '3/4" - 14'  (SAE: '3/4"', no suffix)
  end1Price: number | null;
  // Which end1-* fitting-family page was actually used (e.g. 'end1-bsp',
  // 'end1-sae-61') — needed so Back buttons on later steps can push an
  // explicit, deterministic route instead of relying on router.back(),
  // which corrupts (ping-pongs) once any step in the chain also uses
  // router.push() for its own Back — see end2-fitting.tsx's Back button.
  end1Route: string | null;
  end2Shape: string | null;
  end2Size: string | null;
  end2Price: number | null;
  end2Route: string | null; // same idea as end1Route, for end2-* pages
  selectedAngle: string | null; // e.g. '90°' or 'NOT SURE'; null if orientation step was skipped
  quantity: number; // hoses, 1-20
  cutLengths: Hose360CutLength[]; // one per hose
  selectedProtection: string; // default 'NOT REQUIRED'
  selectedPressure: string; // default 'Not Required'
  // True only once the user has actually clicked an option on that step (the
  // defaults above are real values, so they can't tell 'never chose' from
  // 'chose the default'). Drives the Continue button on those two steps.
  protectionChosen: boolean;
  pressureChosen: boolean;
  totalPrice: number;
  breakdown: Record<string, any> | null; // last /api/hose360/price response.breakdown
  swellProductIds: string[];
}

// ============================================================================
// OPTIONS (GET /api/hose360/options response shape)
// ============================================================================

export interface Hose360HoseSize {
  size: string;
  insideDiameterLabel: string;
  pricePerMetre: number;
  workingPressurePsi: number;
  burstPressurePsi: number;
  bendRadiusMm: number;
  saeEligible: boolean;
}

export interface Hose360FittingShape {
  id: string;
  label: string;
  image: string;
  isStraight: boolean;
}

export interface Hose360FittingSize {
  size: string;
  price: number;
}

export interface Hose360FittingFamily {
  family: string;
  fullName: string;
  shapes: Hose360FittingShape[];
  sizes: Hose360FittingSize[];
  compatibilityMatrix: Record<string, string[]>;
}

export interface Hose360SaeCode {
  code: 'Code 61' | 'Code 62';
  pressureRating: string;
  shapes: Hose360FittingShape[];
}

export interface Hose360SaeFittings {
  saeEligibleHoseSizes: string[];
  codes: Hose360SaeCode[];
  sizes: Hose360FittingSize[];
}

export interface Hose360ProtectionOption {
  label: string;
  multiplier: number;
  image: string | null;
}

export interface Hose360PressureTestOption {
  label: string;
  flatFee: number;
  feeAppliedPerHose?: boolean;
  image?: string | null;
}

export interface Hose360OrientationAngle {
  angle: string;
  image: string | null;
  helpImage: string | null;
}

export interface Hose360QuantityLimits {
  hoseQuantityMin: number;
  hoseQuantityMax: number;
  cutLengthMinMm: number;
}

export interface Hose360Options {
  hoseSizes: { hoseSpec: string; sizes: Hose360HoseSize[] };
  fittingFamilies: {
    bsp: Hose360FittingFamily;
    jic: Hose360FittingFamily;
    metric: Hose360FittingFamily;
    orfs: Hose360FittingFamily;
  };
  saeFittings: Hose360SaeFittings;
  protectionOptions: Hose360ProtectionOption[];
  pressureTestOptions: Hose360PressureTestOption[];
  orientationAngles: Hose360OrientationAngle[];
  quantityLimits: Hose360QuantityLimits;
}

// ============================================================================
// PRICE REQUEST/RESPONSE (POST /api/hose360/price)
// ============================================================================

export interface Hose360PriceOrderConfig {
  selectedHose: Hose360SelectedHose | null;
  end1Shape: string | null;
  end1Size: string | null;
  end2Shape: string | null;
  end2Size: string | null;
  cutLengths: Hose360CutLength[];
  selectedProtection: string;
  selectedPressure: string;
  quantity: number;
  isOrderFittingMode: false;
}

export interface Hose360PriceResponse {
  currency: string;
  amount: number;
  breakdown: Record<string, any>;
  swellProductIds: string[];
}

// ============================================================================
// STEPS
// ============================================================================

export type Hose360Step =
  | 'start'
  | 'hose-selection'
  | 'end1-fitting'
  | 'end1-family'
  | 'end2-fitting'
  | 'end2-family'
  | 'orientation'
  | 'cut-lengths'
  | 'hose-protection'
  | 'pressure-testing'
  | 'summary';

// ============================================================================
// CONTEXT VALUE
// ============================================================================

export interface Hose360ContextValue {
  config: Hose360Config;
  priceLoading: boolean;
  priceError: string | null;

  setSelectedHose: (size: string) => void;
  setEnd1Fitting: (shape: string, size: string, price: number, route: string) => void;
  setEnd2Fitting: (shape: string, size: string, price: number, route: string) => void;
  setOrientation: (angle: string) => void;
  setCutLengths: (quantity: number, cutLengths: Hose360CutLength[]) => void;
  applyPriceResult: (amount: number, breakdown: Record<string, any> | null, swellProductIds: string[]) => void;
  setProtection: (label: string) => void;
  setPressure: (label: string) => void;

  resetConfig: () => void;
  canProceed: (step: Hose360Step) => boolean;
}
