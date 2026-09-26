import NavHeader from "./NavHeader";
import { FiUser, FiShoppingCart, FiSearch } from "react-icons/fi";
import Snackbar from "./Snackbar/Snackbar";
import { useContext, useState, useEffect } from "react";
import { useRouter } from "next/router";
import HoverWrapper from "context/HoverWrapper";
import { AnimatePresence } from "framer-motion";
import ProductMenuHeader from "./MenuHeader/ProductMenuHeader/ProductMenuHeader";
import Logo from "../Logo";
import Cart from "../Cart";
import { CartContext } from "context/CartWrapper";
import { Category } from "types/products";
import { BsSearch } from "react-icons/bs";
import Link from "next/link";
import BuyMenuHeader from "./MenuHeader/BuyMenuHeader";

const Header = ({ categories }: { categories: Category[] }) => {
  const [hover, setHover] = useState<string | null>(null);
  const [mobileSearchPressed, setMobileSearchPressed] = useState(false);
  const [mobileCartPressed, setMobileCartPressed] = useState(false);
  const { open: cartOpen, toggleCart, items } = useContext(CartContext);
  const router = useRouter();

  // ADJUSTABLE: Mobile logo width percentage - you can change this value
  const MOBILE_LOGO_WIDTH_PERCENTAGE = 50; // Start with 50%, adjust as needed

  // Check if user is on search page
  const isSearchActive = router.pathname === '/products/search' || router.pathname === '/search';

  // Check if user is on any product-related page
  const isProductsActive: boolean = 
    router.pathname === '/products' ||         // Main products page
    router.pathname === '/catalogue' ||        // ProductSlider page
    router.pathname.startsWith('/products/') || // Individual product pages like /products/[id]
    router.pathname.startsWith('/product') ||   // Catch other product-related routes
    (router.asPath.includes('products') && !router.asPath.includes('search')) || // Any URL containing 'products' but not search
    (router.pathname === '/products' && !!router.query.subcategory); // Subcategory pages

    // ========================================
    // PHASE 1: URL MIGRATION - Active State Detection
    // ========================================
    const isBuyActive: boolean = 
    router.pathname === '/suite360' ||
    router.pathname === '/buy' ||  // ← ADD THIS
    router.pathname.startsWith('/suite360/hose360') ||
    router.pathname.startsWith('/suite360/trac360') ||
    router.pathname.startsWith('/suite360/function360') ||
    router.pathname.startsWith('/suite360/tube360');

  // Handle mobile search press with animation
  const handleMobileSearchPress = () => {
    setMobileSearchPressed(true);
    setTimeout(() => {
      router.push("/products/search");
      setMobileSearchPressed(false);
    }, 300); // 300ms delay for animation
  };

  // Handle mobile cart press with animation
  const handleMobileCartPress = () => {
    setMobileCartPressed(true);
    setTimeout(() => {
      toggleCart();
      setMobileCartPressed(false);
    }, 300); // 300ms delay for animation
  };

  // Reset hover state on route change
  useEffect(() => {
    const handleRouteChange = () => {
      setHover(null); // Reset hover state when route changes
    };

    // Listen for route changes
    router.events.on('routeChangeStart', handleRouteChange);
    router.events.on('routeChangeComplete', handleRouteChange);

    // Cleanup
    return () => {
      router.events.off('routeChangeStart', handleRouteChange);
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events]);

  return (
    <>
    <style dangerouslySetInnerHTML={{
      __html: `
        @keyframes cartBadgeAnimation {
          0% {
            transform: scale(0) rotate(-180deg);
            opacity: 0;
          }
          50% {
            transform: scale(1.2) rotate(-90deg);
            opacity: 1;
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }
        
        /* Mobile-only styles using fixed values to avoid template literal issues */
        @media (max-width: 1023px) {
          .mobile-logo-container {
            width: 40% !important;
            display: flex;
            justify-content: center;
            align-items: center;
            transform: translateY(-5px);
          }
          
          .mobile-logo-container .logo-scale {
            transform: scale(0.7);
            transform-origin: center;
          }
          
          .mobile-left-section {
            width: 30% !important;
            min-width: 100px;
            display: flex;
            align-items: center;
            justify-content: flex-start;
          }
          
          .mobile-right-section {
            width: 30% !important;
            min-width: 50px;
            display: flex;
            align-items: center;
            justify-content: flex-end;
          }
        }
      `
    }} />
    <HoverWrapper hook={{ hover, setHover }}>
      <div className="w-full fixed top-0 bg-white z-50" 
        style={{
          background: 'linear-gradient(to bottom, white 0%, white 50%, rgba(255, 255, 255, 0.8) 80%, rgba(255, 255, 255, 0) 100%)',
          borderBottom: 'none',
          paddingBottom: '30px',
          transition: 'all 0.3s ease-in-out' // Add smooth transition
        }}
        onMouseLeave={() => setHover(null)}>
        <div className="wrapper relative w-full px-6 z-30">
          <div className="flex items-center gap-6 py-2 overflow-hidden ">
            {/* Mobile Left Section - ONLY applies on mobile */}
            <div className="mobile-left-section w-1/5 lg:hidden flex items-center justify-start">
              <Cart open={cartOpen} handleClose={toggleCart} />

              {/* Mobile Search and Cart Section - Larger icons */}
              <div className="relative flex items-center pl-1">
                {items.length > 0 && (
                  <div className="absolute -top-2 -right-2 text-xs py-1 px-2 bg-black text-white rounded-full z-10 min-w-[18px] h-[18px] flex items-center justify-center font-semibold">
                    {items.length}
                  </div>
                )}
                
                {/* Larger Mobile Search Icon with Press Animation */}
                <div className="relative group" style={{ perspective: "1000px" }}>
                  <FiSearch
                    onClick={handleMobileSearchPress}
                    className="text-2xl mr-2 hover:cursor-pointer p-2 relative z-10"
                    style={{
                      color: mobileSearchPressed ? "rgb(250, 204, 21)" : "#333",
                      transition: "color 0.3s ease",
                      width: "40px",
                      height: "40px"
                    }}
                  />
                  {/* Black background animation for search */}
                  <div 
                    className={`absolute inset-0 rounded-full border-2 border-transparent transition-all duration-300 ease-out transform z-0 ${
                      mobileSearchPressed 
                        ? 'border-yellow-400 bg-black scale-110 opacity-100' 
                        : 'scale-0 opacity-0'
                    }`}
                    style={{
                      top: "-2px",
                      left: "-2px", 
                      right: "-2px",
                      bottom: "-2px",
                    }}
                  ></div>
                </div>
                
                {/* Larger Mobile Cart Icon with Press Animation */}
                <div className="relative group" style={{ perspective: "1000px" }}>
                  <FiShoppingCart 
                    onClick={handleMobileCartPress}
                    className="text-2xl hover:cursor-pointer p-2 relative z-10"
                    style={{
                      color: mobileCartPressed ? "rgb(250, 204, 21)" : "#333",
                      transition: "color 0.3s ease",
                      width: "40px",
                      height: "40px",
                    }}
                  />
                  {/* Black background animation for cart */}
                  <div 
                    className={`absolute inset-0 rounded-full border-2 border-transparent transition-all duration-300 ease-out transform z-0 ${
                      mobileCartPressed 
                        ? 'border-yellow-400 bg-black scale-110 opacity-100' 
                        : 'scale-0 opacity-0'
                    }`}
                    style={{
                      top: "-2px",
                      left: "-2px", 
                      right: "-2px",
                      bottom: "-2px",
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Logo Section - Mobile: hybrid approach, Desktop: original */}
            <div className="mobile-logo-container lg:w-full flex self-center w-3/5 justify-center lg:justify-start">
              <div className="logo-scale">
                <Logo />
              </div>
            </div>

            {/* Desktop Navigation - Pass isProductsActive to NavHeader */}
            <div className="w-full justify-center hidden lg:flex z-30">
            <NavHeader isProductsActive={isProductsActive} isBuyActive={isBuyActive} />
            </div>

            {/* Mobile Right Section - ONLY applies on mobile */}
            <div className="mobile-right-section lg:w-full w-1/5 justify-end flex lg:hidden items-center">
              <Snackbar />
            </div>

            {/* Desktop Actions - Unchanged */}
            <div className="w-full text-2xl gap-2 justify-end hidden lg:flex pr-4">
              {/* Actions Container - Same styling as NavHeader */}
              <div 
                style={{
                  background: "rgba(0, 0, 0, 0.15)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  borderRadius: "50px",
                  padding: "8px 12px 12px 12px",
                  boxShadow: "0 8px 25px rgba(0, 0, 0, 0.1)"
                }}
              >
                <div className="flex items-center gap-1">
                  {/* Search Button with Active State Detection.
                      href is required here, not decorative: without it this was a real
                      <a> tag with no destination at all, invisible to Googlebot (which
                      follows href, not onClick) and unusable via middle-click / open-in-
                      new-tab / copy-link. preventDefault stops the browser's own full-page
                      navigation for that href so router.push's SPA transition still fires
                      exactly as before — this is additive, not a behaviour change. */}
                  <a
                    href="/products/search"
                    onClick={(e) => {
                      e.preventDefault();
                      router.push("/products/search");
                    }}
                    className="relative overflow-hidden"
                    style={{
                      // Override global button/anchor styles - SAME AS NAV TABS
                      all: "unset",
                      cursor: "pointer",
                      display: "inline-block",
                      padding: "6px 16px",
                      borderRadius: "40px",
                      fontSize: "0.85rem",
                      fontWeight: "600",
                      textDecoration: "none",
                      transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                      position: "relative",
                      whiteSpace: "nowrap",
                      minWidth: "max-content",
                      // Conditional styling based on active state
                      ...(isSearchActive ? {
                        // Active state - Yellow gradient
                        background: `radial-gradient(ellipse at center, rgba(250, 204, 21, 0.9) 20%, rgba(250, 204, 21, 0.7) 60%, rgba(255, 215, 0, 0.8) 100%), rgba(250, 204, 21, 0.6)`,
                        border: "1px solid rgba(255, 215, 0, 0.9)",
                        color: "#000",
                        transform: "translateY(-2px) scale(1.02)",
                        boxShadow: `
                          0 10px 30px rgba(250, 204, 21, 0.6),
                          inset 0 2px 0 rgba(255, 255, 255, 0.8),
                          inset 0 3px 10px rgba(255, 255, 255, 0.4),
                          inset 0 -1px 0 rgba(255, 215, 0, 0.4)
                        `
                      } : {
                        // Inactive state - Default glass
                        background: `radial-gradient(ellipse at center, rgba(255, 255, 255, 0.3) 20%, rgba(255, 255, 255, 0.15) 70%, rgba(240, 240, 240, 0.2) 100%), rgba(255, 255, 255, 0.15)`,
                        backdropFilter: "blur(15px)",
                        border: "1px solid rgba(255, 255, 255, 0.4)",
                        color: "#333",
                        boxShadow: `
                          0 4px 15px rgba(0, 0, 0, 0.1),
                          inset 0 1px 0 rgba(255, 255, 255, 0.6),
                          inset 0 2px 8px rgba(255, 255, 255, 0.2),
                          inset 0 -1px 0 rgba(0, 0, 0, 0.05)
                        `
                      })
                    }}
                    onMouseEnter={(e) => {
                      if (!isSearchActive) {
                        e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
                        e.currentTarget.style.background = `radial-gradient(ellipse at center, rgba(250, 204, 21, 0.9) 20%, rgba(250, 204, 21, 0.7) 60%, rgba(255, 215, 0, 0.8) 100%), rgba(250, 204, 21, 0.6)`;
                        e.currentTarget.style.border = "1px solid rgba(255, 215, 0, 0.9)";
                        e.currentTarget.style.color = "#000";
                        e.currentTarget.style.boxShadow = `
                          0 10px 30px rgba(250, 204, 21, 0.6),
                          inset 0 2px 0 rgba(255, 255, 255, 0.8),
                          inset 0 3px 10px rgba(255, 255, 255, 0.4),
                          inset 0 -1px 0 rgba(255, 215, 0, 0.4)
                        `;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSearchActive) {
                        e.currentTarget.style.transform = "translateY(0px) scale(1)";
                        e.currentTarget.style.background = `radial-gradient(ellipse at center, rgba(255, 255, 255, 0.3) 20%, rgba(255, 255, 255, 0.15) 70%, rgba(240, 240, 240, 0.2) 100%), rgba(255, 255, 255, 0.15)`;
                        e.currentTarget.style.border = "1px solid rgba(255, 255, 255, 0.4)";
                        e.currentTarget.style.color = "#333";
                        e.currentTarget.style.boxShadow = `
                          0 4px 15px rgba(0, 0, 0, 0.1),
                          inset 0 1px 0 rgba(255, 255, 255, 0.6),
                          inset 0 2px 8px rgba(255, 255, 255, 0.2),
                          inset 0 -1px 0 rgba(0, 0, 0, 0.05)
                        `;
                      }
                    }}
                  >
                    {/* Glass shine effect - SAME AS NAV TABS */}
                    <span
                      style={{
                        position: "absolute",
                        top: "1px",
                        left: "8px",
                        right: "8px",
                        height: "50%",
                        background: "linear-gradient(180deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%)",
                        borderRadius: "40px 40px 20px 20px",
                        pointerEvents: "none",
                        transition: "all 0.4s ease"
                      }}
                    />
                    Search
                  </a>

                  {/* Cart Icon - Larger size with proper badge positioning */}
                  <div className="relative group" style={{ perspective: "1000px" }}>
                    <FiShoppingCart
                      onClick={toggleCart}
                      className="hover:cursor-pointer font-bold transition-colors duration-300 relative z-10"
                      style={{
                        width: "44px",
                        height: "44px",
                        padding: "10px",
                        background: "rgba(255, 255, 255, 0.15)",
                        backdropFilter: "blur(15px)",
                        border: "1px solid rgba(255, 255, 255, 0.25)",
                        borderRadius: "50%",
                        color: "#333",
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = "rgb(250, 204, 21)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = "#333";
                      }}
                    />
                    {/* Cart Count Badge - Always visible when items exist */}
                    {items.length > 0 && (
                      <div 
                        key={items.length}
                        style={{
                          position: "absolute",
                          top: "-6px",
                          right: "-6px",
                          fontSize: "10px",
                          fontWeight: "700",
                          padding: "3px 6px",
                          background: "rgb(250, 204, 21)",
                          color: "#000",
                          borderRadius: "50px",
                          zIndex: 20,
                          minWidth: "20px",
                          height: "20px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          animation: "cartBadgeAnimation 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
                          transformOrigin: "center",
                          border: "2px solid white",
                          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)"
                        }}
                      >
                        {items.length}
                      </div>
                    )}
                    {/* Black background animation only */}
                    <div 
                      className="absolute inset-0 rounded-full border-2 border-transparent transition-all duration-400 ease-out transform scale-0 opacity-0 z-0 group-hover:border-yellow-400 group-hover:bg-black group-hover:scale-110 group-hover:opacity-100"
                      style={{
                        top: "-2px",
                        left: "-2px", 
                        right: "-2px",
                        bottom: "-2px",
                        transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              <Cart open={cartOpen} handleClose={toggleCart} />
            </div>
          </div>
        </div>

        <AnimatePresence>
          {hover === "products" && (
            <ProductMenuHeader categories={categories} />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {hover === "buy" && (
            <BuyMenuHeader onClose={() => setHover(null)} />
          )}
        </AnimatePresence>

      </div>
    </HoverWrapper>
      <div style={{ height: "90px", width: "100%" }} />
    </>
  );
};

export default Header;