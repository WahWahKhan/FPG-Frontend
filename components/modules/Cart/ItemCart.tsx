import { CartContext } from "context/CartWrapper";
import Image from "next/image";
import { useContext, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { FiX, FiPlus, FiMinus } from "react-icons/fi";
import { IItemCart } from "types/cart";
import { getItemPrice, isPWAOrder } from "utils/cart-helpers";

type IItemCartProps = { item: IItemCart };

const ItemCart = ({ item }: IItemCartProps) => {
  const { updateItem, deleteItem } = useContext(CartContext);
  const [showPDFModal, setShowPDFModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile on mount
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Check item type
  const isPWA = isPWAOrder(item);
  const isTrac360 = item.type === 'trac360_order';
  const isFunction360 = item.type === 'function360_order';
  const isTube360 = item.type === 'tube360_order';
  const isCustomOrder = isPWA || isTrac360 || isFunction360 || isTube360;
  
  // Get item price safely (handles both price and totalPrice)
  const itemPrice = getItemPrice(item);
  
  // Calculate the total price for the item based on its quantity
  const totalPrice = itemPrice * item.quantity;
  
  // Get stock with fallback (custom orders have unlimited stock)
  const itemStock = item.stock || 999;

  const incrementQuantity = () => {
    // Don't allow quantity changes for custom orders
    if (isCustomOrder) return;
    
    if (item.quantity < itemStock) {
      updateItem({ ...item, quantity: item.quantity + 1 });
    }
  };

  const decrementQuantity = () => {
    // Don't allow quantity changes for custom orders
    if (isCustomOrder) return;
    
    if (item.quantity > 0) {
      updateItem({ ...item, quantity: item.quantity - 1 });
    }
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Don't allow quantity changes for custom orders
    if (isCustomOrder) return;
    
    const value = parseInt(e.target.value) || 0;
    if (value >= 0 && value <= itemStock) {
      updateItem({ ...item, quantity: value });
    }
  };

  // Get PDF button label based on type
  const getPDFButtonLabel = () => {
    if (isFunction360) return 'View PDF'; 
    if (isTrac360) return 'View PDF';
    if (isPWA) return 'View PDF';
    return 'View PDF';
  };

  return (
    <div 
      className="m-3 p-4 flex gap-4 justify-between select-none transition-all duration-200 hover:shadow-md"
      style={{
        border: "1px solid rgba(0, 0, 0, 0.15)",
        borderRadius: "12px",
        background: "rgba(255, 255, 255, 0.5)",
        backdropFilter: "blur(5px)"
      }}
    >
      <div className="flex gap-4 flex-grow">
        <div 
          className="w-20 aspect-square p-2 min-w-fit"
          style={{
            background: "white",
            border: "1px solid rgba(0, 0, 0, 0.1)",
            borderRadius: "8px"
          }}
        >
          <div className="relative w-full h-full">
            <Image
              layout="fill"
              src={isTrac360 ? '/Trac360_Cart.png' : isPWA ? '/Hose360.png': isTube360 ? '/Tube360.png' : (item.image || '/cartImage.jpeg')}
              alt={item.name || "product"}
              objectFit="contain"
            />
          </div>
        </div>
        <div className="flex flex-col text-xl font-light gap-2">
        <h3 className="font-medium">
          {isPWA ? 'HOSE360 Custom Order' :
          isFunction360 ? 'FUNCTION360 Custom Order' :
          isTube360 ? 'TUBE360 Custom Tube' : item.name}
        </h3>

          {/* Custom orders show Qty: 1 (fixed) with PDF button */}
          {isCustomOrder && (
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-600">
                {isTube360 ? `Tubes: ${item.tube360Config?.spec?.quantity ?? 1}` : `Qty: ${item.quantity}`}
              </div>
              {item.pdfDataUrl && (
                <button
                  onClick={() => {
                    if (isMobile) {
                      // Open in new window for mobile
                      const newWindow = window.open('', '_blank');
                      if (newWindow) {
                        newWindow.document.write(`
                          <!DOCTYPE html>
                          <html>
                            <head>
                              <title>${getPDFButtonLabel()}</title>
                              <style>
                                body { margin: 0; padding: 0; }
                                iframe { width: 100vw; height: 100vh; border: none; }
                              </style>
                            </head>
                            <body>
                              <iframe src="${item.pdfDataUrl}"></iframe>
                            </body>
                          </html>
                        `);
                        newWindow.document.close();
                      }
                    } else {
                      // Open modal for desktop
                      setShowPDFModal(true);
                    }
                  }}
                  className="text-xs cursor-pointer transition-all duration-300"
                  style={{
                    padding: "6px 16px",
                    borderRadius: "20px",
                    background: "rgba(255, 255, 255, 0.9)",
                    backdropFilter: "blur(15px)",
                    border: "1px solid rgba(200, 200, 200, 0.3)",
                    color: "#2563eb",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
                    fontWeight: "600",
                    fontSize: "13px"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
                    e.currentTarget.style.background = "radial-gradient(ellipse at center, rgba(250, 204, 21, 0.9) 20%, rgba(250, 204, 21, 0.7) 60%, rgba(255, 215, 0, 0.8) 100%), rgba(250, 204, 21, 0.6)";
                    e.currentTarget.style.border = "1px solid rgba(255, 215, 0, 0.9)";
                    e.currentTarget.style.color = "#000";
                    e.currentTarget.style.boxShadow = "0 10px 30px rgba(250, 204, 21, 0.6), inset 0 2px 0 rgba(255, 255, 255, 0.8), inset 0 3px 10px rgba(255, 255, 255, 0.4), inset 0 -1px 0 rgba(255, 215, 0, 0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0px) scale(1)";
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.9)";
                    e.currentTarget.style.border = "1px solid rgba(200, 200, 200, 0.3)";
                    e.currentTarget.style.color = "#2563eb";
                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.08)";
                  }}
                >
                  {getPDFButtonLabel()}
                </button>
              )}
            </div>
          )}
          
          {/* Quantity Counter - Hidden for custom orders */}
          {!isCustomOrder && (
            <div className="flex items-center gap-2 mt-1">
              <button
                onClick={decrementQuantity}
                disabled={item.quantity <= 0}
                className="flex items-center justify-center transition-all duration-200"
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  border: "1px solid rgba(0, 0, 0, 0.2)",
                  background: item.quantity <= 0 
                    ? "rgba(200, 200, 200, 0.3)" 
                    : "rgba(255, 255, 255, 0.8)",
                  color: item.quantity <= 0 ? "#999" : "#333",
                  cursor: item.quantity <= 0 ? "not-allowed" : "pointer",
                  backdropFilter: "blur(10px)",
                  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"
                }}
                onMouseEnter={(e) => {
                  if (item.quantity > 0) {
                    e.currentTarget.style.background = "rgba(250, 204, 21, 0.8)";
                    e.currentTarget.style.transform = "scale(1.05)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (item.quantity > 0) {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.8)";
                    e.currentTarget.style.transform = "scale(1)";
                  }
                }}
              >
                <div style={{ width: "18px", height: "18px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <FiMinus style={{ width: "100%", height: "100%", minWidth: "18px", minHeight: "18px" }} />
                </div>
              </button>

              <input
                type="number"
                value={item.quantity}
                onChange={handleQuantityChange}
                min="0"
                max={itemStock}
                className="text-center font-semibold transition-all duration-200 focus:outline-none"
                style={{
                  width: "60px",
                  height: "32px",
                  borderRadius: "8px",
                  border: "1px solid rgba(0, 0, 0, 0.2)",
                  background: "rgba(255, 255, 255, 0.9)",
                  backdropFilter: "blur(10px)",
                  boxShadow: "inset 0 1px 3px rgba(0, 0, 0, 0.1)",
                  fontSize: "14px"
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "rgba(250, 204, 21, 0.8)";
                  e.currentTarget.style.boxShadow = "0 0 0 2px rgba(250, 204, 21, 0.2), inset 0 1px 3px rgba(0, 0, 0, 0.1)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "rgba(0, 0, 0, 0.2)";
                  e.currentTarget.style.boxShadow = "inset 0 1px 3px rgba(0, 0, 0, 0.1)";
                }}
              />

              <button
                onClick={incrementQuantity}
                disabled={item.quantity >= itemStock}
                className="flex items-center justify-center transition-all duration-200"
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  border: "1px solid rgba(0, 0, 0, 0.2)",
                  background: item.quantity >= itemStock 
                    ? "rgba(200, 200, 200, 0.3)" 
                    : "rgba(255, 255, 255, 0.8)",
                  color: item.quantity >= itemStock ? "#999" : "#333",
                  cursor: item.quantity >= itemStock ? "not-allowed" : "pointer",
                  backdropFilter: "blur(10px)",
                  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"
                }}
                onMouseEnter={(e) => {
                  if (item.quantity < itemStock) {
                    e.currentTarget.style.background = "rgba(250, 204, 21, 0.8)";
                    e.currentTarget.style.transform = "scale(1.05)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (item.quantity < itemStock) {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.8)";
                    e.currentTarget.style.transform = "scale(1)";
                  }
                }}
              >
                <div style={{ width: "18px", height: "18px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <FiPlus style={{ width: "100%", height: "100%", minWidth: "18px", minHeight: "18px" }} />
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col justify-between items-end text-xl font-light gap-1">
        <button
          className="flex items-center justify-center transition-all duration-200"
          onClick={() => deleteItem(item)}
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "8px",
            border: "1px solid rgba(220, 38, 38, 0.3)",
            background: "rgba(254, 226, 226, 0.8)",
            color: "#dc2626",
            cursor: "pointer"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)";
            e.currentTarget.style.borderColor = "rgba(220, 38, 38, 0.5)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(254, 226, 226, 0.8)";
            e.currentTarget.style.borderColor = "rgba(220, 38, 38, 0.3)";
          }}
        >
          <div style={{ width: "20px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <FiX style={{ width: "100%", height: "100%", minWidth: "20px", minHeight: "20px" }} />
          </div>
        </button>
        <h4 className="text-lg font-medium">${totalPrice.toFixed(2)}</h4>
      </div>

      {/* PDF Modal - Only for desktop */}
      {!isMobile && showPDFModal && item.pdfDataUrl && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{
            background: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(4px)"
          }}
          onClick={() => setShowPDFModal(false)}
        >
          <div 
            className="relative w-11/12 h-5/6 bg-white rounded-lg shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setShowPDFModal(false)}
              className="absolute top-4 right-4 z-10 transition-all duration-200 flex items-center justify-center"
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                border: "1px solid rgba(220, 38, 38, 0.3)",
                background: "rgba(254, 226, 226, 0.8)",
                color: "#dc2626",
                cursor: "pointer"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)";
                e.currentTarget.style.borderColor = "rgba(220, 38, 38, 0.5)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(254, 226, 226, 0.8)";
                e.currentTarget.style.borderColor = "rgba(220, 38, 38, 0.3)";
              }}
            >
              <div style={{ width: "20px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <FiX style={{ width: "100%", height: "100%", minWidth: "20px", minHeight: "20px" }} />
              </div>
            </button>
            
            {/* PDF viewer */}
            <object
              data={item.pdfDataUrl}
              type="application/pdf"
              className="w-full h-full"
              style={{ border: "none" }}
            >
              {/* Fallback for mobile - download link */}
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <p className="mb-4 text-gray-700">Unable to display PDF in browser.</p>
                <a
                  href={item.pdfDataUrl}
                  download={`${isTrac360 ? 'tractor-configuration' : isTube360 ? 'tube360-configuration' : 'hose-assembly'}.pdf`}
                  className="px-6 py-3 rounded-lg font-semibold transition-all"
                  style={{
                    background: "radial-gradient(ellipse at center, rgba(250, 204, 21, 0.9) 20%, rgba(250, 204, 21, 0.7) 60%, rgba(255, 215, 0, 0.8) 100%), rgba(250, 204, 21, 0.6)",
                    border: "1px solid rgba(255, 215, 0, 0.9)",
                    color: "#000"
                  }}
                >
                  Download PDF
                </a>
              </div>
            </object>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ItemCart;