// /pages/products/[id].tsx
// SSR conversion: getServerSideProps added at bottom
// Data fetching useEffect removed — products/series now arrive as props, fully rendered for Googlebot
// Scroll useEffect kept — client-side UX only, not data fetching
// useState for items/subcategories kept — required for cart quantity interactions
// fetchProducts and fetchSeriesDetails imported from new utilities
// getProducts.ts and getSeriesDetails.ts API routes remain completely untouched

import {
  DescriptionProduct,
  ImageProduct,
  OrderSummaryProduct,
  TableProduct,
} from '@/views/Product';
import { GridProducts } from '@/views/Products';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import { IItemCart } from 'types/cart';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import { fetchProducts } from 'utils/swell/fetchProducts';
import { fetchSeriesDetails, ISeries } from 'utils/swell/fetchSeriesDetails';
import { sortProductsAlphanumerically } from '../../utils/productSorting';

interface ProductPageProps {
  initialItems: IItemCart[];
  initialSubcategories: any[];
  series: ISeries | null;
}

const ProductPage = ({ initialItems, initialSubcategories, series }: ProductPageProps) => {
  const router = useRouter();
  const id = router.query.id;

  // items needs useState — user can change quantities for cart interactions
  // Reset items whenever the page id changes (new product page navigation)
  const [items, setItems] = useState<IItemCart[]>(initialItems);
  useEffect(() => {
    setItems(initialItems);
  }, [id, initialItems]);

  // Keep scroll UX — purely client-side, unrelated to data fetching
  useEffect(() => {
    if (router.isReady && id) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [id, router.isReady]);

  // If series failed to load server-side, show a clean error
  if (!series) {
    return (
      <div className="wrapper px-8 md:px-12 py-12 min-h-screen flex flex-col items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Category Not Found</h2>
          <p className="text-gray-600">This category could not be loaded. Please try again.</p>
        </div>
      </div>
    );
  }

  // If we have subcategories, show them in a grid
  if (initialSubcategories.length > 0) {
    return (
      <div className="pt-10 pb-12 lg:pt-14 lg:pb-20 flex flex-col gap-10 sm:gap-16">
        <div className="wrapper px-8 md:px-12">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">{series?.name}</h1>
            {series?.description && (
              <div
                className="text-gray-600 mt-2"
                dangerouslySetInnerHTML={{ __html: series.description }}
              />
            )}
          </div>
          <GridProducts
            seriesList={initialSubcategories}
            showDescription={true}
          />
        </div>
      </div>
    );
  }
  const plainDescription = series.description ? series.description.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : '';
  
  // Default: show products in table format
  return (
    <div className="pt-10 pb-12 lg:pt-14 lg:pb-20 flex flex-col gap-10 sm:gap-16">
      <Head>
        <title>{series.name} | FluidPower Group</title>
        <meta name="description" content={`Buy ${series.name} hydraulic products from FluidPower Group. Available online with Australia-wide delivery.`} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ItemList",
              "name": series.name,
              "description": plainDescription,
              "url": `https://www.fluidpowergroup.com.au/products/${id}`,
              "numberOfItems": items.length,
              "itemListElement": items
                .filter(item => item.price && item.price > 0)
                .map((item, index) => ({
                  "@type": "ListItem",
                  "position": index + 1,
                  "item": {
                    "@type": "Product",
                    "name": item.name,
                    "mpn": item.name,
                    "image": series.images[0] || "",
                    "description": plainDescription,
                    "brand": {
                      "@type": "Brand",
                      "name": "FluidPower Group"
                    },
                    "offers": {
                      "@type": "Offer",
                      "priceCurrency": "AUD",
                      "price": item.price,
                      "availability": (item.stock ?? 0) > 0
                        ? "https://schema.org/InStock"
                        : "https://schema.org/OutOfStock",
                      "seller": {
                        "@type": "Organization",
                        "name": "FluidPower Group"
                      }
                    }
                  }
                }))
            })
          }}
        />
      </Head>
      <div className="max-w-2xl lg:max-w-full w-full mx-auto mb-4">
        <div className="grid grid-cols-12 h-full space-y-6 lg:space-y-0 space-x-0 lg:space-x-6 mx-auto wrapper px-8 md:px-12 overflow-hidden">
          <ImageProduct images={series.images} />
          <DescriptionProduct items={items[0]} series={series} />
        </div>
      </div>
      {items.length !== 0 && <TableProduct items={items} setItems={setItems} />}
      <div className="max-w-2xl lg:max-w-full w-full mx-auto">
        <OrderSummaryProduct
          items={items}
          series={series}
          handleClear={() =>
            setItems(items.map((item) => ({ ...item, quantity: 0 })))
          }
        />
      </div>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params as { id: string };

  try {
    // Run both Swell calls in parallel — same data, just fetched server-side now
    const [productResult, series] = await Promise.all([
      fetchProducts(id),
      fetchSeriesDetails(id)
    ]);

    // Apply same sorting as before — just moved server-side
    const initialItems = productResult.products.length > 0
      ? sortProductsAlphanumerically(productResult.products)
      : [];

    const initialSubcategories = productResult.series.length > 0
      ? sortProductsAlphanumerically(productResult.series)
      : [];

    return {
      props: {
        initialItems,
        initialSubcategories,
        series
      }
    };
  } catch (err: any) {
    console.error('getServerSideProps error in [id].tsx:', err);

    return {
      props: {
        initialItems: [],
        initialSubcategories: [],
        series: null
      }
    };
  }
};

export default ProductPage;