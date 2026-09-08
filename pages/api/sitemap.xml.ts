// /pages/api/sitemap.xml.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { fetchCategories } from 'utils/swell/fetchCategories';

const STATIC_URLS = [
  { loc: 'https://www.fluidpowergroup.com.au/', priority: '1.0', changefreq: 'weekly' },
  { loc: 'https://www.fluidpowergroup.com.au/catalogue', priority: '0.9', changefreq: 'weekly' },
  { loc: 'https://www.fluidpowergroup.com.au/suite360', priority: '0.9', changefreq: 'weekly' },
  { loc: 'https://www.fluidpowergroup.com.au/suite360/hose360', priority: '0.8', changefreq: 'monthly' },
  { loc: 'https://www.fluidpowergroup.com.au/suite360/trac360/start', priority: '0.8', changefreq: 'monthly' },
  { loc: 'https://www.fluidpowergroup.com.au/suite360/function360/start', priority: '0.8', changefreq: 'monthly' },
  { loc: 'https://www.fluidpowergroup.com.au/services', priority: '0.8', changefreq: 'monthly' },
  { loc: 'https://www.fluidpowergroup.com.au/design', priority: '0.7', changefreq: 'monthly' },
  { loc: 'https://www.fluidpowergroup.com.au/about', priority: '0.7', changefreq: 'monthly' },
  { loc: 'https://www.fluidpowergroup.com.au/contact', priority: '0.7', changefreq: 'monthly' },
  { loc: 'https://www.fluidpowergroup.com.au/downloads', priority: '0.7', changefreq: 'monthly' },
  { loc: 'https://www.fluidpowergroup.com.au/privacy-policy', priority: '0.3', changefreq: 'yearly' },
];

// Slug of the hidden "Build My Hose" parent. This branch holds supplier/developer
// -only products and must never appear in the sitemap. Skipping the node here also
// skips its entire subtree, since we stop recursing into its children.
const HIDDEN_ROOT_SLUG = 'hydraulic-hoses-custom-hose-assembly';

// ---------------------------------------------------------------------------
// <lastmod>
// ---------------------------------------------------------------------------
// A page's rendered content is CMS data *plus* the template around it. Swell's
// per-category `date_updated` only moves when someone edits the category, so a
// template change — which really does alter every page — leaves it untouched.
//
// TEMPLATE_CONTENT_UPDATED is that missing half: the date the shared category
// template last changed in a way a reader would notice. 2026-09-03 shipped the
// SEO Plan 2 work (section <h2>s, real CMS meta descriptions, related-category
// links, footer category links), which altered ~220 pages at once.
//
// lastmod = max(category date_updated, TEMPLATE_CONTENT_UPDATED), capped at now.
// Both halves are true dates. Do NOT substitute `new Date()` here: Google checks
// lastmod against what it actually finds, and a site that stamps every crawl with
// today's date gets its lastmod ignored domain-wide. Bump this constant by hand,
// only when a template change genuinely alters page content.
const TEMPLATE_CONTENT_UPDATED = '2026-09-03';

// Emit W3C date (YYYY-MM-DD). Returns undefined for unparseable input so the
// entry simply omits <lastmod> rather than emitting a bad one.
const toLastmod = (...dates: (string | null | undefined)[]): string | undefined => {
  const now = Date.now();
  const times = dates
    .map((d) => (d ? new Date(d).getTime() : NaN))
    .filter((t) => !Number.isNaN(t))
    .map((t) => Math.min(t, now)); // never claim a future date

  if (times.length === 0) return undefined;
  return new Date(Math.max(...times)).toISOString().slice(0, 10);
};

// Carries slug, depth and the category's own change date (for <lastmod>) —
// id removed after UUID sitemap entries were retired
const flattenCategories = (
  categories: any[],
  depth = 0
): { slug: string; depth: number; dateUpdated: string | null }[] => {
  const result: { slug: string; depth: number; dateUpdated: string | null }[] = [];
  for (const cat of categories) {
    // Prune the hidden branch entirely — the node and all its descendants
    if (cat.slug === HIDDEN_ROOT_SLUG) continue;

    result.push({ slug: cat.slug, depth, dateUpdated: cat.date_updated ?? null });
    if (cat.subCategories && cat.subCategories.length > 0) {
      result.push(...flattenCategories(cat.subCategories, depth + 1));
    }
  }
  return result;
};

const urlEntry = (
  loc: string,
  priority: string,
  changefreq: string,
  lastmod?: string
) => `
  <url>
    <loc>${loc}</loc>${lastmod ? `
    <lastmod>${lastmod}</lastmod>` : ''}
    <priority>${priority}</priority>
    <changefreq>${changefreq}</changefreq>
  </url>`;

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const categories = await fetchCategories();
    const allCategories = flattenCategories(categories);

    // Every static page carries the footer, which the same 2026-09-03 release
    // rebuilt, so the template date applies to these too.
    const staticXml = STATIC_URLS
      .map(({ loc, priority, changefreq }) =>
        urlEntry(loc, priority, changefreq, toLastmod(TEMPLATE_CONTENT_UPDATED)))
      .join('');

    // Depth 0 = root categories (e.g. "Hydraulic Hoses") — these are top-level
    // nav groupings on /catalogue, not individual pages, so excluded as before.
    // Depth 1+ = real navigable pages.
    const dynamicXml = allCategories
      .filter(({ depth }) => depth > 0)
      .map(({ slug, depth, dateUpdated }) => {
        const priority = depth === 1 ? '0.8' : '0.7';
        return urlEntry(
          `https://www.fluidpowergroup.com.au/products/${slug}`,
          priority,
          'monthly',
          toLastmod(dateUpdated, TEMPLATE_CONTENT_UPDATED)
        );
      })
      .join('');

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${staticXml}${dynamicXml}
</urlset>`;

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=3600');
    res.status(200).send(sitemap);

  } catch (err) {
    console.error('Sitemap generation error:', err);

    // Fallback — static URLs only, no dynamic categories
    const fallbackXml = STATIC_URLS
      .map(({ loc, priority, changefreq }) =>
        urlEntry(loc, priority, changefreq, toLastmod(TEMPLATE_CONTENT_UPDATED)))
      .join('');

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${fallbackXml}
</urlset>`;

    res.setHeader('Content-Type', 'application/xml');
    res.status(200).send(sitemap);
  }
};

export default handler;