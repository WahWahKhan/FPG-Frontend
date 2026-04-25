import { motion } from "framer-motion";
import React, { useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import { FiHelpCircle, FiX } from "react-icons/fi";
import Head from 'next/head';

interface Product {
  id: string;
  title: string;
  description: string;
  href: string;
  image: string;
  isActive: boolean;
  learnMore: string;
}

const products: Product[] = [
  {
    id: "hose360",
    title: "Hose360",
    description: "Hydraulic Hose Builder",
    href: "/suite360/hose360",  // ← CHANGED from /hosebuilder/hose360
    image: "/Hose360.png",
    isActive: true,
    learnMore: "Build custom hydraulic hose assemblies with our interactive configurator. Select fittings, hoses, and specifications to create your perfect assembly.",
  },
  {
    id: "trac360",
    title: "Trac360",
    description: "Tractor Hydraulics Configurator",
    href: "/suite360/trac360/start",  // ← CHANGED from /hosebuilder/trac360/start
    image: "/Trac360_Cart.png",
    isActive: false,
    learnMore: "Configure your tractor's hydraulic valve setup with our step-by-step guide. Choose your tractor model, valve location, and operation type to get a complete solution.",
  },
  {
    id: "function360",
    title: "Function360",
    description: "Hydraulic Functions Configurator",
    href: "/suite360/function360/start",  // ← CHANGED from /hosebuilder/function360 (even though not active yet)
    image: "/Function360.png",
    isActive: false,
    learnMore: "Our next-generation product configurator is currently in development. Stay tuned for updates!",
  },
];

const Title360 = ({ title, color }: { title: string; color: string }) => {
  const base = title.endsWith('0') ? title.slice(0, -1) : title;
  return (
    <span className="inline-flex items-center" style={{ gap: '1px' }}>
      <span style={{ color }}>{base}</span>
      <img
        src="/circular-arrow.svg"
        alt="0"
        style={{ width: '0.78em', height: '0.78em', display: 'inline-block' }}
      />
    </span>
  );
};

const BuyPage = () => {
  const router = useRouter();
  const [learnMoreModal, setLearnMoreModal] = useState<string | null>(null);

  const handleNavigation = (product: Product) => {
    if (product.isActive) {
      router.push(product.href);
    }
  };

  const handleLearnMore = (e: React.MouseEvent, productId: string) => {
    e.stopPropagation();
    setLearnMoreModal(productId);
  };

  const selectedProduct = products.find(p => p.id === learnMoreModal);
  const [rotation, setRotation] = useState(720);

  return (
    <>
    <Head>
      <title>Suite360 | FluidPower Group</title>
      <meta name="description" content="Build your custom hydraulic solution with Suite360. Configure custom hose assemblies, tractor hydraulic kits and function kits online in minutes." />
    </Head>
    <div 
      className="min-h-screen w-full flex items-center justify-center relative overflow-hidden"
      style={{
        background: `
          linear-gradient(90deg, 
            rgba(250, 204, 21, 0.4) 0%,
            rgba(250, 204, 21, 0.3) 20%,
            rgba(250, 204, 21, 0.15) 35%,
            rgba(255, 255, 255, 0.8) 40%,
            rgba(255, 255, 255, 1) 60%,
            rgba(255, 255, 255, 1) 100%
          )
        `,
      }}
    >
      {/* Animated background accent */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(circle at 20% 50%, rgba(250, 204, 21, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 30%, rgba(250, 204, 21, 0.05) 0%, transparent 40%)
          `,
        }}
      />

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-16"
        >
          {/* SUITE 360 Title with Animated Arrow */}
          <div className="flex items-center justify-center gap-0.5 mb-4">
            <h1 
              className="text-4xl sm:text-5xl lg:text-6xl font-bold"
              style={{ color: "#FACC15" }}
            >
              SUITE 36
            </h1>
            <motion.div
              className="circular-arrow-wrapper"
              initial={{ rotate: 0 }}
              animate={{ rotate: rotation }}
              onMouseEnter={() => setRotation(prev => prev + 720)}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              style={{
                width: "55px",
                height: "55px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "#FACC15"
              }}
            >
              <Image
                src="/circular-arrow.svg"
                alt="360"
                width={55}
                height={55}
              />
            </motion.div>
          </div>
  
          {/* Subtitle */}
          <h1 
            className="text-4xl sm:text-5xl lg:text-6xl font-bold"
            style={{ color: "#4A4A4A" }}
          >
            Build Your Custom Solution
          </h1>
          
          <p 
            className="text-lg sm:text-xl lg:text-2xl font-light"
            style={{ color: "#808080" }}
          >
            Choose your configurator to get started
          </p>
        </motion.div>

        {/* Product Tiles - Horizontal on Desktop, Vertical on Mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-6">
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.6, 
                delay: index * 0.15,
                ease: "easeOut" 
              }}
              onClick={() => handleNavigation(product)}
              className={`relative group ${product.isActive ? 'cursor-pointer' : 'cursor-not-allowed'}`}
            >
              {/* Glassmorphism Tile */}
              <div
                className="relative rounded-3xl overflow-hidden transition-all duration-500"
                style={{
                  background: product.isActive
                    ? `
                        linear-gradient(180deg, 
                          rgba(255, 255, 255, 0.9) 0%, 
                          rgba(255, 255, 255, 0.8) 60%, 
                          rgba(255, 255, 255, 0.95) 85%, 
                          rgba(255, 255, 255, 1) 100%
                        ),
                        rgba(255, 255, 255, 0.85)
                      `
                    : `
                        linear-gradient(180deg, 
                          rgba(200, 200, 200, 0.5) 0%, 
                          rgba(200, 200, 200, 0.4) 60%, 
                          rgba(200, 200, 200, 0.6) 85%, 
                          rgba(200, 200, 200, 0.7) 100%
                        ),
                        rgba(200, 200, 200, 0.5)
                      `,
                  backdropFilter: "blur(12px)",
                  border: product.isActive
                    ? "1px solid rgba(255, 255, 255, 0.4)"
                    : "1px solid rgba(150, 150, 150, 0.3)",
                  boxShadow: product.isActive
                    ? `
                        0 10px 40px rgba(0, 0, 0, 0.08),
                        inset 0 1px 0 rgba(255, 255, 255, 0.6),
                        inset 0 -2px 10px rgba(255, 255, 255, 0.2)
                      `
                    : `
                        0 5px 20px rgba(0, 0, 0, 0.05),
                        inset 0 1px 0 rgba(255, 255, 255, 0.3)
                      `,
                  transform: "scale(1)",
                  filter: product.isActive ? "none" : "grayscale(60%)",
                }}
                onMouseEnter={(e) => {
                  if (product.isActive) {
                    e.currentTarget.style.transform = "scale(1.03) translateY(-8px)";
                    e.currentTarget.style.boxShadow = `
                      0 20px 60px rgba(250, 204, 21, 0.25),
                      0 10px 40px rgba(0, 0, 0, 0.12),
                      inset 0 2px 0 rgba(255, 255, 255, 0.8),
                      inset 0 -3px 15px rgba(255, 255, 255, 0.3)
                    `;
                    e.currentTarget.style.borderColor = "rgba(250, 204, 21, 0.5)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (product.isActive) {
                    e.currentTarget.style.transform = "scale(1) translateY(0px)";
                    e.currentTarget.style.boxShadow = `
                      0 10px 40px rgba(0, 0, 0, 0.08),
                      inset 0 1px 0 rgba(255, 255, 255, 0.6),
                      inset 0 -2px 10px rgba(255, 255, 255, 0.2)
                    `;
                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.4)";
                  }
                }}
              >
                {/* Learn More Button - Top Right */}
                {product.isActive && (
                <button
                    onClick={(e) => handleLearnMore(e, product.id)}
                    className="absolute top-4 right-4 z-20 transition-all duration-300"
                    style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "50%",
                    background: "rgba(250, 204, 21, 0.95)",
                    backdropFilter: "blur(10px)",
                    border: "2px solid rgba(255, 215, 0, 0.9)",
                    color: "#000",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 4px 12px rgba(250, 204, 21, 0.4)",
                    fontWeight: "700",
                    }}
                    onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255, 215, 0, 1)";
                    e.currentTarget.style.borderColor = "rgba(255, 215, 0, 1)";
                    e.currentTarget.style.transform = "scale(1.15)";
                    e.currentTarget.style.boxShadow = "0 6px 20px rgba(250, 204, 21, 0.6)";
                    }}
                    onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(250, 204, 21, 0.95)";
                    e.currentTarget.style.borderColor = "rgba(255, 215, 0, 0.9)";
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(250, 204, 21, 0.4)";
                    }}
                    aria-label="Learn more"
                >
                    <FiHelpCircle size={24} />
                </button>
                )}

                {/* Coming Soon Badge */}
                {!product.isActive && (
                  <div
                    className="absolute top-4 left-4 z-20 px-4 py-2 rounded-full text-xs font-semibold"
                    style={{
                      background: "rgba(128, 128, 128, 0.8)",
                      backdropFilter: "blur(10px)",
                      border: "1px solid rgba(100, 100, 100, 0.5)",
                      color: "#fff",
                    }}
                  >
                    COMING SOON
                  </div>
                )}

                {/* Content */}
                <div className="p-8 sm:p-10 flex flex-col items-center text-center">
                  {/* Product Image */}
                  <div 
                    className="mb-6 transition-transform duration-500"
                    style={{
                      width: "200px",
                      height: "200px",
                      position: "relative",
                      transform: "scale(1)",
                    }}
                    onMouseEnter={(e) => {
                      if (product.isActive) {
                        e.currentTarget.style.transform = "scale(1.1)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (product.isActive) {
                        e.currentTarget.style.transform = "scale(1)";
                      }
                    }}
                  >
                    <Image
                      src={product.image}
                      layout="fill"
                      objectFit="contain"
                      alt={product.title}
                      priority
                    />
                  </div>

                  {/* Title */}
                  <h2
                    className="text-3xl sm:text-4xl font-bold mb-3"
                  >
                    <Title360 title={product.title} color={product.isActive ? "#4A4A4A" : "#999"} />
                  </h2>

                  {/* Description */}
                  <p 
                    className="text-base sm:text-lg font-light mb-6"
                    style={{ 
                      color: product.isActive ? "#808080" : "#aaa",
                    }}
                  >
                    {product.description}
                  </p>

                  {/* CTA Button */}
                  {product.isActive && (
                    <div
                      className="px-8 py-3 rounded-full text-base font-semibold transition-all duration-300"
                      style={{
                        background: `
                          radial-gradient(ellipse at center, 
                            rgba(250, 204, 21, 0.9) 20%, 
                            rgba(250, 204, 21, 0.7) 60%, 
                            rgba(255, 215, 0, 0.8) 100%
                          ), 
                          rgba(250, 204, 21, 0.6)
                        `,
                        backdropFilter: "blur(15px)",
                        border: "1px solid rgba(255, 215, 0, 0.9)",
                        color: "#000",
                        boxShadow: `
                          0 6px 20px rgba(250, 204, 21, 0.4),
                          inset 0 2px 0 rgba(255, 255, 255, 0.8),
                          inset 0 3px 8px rgba(255, 255, 255, 0.4),
                          inset 0 -1px 0 rgba(255, 215, 0, 0.4)
                        `,
                      }}
                    >
                      Get Started →
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Learn More Modal */}
      {learnMoreModal && selectedProduct && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{
            background: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(8px)",
          }}
          onClick={() => setLearnMoreModal(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-lg w-full rounded-3xl overflow-hidden"
            style={{
              background: `
                linear-gradient(180deg, 
                  rgba(255, 255, 255, 0.95) 0%, 
                  rgba(255, 255, 255, 0.9) 60%, 
                  rgba(255, 255, 255, 0.98) 100%
                ),
                rgba(255, 255, 255, 0.9)
              `,
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255, 255, 255, 0.5)",
              boxShadow: `
                0 20px 60px rgba(0, 0, 0, 0.2),
                inset 0 2px 0 rgba(255, 255, 255, 0.8)
              `,
            }}
          >
            {/* Close Button */}
            <button
              onClick={() => setLearnMoreModal(null)}
              className="absolute top-4 right-4 z-10 transition-all duration-200"
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: "rgba(255, 255, 255, 0.9)",
                border: "1px solid rgba(200, 200, 200, 0.3)",
                color: "#4A4A4A",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(220, 38, 38, 0.1)";
                e.currentTarget.style.borderColor = "rgba(220, 38, 38, 0.3)";
                e.currentTarget.style.color = "#dc2626";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.9)";
                e.currentTarget.style.borderColor = "rgba(200, 200, 200, 0.3)";
                e.currentTarget.style.color = "#4A4A4A";
              }}
            >
              <FiX size={24} />
            </button>

            {/* Modal Content */}
            <div className="p-10">
              {/* Product Image */}
              <div className="flex justify-center mb-6">
                <div 
                  style={{
                    width: "120px",
                    height: "120px",
                    position: "relative",
                  }}
                >
                  <Image
                    src={selectedProduct.image}
                    layout="fill"
                    objectFit="contain"
                    alt={selectedProduct.title}
                  />
                </div>
              </div>

              {/* Title */}
              <h3 className="text-3xl font-bold text-center mb-4">
                <Title360 title={selectedProduct.title} color="#4A4A4A" />
              </h3>

              {/* Description */}
              <p 
                className="text-base leading-relaxed text-center mb-8"
                style={{ color: "#808080" }}
              >
                {selectedProduct.learnMore}
              </p>

              {/* CTA Button */}
              <div className="flex justify-center">
                <button
                  onClick={() => {
                    setLearnMoreModal(null);
                    router.push(selectedProduct.href);
                  }}
                  className="px-10 py-4 rounded-full text-lg font-semibold transition-all duration-300"
                  style={{
                    background: `
                      radial-gradient(ellipse at center, 
                        rgba(250, 204, 21, 0.9) 20%, 
                        rgba(250, 204, 21, 0.7) 60%, 
                        rgba(255, 215, 0, 0.8) 100%
                      ), 
                      rgba(250, 204, 21, 0.6)
                    `,
                    backdropFilter: "blur(15px)",
                    border: "1px solid rgba(255, 215, 0, 0.9)",
                    color: "#000",
                    boxShadow: `
                      0 6px 20px rgba(250, 204, 21, 0.4),
                      inset 0 2px 0 rgba(255, 255, 255, 0.8),
                      inset 0 3px 8px rgba(255, 255, 255, 0.4),
                      inset 0 -1px 0 rgba(255, 215, 0, 0.4)
                    `,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.05)";
                    e.currentTarget.style.boxShadow = `
                      0 10px 30px rgba(250, 204, 21, 0.6),
                      inset 0 2px 0 rgba(255, 255, 255, 0.9),
                      inset 0 4px 12px rgba(255, 255, 255, 0.5)
                    `;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.boxShadow = `
                      0 6px 20px rgba(250, 204, 21, 0.4),
                      inset 0 2px 0 rgba(255, 255, 255, 0.8),
                      inset 0 3px 8px rgba(255, 255, 255, 0.4),
                      inset 0 -1px 0 rgba(255, 215, 0, 0.4)
                    `;
                  }}
                >
                  Get Started →
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
    </>
  );
};

export default BuyPage;