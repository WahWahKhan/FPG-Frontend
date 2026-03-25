// /utils/swell/fetchSeriesDetails.ts
// Extracted from /pages/api/getSeriesDetails.ts
// Used by both the API route and getServerSideProps in [id].tsx and [slug].tsx
// DO NOT modify getSeriesDetails.ts — it remains intact and still handles API requests

import swell from "utils/swell/swellinit";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80";

export type ISeries = {
  id: string;
  slug: string;
  parent_id: string | null;
  name: string;
  description: string;
  images: string[];
};

const mapSwellCategory = (series: any): ISeries => ({
  id: series.id,
  slug: series.slug,
  parent_id: series.parent_id ?? null,
  name: series.name,
  description: series.description ?? "",
  images: Array.isArray(series.images) && series.images.length > 0
    ? series.images.map((image: any) => image.file.url)
    : [FALLBACK_IMAGE]
});

// Fetch by UUID — used by [id].tsx (unchanged behaviour)
export const fetchSeriesDetails = async (id: string): Promise<ISeries | null> => {
  try {
    const series = await swell.get('/categories/{id}', { id });
    if (series !== null) return mapSwellCategory(series);
    return null;
  } catch (err: any) {
    console.error('fetchSeriesDetails error:', err.message);
    return null;
  }
};

// Fetch by slug — used by [slug].tsx
// Defensive: takes first result (audit confirmed no duplicates, but guard anyway)
export const fetchSeriesDetailsBySlug = async (slug: string): Promise<ISeries | null> => {
  try {
    const response = await swell.get('/categories', {
      where: { slug },
      limit: 1
    });

    const result = response?.results?.[0];
    if (!result) return null;

    return mapSwellCategory(result);
  } catch (err: any) {
    console.error('fetchSeriesDetailsBySlug error:', err.message);
    return null;
  }
};

// Build breadcrumb chain by walking parent_id up to root
// Returns ordered array from root → current, e.g. [Home, Hydraulic Adaptors, ORFS, Elbow 90°]
// Capped at 5 levels to guard against bad data
export type IBreadcrumb = {
  name: string;
  slug: string;
  id: string;
};

export const fetchBreadcrumbs = async (series: ISeries): Promise<IBreadcrumb[]> => {
  const crumbs: IBreadcrumb[] = [];
  const MAX_DEPTH = 5;

  // Start with the current category
  crumbs.unshift({ name: series.name, slug: series.slug, id: series.id });

  let parentId = series.parent_id;
  let depth = 0;

  while (parentId && depth < MAX_DEPTH) {
    try {
      const parent = await swell.get('/categories/{id}', { id: parentId });
      if (!parent) break;

      crumbs.unshift({ name: parent.name, slug: parent.slug, id: parent.id });
      parentId = parent.parent_id ?? null;
      depth++;
    } catch {
      break;
    }
  }

  return crumbs;
};