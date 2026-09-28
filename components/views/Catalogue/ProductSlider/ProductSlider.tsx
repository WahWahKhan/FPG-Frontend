// ProductSlider.tsx - centred dot-to-tile scrolling, edge fades, memoization
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
// Width of each edge fade, signalling "more tiles this way".
const EDGE_FADE_PX = 40;

const ProductSlider = ({
  title,
  description,
  products,
  btn,
}: IProductSliderProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const tileRefs = useRef<(HTMLDivElement | null)[]>([]);
  // Index a dot click is scrolling to. Takes precedence over the position-
  // based guess once that scroll settles, so e.g. dot 5 of 7 stays selected
  // on desktop even when the row can only scroll as far as its end.
  const pendingIndex = useRef<number | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [edges, setEdges] = useState({ atStart: true, atEnd: true });

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

  // Dots, counter and tiles all come from the same filtered list, so there
  // is exactly one dot per rendered tile.
  const tileCount = processedProducts.length;

  // scrollLeft that puts tile `index`'s centre in the middle of the viewport.
  // Measured from the DOM rather than assuming a fixed tile width.
  const centredScrollLeft = useCallback((index: number) => {
    const el = scrollRef.current;
    const tile = tileRefs.current[index];
    if (!el || !tile) return 0;
    const target = tile.offsetLeft + tile.offsetWidth / 2 - el.clientWidth / 2;
    return Math.max(0, Math.min(target, el.scrollWidth - el.clientWidth));
  }, []);

  const scrollToTile = useCallback((index: number) => {
    const el = scrollRef.current;
    if (!el) return;
    pendingIndex.current = index;
    setCurrentIndex(index);
    el.scrollTo({ left: centredScrollLeft(index), behavior: 'smooth' });
  }, [centredScrollLeft]);

  const updateEdges = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const atStart = el.scrollLeft <= 2;
    const atEnd = el.scrollLeft >= max - 2;
    setEdges(prev =>
      prev.atStart === atStart && prev.atEnd === atEnd ? prev : { atStart, atEnd }
    );
  }, []);

  // Which tile is "in focus" after the user swipes/scrolls: the one whose
  // centre is nearest the viewport centre, pinned to the first/last tile
  // when the row is scrolled all the way to either end.
  const updateCurrentIndex = useCallback(() => {
    const el = scrollRef.current;
    if (!el || tileCount === 0) return;

    if (pendingIndex.current !== null) {
      const index = pendingIndex.current;
      pendingIndex.current = null;
      setCurrentIndex(index);
      return;
    }

    const max = el.scrollWidth - el.clientWidth;
    if (max <= 2) return; // nothing to scroll — keep whatever was clicked
    if (el.scrollLeft <= 2) return setCurrentIndex(0);
    if (el.scrollLeft >= max - 2) return setCurrentIndex(tileCount - 1);

    const viewportCentre = el.scrollLeft + el.clientWidth / 2;
    let nearest = 0;
    let nearestDistance = Infinity;
    tileRefs.current.slice(0, tileCount).forEach((tile, i) => {
      if (!tile) return;
      const distance = Math.abs(tile.offsetLeft + tile.offsetWidth / 2 - viewportCentre);
      if (distance < nearestDistance) {
        nearest = i;
        nearestDistance = distance;
      }
    });
    setCurrentIndex(nearest);
  }, [tileCount]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let settleTimeout: ReturnType<typeof setTimeout>;

    const handleScroll = () => {
      updateEdges(); // immediate, so the fades track the finger
      clearTimeout(settleTimeout);
      settleTimeout = setTimeout(updateCurrentIndex, 100);
    };

    updateEdges();
    el.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', updateEdges);
    return () => {
      el.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updateEdges);
      clearTimeout(settleTimeout);
    };
  }, [updateEdges, updateCurrentIndex]);

  const handleMouseLeave = useCallback(() => {
    setHoveredIndex(null);
  }, []);

  const cleanDescription = stripHtml(description);

  // Fade whichever side still has tiles hidden beyond it: right only on the
  // first tile, left only on the last, both in between.
  const edgeMask = `linear-gradient(to right, ${
    edges.atStart ? 'black' : 'transparent'
  } 0, black ${EDGE_FADE_PX}px, black calc(100% - ${EDGE_FADE_PX}px), ${
    edges.atEnd ? 'black' : 'transparent'
  } 100%)`;

  return (
    <div className="w-full flex flex-col gap-8 lg:pl-16">
      {/* Mobile title + description */}
      <motion.div className="flex lg:hidden flex-col shrink-0 w-full justify-center gap-4 px-4">
        <h2 className="text-3xl font-semibold">{stripHtml(title)}</h2>
        <MobileDescription text={cleanDescription} />
      </motion.div>

      {/* Desktop layout */}
      <div className="w-full relative">
        {/* `relative` makes this the tiles' offsetParent, so offsetLeft is
            measured within the scrolling row. Mobile snaps each tile to the
            centre; desktop scrolls freely past the title block. */}
        <div
          ref={scrollRef}
          className="relative w-full overflow-x-auto hide-scrollbar snap-x snap-mandatory lg:snap-none"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitMaskImage: edgeMask,
            maskImage: edgeMask,
          }}
        >
          {/* Mobile side padding = half the viewport minus half a tile (w-56 =
              224px), so the first and last tiles can sit dead centre too. */}
          <div
            className="flex gap-4 pb-4 pt-16 pl-[calc(50%_-_112px)] pr-[calc(50%_-_112px)] lg:pl-1 lg:pr-12"
            style={{ width: 'max-content' }}
          >
            {/* Desktop title + description */}
            <div className="hidden lg:flex flex-col shrink-0 w-56 h-72 justify-center py-4 gap-4 bg-white">
              <h2 className="text-3xl font-semibold">{stripHtml(title)}</h2>
              <DesktopDescription text={cleanDescription} />
            </div>

            {processedProducts.map((product, i) => {
              const isHovered = hoveredIndex === i;
              const isNeighbor = hoveredIndex !== null && Math.abs(hoveredIndex - i) === 1;
              const isDistant = hoveredIndex !== null && Math.abs(hoveredIndex - i) > 1;

              return (
                <div
                  key={product.id}
                  ref={(node) => { tileRefs.current[i] = node; }}
                  className="shrink-0 snap-center"
                >
                  <ProductCard
                    product={product}
                    index={i}
                    isHovered={isHovered}
                    isNeighbor={isNeighbor}
                    isDistant={isDistant}
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={handleMouseLeave}
                    stripHtml={stripHtml}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Dots Indicator — one per tile */}
        <div className="flex items-center gap-3 mt-6 px-0 md:px-4 lg:ml-80">
          {processedProducts.map((product, index) => (
            <button
              key={product.id}
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
              aria-current={index === currentIndex ? 'true' : undefined}
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

          <span className="text-sm text-gray-600 ml-4 whitespace-nowrap">
            {currentIndex + 1} of {tileCount}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProductSlider;
