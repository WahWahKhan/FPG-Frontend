import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { BannerItem, filterByDate } from '../lib/banner/fetchBannerItems';

interface CompanyNewsBannerProps {
  // Active rows from the Google Sheet, fetched on the server by the homepage's
  // getStaticProps (lib/banner/fetchBannerItems.ts) so the banner is in the
  // page from the first paint - no "Loading..." box and no layout shift.
  // null = the sheet could not be read at build time (banner simply hidden).
  items: BannerItem[] | null;
  // The server's "today" (YYYY-MM-DD) when the page was built, so the first
  // client render filters exactly like the server did (no hydration mismatch).
  asOf: string;
}

const groupByType = (items: BannerItem[]) => ({
  announcements: items.filter(item => item.type === 'announcement'),
  deals: items.filter(item => item.type === 'deal'),
  products: items.filter(item => item.type === 'product')
});

const CompanyNewsBanner = ({ items, asOf }: CompanyNewsBannerProps) => {
  // First render filters with the server's build date (asOf), so server and
  // client output match exactly. After mount we re-check start/end dates against the
  // visitor's clock, so an item that ended today disappears on time even though
  // the page itself is cached for up to 5 minutes.
  const [bannerData, setBannerData] = useState(() => groupByType(filterByDate(items || [], new Date(`${asOf}T12:00:00Z`))));

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-off post-hydration date re-check
    setBannerData(groupByType(filterByDate(items || [])));
  }, [items]);

  // State for current indices
  const [currentAnnouncement, setCurrentAnnouncement] = useState(0);
  const [currentDeal, setCurrentDeal] = useState(0);
  const [currentProduct, setCurrentProduct] = useState(0);

  // Auto-rotation effects
  useEffect(() => {
    if (bannerData.announcements.length > 1) {
      const interval = setInterval(() => {
        setCurrentAnnouncement(prev => (prev + 1) % bannerData.announcements.length);
      }, 7000);
      return () => clearInterval(interval);
    }
  }, [bannerData.announcements.length]);

  useEffect(() => {
    if (bannerData.deals.length > 1) {
      const interval = setInterval(() => {
        setCurrentDeal(prev => (prev + 1) % bannerData.deals.length);
      }, 4500);
      return () => clearInterval(interval);
    }
  }, [bannerData.deals.length]);

  useEffect(() => {
    if (bannerData.products.length > 1) {
      const interval = setInterval(() => {
        setCurrentProduct(prev => (prev + 1) % bannerData.products.length);
      }, 7500);
      return () => clearInterval(interval);
    }
  }, [bannerData.products.length]);

  // Calculate section widths - UPDATED FOR EQUAL SPACING
  const hasAnnouncements = bannerData.announcements.length > 0;
  const hasDeals = bannerData.deals.length > 0;
  const hasProducts = bannerData.products.length > 0;

  const getSectionWidths = () => {
    const activeSections = [hasAnnouncements, hasDeals, hasProducts].filter(Boolean).length;
    
    if (activeSections === 3) {
      // Equal width for all three sections (33.33% each)
      return { announcements: 'lg:w-1/3', deals: 'lg:w-1/3', products: 'lg:w-1/3' };
    } else if (activeSections === 2) {
      // Equal width for two sections (50% each)
      return { announcements: 'lg:w-1/2', deals: 'lg:w-1/2', products: 'lg:w-1/2' };
    } else {
      // Full width for single section
      return { announcements: 'lg:w-full', deals: 'lg:w-full', products: 'lg:w-full' };
    }
  };

  const sectionWidths = getSectionWidths();

  // Render functions
  const renderCard = (item: BannerItem, sectionType: string, isMobile: boolean = false) => {
    const getIcon = () => {
      switch (item.type) {
        case 'announcement': return '📢';
        case 'deal': return '🎯';
        case 'product': return '⭐';
        default: return '📢';
      }
    };

    return (
      <motion.div
        key={item.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="h-full flex items-center justify-between p-4 lg:p-6 absolute inset-0"
      >
        <div className="flex items-center gap-3 lg:gap-4 flex-1 min-w-0">
          <span className="text-2xl lg:text-3xl flex-shrink-0" role="img" aria-label={item.type}>
            {getIcon()}
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold text-sm lg:text-base truncate">
              {item.title}
            </h3>
            <p className="text-gray-300 text-xs lg:text-sm lg:whitespace-normal lg:leading-relaxed truncate lg:max-h-10 lg:overflow-hidden">
              {item.description}
            </p>
          </div>
        </div>

        {!isMobile && (
          <div className="hidden lg:block ml-4 flex-shrink-0">
            <a
              href={item.href}
              target={item.target || '_self'}
              className="relative overflow-hidden transition-all duration-300 ease-out whitespace-nowrap"
              style={{
                // Override any global button styles
                all: "unset",
                cursor: "pointer",
                display: "inline-block",
                padding: "8px 16px",
                borderRadius: "20px",
                fontSize: "0.875rem",
                fontWeight: "600",
                color: "#000",
                textDecoration: "none",
                position: "relative",
                // Liquid glass styling
                background: `radial-gradient(ellipse at center, rgba(250, 204, 21, 0.9) 20%, rgba(250, 204, 21, 0.7) 60%, rgba(255, 215, 0, 0.8) 100%), rgba(250, 204, 21, 0.6)`,
                backdropFilter: "blur(15px)",
                border: "1px solid rgba(255, 215, 0, 0.9)",
                boxShadow: `
                  0 6px 20px rgba(250, 204, 21, 0.4),
                  inset 0 2px 0 rgba(255, 255, 255, 0.8),
                  inset 0 3px 8px rgba(255, 255, 255, 0.4),
                  inset 0 -1px 0 rgba(255, 215, 0, 0.4)
                `
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
                e.currentTarget.style.background = `radial-gradient(ellipse at center, rgba(255, 215, 0, 1) 20%, rgba(250, 204, 21, 0.9) 60%, rgba(255, 235, 59, 0.9) 100%), rgba(255, 215, 0, 0.8)`;
                e.currentTarget.style.border = "1px solid rgba(255, 235, 59, 1)";
                e.currentTarget.style.boxShadow = `
                  0 10px 30px rgba(250, 204, 21, 0.6),
                  inset 0 2px 0 rgba(255, 255, 255, 0.9),
                  inset 0 4px 12px rgba(255, 255, 255, 0.5),
                  inset 0 -1px 0 rgba(255, 215, 0, 0.6)
                `;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0px) scale(1)";
                e.currentTarget.style.background = `radial-gradient(ellipse at center, rgba(250, 204, 21, 0.9) 20%, rgba(250, 204, 21, 0.7) 60%, rgba(255, 215, 0, 0.8) 100%), rgba(250, 204, 21, 0.6)`;
                e.currentTarget.style.border = "1px solid rgba(255, 215, 0, 0.9)";
                e.currentTarget.style.boxShadow = `
                  0 6px 20px rgba(250, 204, 21, 0.4),
                  inset 0 2px 0 rgba(255, 255, 255, 0.8),
                  inset 0 3px 8px rgba(255, 255, 255, 0.4),
                  inset 0 -1px 0 rgba(255, 215, 0, 0.4)
                `;
              }}
            >
              {/* Glass shine effect */}
              <span
                style={{
                  position: "absolute",
                  top: "1px",
                  left: "6px",
                  right: "6px",
                  height: "50%",
                  background: "linear-gradient(180deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.3) 50%, rgba(255, 215, 0, 0.2) 100%)",
                  borderRadius: "20px 20px 10px 10px",
                  pointerEvents: "none",
                  transition: "all 0.3s ease"
                }}
              />
              {item.ctaText}
            </a>
          </div>
        )}
      </motion.div>
    );
  };

  const renderSection = (
    items: BannerItem[], 
    currentIndex: number, 
    setCurrentIndex: (index: number) => void,
    sectionType: string, 
    widthClass: string,
    title: string,
    isLast: boolean = false
  ) => {
    if (items.length === 0) return null;

    const currentItem = items[currentIndex];

    return (
      <div key={`section-${sectionType}`} className={`${widthClass} flex-shrink-0 relative`}>
        {/* Mobile section header with counter inside the section */}
        <div className="lg:hidden bg-gray-800 border-b border-gray-700">
          <div className="flex items-center justify-between p-3">
            <span className="text-yellow-400 font-medium text-sm">{title}</span>
            {items.length > 1 && (
              <span className="text-gray-400 text-xs">
                {currentIndex + 1} of {items.length}
              </span>
            )}
          </div>
        </div>

        {/* Content area */}
        <div className="relative h-[80px] lg:h-[100px] overflow-hidden">
          <a 
            href={currentItem.href} 
            target={currentItem.target || '_self'} 
            className="lg:hidden block h-full relative"
          >
            <AnimatePresence>
              {renderCard(currentItem, sectionType, true)}
            </AnimatePresence>
          </a>

          <div className="hidden lg:block h-full relative">
            <AnimatePresence>
              {renderCard(currentItem, sectionType, false)}
            </AnimatePresence>
          </div>

          {/* Mobile progress indicators - positioned inside content area */}
          {items.length > 1 && (
            <div className="lg:hidden absolute bottom-2 right-3 flex gap-2 z-10">
              {items.map((_, index) => (
                <button
                  key={`mobile-${sectionType}-${index}`}
                  onClick={() => setCurrentIndex(index)}
                  className="flex items-center justify-center transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50 flex-shrink-0 rounded-full"
                  style={{ 
                    width: '20px', 
                    height: '20px',
                    minWidth: '20px', 
                    minHeight: '20px',
                    background: index === currentIndex 
                      ? `radial-gradient(circle, rgba(250, 204, 21, 1) 20%, rgba(255, 215, 0, 0.9) 100%)`
                      : `radial-gradient(circle, rgba(255, 255, 255, 0.25) 20%, rgba(200, 200, 200, 0.15) 100%)`,
                    backdropFilter: "blur(10px)",
                    border: index === currentIndex 
                      ? "1px solid rgba(255, 215, 0, 0.8)"
                      : "1px solid rgba(255, 255, 255, 0.25)",
                    boxShadow: index === currentIndex
                      ? `0 3px 12px rgba(250, 204, 21, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.6)`
                      : `0 2px 6px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)`,
                    transform: 'none',
                    outline: 'none',
                    padding: 0
                  }}
                  onMouseEnter={(e) => {
                    if (index !== currentIndex) {
                      e.currentTarget.style.background = `radial-gradient(circle, rgba(250, 204, 21, 0.4) 20%, rgba(200, 150, 0, 0.3) 100%)`;
                      e.currentTarget.style.border = "1px solid rgba(250, 204, 21, 0.4)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (index !== currentIndex) {
                      e.currentTarget.style.background = `radial-gradient(circle, rgba(255, 255, 255, 0.25) 20%, rgba(200, 200, 200, 0.15) 100%)`;
                      e.currentTarget.style.border = "1px solid rgba(255, 255, 255, 0.25)";
                    }
                  }}
                  aria-label={`Go to ${sectionType} ${index + 1}`}
                >
                  <span
                    style={{
                      position: "absolute",
                      top: "1px",
                      left: "1px",
                      right: "1px",
                      height: "50%",
                      background: index === currentIndex 
                        ? "linear-gradient(180deg, rgba(255, 255, 255, 0.7) 0%, transparent 100%)"
                        : "linear-gradient(180deg, rgba(255, 255, 255, 0.3) 0%, transparent 100%)",
                      borderRadius: "50%",
                      pointerEvents: "none"
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Desktop progress indicators - positioned below CTA with gap */}
        {items.length > 1 && (
          <div className="hidden lg:flex justify-center pt-3 pb-2">
            <div className="flex gap-3">
              {items.map((_, index) => (
                <button
                  key={`desktop-${sectionType}-${index}`}
                  onClick={() => setCurrentIndex(index)}
                  className="flex items-center justify-center transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50 flex-shrink-0 rounded-full"
                  style={{ 
                    width: '20px', 
                    height: '20px',
                    minWidth: '20px', 
                    minHeight: '20px',
                    background: index === currentIndex 
                      ? `radial-gradient(circle, rgba(250, 204, 21, 1) 20%, rgba(255, 215, 0, 0.9) 100%)`
                      : `radial-gradient(circle, rgba(255, 255, 255, 0.25) 20%, rgba(200, 200, 200, 0.15) 100%)`,
                    backdropFilter: "blur(10px)",
                    border: index === currentIndex 
                      ? "1px solid rgba(255, 215, 0, 0.8)"
                      : "1px solid rgba(255, 255, 255, 0.25)",
                    boxShadow: index === currentIndex
                      ? `0 3px 12px rgba(250, 204, 21, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.6)`
                      : `0 2px 6px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)`,
                    transform: 'none',
                    outline: 'none',
                    padding: 0
                  }}
                  onMouseEnter={(e) => {
                    if (index !== currentIndex) {
                      e.currentTarget.style.background = `radial-gradient(circle, rgba(250, 204, 21, 0.4) 20%, rgba(200, 150, 0, 0.3) 100%)`;
                      e.currentTarget.style.border = "1px solid rgba(250, 204, 21, 0.4)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (index !== currentIndex) {
                      e.currentTarget.style.background = `radial-gradient(circle, rgba(255, 255, 255, 0.25) 20%, rgba(200, 200, 200, 0.15) 100%)`;
                      e.currentTarget.style.border = "1px solid rgba(255, 255, 255, 0.25)";
                    }
                  }}
                  aria-label={`Go to ${sectionType} ${index + 1}`}
                >
                  <span
                    style={{
                      position: "absolute",
                      top: "1px",
                      left: "1px",
                      right: "1px",
                      height: "50%",
                      background: index === currentIndex 
                        ? "linear-gradient(180deg, rgba(255, 255, 255, 0.7) 0%, transparent 100%)"
                        : "linear-gradient(180deg, rgba(255, 255, 255, 0.3) 0%, transparent 100%)",
                      borderRadius: "50%",
                      pointerEvents: "none"
                    }}
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Desktop vertical divider - only show if not the last section */}
        {!isLast && (
          <div className="hidden lg:block absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-gray-600 to-transparent"></div>
        )}
      </div>
    );
  };

  // Don't render if no content
  if (!hasAnnouncements && !hasDeals && !hasProducts) {
    return null;
  }

  // Helper to determine which sections are active and their order
  const activeSections = [
    { name: 'announcements', data: bannerData.announcements, current: currentAnnouncement, setter: setCurrentAnnouncement, title: 'Announcements', width: sectionWidths.announcements },
    { name: 'deals', data: bannerData.deals, current: currentDeal, setter: setCurrentDeal, title: 'Deals', width: sectionWidths.deals },
    { name: 'products', data: bannerData.products, current: currentProduct, setter: setCurrentProduct, title: 'New Products', width: sectionWidths.products }
  ].filter(section => section.data.length > 0);

  return (
    <div className="w-full bg-gray-900 border-b border-gray-700 shadow-lg pt-10">
      <div className="wrapper">
        <div className="flex flex-col lg:flex-row min-h-[140px] lg:min-h-[140px] lg:gap-0 relative">
          {activeSections.map((section, index) => 
            renderSection(
              section.data,
              section.current,
              section.setter,
              section.name,
              section.width,
              section.title,
              index === activeSections.length - 1 // isLast
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanyNewsBanner;