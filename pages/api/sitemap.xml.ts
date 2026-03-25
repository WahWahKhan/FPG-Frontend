// /pages/api/sitemap.xml.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { fetchCategories } from 'utils/swell/fetchCategories';

const STATIC_URLS = [
  { loc: 'https://www.fluidpowergroup.com.au', priority: '1.0', changefreq: 'weekly' },
  { loc: 'https://www.fluidpowergroup.com.au/catalogue', priority: '0.9', changefreq: 'weekly' },
  { loc: 'https://www.fluidpowergroup.com.au/suite360', priority: '0.9', changefreq: 'weekly' },
  { loc: 'https://www.fluidpowergroup.com.au/suite360/hose360', priority: '0.8', changefreq: 'monthly' },
  { loc: 'https://www.fluidpowergroup.com.au/suite360/trac360', priority: '0.8', changefreq: 'monthly' },
  { loc: 'https://www.fluidpowergroup.com.au/suite360/function360', priority: '0.8', changefreq: 'monthly' },
  { loc: 'https://www.fluidpowergroup.com.au/services', priority: '0.8', changefreq: 'monthly' },
  { loc: 'https://www.fluidpowergroup.com.au/design', priority: '0.7', changefreq: 'monthly' },
  { loc: 'https://www.fluidpowergroup.com.au/about', priority: '0.7', changefreq: 'monthly' },
  { loc: 'https://www.fluidpowergroup.com.au/contact', priority: '0.7', changefreq: 'monthly' },
];

// Now carries slug alongside id and depth
const flattenCategories = (
  categories: any[],
  depth = 0
): { id: string; slug: string; depth: number }[] => {
  const result: { id: string; slug: string; depth: number }[] = [];
  for (const cat of categories) {
    result.push({ id: cat.id, slug: cat.slug, depth });
    if (cat.subCategories && cat.subCategories.length > 0) {
      result.push(...flattenCategories(cat.subCategories, depth + 1));
    }
  }
  return result;
};

const urlEntry = (loc: string, priority: string, changefreq: string) => `
  <url>
    <loc>${loc}</loc>
    <priority>${priority}</priority>
    <changefreq>${changefreq}</changefreq>
  </url>`;

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const categories = await fetchCategories();
    const allCategories = flattenCategories(categories);

    const staticXml = STATIC_URLS
      .map(({ loc, priority, changefreq }) => urlEntry(loc, priority, changefreq))
      .join('');

    // Depth 0 = root categories (e.g. "Hydraulic Hoses") — these are top-level
    // nav groupings on /catalogue, not individual pages, so excluded as before.
    // Depth 1+ = real navigable pages.
    const dynamicXml = allCategories
      .filter(({ depth }) => depth > 0)
      .flatMap(({ id, slug, depth }) => {
        const priority = depth === 1 ? '0.8' : '0.7';

        // Slug URL — the new canonical clean path (higher priority)
        const slugEntry = urlEntry(
          `https://www.fluidpowergroup.com.au/products/${slug}`,
          priority,
          'monthly'
        );

        // UUID URL — kept during transition so Google can follow existing
        // indexed links and 301 redirect to the slug URL.
        // Once Google Search Console confirms slug URLs are indexed and
        // UUID URLs no longer appear in coverage, remove the uuidEntry lines.
        const uuidEntry = urlEntry(
          `https://www.fluidpowergroup.com.au/products/${id}`,
          '0.5', // Lower priority signals to Google that slug is preferred
          'monthly'
        );

        return [slugEntry, uuidEntry];
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
      .map(({ loc, priority, changefreq }) => urlEntry(loc, priority, changefreq))
      .join('');

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${fallbackXml}
</urlset>`;

    res.setHeader('Content-Type', 'application/xml');
    res.status(200).send(sitemap);
  }
};

export default handler;