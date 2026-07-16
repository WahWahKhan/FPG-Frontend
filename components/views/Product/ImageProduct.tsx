import clsx from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';
import { useState, useMemo, useEffect } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
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
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    if (safeImages.length > 0) {
      setSelectedImage(safeImages[0]);
    }
  }, [safeImages]);

  // Preload remaining images after first image loads
  useEffect(() => {
    if (firstImageLoaded && safeImages.length > 1) {
      safeImages.slice(1).forEach((imageSrc) => {
        if (typeof window !== 'undefined') {
          const img = window.Image ? new window.Image() : document.createElement('img');
          img.src = imageSrc;
        }
      });
    }
  }, [firstImageLoaded, safeImages]);

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
    <div className="relative col-span-full lg:col-span-6 xl:col-span-7 w-full border rounded-3xl h-full overflow-hidden md:flex md:flex-col md:justify-center">
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
            <div
              className="relative w-full h-full cursor-zoom-in"
              style={{
                transition: 'transform 300ms ease-out',
                transform: isZoomed ? 'scale(1.2)' : 'scale(1)',
              }}
              onMouseEnter={() => setIsZoomed(true)}
              onMouseLeave={() => setIsZoomed(false)}
            >
              <NextImage
                src={selectedImage}
                alt="Product"
                layout="fill"
                objectFit="contain"
                unoptimized={true}
                loader={({ src }) => src}
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
  );
};

export default ImageProduct;