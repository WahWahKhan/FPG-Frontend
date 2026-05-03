import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

const BackgroundPhotosSlideshow = () => {
  const images = useMemo(() => [
    `${process.env.NEXT_PUBLIC_BASE_URL || ''}/frontA.jpg`,
    `${process.env.NEXT_PUBLIC_BASE_URL || ''}/frontB.jpg`,
    `${process.env.NEXT_PUBLIC_BASE_URL || ''}/frontC.jpg`,
    `${process.env.NEXT_PUBLIC_BASE_URL || ''}/frontD.jpg`,
    `${process.env.NEXT_PUBLIC_BASE_URL || ''}/frontE.jpg`,
    `${process.env.NEXT_PUBLIC_BASE_URL || ''}/frontF.jpg`,
    `${process.env.NEXT_PUBLIC_BASE_URL || ''}/frontG.jpg`
  ], []);

  const [selectedImage, setSelectedImage] = useState(images[0]);
  const [direction, setDirection] = useState(1);

  // Slide right to left variants
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 1,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? '-100%' : '100%',
      opacity: 1,
    }),
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const currentIndex = images.indexOf(selectedImage);
      const nextIndex = currentIndex + 1 <= images.length - 1 ? currentIndex + 1 : 0;
      setDirection(1);
      setSelectedImage(images[nextIndex]);
    }, 3000);

    return () => {
      clearInterval(interval);
    };
  }, [images, selectedImage]);

  return (
    <div 
      className="absolute w-full h-full overflow-hidden top-[30px] md:top-0 left-0 right-0 bottom-0 md:bottom-[20px]"
      style={{
        zIndex: 5,
        pointerEvents: 'none'
      }}
    >
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={selectedImage}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            duration: 0.8,
            ease: "easeInOut"
          }}
          className="absolute inset-0 w-full h-full"
        >
          <Image
            src={selectedImage}
            width={1920}
            height={1080}
            className="w-full h-full object-cover object-center md:object-contain"
            alt="Background hero image"
            sizes="100vw"
            priority
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default BackgroundPhotosSlideshow;