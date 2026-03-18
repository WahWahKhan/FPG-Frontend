import { createContext, useState, useEffect, useRef } from 'react';
import { ICart, IItemCart } from 'types/cart';
import { Children } from 'types/general';

export const CartContext = createContext<{
  items: IItemCart[];
  open: boolean;
  toggleCart: () => void;
  addItem: (item: IItemCart) => void;
  deleteItem: (item: IItemCart) => void;
  updateItem: (item: IItemCart) => void;
  setCart: (cart: ICart) => void;
  clearCart: () => void;
}>({
  toggleCart: () => {},
  items: [],
  open: false,
  addItem: () => {},
  deleteItem: () => {},
  updateItem: () => {},
  setCart: () => {},
  clearCart: () => {},
});

type ICartWrapperProps = {
  children: Children;
};

const CartWrapper = ({ children }: ICartWrapperProps) => {
  // Start with empty cart for SSR consistency
  const [cart, setCart] = useState<ICart>({ open: false, items: [] });
  const [isHydrated, setIsHydrated] = useState(false);
  
  // 🔧 Track when user is actively modifying cart (delete/clear actions)
  const isUserAction = useRef(false);
  
  // 🆕 NEW: Track if viewing order confirmation (for UI display only)
  const [isViewingOrderConfirmation, setIsViewingOrderConfirmation] = useState(false);

  // Helper function to load cart from localStorage
  const loadCartFromStorage = () => {
    try {
      // 🔧 FIX: Don't clear cart if user is viewing order confirmation
      const isViewingOrderConfirmation = typeof window !== 'undefined' && 
        sessionStorage.getItem('viewingOrderConfirmation') === 'true';
      
      if (isViewingOrderConfirmation) {
        return { open: false, items: [] };
      }

      const savedCart = localStorage.getItem('shopping-cart');
      const cartTimestamp = localStorage.getItem('cart-timestamp');
      
      if (savedCart && cartTimestamp) {
        const now = Date.now();
        const saved = parseInt(cartTimestamp);
        const oneHourInMs = 1 * 60 * 60 * 1000; // 1 hour
        
        // Check if cart is less than 1 hour old
        if (now - saved < oneHourInMs) {
          const parsedCart = JSON.parse(savedCart);
          return {
            open: false, // Always start with cart closed
            items: parsedCart.items || []
          };
        } else {
          // Cart expired, clear it
          localStorage.removeItem('shopping-cart');
          localStorage.removeItem('cart-timestamp');
        }
      }
    } catch (error) {
      console.error('[Website Cart] Error loading cart from localStorage:', error);
    }
    
    return { open: false, items: [] };
  };

  // Load cart from localStorage after component mounts (client-side only)
  useEffect(() => {
    const initialCart = loadCartFromStorage();
    setCart(initialCart);
    setIsHydrated(true);
  }, []); // Run only once after mount

  // NEW: Listen for localStorage changes from PWA
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      // 🔧 FIX: Don't update cart if viewing order confirmation
      const isViewingOrderConfirmation = sessionStorage.getItem('viewingOrderConfirmation') === 'true';
      if (isViewingOrderConfirmation) {
        return;
      }

      // Only react to changes to 'shopping-cart' key
      if (e.key === 'shopping-cart' && e.newValue) {
        try {
          const updatedCart = JSON.parse(e.newValue);
          
          setCart(prevCart => ({
            open: prevCart.open, // Preserve current open state
            items: updatedCart.items || []
          }));
        } catch (error) {
          console.error('[Website Cart] Error parsing storage change:', error);
        }
      }
    };

    // Listen for storage events (fired when localStorage changes in another tab/window)
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // ✅ NEW: Listen for PWA cart item additions (custom event)
  useEffect(() => {
    const handlePWACartAdd = (event: CustomEvent) => {
      setCart(prevCart => ({
        ...prevCart,
        open: true  // ✅ Open cart when PWA adds item
      }));
    };

    window.addEventListener('pwa-cart-item-added', handlePWACartAdd as EventListener);

    return () => {
      window.removeEventListener('pwa-cart-item-added', handlePWACartAdd as EventListener);
    };
  }, []);

  // Save cart to localStorage whenever it changes (but only after hydration)
  useEffect(() => {
    if (isHydrated) {
      // 🔧 Only block saves if we're ACTUALLY on the order-confirmation page
      // Check both sessionStorage flag AND current pathname
      const isViewingOrderConfirmation = 
        typeof window !== 'undefined' &&
        sessionStorage.getItem('viewingOrderConfirmation') === 'true' &&
        window.location.pathname === '/order-confirmation';
      
      if (isViewingOrderConfirmation) {
        // We're on order-confirmation page - check if cart is genuinely empty
        const currentStorage = localStorage.getItem('shopping-cart');
        const currentData = currentStorage ? JSON.parse(currentStorage) : { items: [] };
        
        // Only block if BOTH conditions are true:
        // 1. We're on order-confirmation page
        // 2. Cart is empty
        if (currentData.items?.length === 0 && cart.items.length === 0) {
          return;
        }
        // If cart has items (new order being added), allow save to proceed
      }

      // 🔧 NEW FIX: Debounce save to avoid race conditions with PWA
      const saveTimer = setTimeout(() => {
        try {
          // Double-check localStorage before saving
          const currentStorage = localStorage.getItem('shopping-cart');
          const currentStorageData = currentStorage ? JSON.parse(currentStorage) : { items: [] };
          const storageItemCount = currentStorageData.items?.length || 0;
          const stateItemCount = cart.items.length;
          
          // 🔧 CRITICAL FIX: If this is a user action (delete/clear), ALWAYS save to localStorage
          // Don't sync back - user is deliberately removing items
          if (isUserAction.current) {
            localStorage.setItem('shopping-cart', JSON.stringify(cart));
            localStorage.setItem('cart-timestamp', Date.now().toString());
            isUserAction.current = false; // Reset flag
            
            // ✅ NEW: Notify PWA of cart change
            window.dispatchEvent(new CustomEvent('website-cart-changed', {
              detail: { items: cart.items }
            }));
            return;
          }
          
          // 🔧 If localStorage has MORE items, sync FROM it (PWA added items)
          if (stateItemCount < storageItemCount) {
              setCart({
              open: cart.open,
              items: currentStorageData.items || []
            });
            return; // Don't save, we just synced FROM localStorage
          }
          
          // Only save if our state has MORE or EQUAL items
          if (stateItemCount >= storageItemCount) {
            localStorage.setItem('shopping-cart', JSON.stringify(cart));
            localStorage.setItem('cart-timestamp', Date.now().toString());
            
            // ✅ NEW: Notify PWA of cart change (only if we actually saved)
            window.dispatchEvent(new CustomEvent('website-cart-changed', {
              detail: { items: cart.items }
            }));
          }
        } catch (error) {
          console.error('[Website Cart] Error saving cart to localStorage:', error);
        }
      }, 100); // 100ms debounce

      return () => clearTimeout(saveTimer);
    }
  }, [cart, isHydrated]);

  const toggleCart = () => {
    setCart((prevCart) => ({ ...prevCart, open: !prevCart.open }));
  };

  const addItem = (item: IItemCart) => {
    setCart((prevCart) => ({
      open: true,
      items: [...prevCart.items, item],
    }));
  };

  // ✅ CRITICAL FIX: Use cartId instead of id for deletion
  // This prevents deleting all custom hose assemblies that share the same product id
  const deleteItem = (item: IItemCart) => {
    // 🔧 Mark as user action to prevent sync-back
    isUserAction.current = true;
    setCart((prevCart) => ({
      ...prevCart,
      items: prevCart.items.filter((itemCart) => {
        // ✅ Use cartId (unique per cart instance) instead of id (shared by product type)
        // This is critical for custom hose assemblies which share the same product id
        const deleteBy = item.cartId ? 'cartId' : 'id';
        const shouldKeep = deleteBy === 'cartId' 
          ? itemCart.cartId !== item.cartId 
          : itemCart.id !== item.id;
        
        if (!shouldKeep) {
        }
        
        return shouldKeep;
      }),
    }));
  };

  const updateItem = (item: IItemCart) => {
    setCart((prevCart) => ({
      ...prevCart,
      items: prevCart.items.map((itemCart) =>
        itemCart.id !== item.id ? itemCart : item
      ),
    }));
  };

  const clearCart = () => {
    
    // 🔧 Mark as user action to prevent sync-back from localStorage
    isUserAction.current = true;
    
    // Clear React state only
    setCart({ open: false, items: [] });
    
    // Note: localStorage will be cleared by order-confirmation page cleanup
    // We keep it temporarily so order-confirmation can read PDFs
  };

  // 🆕 NEW: Compute display items (hide cart items when viewing order confirmation)
  // This only affects the UI - actual cart data remains in state and localStorage
  const isOnOrderConfirmationPage = 
  typeof window !== 'undefined' && 
  window.location.pathname === '/order-confirmation';

  const displayItems = isOnOrderConfirmationPage ? [] : cart.items;

  return (
  <CartContext.Provider
    value={{
      toggleCart,
      items: displayItems,
      addItem,
      deleteItem,
      updateItem,
      setCart,
      clearCart,
      open: cart.open,
    }}>
    {children}
  </CartContext.Provider>
  );
};

export default CartWrapper;