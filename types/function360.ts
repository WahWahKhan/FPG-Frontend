/**
 * FUNCTION360 Type Definitions
 * Hydraulic function kit configurator types
 */

// ============================================================================
// EQUIPMENT SELECTION (Step 1)
// ============================================================================

export interface EquipmentOption {
    id: string;
    name: string;
    description: string;
  }
  
  export interface EquipmentSelection {
    horsepower: 'above_50hp' | 'below_50hp' | null;
    functionType: 'electric_3rd' | 'live_3rd' | 'electric_3rd_4th' | null;
  }
  
  // ============================================================================
  // COMPONENT STRUCTURE
  // ============================================================================
  
  export interface Component {
    id: string;
    name: string;
    description: string;
    specifications: Record<string, any>;
    price: number;
    currency: 'AUD';
    image: string;
    fallbackImage: string;
    swellProductId: string;
    note?: string;
  }
  
  // ============================================================================
  // SELECTED COMPONENTS
  // ============================================================================
  
  export interface SelectedComponents {
    diverterValve: boolean;
    quickCouplings: boolean;
    adaptors: boolean;
    hydraulicHoses: boolean;
    electrical: boolean;
    mountingBrackets: boolean;
  }
  
  // ============================================================================
  // MAIN CONFIG STATE
  // ============================================================================
  
  export interface Function360Config {
    // Step 1 - Equipment Selection
    equipment: EquipmentSelection;
    
    // Steps 2-7 - Component Selection
    selectedComponents: SelectedComponents;

    componentPrices: {
      diverterValve: number;
      quickCouplings: number;
      adaptors: number;
      hydraulicHoses: number;
      electrical: number;
      mountingBrackets: number;
    };
    
    // Step 8 - Additional Details
    additionalNotes: string;
    
    // Calculated
    totalPrice: number;
    
    // For backend processing
    swellProductIds: string[];
  }
  
  // ============================================================================
  // CART ITEM
  // ============================================================================
  
  export interface Function360CartItem {
    id: string; // 'function-360'
    type: 'function360_order';
    name: string; // e.g., "Function360 Hydraulic Kit"
    totalPrice: number;
    quantity: 1;
    stock: 999;
    cartId: number; // Date.now()
    image: string; // '/fluidpower_logo_transparent.gif'
    pdfDataUrl: string; // 'data:application/pdf;base64,...'
    configuration: Function360Config;
  }
  
  // ============================================================================
  // CONTEXT ACTIONS
  // ============================================================================
  
  export type Function360Step =
    | 'start'
    | 'equipment'
    | 'diverter-valve'
    | 'quick-couplings'
    | 'adaptors'
    | 'hydraulic-hoses'
    | 'electrical'
    | 'mounting-brackets'
    | 'additional-notes'
    | 'summary';
  
  export interface Function360ContextValue {
    // State
    config: Function360Config;

    // Server-authoritative price (see lib/function360/api.ts / POST /api/function360/price)
    priceLoading: boolean;
    priceError: string | null;

    // Actions
    updateEquipment: (equipment: Partial<EquipmentSelection>) => void;
    toggleComponent: (componentId: keyof SelectedComponents, price?: number) => void;  // ✅ Added price parameter
    updateAdditionalNotes: (notes: string) => void;
    
    // Navigation helpers
    resetConfig: () => void;
    
    // Validation
    canProceed: (step: Function360Step) => boolean;
  }