import { createContext, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { ICart, IItemCart } from 'types/cart';
import { Children } from 'types/general';
import SaveCartModal from '../components/cart/SaveCartModal';
import SavedCartNotice from '../components/cart/SavedCartNotice';

export const CartContext = createContext<{
  items: IItemCart[];
  open: boolean;
  toggleCart: () => void;
  addItem: (item: IItemCart) => void;
  deleteItem: (item: IItemCart) => void;
  updateItem: (item: IItemCart) => void;
  mergeItems: (productId: string) => void;
  setCart: (cart: ICart) => void;
  clearCart: () => void;
  saveCartOpen: boolean;
  openSaveCart: () => void;
  closeSaveCart: () => void;
}>({
  toggleCart: () => {},
  items: [],
  open: false,
  addItem: () => {},
  deleteItem: () => {},
  updateItem: () => {},
  mergeItems: () => {},
  setCart: () => {},
  clearCart: () => {},
  saveCartOpen: false,
  openSaveCart: () => {},
  closeSaveCart: () => {},
});

type ICartWrapperProps = {
  children: Children;
};

const CartWrapper = ({ children }: ICartWrapperProps) => {
  const router = useRouter();
  // Start with empty cart for SSR consistency
  const [cart, setCart] = useState<ICart>({ open: false, items: [] });
  const [isHydrated, setIsHydrated] = useState(false);
  
  // 🔧 Track when user is actively modifying cart (delete/clear actions)
  const isUserAction = useRef(false);
  
  // 🆕 NEW: Track if viewing order confirmation (for UI display only)
  const [isViewingOrderConfirmation, setIsViewingOrderConfirmation] = useState(false);

  // Notice shown when a "save cart for later" email link can't be resumed
  // (already ordered → single-use, or expired). Null when there's nothing to show.
  const [savedCartNotice, setSavedCartNotice] = useState<string | null>(null);

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

  // 🆕 Resume a "saved cart" when the user arrives via an email link that
  // carries ?cart=<token> (e.g. /checkout?cart=... or /catalogue?cart=...).
  // We fetch the anonymous cart from the backend, rehydrate localStorage + the
  // in-tab cart state, then strip the token from the URL. Keyed on the router
  // query so it fires for both full loads (email link) and in-app navigations
  // (CartWrapper lives in _app and persists across route changes). A ref guards
  // against resuming the same token twice.
  const resumedTokenRef = useRef<string | null>(null);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Read the token from the actual URL (window.location.search is always
    // accurate on the client; router.query can lag on statically-optimized
    // pages). Keyed on router.asPath so it fires on full loads AND in-app nav.
    const token = new URLSearchParams(window.location.search).get('cart');
    if (!token || resumedTokenRef.current === token) return;
    resumedTokenRef.current = token; // dedupe: only resume a given token once

    // When a saved-cart link can't be resumed (already ordered / expired) and
    // the user landed straight on /checkout, don't leave them on an empty
    // checkout page (looks unprofessional — just a shipping fee). Send them to
    // the home page; the notice banner persists across this client-side nav.
    const redirectFromEmptyCheckout = () => {
      if (window.location.pathname.startsWith('/checkout')) {
        router.replace('/');
      }
    };

    (async () => {
      try {
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
        const res = await fetch(`${API_BASE_URL}/api/cart/resume?token=${encodeURIComponent(token)}`);
        if (res.ok) {
          const data = await res.json();
          const items = Array.isArray(data.items) ? data.items : [];
          if (items.length > 0) {
            localStorage.setItem('shopping-cart', JSON.stringify({ items }));
            localStorage.setItem('cart-timestamp', Date.now().toString());
            // Remember the token so checkout can request the 7-day price hold.
            // The server still verifies the cart is unchanged before honouring it.
            localStorage.setItem('fpg-saved-cart-token', token);
            setCart({ open: false, items });
          }
        } else if (res.status === 409) {
          // Single-use link: this cart was already ordered. Don't rehydrate, and
          // drop any stale token so it can't ride along into a future checkout.
          console.warn('[Website Cart] This saved cart has already been ordered.');
          localStorage.removeItem('fpg-saved-cart-token');
          setSavedCartNotice('This saved cart has already been ordered, so it can’t be checked out again. Please start a new cart if you’d like to order more.');
          redirectFromEmptyCheckout();
        } else if (res.status === 410) {
          console.warn('[Website Cart] Saved cart link has expired.');
          localStorage.removeItem('fpg-saved-cart-token');
          setSavedCartNotice('This saved-cart link has expired or is no longer available. Please add your items to a new cart.');
          redirectFromEmptyCheckout();
        }
      } catch (err) {
        console.error('[Website Cart] Failed to resume saved cart:', err);
      } finally {
        // Strip ?cart=<token> from the URL without a reload or navigation.
        const params = new URLSearchParams(window.location.search);
        params.delete('cart');
        const q = params.toString();
        window.history.replaceState({}, '', window.location.pathname + (q ? `?${q}` : '') + window.location.hash);
      }
    })();
  }, [router.asPath]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // 🆕 "Save cart for later" modal — opened from the cart drawer, rendered
  // app-wide so it overlays wherever the user currently is.
  const [saveCartOpen, setSaveCartOpen] = useState(false);
  const openSaveCart = () => setSaveCartOpen(true);
  const closeSaveCart = () => setSaveCartOpen(false);

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

  // ✅ Combine every line sharing `productId` into one line with their summed
  // quantity — used by the checkout "combine duplicate lines?" prompt (see
  // utils/cartDuplicates.ts for why duplicate lines happen at all). Only
  // touches plain website-catalog lines, never PWA/Trac360/Function360 custom
  // builds. Marks isUserAction like deleteItem — merging always REDUCES the
  // item count, and without this flag the debounced-save effect below reads
  // that as "state fell behind a PWA localStorage sync" and reverts it back
  // to the unmerged lines before the merge ever reaches localStorage.
  const mergeItems = (productId: string) => {
    isUserAction.current = true;
    setCart((prevCart) => {
      const isWebsiteLine = (i: IItemCart) => !i.type || i.type === 'website_product';
      const matching = prevCart.items.filter((i) => isWebsiteLine(i) && i.id === productId);
      if (matching.length < 2) return prevCart;

      const totalQuantity = matching.reduce((sum, i) => sum + (i.quantity || 0), 0);
      const mergedLine: IItemCart = { ...matching[0], quantity: totalQuantity };
      const rest = prevCart.items.filter((i) => !(isWebsiteLine(i) && i.id === productId));

      return { ...prevCart, items: [...rest, mergedLine] };
    });
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

    // The saved-cart price-hold token no longer applies once the cart is gone.
    if (typeof window !== 'undefined') {
      localStorage.removeItem('fpg-saved-cart-token');
    }

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
      mergeItems,
      setCart,
      clearCart,
      open: cart.open,
      saveCartOpen,
      openSaveCart,
      closeSaveCart,
    }}>
    {children}
    <SaveCartModal open={saveCartOpen} onClose={closeSaveCart} items={cart.items} />
    {savedCartNotice && (
      <SavedCartNotice message={savedCartNotice} onDismiss={() => setSavedCartNotice(null)} />
    )}
  </CartContext.Provider>
  );
};

export default CartWrapper;