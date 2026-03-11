import withLayout from "@/hoc/withLayout";
import { ProductSlider } from "@/views/Catalogue";
import React from "react";
import useSWR from 'swr';
import axios from "axios";
import { Category } from "types/products";
import Loading from "@/modules/Loading";
import Head from 'next/head';

// Fetcher function for SWR
const fetcher = async (url: string) => {
  const response = await axios.get(url);
  return response.data;
};

const CataloguePage = () => {
  // SWR handles all the data fetching, caching, and revalidation
  const { data, error, isLoading } = useSWR('/api/getCategories', fetcher, {
    // SWR configuration options
    revalidateOnFocus: false,    // Don't refetch when window regains focus
    revalidateOnReconnect: true, // Refetch when connection is restored
    dedupingInterval: 60000,     // Dedupe requests within 1 minute
    errorRetryCount: 3,          // Retry 3 times on error
    errorRetryInterval: 1000,    // Wait 1 second between retries
  });

  // Handle loading state
  if (isLoading) {
    return <Loading />;
  }

  // Handle error state
  if (error) {
    console.error('Error fetching categories:', error);
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
  if (!data || !data.categories || data.categories.length === 0) {
    return (
      <div className="wrapper px-8 md:px-12 py-12 min-h-screen flex flex-col items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">No Categories Found</h2>
          <p className="text-gray-600">No product categories are available at the moment.</p>
        </div>
      </div>
    );
  }

  const categories: Category[] = data.categories;

  return (
    <>
      <Head>
        <title>Products | FluidPower Group</title>
        <meta name="description" content="Browse our full range of hydraulic hoses, steel tubes, fittings, adaptors, valves, quick couplings and accessories. Quality hydraulic products Australia-wide." />
      </Head>
    <div className="wrapper px-8 md:px-12  flex flex-col gap-10 mb-32">
            <div className="flex flex-col gap-4 p-8 pt-16">
              <div className="text-[4rem] md:text-[6rem] lg:text-[8rem] xl:text-[10rem] font-semibold text-slate-200/50 ">
               Products
              </div>
             <div className="flex flex-col gap-12">
        {categories.map((category: Category, i) => (
          <ProductSlider
            products={category.subCategories}
            title={category.title}
            btn={{
              title: "View All",
              href: `/products?category=${category.slug}`,
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

export default CataloguePage;