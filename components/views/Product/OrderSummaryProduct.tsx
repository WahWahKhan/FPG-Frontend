import { CartContext } from "context/CartWrapper";
import { AnimatePresence, motion } from "framer-motion";
import { useContext, useMemo, useState } from "react";
import { IItemCart } from "types/cart";
import { useRouter } from "next/router";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";

// Frosted "liquid glass" so blurry hints of the page show through the band.
const GLASS_STYLE: React.CSSProperties = {
  background: "rgba(255,255,255,0.55)",
  backdropFilter: "blur(20px) saturate(180%)",
  WebkitBackdropFilter: "blur(20px) saturate(180%)",
  border: "1px solid rgba(255,255,255,0.5)",
  boxShadow: "0 -6px 30px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.7)",
};

type IOrderSummaryProductProps = {
  items: IItemCart[];
  series?: ISeries;
  handleClear: () => void;
};

type ISeries = {
  name: string;
  description: string;
  images: string[];
};

const OrderSummaryProduct = ({
  items,
  series,
  handleClear,
}: IOrderSummaryProductProps) => {
  const itemsAdded = useMemo(
    () => items.filter((item) => item.quantity),
    [items]
  );
  const router = useRouter();
  const { addItem } = useContext(CartContext);
  const [expanded, setExpanded] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const totalPrice = useMemo(
    () => items.reduce((prev, curr) => prev + (curr.price || 0) * curr.quantity, 0),
    [items]
  );

  const grandTotal = totalPrice;
  const unitCount = useMemo(
    () => itemsAdded.reduce((n, it) => n + (it.quantity || 0), 0),
    [itemsAdded]
  );

  const addAll = () => {
    itemsAdded.forEach((item) => {
      addItem({ ...item, image: series?.images?.[0] || "/cartImage.jpeg" });
    });
  };

  const handleAddToCart = () => {
    addAll();
    setExpanded(false);
    handleClear(); // resets quantities → the bar animates away, confirming the add
  };

  const checkout = async () => {
    addAll();
    setExpanded(false);
    handleClear();
    router.push("/checkout");
  };

  return (
    <AnimatePresence>
      {itemsAdded.length > 0 && (
        <motion.div
          className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.25 } }}
          exit={{ opacity: 0, transition: { duration: 0.2 } }}
        >
          <div className="mx-auto max-w-5xl px-3 sm:px-4 pb-3 sm:pb-4 pointer-events-auto">
            {collapsed ? (
              /* Collapsed → a compact glass pill; click to expand the band back.
                 Lets the user reach anything hidden behind the full band. */
              <motion.div
                className="flex justify-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
              >
                <button
                  onClick={() => setCollapsed(false)}
                  aria-label="Expand order summary"
                  className="flex items-center gap-2 rounded-full px-5 py-2.5"
                  style={{ ...GLASS_STYLE, cursor: "pointer" }}
                >
                  <FiChevronUp className="text-gray-600" />
                  <span className="font-bold text-gray-900">${grandTotal.toFixed(2)}</span>
                  <span className="text-sm text-gray-500">
                    &middot; {unitCount} item{unitCount === 1 ? "" : "s"}
                  </span>
                </button>
              </motion.div>
            ) : (
            <>
            {/* Expandable detail — the "same context" without scrolling away */}
            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 12 }}
                  className="mb-2 rounded-2xl p-5 max-h-[45vh] overflow-y-auto"
                  style={{ ...GLASS_STYLE, background: "rgba(255,255,255,0.8)" }}
                >
                  <h3 className="text-lg font-semibold mb-3">Order Summary</h3>
                  <div className="flex flex-col gap-2 text-base">
                    {itemsAdded.map((item) => (
                      <div className="flex justify-between gap-6" key={item.name}>
                        <span className="text-gray-700">
                          {item.quantity} &times; {item.name}
                        </span>
                        <span className="font-medium">
                          ${(item.quantity * (item.price || 0)).toFixed(2)}
                        </span>
                      </div>
                    ))}
                    <div className="border-t my-1" />
                    <div className="flex justify-between gap-6 font-bold">
                      <span>Total</span>
                      <span>${grandTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* The sticky bar */}
            <div
              className="rounded-2xl px-3 sm:px-5 py-3 flex items-center justify-between gap-3"
              style={GLASS_STYLE}
            >
              {/* Left: collapse handle + count/total (click to expand breakdown) */}
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <button
                  onClick={() => { setExpanded(false); setCollapsed(true); }}
                  aria-label="Collapse order summary"
                  title="Collapse"
                  style={{
                    all: "unset",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "34px",
                    height: "34px",
                    borderRadius: "9999px",
                    background: "rgba(255,255,255,0.55)",
                    border: "1px solid rgba(0,0,0,0.08)",
                    color: "#374151",
                    flexShrink: 0,
                  }}
                >
                  <FiChevronDown size={18} />
                </button>
                <button
                  onClick={() => setExpanded((v) => !v)}
                  className="flex items-center min-w-0 text-left"
                  style={{ all: "unset", cursor: "pointer" }}
                  aria-expanded={expanded}
                >
                <span className="flex flex-col leading-tight min-w-0">
                  <span className="text-sm text-gray-600 whitespace-nowrap">
                    {unitCount} item{unitCount === 1 ? "" : "s"} ready
                    <span className="ml-1 text-gray-900 font-semibold underline">
                      {expanded ? "Hide" : "View"}
                    </span>
                  </span>
                  <span className="text-lg sm:text-xl font-bold text-gray-900 whitespace-nowrap">
                    ${grandTotal.toFixed(2)}
                    <span className="ml-1 text-xs font-normal text-gray-500">excl. GST</span>
                  </span>
                </span>
                </button>
              </div>

              {/* Right: actions — stacked on mobile (so both fit and neither
                  slips under the floating chat button), row on desktop. The
                  right margin on mobile keeps them clear of the chat bubble. */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 shrink-0 mr-16 sm:mr-0">
                <button
                  onClick={checkout}
                  className="transition-all duration-300"
                  style={{
                    all: "unset",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "10px 20px",
                    borderRadius: "40px",
                    fontSize: "1rem",
                    fontWeight: 600,
                    color: "#fff",
                    whiteSpace: "nowrap",
                    background:
                      "radial-gradient(ellipse at center, rgba(0,0,0,0.9) 20%, rgba(0,0,0,0.8) 70%, rgba(20,20,20,0.85) 100%), rgba(0,0,0,0.8)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    boxShadow: "0 4px 15px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.3)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  Checkout
                </button>

                <button
                  onClick={handleAddToCart}
                  className="transition-all duration-300"
                  style={{
                    all: "unset",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "10px 22px",
                    borderRadius: "40px",
                    fontSize: "1rem",
                    fontWeight: 600,
                    color: "#000",
                    whiteSpace: "nowrap",
                    background:
                      "radial-gradient(ellipse at center, rgba(250,204,21,0.95) 20%, rgba(250,204,21,0.8) 60%, rgba(255,215,0,0.9) 100%), rgba(250,204,21,0.7)",
                    border: "1px solid rgba(255,215,0,0.9)",
                    boxShadow: "0 6px 20px rgba(250,204,21,0.5), inset 0 2px 0 rgba(255,255,255,0.8)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  Add to cart
                </button>
              </div>
            </div>
            </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OrderSummaryProduct;