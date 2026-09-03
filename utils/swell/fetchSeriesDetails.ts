// /utils/swell/fetchSeriesDetails.ts
// Extracted from /pages/api/getSeriesDetails.ts
// Used by both the API route and getServerSideProps in [id].tsx and [slug].tsx
// DO NOT modify getSeriesDetails.ts — it remains intact and still handles API requests

import swell from "utils/swell/swellinit";
import { getCached, setCached } from "utils/swell/taxonomyCache";

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
  const cacheKey = `series:id:${id}`;
  const cached = getCached<ISeries>(cacheKey);
  if (cached) return cached;

  try {
    const series = await swell.get('/categories/{id}', { id });
    if (series !== null) {
      const mapped = mapSwellCategory(series);
      setCached(cacheKey, mapped);
      return mapped;
    }
    return null;
  } catch (err: any) {
    console.error('fetchSeriesDetails error:', err.message);
    return null;
  }
};

// Fetch by slug — used by [slug].tsx
// Defensive: takes first result (audit confirmed no duplicates, but guard anyway)
export const fetchSeriesDetailsBySlug = async (slug: string): Promise<ISeries | null> => {
  const cacheKey = `series:slug:${slug}`;
  const cached = getCached<ISeries>(cacheKey);
  if (cached) return cached;

  try {
    const response = await swell.get('/categories', {
      where: { slug },
      limit: 1
    });

    const result = response?.results?.[0];
    if (!result) return null;

    const mapped = mapSwellCategory(result);
    setCached(cacheKey, mapped);
    setCached(`series:id:${mapped.id}`, mapped); // shares cache with fetchSeriesDetails/fetchBreadcrumbs
    return mapped;
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

// Slug of the hidden "Build My Hose" parent category. Everything nested beneath
// this (supplier/developer-only products) must be kept out of Google's index.
export const HIDDEN_ROOT_SLUG = 'hydraulic-hoses-custom-hose-assembly';

// Walk the full parent chain (uncapped beyond a generous safety limit) to decide
// whether a category is the hidden root or a descendant of it. Short-circuits the
// moment the hidden ancestor is found, so normal public pages stop quickly at the
// root. Kept separate from fetchBreadcrumbs so the breadcrumb depth cap and its
// per-level API cost are unaffected for normal pages.
export const isUnderHiddenRoot = async (series: ISeries): Promise<boolean> => {
  // The page itself is the hidden root
  if (series.slug === HIDDEN_ROOT_SLUG) return true;

  const SAFETY_LIMIT = 10;
  let parentId = series.parent_id;
  let depth = 0;

  while (parentId && depth < SAFETY_LIMIT) {
    const parent = await fetchSeriesDetails(parentId);
    if (!parent) break;

    if (parent.slug === HIDDEN_ROOT_SLUG) return true;

    parentId = parent.parent_id;
    depth++;
  }

  return false;
};

export type ISiblingCategory = {
  id: string;
  slug: string;
  name: string;
};

// Other categories sharing the same parent — used for the "Related categories"
// row (sideways internal linking, SEO Fix Plan 2 Phase 3.3). Excludes the
// current category and the hidden "Build My Hose" root/its children.
export const fetchSiblingCategories = async (series: ISeries, limit = 6): Promise<ISiblingCategory[]> => {
  if (!series.parent_id) return [];

  const cacheKey = `siblings:${series.parent_id}`;
  let siblings = getCached<ISiblingCategory[]>(cacheKey);

  if (!siblings) {
    try {
      const response = await swell.get('/categories', { where: { parent_id: series.parent_id }, limit: 50 });
      siblings = (response?.results || [])
        .filter((c: any) => c.slug !== HIDDEN_ROOT_SLUG)
        .map((c: any) => ({ id: c.id, slug: c.slug, name: c.name }));
      setCached(cacheKey, siblings);
    } catch (err: any) {
      console.error('fetchSiblingCategories error:', err.message);
      return [];
    }
  }

  return (siblings ?? []).filter((s) => s.id !== series.id).slice(0, limit);
};

export const fetchBreadcrumbs = async (series: ISeries): Promise<IBreadcrumb[]> => {
  const crumbs: IBreadcrumb[] = [];
  const MAX_DEPTH = 5;

  // Start with the current category
  crumbs.unshift({ name: series.name, slug: series.slug, id: series.id });

  let parentId = series.parent_id;
  let depth = 0;

  while (parentId && depth < MAX_DEPTH) {
    const parent = await fetchSeriesDetails(parentId);
    if (!parent) break;

    crumbs.unshift({ name: parent.name, slug: parent.slug, id: parent.id });
    parentId = parent.parent_id;
    depth++;
  }

  return crumbs;
};