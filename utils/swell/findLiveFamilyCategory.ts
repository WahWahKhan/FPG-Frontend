// /utils/swell/findLiveFamilyCategory.ts
//
// Automatic handling for DELETED products.
//
// The catalogue changes often: obsolete products get deleted in Swell. Once
// deleted there is no data left to say where they used to live, so the only
// signal available is the slug itself. Product slugs follow a convention —
//   <family>-fpg-<code>      e.g. hydraulic-valves-fpg-gdv60
// — so a deleted `hydraulic-valves-fpg-gdv60` can be sent to the still-live
// `hydraulic-valves` family page instead of a dead end. That is a better
// landing for a visitor with an old bookmark/email/PDF/Google result, and it
// tidies the "Not found (404)" report in Search Console.
//
// Back-tested 2026-10-20 against all 134 live products that follow the
// convention (pretending each was deleted, with its true parent known):
// 114 resolved to the true parent or an ancestor, 5 to a closely related
// sibling family, 0 to anything unrelated, 15 stayed a clean 404 (ambiguous).
//
// DELIBERATELY CONSERVATIVE — when unsure it returns null and the caller
// serves a normal 404, which is the correct response for a page that is gone:
//   * requires the "-fpg-" marker, so junk/typo URLs never redirect;
//   * the family must EQUAL a live category slug, or be the end of exactly ONE
//     live category slug (several candidates = ambiguous = no redirect);
//   * the hidden "Build My Hose" branch is NEVER a candidate target, so a
//     deleted hidden item can't redirect Google onto (or reveal) a hidden page.

import { fetchCategories } from 'utils/swell/fetchCategories';
import { HIDDEN_ROOT_SLUG } from 'utils/swell/fetchSeriesDetails';

const PRODUCT_CODE_MARKER = '-fpg-';

// Every publicly visible category slug, with the hidden branch pruned whole —
// same rule pages/api/sitemap.xml.ts uses, kept in step via HIDDEN_ROOT_SLUG.
const collectVisibleSlugs = (nodes: any[], out: string[] = []): string[] => {
  for (const node of nodes) {
    if (node.slug === HIDDEN_ROOT_SLUG) continue;
    out.push(node.slug);
    if (node.subCategories && node.subCategories.length > 0) {
      collectVisibleSlugs(node.subCategories, out);
    }
  }
  return out;
};

// Pure and exported so the matching rules can be tested without a network.
export const pickFamilySlug = (missingSlug: string, visibleSlugs: string[]): string | null => {
  const slug = missingSlug.toLowerCase();
  const markerAt = slug.indexOf(PRODUCT_CODE_MARKER);
  if (markerAt <= 0) return null;

  const family = slug.slice(0, markerAt);
  if (visibleSlugs.includes(family)) return family;

  // Child categories are slugged "<parent>-<name>" while their products use
  // just "<name>" (jic-crimp-fittings-fpg-* lives under
  // crimp-fittings-jic-crimp-fittings), so also accept a UNIQUE suffix match.
  const suffixMatches = visibleSlugs.filter((s) => s.endsWith(`-${family}`));
  return suffixMatches.length === 1 ? suffixMatches[0] : null;
};

// Any failure (Swell down, malformed tree) returns null so the caller falls
// back to a plain 404 — this must never be the reason a page errors.
export const findLiveFamilyCategorySlug = async (missingSlug: string): Promise<string | null> => {
  try {
    const tree = await fetchCategories(); // cached 5 min in taxonomyCache
    return pickFamilySlug(missingSlug, collectVisibleSlugs(tree));
  } catch (err: any) {
    console.error('findLiveFamilyCategorySlug error:', err?.message);
    return null;
  }
};
