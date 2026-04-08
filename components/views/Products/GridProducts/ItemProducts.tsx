// components/views/Products/GridProducts/ItemProducts.tsx
import Anchor from "@/modules/Anchor";
import { motion } from "framer-motion";
import OptimizedImage from "../../../../utils/OptimizedImage";

// ─── Adjust this to change the font size of tile descriptions ─────────────
const TILE_DESCRIPTION_FONT_SIZE = '0.9rem'; // equivalent to text-xs, try '0.8rem', '0.875rem' (text-sm), etc.
// ───────────────────────────────────────────────────────────────────────────

const ItemProducts = ({ item, showDescription = false }: { item: any, showDescription?: boolean }) => {
  const getDescriptions = (description: string) => {
    const text = description.split("<br>")[0];
    const stripped = text.replace(/(<([^>]+)>)/ig, "").replace(/&nbsp;/g, "");
    return stripped
      .replace(/&deg;/g, '°')
      .replace(/&amp;/g, '&')
      .replace(/&mdash;/g, '—')
      .replace(/&ndash;/g, '–')
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"');
  }

  if (!item) {
    return (
      <div className="flex flex-col w-full max-w-sm mx-auto group cursor-pointer border-slate-800 border-[1px] p-4 h-full shadow-md">
        <div className="w-full pt-[100%] relative">
          <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
            <div className="text-gray-400">Loading...</div>
          </div>
        </div>
        <div className="text-xl px-3 py-1.5 font-light flex justify-center">
          <h3 className="text-xl font-semibold">Loading...</h3>
        </div>
      </div>
    );
  }

  return (
    <Anchor href={`/products/${item.id}`}>
      <motion.div 
        className="flex flex-col w-full max-w-sm mx-auto cursor-pointer border-slate-800 border-[1px] p-4 h-full shadow-xl rounded-2xl"
        initial={{ y: 0 }}
        whileHover={{ 
          y: -8,
          boxShadow: "0 25px 50px -12px rgba(31, 41, 55, 0.5)"
        }}
        transition={{ 
          duration: 0.2,
          ease: "easeOut"
        }}
      >
        {/* Fixed image container - centers content and handles hover scaling properly */}
        <div className="w-full pt-[100%] relative overflow-visible">
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <motion.div 
              className="relative w-full h-full"
              initial={{ scale: 0.85 }}
              whileHover={{ scale: 1.0 }}
              transition={{ 
                duration: 0.2,
                ease: "easeOut"
              }}
            >
              <OptimizedImage
                src={item.image}
                alt={item.slug || item.name || "Product image"}
                width={300}
                height={300}
                className="object-contain"
                useContainMode={true}
              />
            </motion.div>
          </div>
        </div>
        
        <div className="text-xl px-3 py-1.5 font-light flex justify-center gap-12">
          <h3 className="text-xl font-semibold">
            <b>{item.name || item.title}</b>
          </h3>
        </div>
        
        {showDescription && (
          <div className="text-center">
            <span className="font-semibold text-slate-700" style={{ textAlign: 'justify', textAlignLast: 'center', display: 'block', fontSize: TILE_DESCRIPTION_FONT_SIZE }}>
              {item.description && getDescriptions(item.description)}
            </span>
          </div>
        )}
      </motion.div>
    </Anchor>
  );
};

export default ItemProducts;