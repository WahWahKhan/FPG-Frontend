import { motion } from "framer-motion";
import { useState } from "react";
import { useRouter } from "next/router";
import { FiArrowLeft } from "react-icons/fi";

interface BuySubMenuProps {
  handleClose: () => void;
  onBack: () => void;
}

interface BuyOption {
  id: string;
  title: string;
  description: string;
  href: string;
}

const buyOptions: BuyOption[] = [
  {
    id: "hose360",
    title: "Hose360",
    description: "Hydraulic Hose Builder",
    href: "/hosebuilder/hose360",
  },
  {
    id: "trac360",
    title: "Trac360",
    description: "Tractor Hydraulic's Configurator",
    href: "/hosebuilder/trac360/start",
  },
  {
    id: "function360",
    title: "Function360",
    description: "Hydraulic Functions Configurator",
    href: "/hosebuilder/function360",
  },
  { id: "tube360", title: "Tube360", description: "Tube Bending Configurator", href: "/suite360/tube360/start" },
];

const BuySubMenu = ({ handleClose, onBack }: BuySubMenuProps) => {
  const [pressedItem, setPressedItem] = useState<string | null>(null);
  const [backPressed, setBackPressed] = useState(false);
  const router = useRouter();

  const handleItemPress = (optionId: string, href: string) => {
    setPressedItem(optionId);
    setTimeout(() => {
      router.push(href);
      handleClose();
      setPressedItem(null);
    }, 200);
  };

  const handleBackPress = () => {
    setBackPressed(true);
    setTimeout(() => {
      onBack();
      setBackPressed(false);
    }, 200);
  };

  return (
    <div className="flex flex-col gap-6 text-2xl font-light tracking-wider text-black">
      {/* Back Button */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{
          opacity: 1,
          x: 0,
          transition: { duration: 0.4 },
        }}
        exit={{
          opacity: 0,
          x: -50,
          transition: { duration: 0.2 },
        }}
        onTouchStart={handleBackPress}
        onMouseDown={handleBackPress}
        className="flex items-center gap-3 cursor-pointer px-3 py-2 rounded-xl transition-all duration-200"
        style={{
          background: backPressed 
            ? "rgba(250, 204, 21, 0.25)" 
            : "rgba(250, 204, 21, 0.1)",
          border: backPressed
            ? "1px solid rgba(250, 204, 21, 0.5)"
            : "1px solid rgba(250, 204, 21, 0.3)",
          boxShadow: backPressed
            ? "0 4px 15px rgba(250, 204, 21, 0.3)"
            : "none",
        }}
      >
        <FiArrowLeft className="text-2xl" style={{ color: "#333" }} />
        <span className="font-semibold" style={{ color: "#333" }}>Back to Menu</span>
      </motion.div>

      {/* Buy Options */}
      {buyOptions.map((option, i) => (
        <motion.div
          key={option.id}
          initial={{ opacity: 0, y: -50 }}
          animate={{
            opacity: 1,
            y: 0,
            transition: { duration: 0.5, delay: (i + 1) * 0.15 },
          }}
          exit={{
            opacity: 0,
            y: -50,
            transition: {
              duration: 0.2,
            },
          }}
          onTouchStart={() => handleItemPress(option.id, option.href)}
          onMouseDown={() => handleItemPress(option.id, option.href)}
          className="cursor-pointer px-4 py-3 rounded-xl transition-all duration-200"
          style={{
            backgroundColor: pressedItem === option.id 
              ? "rgba(250, 204, 21, 0.2)" 
              : "rgba(255, 255, 255, 0.3)",
            backdropFilter: "blur(10px)",
            border: pressedItem === option.id
              ? "1px solid rgba(250, 204, 21, 0.5)"
              : "1px solid rgba(255, 255, 255, 0.4)",
            boxShadow: pressedItem === option.id
              ? "0 4px 15px rgba(250, 204, 21, 0.3)"
              : "0 2px 8px rgba(0, 0, 0, 0.05)",
          }}
        >
          <div className="flex flex-col gap-1">
            <div className="font-semibold text-2xl" style={{ color: "#333" }}>
              {option.title}
            </div>
            <div 
              className="text-sm font-normal" 
              style={{ 
                color: "#666",
                letterSpacing: "normal"
              }}
            >
              {option.description}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default BuySubMenu;