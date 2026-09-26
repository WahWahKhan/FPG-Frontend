import Anchor from "@/modules/Anchor";
import siteLinks from "constants/site-links";
import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useState } from "react";
import { v4 as uuid } from "uuid";
import BuySubMenu from "./BuySubMenu";

type INavSnackbarProps = { handleClose: () => void };

const NavSnackbar = ({ handleClose }: INavSnackbarProps) => {
  const [pressedItem, setPressedItem] = useState<string | null>(null);
  const [showBuySubMenu, setShowBuySubMenu] = useState(false);
  
  const pages = useMemo(
    () => siteLinks.map((page) => ({ ...page, id: uuid() })),
    []
  );

  const handleItemPress = (pageId: string, pageHref: string) => {
    // If Suite360 (formerly "Buy") tab is clicked, show submenu instead of navigating
    if (pageHref === "/suite360") {
      setPressedItem(pageId);
      setTimeout(() => {
        setShowBuySubMenu(true);
        setPressedItem(null);
      }, 200);
      return;
    }

    // Normal navigation for other tabs
    setPressedItem(pageId);
    setTimeout(() => {
      setPressedItem(null);
    }, 200);
  };

  const handleBackToMainMenu = () => {
    setShowBuySubMenu(false);
  };

  return (
    <AnimatePresence exitBeforeEnter>
      {!showBuySubMenu ? (
        <motion.div
          key="main-menu"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col gap-4 text-3xl font-light tracking-wider text-black"
        >
          {pages.map((page, i) => (
            <motion.div
              key={page.id}
              initial={{ opacity: 0, y: -100 }}
              animate={{
                opacity: 1,
                y: 0,
                transition: { duration: 0.6, delay: i * 0.2 },
              }}
              exit={{
                opacity: 0,
                y: -100,
                transition: {
                  duration: 0.2,
                },
              }}
              onClick={() => {
                if (page.href !== "/suite360") {
                  handleClose();
                }
              }}
              onTouchStart={() => handleItemPress(page.id, page.href)}
              onMouseDown={() => handleItemPress(page.id, page.href)}
              className="cursor-pointer px-2 py-1 rounded-xl transition-[background-color,border-color,box-shadow] duration-200"
              style={{
                backgroundColor: pressedItem === page.id ? "rgba(0, 0, 0, 0.1)" : "transparent"
              }}
            >
              {page.href === "/suite360" ? (
                <div className="flex items-center gap-4">
                  {page.title}
                </div>
              ) : (
                <Anchor href={page.href} className="flex items-center gap-4">
                  {page.title}
                </Anchor>
              )}
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div
          key="buy-submenu"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <BuySubMenu 
            handleClose={handleClose} 
            onBack={handleBackToMainMenu}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NavSnackbar;