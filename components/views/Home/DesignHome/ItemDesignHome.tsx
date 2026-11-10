import {
  AnimatePresence,
  LayoutGroup,
  motion,
} from "framer-motion";
import Image from "next/image";
import { useState, useEffect } from "react";

interface ItemDesignHomeProps {
  title: string;
}

const ItemDesignHome = ({ title }: ItemDesignHomeProps) => {
  const [hover, setHover] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return (
    <>
      <div
        className="col-span-2 aspect-square rounded-md relative overflow-hidden hover:shadow-2xl hover:shadow-slate-200 max-w-[400px] w-full mx-auto z-10"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        <Image
          src={`${process.env.NEXT_PUBLIC_BASE_URL || ''}/hydraulicSystemDesign.jpeg`}
          alt="Hydraulic System Design"
          width={400}
          height={400}
          className="object-cover w-full h-full"
          priority
          quality={100}
          unoptimized
        />
        
        <motion.div
          layout
          className="absolute top-0 left-0 w-full bg-black/30 backdrop-grayscale-[0.3] hover:backdrop-grayscale-0 cursor-pointer transition-all duration-200 h-full z-20 text-white font-semibold p-8 flex flex-col justify-end gap-4"
        >
          <LayoutGroup>
            <motion.h2 layout="position" className="text-2xl xl:text-3xl">
              {title}
            </motion.h2>
            <AnimatePresence>
              {(hover || isMobile) && (
                <motion.div
                  className="text-lg xl:text-xl font-light"
                  initial={isMobile ? { opacity: 1, y: 0 } : { y: 20, opacity: 0 }}
                  animate={{ 
                    y: 0, 
                    opacity: 1, 
                    transition: { 
                      duration: isMobile ? 0 : 0.2,
                      ease: "easeOut"
                    } 
                  }}
                  exit={isMobile ? {} : { 
                    y: 10, 
                    opacity: 0, 
                    transition: { 
                      duration: 0.15,
                      ease: "easeIn"
                    } 
                  }}
                >
                  We can design, build and install the right hydraulic systems
                  according to your needs.
                </motion.div>
              )}
            </AnimatePresence>
          </LayoutGroup>
        </motion.div>
      </div>
    </>
  );
};

const ItemDesignsHome = ({ title }: ItemDesignHomeProps) => {
  const [hover, setHover] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return (
    <>
      <div 
        className="col-span-2 aspect-square rounded-md relative overflow-hidden hover:shadow-2xl hover:shadow-slate-200 max-w-[400px] w-full mx-auto z-10"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        <Image
          src={`${process.env.NEXT_PUBLIC_BASE_URL || ''}/drafting.jpeg`}
          alt="Design and Drafting"
          width={400}
          height={400}
          className="object-cover w-full h-full"
          priority
          quality={100}
          unoptimized
        />
        
        <motion.div
          layout
          className="absolute top-0 left-0 w-full bg-black/30 backdrop-grayscale-[0.3] hover:backdrop-grayscale-0 cursor-pointer transition-all duration-200 h-full z-20 text-white font-semibold p-8 flex flex-col justify-end gap-4"
        >
          <LayoutGroup>
            <motion.h2 layout="position" className="text-2xl xl:text-3xl">
              {title}
            </motion.h2>
            <AnimatePresence>
              {(hover || isMobile) && (
                <motion.div
                  className="text-lg xl:text-xl font-light"
                  initial={isMobile ? { opacity: 1, y: 0 } : { y: 20, opacity: 0 }}
                  animate={{ 
                    y: 0, 
                    opacity: 1, 
                    transition: { 
                      duration: isMobile ? 0 : 0.2,
                      ease: "easeOut"
                    } 
                  }}
                  exit={isMobile ? {} : { 
                    y: 10, 
                    opacity: 0, 
                    transition: { 
                      duration: 0.15,
                      ease: "easeIn"
                    } 
                  }}
                >
                  Our engineers can bring your ideas to life.<br />
                  We are using the latest 3D softwares for our design and drafting.<br />
                  Talk to us if you want anything to build.
                </motion.div>
              )}
            </AnimatePresence>
          </LayoutGroup>
        </motion.div>
      </div>
    </>
  );
};

export default ItemDesignHome;
export { ItemDesignsHome };