import SortProducts from "./SortProducts/SortProducts";
import ItemProducts from "./ItemProducts";
import { motion } from "framer-motion";

type Props = {
  seriesList: any;
  showDescription: any;
};

const GridProducts = ({ seriesList, showDescription }: Props) => {
  return (
    <div className="col-span-12  sm:col-span-9 xl:col-span-10 flex flex-col gap-8  sm:gap-2  ">
      <SortProducts />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {seriesList.map((item: any, index: number) => (
          <ItemProducts
            item={item}
            key={item.id}
            showDescription={showDescription}
            // First row (up to 4 tiles on xl) loads immediately with high
            // priority instead of lazily after the page has rendered.
            priority={index < 4}
          />
        ))}
      </div>
    </div>
  );
};

export default GridProducts;
