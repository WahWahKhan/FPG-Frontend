import Anchor from "@/modules/Anchor";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import React from "react";
import { SubCategory } from "types/products";

type ICategoriesProps = {
  subCategories: SubCategory[];
};

const SubCategories = ({ subCategories }: ICategoriesProps) => {
  if (subCategories === null || subCategories.length === 0) {
    return null
  }
  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          .hover-scale-element {
            transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
          }
          .group:hover .hover-scale-element {
            transform: scale(1.2) !important;
          }
        `
      }} />
      
      <div className="grid grid-rows-3 grid-cols-3 w-4/5 grid-flow-row gap-y-4 gap-x-6 pl-12 xl:pl-20">
        <AnimatePresence exitBeforeEnter>
          {subCategories.map((subCategory) => (
            <Anchor
              key={subCategory.id}
              href={`/products/${subCategory?.slug}`}
              className="hover:no-underline"
            >
              <motion.div
                key={subCategory?.id}
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 50, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full h-full flex rounded-lg group cursor-pointer"
              >
                <div 
                  className="rounded-xl w-24 h-24 p-1 border hover-scale-element flex items-center justify-center overflow-hidden"
                  style={{ aspectRatio: '1 / 1' }}
                >
                  <div className="relative w-full h-full">
                    <Image
                      src={subCategory?.image || "/product-3.png"}
                      layout="fill"
                      objectFit="contain"
                      alt="Site logo"
                    />
                  </div>
                </div>
                <h3 className="text-lg xl:text-xl font-light py-1 px-4 origin-left hover-scale-element">
                  {subCategory?.title}
                </h3>
              </motion.div>
            </Anchor>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
};

export default SubCategories;