// ProductSlider.tsx - Optimized with virtual scrolling and memoization
import Anchor from "@/modules/Anchor";
import { motion } from "framer-motion";
import Image from "next/image";
import { useRef, useState, useEffect, useMemo, useCallback } from "react";

// ─── Adjust these to change truncation behaviour ───────────────────────────
const DESKTOP_LINE_CLAMP = 4; // lines shown in left column before Read more appears
const MOBILE_LINE_CLAMP = 4;  // lines shown on mobile before Read more appears
// ───────────────────────────────────────────────────────────────────────────

interface IProductSliderProps {
  title: string;
  description: string;
  products: any[];
  btn: {
    title: string;
    href: string;
  };
}

// Memoized HTML stripping function
const createHtmlStripper = () => {
  const cache = new Map<string, string>();
  
  return (html: string): string => {
    if (!html) return '';
    
    if (cache.has(html)) {
      return cache.get(html)!;
    }
    
    const cleaned = html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&mdash;/g, '—')
      .replace(/\s+/g, ' ')
      .trim();
    
    cache.set(html, cleaned);
    
    if (cache.size > 1000) {
      const firstKey = cache.keys().next().value;
      if (firstKey !== undefined) cache.delete(firstKey);
    }
    
    return cleaned;
  };
};

// ─── Desktop: truncated description with click popover ────────────────────
const DesktopDescription = ({ text }: { text: string }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);



  if (!text) return null;

  return (
    <div ref={ref} className="relative">
      {/* Truncated text */}
      <div
        className="font-light text-sm text-gray-700"
        style={{
          display: '-webkit-box',
          WebkitLineClamp: DESKTOP_LINE_CLAMP,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {text}
      </div>

      {/* Read more link */}
      <button
        onClick={() => setOpen(true)}
        className="mt-1 text-sm font-bold text-gray-900 underline underline-offset-2 bg-transparent border-none p-0 cursor-pointer focus:outline-none" style={{ WebkitTapHighlightColor: "transparent", outline: "none" }}
      >
        Read more
      </button>

      {/* Popover — overlays on top, no layout shift */}
      {open && (
        <div className="absolute z-50 top-0 left-0 w-64 bg-white border border-gray-200 rounded-xl shadow-xl p-4 text-sm text-gray-700 font-light leading-relaxed">
          {/* Scrollable content area */}
          <div
            ref={scrollRef}
            style={{ maxHeight: '140px', overflowY: 'auto' }}
            className="pr-1"
          >
            <p>{text}</p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="mt-3 text-sm font-bold text-gray-900 underline underline-offset-2 bg-transparent border-none p-0 cursor-pointer focus:outline-none" style={{ WebkitTapHighlightColor: "transparent", outline: "none" }}
          >
            Read less
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Mobile: truncated description with Read more / Read less ─────────────
const MobileDescription = ({ text }: { text: string }) => {
  const [expanded, setExpanded] = useState(false);

  if (!text) return null;

  return (
    <div className="text-sm text-gray-700 font-light">
      <div
        style={
          !expanded
            ? {
                display: '-webkit-box',
                WebkitLineClamp: MOBILE_LINE_CLAMP,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }
            : undefined
        }
      >
        {text}
      </div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="mt-1 text-sm font-bold text-gray-900 underline underline-offset-2 bg-transparent border-none p-0 cursor-pointer focus:outline-none" style={{ WebkitTapHighlightColor: "transparent", outline: "none" }}
      >
        {expanded ? 'Read less' : 'Read more'}
      </button>
    </div>
  );
};

// ─── Product Card ──────────────────────────────────────────────────────────
const ProductCard = ({ 
  product, 
  index, 
  isHovered, 
  isNeighbor, 
  isDistant,
  onMouseEnter, 
  onMouseLeave,
  stripHtml 
}: {
  product: any;
  index: number;
  isHovered: boolean;
  isNeighbor: boolean;
  isDistant: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  stripHtml: (html: string) => string;
}) => {
  return (
    <Anchor
      href={`/products/${product.slug}`}
      className="hover:no-underline z-10"
    >
      <div 
        className={`
          flex flex-col w-56 cursor-pointer border-slate-800 border-[1px] p-4 shadow-xl rounded-2xl 
          transition-all duration-500 ease-out transform
          ${isHovered ? 'hover:shadow-2xl hover:-translate-y-2 z-20 scale-110' : ''}
          ${isNeighbor ? 'scale-95 opacity-80' : ''}
          ${isDistant ? 'scale-90 opacity-60' : ''}
        `}
        style={{
          height: '288px',
          transformOrigin: 'bottom center'
        }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <LazyImage
          src={product.image || "/product-4.png"}
          alt="product"
          className="w-full h-36 mb-4 rounded-lg"
        />
        
        <div className="flex-1 flex flex-col justify-center text-center">
          <h3 className={`font-bold transition-all duration-500 ${
            isHovered ? 'text-lg' : 'text-base'
          }`}>
            <div className="truncate">
              {stripHtml((product.shortTitle || product.title).replace(/ORing/g, 'O-Ring'))}
            </div>
          </h3>
          
          {product.price && (
            <div className="text-lg font-medium mt-2">
              {stripHtml(product.price)}
            </div>
          )}
        </div>
      </div>
    </Anchor>
  );
};

// ─── Lazy Image ────────────────────────────────────────────────────────────
const LazyImage = ({ src, alt, className }: { src: string; alt: string; className: string }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '50px'
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={imgRef} className={`relative ${className}`}>
      {!isLoaded && (
        <div className="w-full h-full animate-pulse bg-gray-200 rounded-lg flex items-center justify-center">
          <div className="text-gray-400 text-sm">Loading...</div>
        </div>
      )}
      {isInView && (
        <Image
          src={src}
          alt={alt}
          width={224}
          height={144}
          className={`w-full h-full object-contain transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setIsLoaded(true)}
          placeholder="blur"
          blurDataURL="/product-2.png"
        />
      )}
    </div>
  );
};

// ─── Main ProductSlider ────────────────────────────────────────────────────
const ProductSlider = ({
  title,
  description,
  products,
  btn,
}: IProductSliderProps) => {
  const scrollRef = useRef<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const stripHtml = useMemo(() => createHtmlStripper(), []);

  const processedProducts = useMemo(() => {
    return products
      .filter(product => product.slug !== 'hydraulic-hoses-custom-hose-assembly')
      .map(product => ({
        ...product,
        cleanTitle: stripHtml(product.title || ''),
        cleanDescription: stripHtml(product.description || ''),
        cleanSubtitle: stripHtml(product.subtitle || '')
      }));
  }, [products, stripHtml]);

  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 6 });
  const BUFFER_SIZE = 3;

  const scrollToTile = useCallback((index: number) => {
    if (scrollRef.current) {
      const tileWidth = 280;
      setCurrentIndex(index);
      scrollRef.current.scrollTo({
        left: index * tileWidth,
        behavior: 'smooth'
      });
    }
  }, []);

  const updateVisibleRange = useCallback(() => {
    if (scrollRef.current) {
      const scrollLeft = scrollRef.current.scrollLeft;
      const containerWidth = scrollRef.current.clientWidth;
      const tileWidth = 280;
      
      const startIndex = Math.floor(scrollLeft / tileWidth);
      const visibleCount = Math.ceil(containerWidth / tileWidth);
      
      const newStart = Math.max(0, startIndex - BUFFER_SIZE);
      const newEnd = Math.min(products.length, startIndex + visibleCount + BUFFER_SIZE);
      
      setVisibleRange({ start: newStart, end: newEnd });
    }
  }, [products.length]);

  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;
    
    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      
      scrollTimeout = setTimeout(() => {
        if (scrollRef.current) {
          const scrollLeft = scrollRef.current.scrollLeft;
          const tileWidth = 280;
          const containerWidth = scrollRef.current.clientWidth;
          
          let newIndex = Math.round(scrollLeft / tileWidth);
          const maxScrollLeft = scrollRef.current.scrollWidth - containerWidth;
          
          if (scrollLeft >= maxScrollLeft - 10) {
            newIndex = products.length - 1;
          }
          
          const boundedIndex = Math.max(0, Math.min(newIndex, products.length - 1));
          
          if (boundedIndex !== currentIndex) {
            setCurrentIndex(boundedIndex);
          }
          
          updateVisibleRange();
        }
      }, 100);
    };

    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll, { passive: true });
      updateVisibleRange();
      
      return () => {
        scrollElement.removeEventListener('scroll', handleScroll);
        clearTimeout(scrollTimeout);
      };
    }
  }, [currentIndex, products.length, updateVisibleRange]);

  const visibleProducts = useMemo(() => {
    return processedProducts.slice(visibleRange.start, visibleRange.end);
  }, [processedProducts, visibleRange]);

  const handleMouseEnter = useCallback((index: number) => {
    setHoveredIndex(visibleRange.start + index);
  }, [visibleRange.start]);

  const handleMouseLeave = useCallback(() => {
    setHoveredIndex(null);
  }, []);

  const cleanDescription = stripHtml(description);

  return (
    <div className="w-full flex flex-col gap-8 lg:pl-16">
      {/* Mobile title + description */}
      <motion.div className="flex lg:hidden flex-col shrink-0 w-full justify-center gap-4 px-4">
        <h2 className="text-3xl font-semibold">{stripHtml(title)}</h2>
        <MobileDescription text={cleanDescription} />
      </motion.div>

      {/* Desktop layout */}
      <div className="w-full relative">
        <div 
          ref={scrollRef}
          className="w-full overflow-x-auto hide-scrollbar"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >
          <div 
            className="flex gap-4 pb-4 pl-1 pr-12 pt-16"
            style={{ width: 'max-content' }}
          >
            {/* Desktop title + description */}
            <div className="hidden lg:flex flex-col shrink-0 w-56 h-72 justify-center py-4 gap-4 bg-white">
              <h2 className="text-3xl font-semibold">{stripHtml(title)}</h2>
              <DesktopDescription text={cleanDescription} />
            </div>

            {/* Spacer for items before visible range */}
            {visibleRange.start > 0 && (
              <div style={{ width: visibleRange.start * 280, flexShrink: 0 }} />
            )}

            {/* Render only visible products */}
            {visibleProducts.map((product, i) => {
              const actualIndex = visibleRange.start + i;
              const isHovered = hoveredIndex === actualIndex;
              const isNeighbor = hoveredIndex !== null && Math.abs(hoveredIndex - actualIndex) === 1;
              const isDistant = hoveredIndex !== null && Math.abs(hoveredIndex - actualIndex) > 1;
              
              return (
                <ProductCard
                  key={product.id}
                  product={product}
                  index={actualIndex}
                  isHovered={isHovered}
                  isNeighbor={isNeighbor}
                  isDistant={isDistant}
                  onMouseEnter={() => handleMouseEnter(i)}
                  onMouseLeave={handleMouseLeave}
                  stripHtml={stripHtml}
                />
              );
            })}

            {/* Spacer for items after visible range */}
            {visibleRange.end < products.length && (
              <div style={{ width: (products.length - visibleRange.end) * 280, flexShrink: 0 }} />
            )}
          </div>
        </div>

        {/* Dots Indicator */}
        <div className="flex items-center gap-3 mt-6 px-4 lg:px-4 lg:ml-80">
          {products.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollToTile(index)}
              className="flex items-center justify-center transition-all duration-300 flex-shrink-0"
              style={{ 
                width: '32px', 
                height: '32px',
                minWidth: '32px', 
                minHeight: '32px',
                transform: 'none',
                border: 'none',
                outline: 'none',
                padding: 0
              }}
              aria-label={`Go to slide ${index + 1}`}
            >
              <div
                className="rounded-full flex items-center justify-center transition-all duration-300"
                style={{ 
                  width: '30px',
                  height: '30px',
                  backgroundColor: index === currentIndex ? '#ffc100' : '#ffffff',
                  border: '2px solid #000',
                  transform: 'none'
                }}
              />
            </button>
          ))}
          
          <span className="text-sm text-gray-600 ml-4">
            {currentIndex + 1} of {products.length}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProductSlider;