import Anchor from "@/modules/Anchor";
import clsx from "clsx";
import React, { useRef, useState } from "react";
import { Category } from "types/products";

type ICategoriesProps = {
  setSelectedCategory: (val: Category) => void;
  selectedCategory: Category;
  categories: Category[];
};

const Categories = ({
  setSelectedCategory,
  selectedCategory,
  categories,
}: ICategoriesProps) => {
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  const handleMouseEnter = (category: Category) => {
    // Clear any existing timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    // Set hover state immediately for visual effect
    setHoveredCategory(category.title);

    // If it's the same category, set immediately
    if (selectedCategory.title === category.title) {
      return;
    }

    // Add a small delay before switching categories
    hoverTimeoutRef.current = setTimeout(() => {
      setSelectedCategory(category);
    }, 150); // 150ms delay
  };

  const handleMouseLeave = () => {
    // Clear timeout if mouse leaves before delay completes
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    
    // Don't clear hover state immediately - let it persist for subcategories
    // Only clear if mouse completely leaves the dropdown area
  };

  // Clear hover state only when mouse leaves the entire categories container
  const handleContainerMouseLeave = () => {
    setHoveredCategory(null);
  };

  return (
    <div 
      className="flex flex-col gap-4 w-1/5 z-10 text-black relative"
      onMouseLeave={handleContainerMouseLeave}
    >
      {/* More prominent vertical separator */}
      <div 
        className="absolute top-0 right-0 w-px h-full"
        style={{
          background: "linear-gradient(to bottom, transparent 5%, rgba(0, 0, 0, 0.3) 20%, rgba(0, 0, 0, 0.4) 50%, rgba(0, 0, 0, 0.3) 80%, transparent 95%)",
          boxShadow: "1px 0 2px rgba(0, 0, 0, 0.1)"
        }}
      />
      
      {categories.map((category: Category) => (
        <Anchor href={`/products/${category.slug}`} key={category.id}>
          <div className="relative">
            {/* 3D Yellow Glass Background - smaller on the right, persists when browsing subcategories */}
            {(hoveredCategory === category.title || selectedCategory.title === category.title) && (
              <div
                className="absolute transition-all duration-300"
                style={{
                  top: "-4px",
                  left: "-8px", 
                  right: "20px", // Smaller on the right side
                  bottom: "-4px",
                  borderRadius: "40px",
                  background: `radial-gradient(ellipse at center, rgba(250, 204, 21, 0.9) 20%, rgba(250, 204, 21, 0.7) 60%, rgba(255, 215, 0, 0.8) 100%), rgba(250, 204, 21, 0.6)`,
                  backdropFilter: "blur(15px)",
                  border: "1px solid rgba(255, 215, 0, 0.9)",
                  boxShadow: `
                    0 10px 30px rgba(250, 204, 21, 0.6),
                    inset 0 2px 0 rgba(255, 255, 255, 0.8),
                    inset 0 3px 10px rgba(255, 255, 255, 0.4),
                    inset 0 -1px 0 rgba(255, 215, 0, 0.4)
                  `,
                  transform: "translateY(-2px) scale(1.02)",
                  zIndex: -1
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
                    background: "linear-gradient(180deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%)",
                    borderRadius: "40px 40px 20px 20px",
                    pointerEvents: "none"
                  }}
                />
              </div>
            )}
            
            {/* Original text - maintains original size and styling */}
            <h2
              className={clsx(
                "text-xl flex font-light items-center gap-1 cursor-pointer relative z-10 px-2 py-1",
                selectedCategory.title === category.title
                  ? "font-medium"
                  : "font-light"
              )}
              onMouseEnter={() => handleMouseEnter(category)}
              onMouseLeave={handleMouseLeave}
            >
              {category.title}
            </h2>
          </div>
        </Anchor>
      ))}
      {/*<Anchor href="/products" className={clsx("text-xl flex font-medium ")}>
        View all
      </Anchor>*/}
    </div>
  );
};

export default Categories;