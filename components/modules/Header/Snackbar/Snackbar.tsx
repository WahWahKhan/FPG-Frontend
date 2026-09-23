import siteLinks from "constants/site-links";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useRef, useState } from "react";
import { FiMenu } from "react-icons/fi";
import { useLockBodyScrollForOverlay } from "../../../../utils/useLockBodyScrollForOverlay";
import NavSnackbar from "./NavSnackbar";

const Snackbar = () => {
  const [menu, setMenu] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const variants = {
    initial: { opacity: 0, y: -100 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, staggerChildren: 0.5 },
    },
    exit: { opacity: 0, y: -100, transition: { duration: 0.3 } },
  };

  useLockBodyScrollForOverlay(menu, panelRef);

  return (
    <div className="relative">
      {/* FLOW FIX: Remove all absolute positioning, make it behave like normal content */}
      <div
        onClick={() => {
          setMenu(!menu);
        }}
        className="cursor-pointer p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 relative"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "4px",
          width: "32px",
          height: "32px",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: "24px",
            height: "3px",
            backgroundColor: "#333",
            borderRadius: "2px",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            position: "absolute",
            top: menu ? "50%" : "calc(50% - 7px)",
            transform: menu ? "translateY(-50%) rotate(45deg)" : "translateY(-50%) rotate(0)",
          }}
        />
        <div
          style={{
            width: "24px",
            height: "3px",
            backgroundColor: "#333",
            borderRadius: "2px",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            position: "absolute",
            top: "50%",
            opacity: menu ? 0 : 1,
            transform: menu ? "translateY(-50%) scale(0)" : "translateY(-50%) scale(1)",
          }}
        />
        <div
          style={{
            width: "24px",
            height: "3px",
            backgroundColor: "#333",
            borderRadius: "2px",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            position: "absolute",
            top: menu ? "50%" : "calc(50% + 7px)",
            transform: menu ? "translateY(-50%) rotate(-45deg)" : "translateY(-50%) rotate(0)",
          }}
        />
      </div>

      <AnimatePresence exitBeforeEnter>
        {menu && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{
                opacity: 1,
                transition: { duration: 0.8 },
              }}
              exit={{ opacity: 0, transition: { duration: 0 } }}
              className="fixed inset-0 z-40 bg-black/10"
              style={{ top: "90px" }} // Start below header
              onClick={() => setMenu(!menu)}
            ></motion.div>
            <motion.div
              ref={panelRef}
              className="fixed left-0 right-0 z-50 p-6 border-b"
              style={{
                // FLOW FIX: Use fixed positioning that's viewport-based, not container-based
                top: "90px", // Position right below header
                width: "100%",
                // Glass effect background with gradient towards bottom
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
                borderRadius: "0 0 25px 25px",
                boxShadow: `
                  0 15px 35px rgba(0, 0, 0, 0.08),
                  inset 0 1px 0 rgba(255, 255, 255, 0.4),
                  inset 0 -2px 8px rgba(255, 255, 255, 0.15)
                `,
              }}
              variants={variants}
              initial={"initial"}
              animate={"animate"}
              exit={"exit"}
            >
              <NavSnackbar
                handleClose={() => {
                  setMenu(false);
                }}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Snackbar;