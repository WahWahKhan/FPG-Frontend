import { motion, AnimatePresence } from "framer-motion";
import React from "react";
import { useRouter } from "next/router";
import Image from "next/image";

interface BuyMenuHeaderProps {
  onClose?: () => void;
}

interface BuyOption {
  id: string;
  title: string;
  description: string;
  href: string;
  image: string;
  isActive: boolean;
}

const buyOptions: BuyOption[] = [
  {
    id: "hose360",
    title: "Hose360",
    description: "Hydraulic Hose Builder",
    href: "/suite360/hose360",  // ← CHANGED from /hosebuilder/hose360
    image: "/Hose360.png",
    isActive: true,
  },
  {
    id: "trac360",
    title: "Trac360",
    description: "Tractor Hydraulics Configurator",
    href: "/suite360/trac360/start",  // ← CHANGED from /hosebuilder/trac360/start
    image: "/Trac360_Cart.png",
    isActive: true,
  },
  {
    id: "function360",
    title: "Function360",
    description: "Hydraulic Functions Configurator",
    href: "/suite360/function360/start",  // ← CHANGED from /hosebuilder/function360
    image: "/Function360.png",
    isActive: true,
  },
];

const BuyMenuHeader = ({ onClose }: BuyMenuHeaderProps) => {
  const router = useRouter();

  const handleNavigation = (option: BuyOption) => {
    if (option.isActive) {
      router.push(option.href);
      if (onClose) {
        onClose();
      }
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          .buy-hover-scale {
            transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
          }
          .buy-item-group:hover .buy-hover-scale {
            transform: scale(1.2) !important;
          }
        `
      }} />
      
      <motion.div 
        className="absolute w-full left-0 z-40"
        style={{ top: "80%" }}
        data-dropdown="buy-menu"
      >
        <motion.div
          className="py-16 px-10 xl:px-28 w-full z-30"
          style={{
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
            position: "relative"
          }}
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.3 } }}
          exit={{ opacity: 0, y: -50, transition: { duration: 0.2 } }}
        >
          {/* Subtle top shine */}
          <div
            style={{
              position: "absolute",
              top: "0",
              left: "0",
              right: "0",
              height: "20%",
              background: "linear-gradient(180deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.05) 100%)",
              borderRadius: "0 0 15px 15px",
              pointerEvents: "none",
              zIndex: 1
            }}
          />
          
          <div className="wrapper relative z-10">
            {/* Horizontal layout with wrapping */}
            <div className="flex flex-wrap gap-4">
              <AnimatePresence exitBeforeEnter>
                {buyOptions.map((option, index) => (
                  <div
                  key={option.id}
                  onClick={() => handleNavigation(option)}
                  className={option.isActive ? "hover:no-underline cursor-pointer" : "cursor-not-allowed"}
                  style={{
                    opacity: option.isActive ? 1 : 0.5,
                    filter: option.isActive ? "none" : "grayscale(60%)",
                  }}
                >
                    <motion.div
                      key={option.id}
                      initial={{ x: -50, opacity: 0 }}
                      animate={{ 
                        x: 0, 
                        opacity: 1,
                        transition: { duration: 0.3, delay: index * 0.1 }
                      }}
                      exit={{ x: 50, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="w-full h-full flex items-center rounded-lg buy-item-group cursor-pointer"
                    >
                    {/* ADD THIS: Coming Soon Badge */}
                    {!option.isActive && (
                      <div
                        className="absolute top-2 right-2 z-10 px-3 py-1 rounded-full text-xs font-semibold"
                        style={{
                          background: "rgba(128, 128, 128, 0.9)",
                          backdropFilter: "blur(10px)",
                          border: "1px solid rgba(100, 100, 100, 0.5)",
                          color: "#fff",
                        }}
                      >
                        Coming Soon
                      </div>
                    )}
                      {/* Thumbnail - exactly like SubCategories */}
                      <div 
                        className="rounded-xl w-24 h-24 p-1 border buy-hover-scale flex items-center justify-center overflow-hidden"
                        style={{ aspectRatio: '1 / 1' }}
                      >
                        <div className="relative w-full h-full">
                          <Image
                            src={option.image}
                            layout="fill"
                            objectFit="contain"
                            alt={option.title}
                          />
                        </div>
                      </div>
                      
                      {/* Text content */}
                      <div className="flex flex-col buy-hover-scale origin-left">
                        <h3 className="text-lg xl:text-xl font-light py-1 px-4">
                          {option.title}
                        </h3>
                        <p className="text-sm font-light px-4 text-gray-600">
                          {option.description}
                        </p>
                      </div>
                    </motion.div>
                  </div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
};

export default BuyMenuHeader;