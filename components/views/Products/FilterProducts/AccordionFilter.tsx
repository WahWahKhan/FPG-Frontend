import Anchor from "@/modules/Anchor";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";
import { Category } from "types/products";

type IAccordionFilter = {
  category: Category;
  open: boolean;
  selected: boolean;
  handleClick: () => void;
  selectedSubCategory: string;
};

const AccordionFilter = ({
  category,
  open,
  handleClick,
  selected,
  selectedSubCategory,
}: IAccordionFilter) => {
  return (
    <motion.div className="flex flex-col" layout="position">
      <motion.button
        className="flex w-full text-xl items-center  py-2 px-0  justify-between cursor-pointer rounded-lg bg-transparent text-black border-0 hover:text-black hover:bg-transparent"
        onClick={handleClick}
      >
        <motion.div layout="position"> {category.title} </motion.div>
        <motion.div layout="position">
          {open ? <FiChevronUp /> : <FiChevronDown />}
        </motion.div>
      </motion.button>
      <AnimatePresence exitBeforeEnter>
        {open && (
          <motion.div
            className="flex flex-col gap-2 py-2"
            initial={{ y: -20, opacity: 0 }}
            layout
            animate={{
              y: 0,
              opacity: 1,
              transition: {
                duration: 0.2,
              },
            }}
            exit={{
              y: -20,
              opacity: 0,
              transition: {
                duration: 0.1,
              },
            }}
          >
            {category.subCategories.map((subCategory) => (
              <Anchor
                href={`/products/${subCategory?.slug}`}
                className={clsx(
                  "text-xl ",
                  selectedSubCategory === subCategory?.slug
                    ? "font-semibold"
                    : "font-light"
                )}
                key={subCategory.id}
              >
                {subCategory.title}
              </Anchor>
            ))}
            {/*<Anchor
              className={clsx(
                "text-lg font-semibold bg-gradient-to-r text-transparent bg-clip-text from-amber-600 to-black",
                { "pointer-events-none text-gray-400": selected }
              )}
              href={`/products/${category.slug}`}
            >
              View All
              </Anchor>*/}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AccordionFilter;
