import withLayout from "@/hoc/withLayout";
import { FilterProducts, GridProducts, HeaderProducts } from "@/views/Products";
import { useEffect, useState } from "react";
import Header from "@/modules/Header";
import { useRouter } from "next/router";
import axios from "axios";
import Loading from "@/modules/Loading";
import { AnimatePresence, motion } from "framer-motion";

type searchParams = {
  title: string | null;
  categories: string | null;
  subCategories: string | null;
  subSubCategories: string | null;
  finalProducts: string | null;
  extraParams?: string | null;
};

const Search = () => {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<searchParams>({
    title: null, 
    categories: null, 
    subCategories: null, 
    subSubCategories: null,
    finalProducts: null,
    extraParams: null
  });
  const [data, setData] = useState<any>([]);
  const [filteredData, setFilteredData] = useState<any>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string>("");
  const [level3Data, setLevel3Data] = useState<any[]>([]);
  const [searchMode, setSearchMode] = useState<'quick' | 'part'>('quick');
  const [partSearchQuery, setPartSearchQuery] = useState<string>('');
  const [partSearchResults, setPartSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [wordSearchQuery, setWordSearchQuery] = useState<string>('');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await axios.get('/api/getAllProducts');
        
        if (response.data && response.data.categories) {
          // Filter out hidden subcategories from each category
          const visibleCategories = response.data.categories.map((category: any) => ({
            ...category,
            subCategories: category.subCategories?.filter(
              (subCat: any) => subCat.slug !== 'hydraulic-hoses-custom-hose-assembly'
            ) || []
          }));
          
          setData(visibleCategories);
          
          if (visibleCategories.length > 0) {
            if (visibleCategories[0].subCategories?.length > 0) {
              if (visibleCategories[0].subCategories[0].series?.length > 0) {
              }
            }
          }
        } else {
          console.warn('No categories found in response');
          setData([]);
        }
        
      } catch (err: any) {
        console.error('Error fetching categories:', err);
        setError(err.message || 'Failed to load search data');
        setData([]);
      } finally {
        setLoading(false);
      }
    };
  
    fetchCategories();
  }, []);

  // Word Search Logic - API handles filtering now
  useEffect(() => {
    const searchProducts = async () => {
      if (!wordSearchQuery.trim()) {
        return;
      }

      setIsSearching(true);
      try {
        
        const response = await axios.post('/api/searchProducts', {
          query: wordSearchQuery,
          searchType: 'general'
        });
        
        if (response.data.products && response.data.products.length > 0) {
          // No frontend filtering needed - API already filtered
          setFilteredData(response.data.products);
        } else {
          setFilteredData([]);
        }
        
      } catch (error: any) {
        console.error('Word search error:', error);
        setFilteredData([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(searchProducts, 300);
    return () => clearTimeout(debounceTimer);
  }, [wordSearchQuery]);

  const categoryTitle = selectedCategory.title;
  const categoryName = selectedCategory.categories;

  // Part Number Search Logic - API handles filtering now
  useEffect(() => {
    const searchPartNumbers = async () => {
      if (!partSearchQuery.trim() || searchMode !== 'part') {
        setPartSearchResults([]);
        return;
      }
  
      setIsSearching(true);
      try {
        
        const response = await axios.post('/api/searchProducts', {
          query: `FPG-${partSearchQuery}`,
          searchType: 'partNumber'
        });
        
        if (response.data.products && response.data.products.length > 0) {
          // No frontend filtering needed - API already filtered
          setPartSearchResults(response.data.products);
        } else {
          setPartSearchResults([]);
        }
        
      } catch (error: any) {
        console.error('Part search error:', error);
        setPartSearchResults([]);
        
        if (error.response?.status === 400) {
          console.log('Search query too short or invalid');
        } else if (error.response?.status === 500) {
          console.log('Server error during search');
        } else {
          console.log('Network error during search');
        }
      } finally {
        setIsSearching(false);
      }
    };
  
    const debounceTimer = setTimeout(searchPartNumbers, 300);
    return () => clearTimeout(debounceTimer);
  }, [partSearchQuery, searchMode]);

  useEffect(() => {
    let newFilteredData: any[] = [];

    if (categoryTitle && categoryName && data.length > 0) {
      
      data.forEach((product: any) => {
        if (product.title === categoryTitle) {
          
          product.subCategories.forEach((cat: any) => {
            if (cat.title.toLowerCase().includes(categoryName.toLowerCase())) {
              if (cat.series && cat.series.length > 0) {
                newFilteredData = [...newFilteredData, ...cat.series];
              }
            }
          });
        }
      });
    }
    
    setFilteredData(newFilteredData);
  }, [categoryTitle, categoryName, data]);

  // Filter products for Quick Search category navigation (local filtering only)
  const filteredProducts = data.filter((product: any) => {
    if (!wordSearchQuery.trim()) return true;
    
    const searchLower = wordSearchQuery.toLowerCase();
    const searchTerms = searchLower.split(' ').filter(term => term.length > 0);
    
    const titleMatches = searchTerms.every(term => 
      product.title.toLowerCase().includes(term)
    );
    
    const subCategoryMatches = product.subCategories?.some((cat: any) =>
      searchTerms.every(term => cat.title.toLowerCase().includes(term))
    );
    
    const seriesMatches = product.subCategories?.some((cat: any) =>
      cat.series?.some((series: any) =>
        searchTerms.every(term => series.title.toLowerCase().includes(term))
      )
    );
    
    return titleMatches || subCategoryMatches || seriesMatches;
  });

  const variants = {
    initial: { opacity: 0, x: -100 },
    animate: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.5, staggerChildren: 0.5 },
    },
    exit: { opacity: 0, y: -100, transition: { duration: 0.3 } },
  };

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="px-8 md:px-12 py-12 min-h-screen flex flex-col items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Search Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-8 md:px-12 py-8 md:py-12 min-h-screen">
      <div className="text-[2.5rem] sm:text-[4rem] md:text-[6rem] lg:text-[8rem] xl:text-[10rem] font-bold text-slate-200/50 px-2 sm:px-4 md:px-10">
        Search
      </div>
      
      <div className="wrapper flex flex-col gap-8 md:gap-12 items-center px-2 sm:px-6 md:px-10">
        <div className="w-full flex justify-center mb-4">
          <div 
            style={{
              background: "rgba(0, 0, 0, 0.15)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              borderRadius: "50px",
              padding: "8px 12px 12px 12px",
              boxShadow: "0 8px 25px rgba(0, 0, 0, 0.1)"
            }}
          >
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSearchMode('quick')}
                className="relative overflow-hidden"
                style={{
                  all: "unset",
                  cursor: "pointer",
                  display: "inline-block",
                  padding: "12px 16px",
                  borderRadius: "40px",
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  textDecoration: "none",
                  transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                  position: "relative",
                  whiteSpace: "nowrap",
                  minWidth: "max-content",
                  ...(searchMode === 'quick' ? {
                    background: `radial-gradient(ellipse at center, rgba(250, 204, 21, 0.9) 20%, rgba(250, 204, 21, 0.7) 60%, rgba(255, 215, 0, 0.8) 100%), rgba(250, 204, 21, 0.6)`,
                    border: "1px solid rgba(255, 215, 0, 0.9)",
                    color: "#000",
                    transform: "translateY(-2px) scale(1.02)",
                    boxShadow: `
                      0 10px 30px rgba(250, 204, 21, 0.6),
                      inset 0 2px 0 rgba(255, 255, 255, 0.8),
                      inset 0 3px 10px rgba(255, 255, 255, 0.4),
                      inset 0 -1px 0 rgba(255, 215, 0, 0.4)
                    `
                  } : {
                    background: `radial-gradient(ellipse at center, rgba(255, 255, 255, 0.3) 20%, rgba(255, 255, 255, 0.15) 70%, rgba(240, 240, 240, 0.2) 100%), rgba(255, 255, 255, 0.15)`,
                    backdropFilter: "blur(15px)",
                    border: "1px solid rgba(255, 255, 255, 0.4)",
                    color: "#333",
                    boxShadow: `
                      0 4px 15px rgba(0, 0, 0, 0.1),
                      inset 0 1px 0 rgba(255, 255, 255, 0.6),
                      inset 0 2px 8px rgba(255, 255, 255, 0.2),
                      inset 0 -1px 0 rgba(0, 0, 0, 0.05)
                    `
                  })
                }}
                onMouseEnter={(e) => {
                  if (searchMode !== 'quick') {
                    e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
                    e.currentTarget.style.background = `radial-gradient(ellipse at center, rgba(250, 204, 21, 0.9) 20%, rgba(250, 204, 21, 0.7) 60%, rgba(255, 215, 0, 0.8) 100%), rgba(250, 204, 21, 0.6)`;
                    e.currentTarget.style.border = "1px solid rgba(255, 215, 0, 0.9)";
                    e.currentTarget.style.color = "#000";
                  }
                }}
                onMouseLeave={(e) => {
                  if (searchMode !== 'quick') {
                    e.currentTarget.style.transform = "translateY(0px) scale(1)";
                    e.currentTarget.style.background = `radial-gradient(ellipse at center, rgba(255, 255, 255, 0.3) 20%, rgba(255, 255, 255, 0.15) 70%, rgba(240, 240, 240, 0.2) 100%), rgba(255, 255, 255, 0.15)`;
                    e.currentTarget.style.border = "1px solid rgba(255, 255, 255, 0.4)";
                    e.currentTarget.style.color = "#333";
                  }
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    top: "1px",
                    left: "8px",
                    right: "8px",
                    height: "50%",
                    background: "linear-gradient(180deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%)",
                    borderRadius: "40px 40px 20px 20px",
                    pointerEvents: "none",
                    transition: "all 0.4s ease"
                  }}
                />
                Quick Search
              </button>

              <button
                onClick={() => setSearchMode('part')}
                className="relative overflow-hidden"
                style={{
                  all: "unset",
                  cursor: "pointer",
                  display: "inline-block",
                  padding: "12px 16px",
                  borderRadius: "40px",
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  textDecoration: "none",
                  transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                  position: "relative",
                  whiteSpace: "nowrap",
                  minWidth: "max-content",
                  ...(searchMode === 'part' ? {
                    background: `radial-gradient(ellipse at center, rgba(250, 204, 21, 0.9) 20%, rgba(250, 204, 21, 0.7) 60%, rgba(255, 215, 0, 0.8) 100%), rgba(250, 204, 21, 0.6)`,
                    border: "1px solid rgba(255, 215, 0, 0.9)",
                    color: "#000",
                    transform: "translateY(-2px) scale(1.02)",
                    boxShadow: `
                      0 10px 30px rgba(250, 204, 21, 0.6),
                      inset 0 2px 0 rgba(255, 255, 255, 0.8),
                      inset 0 3px 10px rgba(255, 255, 255, 0.4),
                      inset 0 -1px 0 rgba(255, 215, 0, 0.4)
                    `
                  } : {
                    background: `radial-gradient(ellipse at center, rgba(255, 255, 255, 0.3) 20%, rgba(255, 255, 255, 0.15) 70%, rgba(240, 240, 240, 0.2) 100%), rgba(255, 255, 255, 0.15)`,
                    backdropFilter: "blur(15px)",
                    border: "1px solid rgba(255, 255, 255, 0.4)",
                    color: "#333",
                    boxShadow: `
                      0 4px 15px rgba(0, 0, 0, 0.1),
                      inset 0 1px 0 rgba(255, 255, 255, 0.6),
                      inset 0 2px 8px rgba(255, 255, 255, 0.2),
                      inset 0 -1px 0 rgba(0, 0, 0, 0.05)
                    `
                  })
                }}
                onMouseEnter={(e) => {
                  if (searchMode !== 'part') {
                    e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
                    e.currentTarget.style.background = `radial-gradient(ellipse at center, rgba(250, 204, 21, 0.9) 20%, rgba(250, 204, 21, 0.7) 60%, rgba(255, 215, 0, 0.8) 100%), rgba(250, 204, 21, 0.6)`;
                    e.currentTarget.style.border = "1px solid rgba(255, 215, 0, 0.9)";
                    e.currentTarget.style.color = "#000";
                  }
                }}
                onMouseLeave={(e) => {
                  if (searchMode !== 'part') {
                    e.currentTarget.style.transform = "translateY(0px) scale(1)";
                    e.currentTarget.style.background = `radial-gradient(ellipse at center, rgba(255, 255, 255, 0.3) 20%, rgba(255, 255, 255, 0.15) 70%, rgba(240, 240, 240, 0.2) 100%), rgba(255, 255, 255, 0.15)`;
                    e.currentTarget.style.border = "1px solid rgba(255, 255, 255, 0.4)";
                    e.currentTarget.style.color = "#333";
                  }
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    top: "1px",
                    left: "8px",
                    right: "8px",
                    height: "50%",
                    background: "linear-gradient(180deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%)",
                    borderRadius: "40px 40px 20px 20px",
                    pointerEvents: "none",
                    transition: "all 0.4s ease"
                  }}
                />
                Part Number Search
              </button>
            </div>
          </div>
        </div>
        
        {searchMode === 'quick' ? (
          <div className="w-full p-4 sm:p-5 sm:px-8 rounded-md shadow-lg hover:shadow-xl transition duration-200">
            <div className="mb-6">
              <div className="w-full max-w-sm sm:max-w-lg md:max-w-2xl mx-auto px-1 sm:px-2 md:px-0">
                <div className="relative">
                  <div className="flex items-stretch w-full border-2 border-yellow-400 rounded-xl bg-white shadow-md focus-within:shadow-lg transition-shadow duration-200 overflow-hidden">
                    <div className="px-3 sm:px-4 py-3 bg-yellow-100 text-gray-700 font-medium border-r border-yellow-300 text-sm sm:text-base flex items-center justify-center">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={wordSearchQuery}
                      onChange={(e) => setWordSearchQuery(e.target.value)}
                      placeholder="Search by keyword (e.g., valve, hose, fitting)..."
                      className="
                        flex-1 min-w-0 px-3 sm:px-4 py-3 focus:outline-none
                        text-gray-800 text-sm sm:text-base
                        placeholder:text-gray-400 placeholder:text-xs sm:placeholder:text-sm
                      "
                    />
                    {wordSearchQuery && (
                      <button
                        onClick={() => {
                          setWordSearchQuery('');
                          setFilteredData([]); 
                          setOpen('');
                          setSelectedCategory({
                            title: null,
                            categories: null,
                            subCategories: null,
                            subSubCategories: null,
                            finalProducts: null,
                            extraParams: null,
                          });
                        }}
                        className="mr-2 my-2 bg-white border-2 border-yellow-400 rounded-full w-10 h-10 flex items-center justify-center hover:bg-yellow-50 transition-colors flex-shrink-0"
                        aria-label="Clear search"
                      >
                        <span className="text-yellow-400 text-2xl font-bold leading-none">×</span>
                      </button>
                    )}
                  </div>
                </div>
                
                <p className="text-xs sm:text-sm text-gray-500 mt-3 text-center leading-relaxed px-2">
                  Type keywords to instantly filter categories below
                  {wordSearchQuery && (
                    <span className="block mt-1 text-yellow-600 font-medium">
                      {isSearching ? 'Searching...' : `Found ${filteredData.length} matching product${filteredData.length === 1 ? '' : 's'}`}
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div>
              <div>
                {filteredProducts.map((product: any, index: number) => (
                  <div
                    key={index}
                    className="flex flex-col md:flex-row justify-start items-start my-2"
                  >
                    <div
                      className="w-full md:w-[30%] md:max-w-[200px] mb-3 md:mb-0"
                      onClick={() => {
                        console.log('Selected product:', product.title);
                        setSelectedCategory({
                          title: product.title,
                          categories: null,
                          subCategories: null,
                          subSubCategories: null,
                          finalProducts: null,
                          extraParams: null,
                        });
                        setOpen(product.title);
                      }}
                    >
                      <span
                        className={`text-base sm:text-lg font-bold ${
                          open === product.title
                            ? "text-primary"
                            : "text-slate-700"
                        } cursor-pointer block`}
                      >
                        {product.title}
                      </span>
                    </div>
                    {open === product.title && (
                      <AnimatePresence>
                        <motion.div
                          key={product.title}
                          variants={variants}
                          initial="initial"
                          animate="animate"
                          exit="exit"
                          transition={{ duration: 0.5, staggerChildren: 0.5 }}
                          className="w-full md:flex-1"
                        >
                          <div>
                            <span className="text-sm sm:text-md font-bold text-black">
                              Categories
                            </span>
                            <motion.div className="flex mt-2 flex-wrap">
                              {product.subCategories.map((category: any, catIndex: number) => (
                                <div
                                  className={`border-2 rounded-xl mr-2 sm:mr-4 px-2 sm:px-4 py-1 flex justify-center items-center my-1 sm:my-2 hover:cursor-pointer text-xs sm:text-sm
                                  ${
                                    selectedCategory.categories === category.title
                                      ? "border-slate-700 text-slate-700 bg-primary"
                                      : "border-slate-700"
                                  }
                                  `}
                                  key={catIndex}
                                  onClick={() => {
                                    console.log('Selected category:', category.title);
                                    setSelectedCategory({
                                      ...selectedCategory,
                                      categories: category.title,
                                      subCategories: null,
                                      subSubCategories: null,
                                      finalProducts: null
                                    });
                                  }}
                                >
                                  {category.title}
                                </div>
                              ))}
                            </motion.div>
                          </div>
                          
                          {selectedCategory.categories && (
                            <div className="mt-3 sm:mt-2">
                              <span className="text-sm sm:text-md font-bold text-black">
                                Sub-Categories
                              </span>
                              <div className="flex mt-2 flex-wrap mb-3 sm:mb-5">
                                {product.subCategories
                                  .find((cat: any) => cat.title === selectedCategory.categories)
                                  ?.series?.map((series: any, seriesIndex: number) => (
                                    <div
                                      className={`
                                        border-2 rounded-xl mr-2 sm:mr-4 mt-1 sm:mt-2 px-2 sm:px-4 py-1 flex justify-center items-center hover:cursor-pointer hover:bg-blue-50 transition-colors text-xs sm:text-sm
                                        ${selectedCategory.subCategories === series.title ? "border-blue-500 bg-blue-100" : "border-slate-700"}
                                      `}
                                      key={seriesIndex}
                                      onClick={async () => {
                                        console.log('=== SUB-CATEGORY SELECTION ===');
                                        console.log('Selected sub-category:', series.title);
                                        
                                        const parentCategory = selectedCategory.title;
                                        const is4LevelCategory = parentCategory === 'Hydraulic Adaptors';
                                        
                                        if (is4LevelCategory) {
                                          try {
                                            const response = await axios.post('/api/getAllSeries', {
                                              data: { slug: series.slug }
                                            });
                                            
                                            if (response.data.series && response.data.series.length > 0) {
                                              setLevel3Data(response.data.series);
                                            } else {
                                              const fallbackResponse = await axios.post('/api/getProducts', {
                                                data: { id: series.id }
                                              });
                                              
                                              if (fallbackResponse.data.series && fallbackResponse.data.series.length > 0) {
                                                setLevel3Data(fallbackResponse.data.series);
                                              }
                                            }
                                          } catch (error) {
                                            console.error('Error fetching Level 3 data:', error);
                                            setLevel3Data([]);
                                          }
                                          
                                          setSelectedCategory({
                                            ...selectedCategory,
                                            subCategories: series.title,
                                            subSubCategories: null,
                                            finalProducts: null
                                          });
                                        } else {
                                          if (series.id) {
                                            router.push(`/products/${series.id}`);
                                          }
                                        }
                                      }}
                                    >
                                      {series.title}
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}
                          
                          {selectedCategory.subCategories && level3Data.length > 0 && (
                            <div className="mt-3 sm:mt-2">
                              <span className="text-sm sm:text-md font-bold text-black">
                                Product Types
                              </span>
                              <div className="flex mt-2 flex-wrap mb-3 sm:mb-5">
                                {level3Data.map((level3Item: any, level3Index: number) => (
                                  <div
                                    className={`
                                      border-2 rounded-xl mr-2 sm:mr-4 mt-1 sm:mt-2 px-2 sm:px-4 py-1 flex justify-center items-center hover:cursor-pointer hover:bg-blue-50 transition-colors text-xs sm:text-sm
                                      ${selectedCategory.subSubCategories === level3Item.title ? "border-green-500 bg-green-100" : "border-slate-700"}
                                    `}
                                    key={level3Index}
                                    onClick={() => {
                                      if (level3Item.id) {
                                        router.push(`/products/${level3Item.id}`);
                                      }
                                    }}
                                  >
                                    {level3Item.title}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {selectedCategory.subCategories && level3Data.length === 0 && (
                            <div className="mt-3 sm:mt-2">
                              <span className="text-sm sm:text-md font-bold text-black">
                                Product Types
                              </span>
                              <div className="flex mt-2 flex-wrap mb-3 sm:mb-5">
                                <div className="text-xs sm:text-sm text-gray-500">
                                  Loading product types...
                                </div>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      </AnimatePresence>
                    )}
                  </div>
                ))}
                
                {wordSearchQuery && filteredProducts.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-gray-500 mb-4">
                      <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-lg font-medium">No categories found matching &quot;{wordSearchQuery}&quot;</p>
                      <p className="text-sm mt-2">Try different keywords or clear the search</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full p-4 sm:p-5 sm:px-8 rounded-md shadow-lg hover:shadow-xl transition duration-200">
            <div className="flex flex-col items-center gap-4 sm:gap-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 text-center px-2">
                Search by Part Number
              </h2>
              
              <div className="w-full max-w-sm sm:max-w-lg md:max-w-2xl px-1 sm:px-2 md:px-0">
                <div className="relative">
                  <div className="flex items-stretch w-full border-2 border-yellow-400 rounded-xl bg-white shadow-md focus-within:shadow-lg transition-shadow duration-200 overflow-hidden">
                    <div className="px-3 sm:px-4 py-3 bg-yellow-100 text-gray-700 font-medium border-r border-yellow-300 text-sm sm:text-base flex items-center justify-center min-w-[60px] sm:min-w-[80px]">
                      FPG-
                    </div>
                    <input
                      type="text"
                      value={partSearchQuery}
                      onChange={(e) => setPartSearchQuery(e.target.value)}
                      placeholder="Enter part number (e.g., SSTI, 2J9)"
                      className="
                        flex-1 min-w-0 px-3 sm:px-4 py-3 focus:outline-none
                        text-gray-800 text-sm sm:text-base
                        placeholder:text-gray-400 placeholder:text-xs sm:placeholder:text-sm
                      "
                    />
                  </div>
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-500"></div>
                    </div>
                  )}
                </div>
                
                <p className="text-xs sm:text-sm text-gray-500 mt-3 text-center leading-relaxed px-2">
                  Type part number without <span className="font-medium">&quot;FPG-&quot;</span> prefix. 
                  <br className="sm:hidden" />
                  <span className="hidden sm:inline"> </span>Results will appear as you type.
                </p>
              </div>
              
              {partSearchQuery && (
                <div className="w-full text-center px-2">
                  {partSearchResults.length > 0 ? (
                    <div className="text-xs sm:text-sm text-gray-600 mb-4 bg-green-50 p-2 sm:p-3 rounded-lg border border-green-200">
                      <span className="font-medium text-green-700">
                        Found {partSearchResults.length} product{partSearchResults.length !== 1 ? 's' : ''}
                      </span>
                      <br />
                      matching <span className="font-mono bg-green-100 px-1 py-0.5 rounded text-green-800">&quot;FPG-{partSearchQuery}&quot;</span>
                    </div>
                  ) : (
                    !isSearching && (
                      <div className="text-xs sm:text-sm text-gray-500 mb-4 bg-gray-50 p-2 sm:p-3 rounded-lg border border-gray-200">
                        No products found matching <span className="font-mono bg-gray-100 px-1 py-0.5 rounded">&quot;FPG-{partSearchQuery}&quot;</span>
                        <br />
                        <span className="text-blue-600 mt-1 inline-block">Try Quick Search instead.</span>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="text-xs sm:text-sm text-gray-500 text-center px-2">
          {searchMode === 'quick' ? (
            <>
              <span className="block sm:inline">Loaded {data.length} product categories</span>
              {filteredData.length > 0 && (
                <>
                  <span className="hidden sm:inline"> • </span>
                  <span className="block sm:inline">Found {filteredData.length} results</span>
                </>
              )}
            </>
          ) : (
            partSearchQuery && (
              <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                Searching for &quot;FPG-{partSearchQuery}&quot;
              </span>
            )
          )}
        </div>
      </div>
      
      <motion.div className="p-4 sm:p-6 md:p-10">
        <GridProducts
          seriesList={searchMode === 'quick' ? filteredData : partSearchResults}
          showDescription={Boolean(false)}
        />
      </motion.div>
    </div>
  );
};

export default Search;