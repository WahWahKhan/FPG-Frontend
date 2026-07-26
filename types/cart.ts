export interface ICart {
  open: boolean;
  items: IItemCart[];
}

/**
 * Cart item type identifier
 */
export type CartItemType = 'pwa_order' | 'trac360_order' | 'function360_order' | 'website_product';

/**
 * Trac 360 Configuration Interface
 */
export interface ITrac360Config {
  tractorType: string;
  modelNumber: string;
  driveType: string;
  cabinType: string;
  valveLocation: string;
  selectedOptions?: string[];
  basePrice: number;
  optionsPrice: number;
  totalPrice: number;
  productIds: string[];  // Swell product IDs for inventory management

  /**
   * Configurator selection IDs (no prices) persisted at add-to-cart time.
   * Used by the server-authority checkout flow so the backend can INDEPENDENTLY
   * reprice this line from its own rule table. Optional for backward-compat:
   * cart items added before this field existed won't have it.
   */
  selections?: {
    operationTypeId: string | null;
    circuitId: string | null;
    addons: Array<{ id: string; selectedSubOptionId: string | null }>;
  };
}

/**
 * Unified cart item interface supporting:
 * - Website products (Swell catalog items)
 * - PWA orders (Custom Hose Assemblies)
 * - Trac 360 orders (Custom Tractor Configurations)
 * 
 * Item Type Detection:
 * - Website products: type is undefined or 'website_product'
 * - PWA orders: type === 'pwa_order'
 * - Trac 360 orders: type === 'trac360_order'
 * 
 * Price Field Usage:
 * - Website products use: price (per unit) * quantity
 * - Custom orders (PWA/Trac360) use: totalPrice (final calculated price)
 */
export interface IItemCart {
  // ============================================================================
  // CORE FIELDS (Always present)
  // ============================================================================
  id: string;           // Product slug (website) or custom ID (PWA/Trac360)
  name: string;         // Display name
  
  // ============================================================================
  // TYPE IDENTIFIER
  // ============================================================================
  type?: CartItemType;  // Distinguishes item source
  
  // ============================================================================
  // PRICE FIELDS (Use appropriate field based on type)
  // ============================================================================
  price?: number;       // Website products: price per unit
  totalPrice?: number;  // Custom orders: final calculated total price
  quantity: number;     // Website: user-selected, Custom: always 1
  
  // ============================================================================
  // WEBSITE PRODUCT FIELDS
  // ============================================================================
  stock?: number;       // Available inventory (Swell managed)
  image?: string;       // Product image URL
  attributes?: any;     // Product attributes from Swell
  
  // ============================================================================
  // CUSTOM ORDER FIELDS (PWA & Trac 360)
  // ============================================================================
  cartId?: number;      // Unique cart instance ID (timestamp-based)
  pdfDataUrl?: string;  // Base64-encoded PDF: 'data:application/pdf;base64,...'
  
  // ============================================================================
  // PWA ORDER CONFIG (Custom Hose Assemblies)
  // ============================================================================
  orderConfig?: {
    selectedHose?: any;
    selectedHosePrice?: any;
    end1Shape?: string;
    end1Size?: string;
    end1Price?: number;
    end2Shape?: string;
    end2Size?: string;
    end2Price?: number;
    selectedAngle?: string;
    quantity?: number;
    cutLengths?: Array<{
      length: string;
      unit?: string;
    }>;
    selectedProtection?: string;
    protectionCost?: number;
    selectedPressure?: string;
    pressureTestPrice?: number;
    cutLengthPrice?: number;
    isOrderFittingMode?: boolean;
    selectedMethod?: string;
    selectedService?: string;
    basePrice?: number;
    hoseProtectionPrice?: number;
    shippingCost?: number;
    totalBeforeShipping?: number;
    totalPriceWithShipping?: number;
  };
  
  // ============================================================================
  // TRAC 360 CONFIG (Custom Tractor Configurations)
  // ============================================================================
  tractorConfig?: ITrac360Config;
}

/**
 * Helper type for normalized cart items
 */
export interface INormalizedCartItem extends IItemCart {
  price: number;
  quantity: number;
  type: CartItemType;
}