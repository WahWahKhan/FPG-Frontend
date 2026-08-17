import clsx from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';
import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiChevronLeft, FiChevronRight, FiX } from 'react-icons/fi';
import NextImage from 'next/image';
import SafeImage from "../../../utils/SafeImage";

type Props = {
  images: string[];
};

const ImageProduct = ({ images = [] }: Props) => {
  const safeImages = useMemo(() => images || [], [images]);
  const [selectedImage, setSelectedImage] = useState(safeImages.length > 0 ? safeImages[0] : '');
  const [direction, setDirection] = useState(true);
  const [firstImageLoaded, setFirstImageLoaded] = useState(false);
  // Click-to-magnify lightbox open state
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Try Next's image optimizer first; only fall back to the raw file for a
  // given src if that specific image errors out (mirrors utils/OptimizedImage.tsx).
  const [unoptimizedUrls, setUnoptimizedUrls] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (safeImages.length > 0) {
      setSelectedImage(safeImages[0]);
    }
  }, [safeImages]);

  // Preload remaining images after first image loads.
  // Goes through Next's image optimizer (same /_next/image route next/image itself
  // uses) instead of the raw file — a full-res original here can be 1-2.5MB, the
  // optimized version is tens of KB, and preloading every gallery image at full
  // resolution in the background was saturating the connection for every other
  // image request on the page.
  useEffect(() => {
    if (firstImageLoaded && safeImages.length > 1) {
      safeImages.slice(1).forEach((imageSrc) => {
        if (typeof window !== 'undefined') {
          const img = window.Image ? new window.Image() : document.createElement('img');
          img.src = `/_next/image?url=${encodeURIComponent(imageSrc)}&w=1200&q=75`;
        }
      });
    }
  }, [firstImageLoaded, safeImages]);

  // Close the lightbox on Escape and lock background scroll while it is open
  useEffect(() => {
    if (!isModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsModalOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isModalOpen]);

  // Carousel navigation (shared by the inline arrows/dots and the lightbox)
  const showPrev = () => {
    setDirection(false);
    setSelectedImage((cur) => {
      const idx = safeImages.indexOf(cur);
      return safeImages[(idx > 0 ? idx - 1 : safeImages.length - 1) % safeImages.length];
    });
  };
  const showNext = () => {
    setDirection(true);
    setSelectedImage((cur) => {
      const idx = safeImages.indexOf(cur);
      return safeImages[(idx + 1) % safeImages.length];
    });
  };

  const variants = {
    enter: {
      x: 100,
      opacity: 0,
    },
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: {
      zIndex: 0,
      x: -100,
      opacity: 0,
    },
  };

  if (safeImages.length === 0 || !selectedImage) {
    return (
      <div className="relative col-span-full lg:col-span-6 xl:col-span-7 w-full border rounded-3xl h-full">
        <div className="h-full w-full flex items-center justify-center">
          <div className="text-gray-400">Loading image...</div>
        </div>
      </div>
    );
  }

  const imageIndex = safeImages.indexOf(selectedImage);

  return (
    <div className="col-span-full lg:col-span-6 xl:col-span-7 w-full h-full flex flex-col">
    <div className="relative w-full border rounded-3xl overflow-hidden flex-1 md:flex md:flex-col md:justify-center">
      {/* Mobile: Original behavior */}
      <div className="w-full h-full min-h-[200px] max-h-[350px] flex items-center justify-center p-4 md:hidden">
        <AnimatePresence exitBeforeEnter>
          <motion.div
            variants={variants}
            className="flex items-center justify-center max-w-[300px] max-h-[300px]"
            key={selectedImage}
            custom={direction}
            transition={{
              opacity: { duration: 0.2 },
            }}
            initial="enter"
            animate="center"
            exit="exit">
            <SafeImage
              src={selectedImage}
              alt="Product"
              width={300}
              height={300}
              className="!w-[200px] !h-[200px] md:!w-[250px] md:!h-[250px] object-contain"
              useContainMode={true}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Desktop: fill the window while preserving aspect ratio.
          Padding insets the image so it clears the ~62px-wide nav arrows
          on each side and the carousel dots along the bottom. */}
      <div className="hidden md:flex w-full items-center justify-center" style={{ minHeight: '400px', maxHeight: '600px', height: '500px' }}>
        <AnimatePresence exitBeforeEnter>
          <motion.div
            variants={variants}
            className="relative w-full h-full"
            style={{ paddingLeft: '72px', paddingRight: '72px', paddingTop: '32px', paddingBottom: '48px' }}
            key={selectedImage}
            custom={direction}
            transition={{
              opacity: { duration: 0.2 },
            }}
            initial="enter"
            animate="center"
            exit="exit">
            {/* Click the photo to open the enlarged carousel in a lightbox */}
            <div
              className="relative w-full h-full cursor-zoom-in"
              onClick={() => setIsModalOpen(true)}
              role="button"
              tabIndex={0}
              aria-label="Open enlarged image"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setIsModalOpen(true);
                }
              }}
            >
              <NextImage
                key={selectedImage}
                src={selectedImage}
                alt="Product"
                layout="fill"
                objectFit="contain"
                unoptimized={unoptimizedUrls.has(selectedImage)}
                onError={() => {
                  setUnoptimizedUrls((prev) => {
                    if (prev.has(selectedImage)) return prev;
                    const next = new Set(prev);
                    next.add(selectedImage);
                    return next;
                  });
                }}
              />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Hidden preloader - triggers firstImageLoaded */}
      {!firstImageLoaded && safeImages[0] && (
        <div style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}>
          <NextImage
            src={safeImages[0]}
            alt=""
            width={1}
            height={1}
            onLoad={() => setFirstImageLoaded(true)}
            onError={() => setFirstImageLoaded(true)}
          />
        </div>
      )}
      
      {/* Navigation arrows */}
      {safeImages.length > 1 && (
        <>
          <div className="absolute h-full top-0 left-0 flex flex-col justify-center">
            <div
              className="p-2 hover:bg-slate-300/20 rounded-full cursor-pointer z-10 m-2 group"
              onClick={() => {
                setDirection(false);
                setSelectedImage(
                  safeImages[
                    (imageIndex > 0 ? imageIndex - 1 : safeImages.length - 1) %
                      safeImages.length
                  ]
                );
              }}>
              <FiChevronLeft className="text-3xl text-black/60 group-hover:text-black group-hover:scale-110 transition-all duration-200" />
            </div>
          </div>

          <div className="absolute h-full top-0 right-0 flex flex-col justify-center">
            <div
              className="p-2 hover:bg-slate-300/20 rounded-full cursor-pointer z-10 m-2 group"
              onClick={() => {
                setDirection(true);
                setSelectedImage(
                  safeImages[(imageIndex + 1) % safeImages.length]
                );
              }}>
              <FiChevronRight className="text-3xl text-black/60 group-hover:text-black group-hover:scale-110 transition-all duration-200" />
            </div>
          </div>

          <div className="absolute bottom-0 left-0 w-full flex items-end justify-center pb-6 gap-4">
            {safeImages.map((item, i) => (
              <div
                onClick={() => {
                  setDirection(i >= safeImages.indexOf(selectedImage));
                  setSelectedImage(item);
                }}
                className={clsx(
                  'w-3 aspect-square rounded-full cursor-pointer',
                  item === selectedImage ? 'bg-black/60' : 'bg-slate-200'
                )}
                key={i}></div>
            ))}
          </div>
        </>
      )}
      </div>
      <p className="hidden md:block text-center text-xs font-semibold text-gray-500 mt-2 select-none">Click to Magnify</p>

      {isModalOpen && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
          onClick={() => setIsModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          {/* Darkened backdrop */}
          <div className="absolute inset-0 bg-black/75" aria-hidden="true" />

          {/* Popup window — clicks inside do not close it */}
          <div
            className="relative z-10 w-full max-w-5xl rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button (top-right of the popup) */}
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              aria-label="Close"
              className="absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-700 shadow-md transition-colors hover:bg-gray-100 hover:text-black"
            >
              <FiX className="text-3xl" />
            </button>

            {/* Enlarged image + navigation arrows */}
            <div className="relative flex items-center justify-center p-6 sm:p-12" style={{ minHeight: '50vh' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedImage}
                alt="Product enlarged"
                draggable={false}
                className="max-h-[74vh] max-w-full select-none object-contain"
              />

              {safeImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={showPrev}
                    aria-label="Previous image"
                    className="group absolute left-2 top-1/2 -translate-y-1/2 rounded-full p-2 hover:bg-slate-200/60 sm:left-4"
                  >
                    <FiChevronLeft className="text-3xl text-black/60 transition-all duration-200 group-hover:scale-110 group-hover:text-black" />
                  </button>
                  <button
                    type="button"
                    onClick={showNext}
                    aria-label="Next image"
                    className="group absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 hover:bg-slate-200/60 sm:right-4"
                  >
                    <FiChevronRight className="text-3xl text-black/60 transition-all duration-200 group-hover:scale-110 group-hover:text-black" />
                  </button>
                </>
              )}
            </div>

            {/* Dots */}
            {safeImages.length > 1 && (
              <div className="flex items-center justify-center gap-3 pb-6">
                {safeImages.map((item, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Go to image ${i + 1}`}
                    onClick={() => {
                      setDirection(i >= safeImages.indexOf(selectedImage));
                      setSelectedImage(item);
                    }}
                    className={clsx(
                      'h-2 w-2 rounded-full transition-colors',
                      item === selectedImage ? 'bg-black/70' : 'bg-gray-300 hover:bg-gray-400'
                    )}
                  />
                ))}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ImageProduct;