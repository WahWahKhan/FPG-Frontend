/**
 * TRAC360 Type Definitions
 * Complete TypeScript interfaces for the hydraulic valve configurator
 */

// ============================================================================
// STEP 1: TRACTOR INFO
// ============================================================================

export interface TractorInfo {
  brand: string | null;
  model: string | null;
  driveType: '2WD' | '4WD' | null;
  protectionType: 'cab' | 'rops' | null;
}

export interface ProtectionType {
  id: 'cab' | 'rops';
  name: string;
  description: string;
  image: string;
}

export interface TractorData {
  brands: string[];
  models: Record<string, string[]>;
  driveTypes: string[];
  protectionTypes: ProtectionType[];
}

// ============================================================================
// STEP 2: VALVE SETUP
// ============================================================================

export interface ValveSetup {
  id: string;
  code: string;
  name: string;
  description: string;
  image: string;
  compatibleWith: ('cab' | 'rops')[];
}

// ============================================================================
// STEP 3: OPERATION TYPE
// ============================================================================

export interface OperationType {
  id: string;
  name: string;
  description: string;
  image: string;
  components: string[];
  compatibleWith: ('cab' | 'rops')[];
}

// ============================================================================
// STEP 4: CIRCUITS
// ============================================================================

export interface Circuit {
  id: string;
  circuits: number;
  price: number;
  currency: 'AUD';
  description: string;
  swellProductId: string;
}

// ============================================================================
// STEP 5: ADD-ONS
// ============================================================================

export interface SubOption {
  id: string;
  name: string;
  description?: string;
  additionalPrice: number;
  image: string;
}

export interface Addon {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  currency: 'AUD';
  swellProductId: string;
  details?: string[];
  subOptions?: SubOption[] | null;
  note?: string;
  selectedSubOption?: string | null; // Track which sub-option is selected
}

// ============================================================================
// MAIN CONFIG STATE
// ============================================================================

export interface Trac360Config {
  // Step 1
  tractorInfo: TractorInfo;
  
  // Step 2
  valveSetup: ValveSetup | null;
  
  // Step 3
  operationType: OperationType | null;
  
  // Step 4
  circuits: Circuit | null;
  
  // Step 5
  addons: Addon[];
  
  // Step 6 - Summary
  additionalInfo?: string;
  
  // Calculated
  totalPrice: number;
  
  // For backend processing
  productIds: string[];
}

// ============================================================================
// CART ITEM (extends existing ICartItem)
// ============================================================================

export interface Trac360CartItem {
  id: string; // 'trac-360'
  type: 'trac360_order';
  name: string; // e.g., "John Deere 5055E - TracHydro 360"
  totalPrice: number;
  quantity: 1;
  stock: 999;
  cartId: number; // Date.now()
  image: string; // '/logo.png'
  pdfDataUrl: string; // 'data:application/pdf;base64,...'
  tractorConfig: Trac360Config;
}

// ============================================================================
// CONTEXT ACTIONS
// ============================================================================

export type Trac360Step = 
  | 'start'
  | 'tractor-info'
  | 'valve-setup'
  | 'operation-type'
  | 'circuits'
  | 'addons'
  | 'summary';

export interface Trac360ContextValue {
  // State
  config: Trac360Config;
  currentStep: Trac360Step;

  // Server-authoritative price (see lib/trac360/api.ts / POST /api/trac360/price)
  priceBreakdown: import('../lib/trac360/api').Trac360PriceBreakdown | null;
  priceLoading: boolean;
  priceError: string | null;

  // Actions
  updateTractorInfo: (info: Partial<TractorInfo>) => void;
  updateValveSetup: (setup: ValveSetup | null) => void;
  updateOperationType: (type: OperationType | null) => void;
  updateCircuits: (circuits: Circuit | null) => void;
  addAddon: (addon: Addon) => void;
  removeAddon: (addonId: string) => void;
  updateAddonSubOption: (addonId: string, subOptionId: string | null) => void;
  updateAdditionalInfo: (info: string) => void;
  
  // Navigation helpers
  clearFutureSteps: (fromStep: Trac360Step) => void;
  resetConfig: () => void;
  
  // Validation
  canProceed: (step: Trac360Step) => boolean;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface PriceBreakdown {
  baseCircuitPrice: number;
  addonsTotal: number;
  subOptionsTotal: number;
  total: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}