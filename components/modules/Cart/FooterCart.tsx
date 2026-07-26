import { useRouter } from "next/router"
import { useContext } from "react"
import { CartContext } from "../../../context/CartWrapper"

const FooterCart = ({items, handleClose} : any) => {
  const router = useRouter();
  const { openSaveCart } = useContext(CartContext);

  const checkout = async () => {
    // All items now go through the unified checkout system
    console.log('Routing to unified checkout - Total items:', items.length);

    // Log breakdown for debugging
    const pwaItems = items.filter((item: any) => item.type === 'pwa_order');
    const websiteItems = items.filter((item: any) => item.type !== 'pwa_order');
    console.log('Breakdown - PWA items:', pwaItems.length, 'Website items:', websiteItems.length);

    // Close the cart drawer before navigating
    handleClose();

    // Route to unified checkout (reads from localStorage)
    router.push('/checkout');
  }

  const saveCart = () => {
    // Email the cart to yourself and resume later. Opens the
    // save-cart modal in place (email-only, no account, no navigation) so the
    // user stays exactly where they were.
    handleClose();
    openSaveCart();
  }

  return (
    <div className="border p-4 flex flex-col gap-4 items-center">
      {/* Continue Shopping Button - Yellow 3D Glass */}
      <button 
        className="relative overflow-hidden transition-all duration-300 ease-out"
        onClick={handleClose}
        style={{
          all: "unset",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "14px 28px",
          borderRadius: "40px",
          fontSize: "1.125rem",
          fontWeight: "600",
          color: "#000",
          textDecoration: "none",
          transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
          position: "relative",
          whiteSpace: "nowrap" as const,
          minWidth: "180px",
          width: "auto",
          background: `radial-gradient(ellipse at center, rgba(250, 204, 21, 0.9) 20%, rgba(250, 204, 21, 0.7) 60%, rgba(255, 215, 0, 0.8) 100%), rgba(250, 204, 21, 0.6)`,
          backdropFilter: "blur(15px)",
          border: "1px solid rgba(255, 215, 0, 0.9)",
          boxShadow: `
            0 6px 20px rgba(250, 204, 21, 0.4),
            inset 0 2px 0 rgba(255, 255, 255, 0.8),
            inset 0 3px 8px rgba(255, 255, 255, 0.4),
            inset 0 -1px 0 rgba(255, 215, 0, 0.4)
          `
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
          e.currentTarget.style.background = `radial-gradient(ellipse at center, rgba(255, 215, 0, 1) 20%, rgba(250, 204, 21, 0.9) 60%, rgba(255, 235, 59, 0.9) 100%), rgba(255, 215, 0, 0.8)`;
          e.currentTarget.style.border = "1px solid rgba(255, 235, 59, 1)";
          e.currentTarget.style.boxShadow = `
            0 10px 30px rgba(250, 204, 21, 0.6),
            inset 0 2px 0 rgba(255, 255, 255, 0.9),
            inset 0 4px 12px rgba(255, 255, 255, 0.5),
            inset 0 -1px 0 rgba(255, 215, 0, 0.6)
          `;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0px) scale(1)";
          e.currentTarget.style.background = `radial-gradient(ellipse at center, rgba(250, 204, 21, 0.9) 20%, rgba(250, 204, 21, 0.7) 60%, rgba(255, 215, 0, 0.8) 100%), rgba(250, 204, 21, 0.6)`;
          e.currentTarget.style.border = "1px solid rgba(255, 215, 0, 0.9)";
          e.currentTarget.style.boxShadow = `
            0 6px 20px rgba(250, 204, 21, 0.4),
            inset 0 2px 0 rgba(255, 255, 255, 0.8),
            inset 0 3px 8px rgba(255, 255, 255, 0.4),
            inset 0 -1px 0 rgba(255, 215, 0, 0.4)
          `;
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "1px",
            left: "8px",
            right: "8px",
            height: "50%",
            background: "linear-gradient(180deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.3) 50%, rgba(255, 215, 0, 0.2) 100%)",
            borderRadius: "40px 40px 20px 20px",
            pointerEvents: "none",
            transition: "all 0.3s ease"
          }}
        />
        Continue Shopping
      </button>

      {/* Save Cart Button - Slate glass (busy now? email it to yourself) */}
      <button
        onClick={saveCart}
        style={{
          all: "unset",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "12px 26px",
          borderRadius: "40px",
          fontSize: "1.05rem",
          fontWeight: 600,
          color: "#1e293b",
          whiteSpace: "nowrap" as const,
          minWidth: "180px",
          background: "linear-gradient(180deg, #ffffff 0%, #eef2f7 100%)",
          border: "1px solid #cbd5e1",
          boxShadow: "0 3px 10px rgba(15, 23, 42, 0.12), inset 0 1px 0 rgba(255,255,255,0.9)",
          transition: "all 0.3s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = "0 8px 20px rgba(15, 23, 42, 0.18), inset 0 1px 0 rgba(255,255,255,0.9)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 3px 10px rgba(15, 23, 42, 0.12), inset 0 1px 0 rgba(255,255,255,0.9)";
        }}
      >
        Save Cart for Later
      </button>

      {/* Go to Checkout Button - Black 3D Glass */}
      <button 
        className="relative overflow-hidden transition-all duration-300 ease-out"
        onClick={checkout}
        style={{
          all: "unset",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "14px 28px",
          borderRadius: "40px",
          fontSize: "1.125rem",
          fontWeight: "600",
          color: "#fff",
          textDecoration: "none",
          transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
          position: "relative",
          whiteSpace: "nowrap" as const,
          minWidth: "180px",
          width: "auto",
          background: `radial-gradient(ellipse at center, rgba(0, 0, 0, 0.9) 20%, rgba(0, 0, 0, 0.8) 70%, rgba(20, 20, 20, 0.85) 100%), rgba(0, 0, 0, 0.8)`,
          backdropFilter: "blur(15px)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          boxShadow: `
            0 4px 15px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.3),
            inset 0 2px 8px rgba(255, 255, 255, 0.1),
            inset 0 -1px 0 rgba(0, 0, 0, 0.2)
          `
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
          e.currentTarget.style.background = `radial-gradient(ellipse at center, rgba(255, 255, 255, 0.95) 20%, rgba(255, 255, 255, 0.9) 70%, rgba(245, 245, 245, 0.95) 100%), rgba(255, 255, 255, 0.9)`;
          e.currentTarget.style.border = "1px solid rgba(200, 200, 200, 0.8)";
          e.currentTarget.style.color = "#000";
          e.currentTarget.style.boxShadow = `
            0 10px 30px rgba(0, 0, 0, 0.2),
            inset 0 2px 0 rgba(255, 255, 255, 1),
            inset 0 3px 10px rgba(255, 255, 255, 0.8),
            inset 0 -1px 0 rgba(200, 200, 200, 0.4)
          `;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0px) scale(1)";
          e.currentTarget.style.background = `radial-gradient(ellipse at center, rgba(0, 0, 0, 0.9) 20%, rgba(0, 0, 0, 0.8) 70%, rgba(20, 20, 20, 0.85) 100%), rgba(0, 0, 0, 0.8)`;
          e.currentTarget.style.border = "1px solid rgba(255, 255, 255, 0.2)";
          e.currentTarget.style.color = "#fff";
          e.currentTarget.style.boxShadow = `
            0 4px 15px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.3),
            inset 0 2px 8px rgba(255, 255, 255, 0.1),
            inset 0 -1px 0 rgba(0, 0, 0, 0.2)
          `;
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "1px",
            left: "8px",
            right: "8px",
            height: "50%",
            background: "linear-gradient(180deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%)",
            borderRadius: "40px 40px 20px 20px",
            pointerEvents: "none",
            transition: "all 0.4s ease"
          }}
        />
        Go to Checkout
      </button>
    </div>
  );
};

export default FooterCart;