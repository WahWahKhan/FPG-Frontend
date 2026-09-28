import clsx from "clsx";
import siteLinks from "constants/site-links";
import { HoverContext } from "context/HoverWrapper";
import React, { useContext } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

interface NavHeaderProps {
  isProductsActive?: boolean;
  isBuyActive?: boolean;
}

const NavHeader = ({ isProductsActive, isBuyActive }: NavHeaderProps) => {
  const { hover, setHover } = useContext(HoverContext);
  const router = useRouter();

  // ✅ FIXED: Function to check if a tab is active (now uses ID)
  const isActiveTab = (href: string, id: string) => {
    // Special handling for Products tab - use the passed prop
    if (id === "products" && isProductsActive !== undefined) {
      return isProductsActive;
    }
    
    // Special handling for Buy tab - use the passed prop
    if (id === "buy" && isBuyActive !== undefined) {
      return isBuyActive;
    }
    
    // Handle home page specifically
    if (href === "/" && router.pathname === "/") {
      return true;
    }
    // For other pages, check if the current path starts with the href
    if (href !== "/" && router.pathname.startsWith(href)) {
      return true;
    }
    return false;
  };

  return (
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
      {siteLinks.map((page) => {
        const isActive = isActiveTab(page.href, page.id);
          
          return (
            <div
              onMouseEnter={() => {
                
                if (page.id !== "about" && page.id !== "contact" && page.id !== "buy") {
                  setHover(page.id);  // ← Now sets "products" ✅
                }
                // Trigger Buy dropdown on hover
                if (page.id === "buy") {
                  setHover(page.id);  // ← Now sets "buy" ✅
                }
              }}
              key={page.id}
            >
              {/* next/link, not a bare <a>: a bare <a> did a full page reload on
                  every nav click (re-downloading all JS + menu data). Link still
                  renders a real <a href> in the server HTML, so crawlers,
                  middle-click and open-in-new-tab behave exactly as before.
                  The key remounts the <a> when its active state flips: the hover
                  handlers write inline styles straight to the DOM, which the old
                  full reload wiped but a client-side route change doesn't. */}
              <Link href={page.href} passHref key={`${page.id}-${isActive}`}>
              <a
                className="relative text-sm capitalize font-semibold overflow-hidden"
                style={{
                  all: "unset",
                  cursor: "pointer",
                  display: "inline-block",
                  padding: page.id === "contact" ? "8px 10px" : "8px 16px",
                  borderRadius: "40px",
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  color: isActive ? "#000" : "#333",
                  textDecoration: "none",
                  transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                  position: "relative",
                  whiteSpace: "nowrap",
                  minWidth: "max-content",
                  background: isActive 
                    ? `radial-gradient(ellipse at center, rgba(250, 204, 21, 0.9) 20%, rgba(250, 204, 21, 0.7) 60%, rgba(255, 215, 0, 0.8) 100%), rgba(250, 204, 21, 0.6)`
                    : `radial-gradient(ellipse at center, rgba(255, 255, 255, 0.3) 20%, rgba(255, 255, 255, 0.15) 70%, rgba(240, 240, 240, 0.2) 100%), rgba(255, 255, 255, 0.15)`,
                  backdropFilter: "blur(15px)",
                  border: isActive 
                    ? "1px solid rgba(255, 215, 0, 0.9)"
                    : "1px solid rgba(255, 255, 255, 0.4)",
                  boxShadow: isActive
                    ? `0 10px 30px rgba(250, 204, 21, 0.6),
                       inset 0 2px 0 rgba(255, 255, 255, 0.8),
                       inset 0 3px 12px rgba(255, 255, 255, 0.4),
                       inset 0 -1px 0 rgba(255, 215, 0, 0.4)`
                    : `0 4px 15px rgba(0, 0, 0, 0.1),
                       inset 0 1px 0 rgba(255, 255, 255, 0.6),
                       inset 0 2px 8px rgba(255, 255, 255, 0.2),
                       inset 0 -1px 0 rgba(0, 0, 0, 0.05)`
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
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
                  if (!isActive) {
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
                {/* Glass shine effect */}
                <span
                  style={{
                    position: "absolute",
                    top: "1px",
                    left: "8px",
                    right: "8px",
                    height: "50%",
                    background: isActive 
                      ? "linear-gradient(180deg, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.2) 50%, rgba(250, 204, 21, 0.1) 100%)"
                      : "linear-gradient(180deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%)",
                    borderRadius: "40px 40px 20px 20px",
                    pointerEvents: "none",
                    transition: "all 0.4s ease"
                  }}
                />
                {page.title}
              </a>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default NavHeader;