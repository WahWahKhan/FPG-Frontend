import { Listbox } from "@headlessui/react";
import { AnimatePresence, motion } from "framer-motion";
import React, { Fragment, useState } from "react";
import { FiChevronDown } from "react-icons/fi";

const sortingOptions = [
  { id: 1, name: "Featured" },
  { id: 3, name: "Newest" },
  { id: 12, name: "Price (Highest)" },
  { id: 14, name: "Price (Lowest)" },
];

const SelectSortProducts = () => {
  const [selectedOption, setSelectedOption] = useState(sortingOptions[0]);

  return (
    <motion.div className="relative ">
      <Listbox value={selectedOption} onChange={setSelectedOption}>
        {({ open }) => (
          <>
            <Listbox.Button
              className="rounded-md text-black text-lg px-0 py-0 border-0 flex items-center gap-2 cursor-pointer w-full "
              as={motion.div}
              layout="position"
            >
              {selectedOption.name} <FiChevronDown />
            </Listbox.Button>
            <AnimatePresence>
              {open && (
                <Listbox.Options as={Fragment} static>
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className={
                      "absolute top-10 right-0 z-50 bg-white p-3 rounded-lg shadow-lg w-full min-w-max text-lg flex flex-col gap-1 list-none focus:outline-none "
                    }
                  >
                  {sortingOptions.map((option) => (
                    <Listbox.Option
                      key={option.id}
                      value={option}
                      className="cursor-pointer hover:bg-slate-100 py-1 px-2 rounded-lg"
                    >
                      {option.name}
                    </Listbox.Option>
                  ))}
                  </motion.div>
                </Listbox.Options>
              )}
            </AnimatePresence>
          </>
        )}
      </Listbox>
    </motion.div>
  );
};

export default SelectSortProducts;
