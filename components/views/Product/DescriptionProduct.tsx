import { FiCheck, FiSquare } from "react-icons/fi";

// Swell CMS descriptions sometimes wrap plain text in <h1>, which duplicates
// this page's real <h1> above. Downgrade to <p> defensively before rendering.
const downgradeHeadings = (html: string) =>
  html
    .replace(/<h1(\s[^>]*)?>/gi, '<p$1>')
    .replace(/<\/h1>/gi, '</p>');

const DescriptionProduct = ({ series, items }: { series: any, items: any }) => {
  return (
    <div className="col-span-full lg:col-span-6  xl:col-span-5   lg:px-12 flex flex-col gap-8 justify-center ">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl md:text-3xl xl:text-4xl font-semibold">
          {series.name}
        </h1>
        {/*<h2 className="text-xl lg:text-2xl bg-gradient-to-r text-black/60 font-semibold">
          Description for the Series
        </h2>*/}
      </div>

      {/*<div className="flex gap-4">
        {Array(3)
          .fill({})
          .map((_, i) => (
            <div
              className="w-full     bg-gradient-to-r from-amber-500 to-amber-900 bg-clip-text text-transparent text-3xl font-semibold items-center justify-center flex flex-col"
              key={i}
            >
              50%
              <div className="text-xl text-black/70">Faster</div>
            </div>
          ))}
      </div>
          */}
      
      {/* Series Description - Always visible */}
      <ul className="flex flex-col gap-2.5">
        {series.description.length !== 0 &&
          <li className="flex items-center gap-1 text-lg xl:text-xl">
            <div dangerouslySetInnerHTML={{__html: downgradeHeadings(series.description)}}>
            </div>
          </li>
        }
      </ul>
      
      {/* Item Description - Always visible (no more toggle) */}
      {items && items.description && items.description.length !== 0 && (
        <div className="flex flex-col gap-2.5">
          <div dangerouslySetInnerHTML={{__html: downgradeHeadings(items.description)}}>
          </div>
        </div>
      )}
      
      {/* Button removed - all info now visible by default */}
    </div>
  ); 
};

export default DescriptionProduct;