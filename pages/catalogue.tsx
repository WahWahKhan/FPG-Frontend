// /pages/catalogue.tsx
// Static + ISR: getStaticProps (revalidate 300s) at bottom — was getServerSideProps
// SWR and axios removed — data now arrives as props, fully rendered for Googlebot
// fetchCategories imported from new utility — getCategories.ts API route untouched

import withLayout from "@/hoc/withLayout";
import { ProductSlider } from "@/views/Catalogue";
import React from "react";
import { Category } from "types/products";
import Head from 'next/head';
import { GetStaticProps } from 'next';
import { fetchCategories } from 'utils/swell/fetchCategories';

interface CataloguePageProps {
  categories: Category[];
  error?: string;
}

const CataloguePage = ({ categories, error }: CataloguePageProps) => {

  // Handle error state
  if (error) {
    return (
      <div className="wrapper px-8 md:px-12 py-12 min-h-screen flex flex-col items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Categories</h2>
          <p className="text-gray-600 mb-4">Failed to load product categories. Please try again.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  // Handle empty data
  if (!categories || categories.length === 0) {
    return (
      <div className="wrapper px-8 md:px-12 py-12 min-h-screen flex flex-col items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">No Categories Found</h2>
          <p className="text-gray-600">No product categories are available at the moment.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Products | FluidPower Group</title>
        <meta name="description" content="Browse our full range of hydraulic hoses, steel tubes, fittings, adaptors, valves, quick couplings and accessories. Quality hydraulic products Australia-wide." />
      </Head>
      {/* Phones: 16px total side margin (was 32px wrapper + 32px inner = 64px,
          which left the carousel only ~1 tile wide with no room to show the
          neighbouring tiles). md and up unchanged. */}
      <div className="wrapper px-4 md:px-12 flex flex-col gap-10 mb-32">
        <div className="flex flex-col gap-4 px-0 pb-8 pt-16 md:p-8 md:pt-16">
          <h1 className="text-[4rem] md:text-[6rem] lg:text-[8rem] xl:text-[10rem] font-semibold text-slate-200/50">
            Products
          </h1>
          <div className="flex flex-col gap-12">
            {categories.map((category: Category, i) => (
              <ProductSlider
                products={category.subCategories}
                title={category.title}
                btn={{
                  title: "View All",
                  href: `/products/${category.slug}`,
                }}
                key={i}
                description={category.description}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

// ISR instead of getServerSideProps: the page is pre-built and served from
// Vercel's CDN, then regenerated in the background at most every 5 minutes.
// With gSSP every visit (and every client-side click, via /_next/data) waited
// on a cold serverless function + Swell round-trip — measured 3s on a cold
// start, never cached. Googlebot still gets fully rendered HTML either way.
const REVALIDATE_SECONDS = 300;

export const getStaticProps: GetStaticProps = async () => {
  try {
    const categories = await fetchCategories();

    return {
      props: {
        categories
      },
      revalidate: REVALIDATE_SECONDS
    };
  } catch (err: any) {
    console.error('getStaticProps error in catalogue.tsx:', err);

    // During a background regeneration, throwing makes Next keep serving the
    // last good version instead of replacing it with the error page.
    if (process.env.NEXT_PHASE !== 'phase-production-build') {
      throw err;
    }

    // At build time there's no previous version to fall back on, and throwing
    // would fail the whole deploy — ship the error page and retry in a minute.
    return {
      props: {
        categories: [],
        error: 'Failed to load categories'
      },
      revalidate: 60
    };
  }
};

export default CataloguePage;