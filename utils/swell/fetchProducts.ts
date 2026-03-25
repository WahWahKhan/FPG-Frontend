// /utils/swell/fetchProducts.ts
// Extracted from /pages/api/getProducts.ts
// Used by both the API route and getServerSideProps in [id].tsx and [slug].tsx
// DO NOT modify getProducts.ts — it remains intact and still handles API requests

import swell from "utils/swell/swellinit";

const transformTitle = (fullTitle: string) => {
  if (fullTitle.includes('4-Wire Braided Hose') && fullTitle.includes('EN 857 R4')) {
    return { shortTitle: '4-Wire Braided Hose', subtitle: 'EN 857 R4' };
  }
  if (fullTitle.includes('1-Wire Braided Hose') && fullTitle.includes('1SC EN 857')) {
    return { shortTitle: '1-Wire Braided Hose', subtitle: '1SC EN 857' };
  }
  if (fullTitle.includes('2-Wire Braided Hose') && (fullTitle.includes('2SC EN 857') || fullTitle.includes('EN 857'))) {
    return { shortTitle: '2-Wire Braided Hose', subtitle: '2SC EN 857' };
  }
  if (fullTitle.includes('Suction Hose') && !fullTitle.includes('(')) {
    return { shortTitle: 'Suction Hose', subtitle: '' };
  }
  if (fullTitle.includes('Balancing Valves')) {
    return { shortTitle: 'Balancing Valves', subtitle: '' };
  }
  if (fullTitle.includes('Flow Control Valves')) {
    return { shortTitle: 'Flow Control Valves', subtitle: '' };
  }
  if (fullTitle.includes('In-Line Valves')) {
    return { shortTitle: 'In-Line Valves', subtitle: '' };
  }
  if (fullTitle.includes('Solenoid Diverter Valves')) {
    return { shortTitle: 'Solenoid Diverter Valves', subtitle: '' };
  }
  if (fullTitle.includes('Hydraulic Accumulators')) {
    return { shortTitle: 'Hydraulic Accumulators', subtitle: '' };
  }
  if (fullTitle.includes('Directional Control Valves')) {
    return { shortTitle: 'Directional Control Valves', subtitle: '' };
  }
  if (fullTitle.includes('Ball Valves')) {
    return { shortTitle: 'Ball Valves', subtitle: '' };
  }
  if (fullTitle.includes('Live Third Function')) {
    return { shortTitle: 'Live Third Function', subtitle: '' };
  }
  if (fullTitle.includes('Hydraulic Soft Ride Functions')) {
    return { shortTitle: 'Hydraulic Soft Ride Functions', subtitle: '' };
  }
  if (fullTitle.includes('Hydraulic 3rd & 4th Functions')) {
    return { shortTitle: 'Hydraulic 3rd & 4th Functions', subtitle: '' };
  }
  if (fullTitle.includes('Hydraulic 3rd Functions')) {
    return { shortTitle: 'Hydraulic 3rd Functions', subtitle: '' };
  }
  if (fullTitle.includes('JIC') && fullTitle.includes('Joint Industrial Council')) {
    return { shortTitle: 'JIC', subtitle: '(Joint Industrial Council)' };
  }
  if (fullTitle.includes('BSP') && fullTitle.includes('British Standard Pipe')) {
    return { shortTitle: 'BSP', subtitle: '(British Standard Pipe)' };
  }
  if (fullTitle.includes('ORFS') && (fullTitle.includes('ORing Flat Seal') || fullTitle.includes('O-Ring Flat Seal'))) {
    return { shortTitle: 'ORFS', subtitle: '(O-Ring Flat Seal)' };
  }
  if (fullTitle.includes('Metric Light')) {
    return { shortTitle: 'Metric Light', subtitle: '' };
  }
  if (fullTitle.includes('Ferrules')) {
    return { shortTitle: 'Ferrules', subtitle: '' };
  }

  const parenthesesMatch = fullTitle.match(/^([^(]+)\s*\((.+)\)$/);
  if (parenthesesMatch) {
    const beforeParens = parenthesesMatch[1].trim();
    const insideParens = parenthesesMatch[2].trim();
    if (beforeParens.length <= 10 && beforeParens.match(/^[A-Z0-9\s-&]+$/)) {
      return { shortTitle: beforeParens, subtitle: `(${insideParens})` };
    }
  }

  return { shortTitle: fullTitle, subtitle: '' };
};

export type FetchProductsResult = {
  products: any[];
  series: any[];
};

// Fetch by UUID — used by [id].tsx (unchanged behaviour)
export const fetchProducts = async (categoryId: string): Promise<FetchProductsResult> => {
  try {
    const maxItems = 200;
    let currentPage = 1;
    const all: any[] = [];

    while (all.length < maxItems) {
      const resp: any = await swell.get("/products", {
        limit: Math.min(50, maxItems - all.length),
        page: currentPage,
        where: { "category_index.id": { $in: [categoryId] } },
        expand: all.length === 0 ? ["variants:50"] : [],
      });

      if (!resp.results || resp.results.length === 0) break;

      all.push(...resp.results);

      if (!resp.pages?.next || all.length >= maxItems) break;
      currentPage++;

      await new Promise(resolve => setTimeout(resolve, 10));
    }

    if (all.length > 0) {
      const sortedProducts = all.sort((a: any, b: any) =>
        Number(new Date(a.date_created)) - Number(new Date(b.date_created))
      );

      const productList = sortedProducts.map((product: any) => {
        const { shortTitle, subtitle } = transformTitle(product.name);
        return {
          id: product.id,
          name: product.name,
          shortTitle,
          subtitle,
          price: product.price,
          stock: product.stock_level || 0,
          attributes: product.attributes,
          description: product.description,
          quantity: 0
        };
      });

      return { products: productList, series: [] };
    }

    // No products — check for subcategories instead
    const subcategoriesResp = await Promise.race([
      swell.get('/categories', { where: { parent_id: categoryId } }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Subcategories timeout')), 10000)
      )
    ]);

    if (subcategoriesResp.results && subcategoriesResp.results.length > 0) {
      const seriesData = subcategoriesResp.results.map((sub: any) => {
        const { shortTitle, subtitle } = transformTitle(sub.name);
        return {
          id: sub.id,
          title: sub.name,
          shortTitle,
          subtitle,
          slug: sub.slug,
          description: sub.description,
          image: Array.isArray(sub.images) && sub.images[0]
            ? sub.images[0].file.url
            : "https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80"
        };
      });

      return { products: [], series: seriesData };
    }

    return { products: [], series: [] };

  } catch (err: any) {
    console.error('fetchProducts error:', err.message);
    return { products: [], series: [] };
  }
};

// Fetch by slug — used by [slug].tsx
// Resolves slug → UUID via Swell, then delegates to fetchProducts()
// Defensive: returns null if slug not found so [slug].tsx can return 404
export const fetchProductsBySlug = async (slug: string): Promise<FetchProductsResult | null> => {
  try {
    const response = await swell.get('/categories', {
      where: { slug },
      limit: 1
    });

    const category = response?.results?.[0];
    if (!category) return null;

    return fetchProducts(category.id);
  } catch (err: any) {
    console.error('fetchProductsBySlug error:', err.message);
    return null;
  }
};