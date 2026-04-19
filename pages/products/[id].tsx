// /pages/products/[id].tsx
// SSR conversion: getServerSideProps added at bottom
// Data fetching useEffect removed — products/series now arrive as props, fully rendered for Googlebot
// Scroll useEffect kept — client-side UX only, not data fetching
// useState for items/subcategories kept — required for cart quantity interactions
// fetchProducts and fetchSeriesDetails imported from new utilities
// getProducts.ts and getSeriesDetails.ts API routes remain completely untouched
// Breadcrumbs (visual + schema) added — built server-side via fetchBreadcrumbs()

import {
  DescriptionProduct,
  ImageProduct,
  OrderSummaryProduct,
  TableProduct,
} from '@/views/Product';
import { GridProducts } from '@/views/Products';
import { useEffect, useState } from 'react';
import Head from 'next/head';

// ─── Adjust this to change how many lines show before "Read more" ──────────
const CATEGORY_DESCRIPTION_LINE_CLAMP = 3;
// ───────────────────────────────────────────────────────────────────────────
import Link from 'next/link';
import { IItemCart } from 'types/cart';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import { fetchProducts, fetchProductsBySlug } from 'utils/swell/fetchProducts';
import { fetchSeriesDetails, fetchSeriesDetailsBySlug, fetchBreadcrumbs, ISeries, IBreadcrumb } from 'utils/swell/fetchSeriesDetails';
import { sortProductsAlphanumerically } from '../../utils/productSorting';

interface ProductPageProps {
  initialItems: IItemCart[];
  initialSubcategories: any[];
  series: ISeries | null;
  breadcrumbs: IBreadcrumb[];
}

// ---------------------------------------------------------------------------
// Breadcrumb visual component — shared shape with [slug].tsx
// ---------------------------------------------------------------------------
const Breadcrumbs = ({ crumbs }: { crumbs: IBreadcrumb[] }) => {
  if (crumbs.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="wrapper px-8 md:px-12 pt-28 pb-2">
      <ol className="flex flex-wrap items-center gap-1 text-gray-500" style={{ fontSize: "1.125rem" }}>
        <li>
          <Link href="/catalogue">
            <a className="hover:text-gray-800 transition-colors duration-150">Products</a>
          </Link>
        </li>

        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <li key={crumb.id} className="flex items-center gap-1">
              <span className="text-gray-300 select-none" aria-hidden="true">›</span>
              {isLast ? (
                <span className="font-medium text-gray-800" aria-current="page">
                  {crumb.name}
                </span>
              ) : (
                <Link href={`/products/${crumb.slug}`}>
                  <a className="hover:text-gray-800 transition-colors duration-150">
                    {crumb.name}
                  </a>
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

// ---------------------------------------------------------------------------
// BreadcrumbList schema.org JSON-LD
// ---------------------------------------------------------------------------
const buildBreadcrumbSchema = (crumbs: IBreadcrumb[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Products",
      "item": "https://www.fluidpowergroup.com.au/catalogue"
    },
    ...crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      "position": index + 2,
      "name": crumb.name,
      "item": `https://www.fluidpowergroup.com.au/products/${crumb.slug}`
    }))
  ]
});

// ---------------------------------------------------------------------------
// CategoryDescription — clamped with Read more / Read less (desktop only)
// ---------------------------------------------------------------------------
const CategoryDescription = ({ description }: { description: string }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mt-2 flex flex-col items-center">
      <div
        className="text-gray-600 text-center w-full"
        style={{
          maxWidth: '680px',
          textAlign: 'justify',
          ...(!expanded ? {
            display: '-webkit-box',
            WebkitLineClamp: CATEGORY_DESCRIPTION_LINE_CLAMP,
            WebkitBoxOrient: 'vertical' as const,
            overflow: 'hidden',
          } : {})
        }}
        dangerouslySetInnerHTML={{ __html: description }}
      />
      <button
        onClick={() => setExpanded(!expanded)}
        className="mt-1 text-sm font-bold text-gray-900 underline underline-offset-2 bg-transparent border-none p-0 cursor-pointer focus:outline-none"
        style={{ WebkitTapHighlightColor: 'transparent', outline: 'none' }}
      >
        {expanded ? 'Read less' : 'Read more'}
      </button>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------
const ProductPage = ({ initialItems, initialSubcategories, series, breadcrumbs }: ProductPageProps) => {
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
      <div className="pt-4 pb-12 lg:pt-6 lg:pb-20 flex flex-col gap-4 sm:gap-8">
        <Head>
          <title>{series.name} | FluidPower Group</title>
          <link rel="canonical" href={`https://www.fluidpowergroup.com.au/products/${series.slug}`} />
          <meta name="description" content={`Browse ${series.name} hydraulic products from FluidPower Group. Available online with Australia-wide delivery.`} />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(buildBreadcrumbSchema(breadcrumbs)) }}
          />
        </Head>

        <Breadcrumbs crumbs={breadcrumbs} />

        <div className="wrapper px-8 md:px-12">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">{series?.name}</h1>
            {series?.description && (
              <CategoryDescription description={series.description} />
            )}
          </div>
          <GridProducts
            seriesList={initialSubcategories}
            showDescription={series.slug !== 'jic-adapters'}
          />
        </div>
      </div>
    );
  }

  const plainDescription = series.description ? series.description.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : '';

  // Default: show products in table format
  return (
    <div className="pt-4 pb-12 lg:pt-6 lg:pb-20 flex flex-col gap-10 sm:gap-16">
      <Head>
        <title>{series.name} | FluidPower Group</title>
          <link rel="canonical" href={`https://www.fluidpowergroup.com.au/products/${series.slug}`} />
        <meta name="description" content={`Buy ${series.name} hydraulic products from FluidPower Group. Available online with Australia-wide delivery.`} />

        {/* BreadcrumbList schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(buildBreadcrumbSchema(breadcrumbs)) }}
        />

        {/* ItemList + Product schema — unchanged from original */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ItemList",
              "name": series.name,
              "description": plainDescription,
              "url": `https://www.fluidpowergroup.com.au/products/${series.slug}`,
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

      <Breadcrumbs crumbs={breadcrumbs} />

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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Matches standard UUID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
// Also matches MongoDB ObjectID: 24-character hex string (e.g. 634c0ba595e16400126463b2)
// Both are used by Swell — UUIDs for some resources, ObjectIDs for others
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const OBJECT_ID_REGEX = /^[0-9a-f]{24}$/i;

const isUuid = (value: string) => UUID_REGEX.test(value) || OBJECT_ID_REGEX.test(value);

// ---------------------------------------------------------------------------
// getServerSideProps
// ---------------------------------------------------------------------------
export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id: param } = context.params as { id: string };

  try {
    // Detect whether param is a UUID or a human-readable slug and
    // call the appropriate fetch functions accordingly.
    // This lets a single [id].tsx handle both /products/abc123-uuid
    // and /products/orfs-adapters without a second page file.
    const isUuidParam = isUuid(param);

    const [productResult, series] = await Promise.all([
      isUuidParam ? fetchProducts(param) : fetchProductsBySlug(param),
      isUuidParam ? fetchSeriesDetails(param) : fetchSeriesDetailsBySlug(param)
    ]);

    if (!series) {
      return { notFound: true };
    }

    // Breadcrumbs need series to be resolved first — sequential but fast
    const breadcrumbs = await fetchBreadcrumbs(series);

    const initialItems = productResult && productResult.products.length > 0
      ? sortProductsAlphanumerically(productResult.products)
      : [];

    const initialSubcategories = productResult && productResult.series.length > 0
      ? sortProductsAlphanumerically(productResult.series.filter((s: any) => s.slug !== 'hydraulic-hoses-custom-hose-assembly'))
      : [];

    return {
      props: {
        initialItems,
        initialSubcategories,
        series,
        breadcrumbs
      }
    };
  } catch (err: any) {
    console.error('getServerSideProps error in [id].tsx:', err);

    return {
      props: {
        initialItems: [],
        initialSubcategories: [],
        series: null,
        breadcrumbs: []
      }
    };
  }
};

export default ProductPage;