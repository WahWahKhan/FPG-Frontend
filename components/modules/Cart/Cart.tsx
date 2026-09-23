import { CartContext } from "context/CartWrapper";
import { AnimatePresence, motion } from "framer-motion";
import { useContext, useRef, CSSProperties } from "react";
import { useLockBodyScrollForOverlay } from "../../../utils/useLockBodyScrollForOverlay";
import FooterCart from "./FooterCart";
import HeaderCart from "./HeaderCart";
import ItemCart from "./ItemCart";

interface ICart {
  open: boolean;
  handleClose: () => void;
}

const Cart = ({ open, handleClose }: ICart) => {
  const { items } = useContext(CartContext);
  const scrollRef = useRef<HTMLDivElement>(null);

  useLockBodyScrollForOverlay(open, scrollRef);

  const isEmpty = !items.length;

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed left-0 top-0 w-screen h-screen overlay-full-height z-30 flex justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.6, delay: 0.4 } }}
            exit={{ opacity: 0, transition: { duration: 0.4 } }}
            className="absolute left-0 top-0 w-full h-full bg-black/40"
            onClick={handleClose}
          ></motion.div>
          <motion.div
            className="h-full max-w-md w-full justify-between flex flex-col z-50"
            style={{
              // Glass effect background similar to Snackbar
              background: `
                linear-gradient(180deg, 
                  rgba(255, 255, 255, 0.25) 0%, 
                  rgba(255, 255, 255, 0.2) 60%, 
                  rgba(255, 255, 255, 0.35) 85%, 
                  rgba(255, 255, 255, 0.4) 100%
                ),
                rgba(255, 255, 255, 0.3)
              `,
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255, 255, 255, 0.25)",
              borderLeft: "none", // Remove left border to fix fringing
              borderRadius: "25px 0 0 25px",
              boxShadow: `
                0 15px 35px rgba(0, 0, 0, 0.08),
                inset 0 1px 0 rgba(255, 255, 255, 0.4),
                inset 0 -2px 8px rgba(255, 255, 255, 0.15)
              `,
            }}
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1, transition: { duration: 0.6, delay: 0.4 } }}
            exit={{ x: 500, opacity: 0, transition: { duration: 0.4 } }}
            // Swipe-right-to-close (iOS-style dismiss gesture). Locked to the
            // x axis only, so a vertical touch on the item list is still
            // free to scroll - framer-motion decides which axis a gesture
            // belongs to from its initial direction, same mechanism as any
            // native swipeable drawer. dragConstraints of a zero-width box
            // means: no free-form dragging, but dragElastic lets the panel
            // visually follow the finger with rubber-band resistance past
            // that point; on release, framer-motion auto-animates back to
            // x:0 unless we've already triggered handleClose() below.
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={{ left: 0, right: 0.6 }}
            dragMomentum={false}
            onDragEnd={(_event, info) => {
              if (info.offset.x > 100 || info.velocity.x > 500) {
                handleClose();
              }
            }}
          >
            <HeaderCart handleClose={handleClose} />
            <div
              ref={scrollRef}
              className="flex flex-col flex-1 min-h-0 overflow-y-auto"
              style={{ overscrollBehavior: "contain", WebkitOverflowScrolling: "touch" } as CSSProperties}
            >
              {isEmpty ? (
                <div className="h-full flex flex-col items-center justify-center">
                  Your Cart is Empty
                </div>
              ) : (
                items.map((item, i) => <ItemCart key={i} item={item} />)
              )}
            </div>
            {isEmpty || <FooterCart handleClose={handleClose} items={ items} />}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Cart;