// One-off audit script for SEO Fix Plan 2, Phase 3.2.
// Walks the sitemap, fetches every /products/* category page, and reports
// pages with under 40 words of unique body content (main tag, tags/nav/footer
// stripped). Not wired into the app — run manually with:
//   node scripts/audit-thin-pages.mjs [baseUrl]
// Writes THIN_PAGES.md to the sandbox root.

const baseUrl = process.argv[2] || 'http://localhost:3011';

const stripTags = (html) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#\d+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const wordCount = (text) => (text ? text.split(' ').filter(Boolean).length : 0);

async function main() {
  const sitemapRes = await fetch(`${baseUrl}/api/sitemap.xml`);
  const sitemapXml = await sitemapRes.text();
  const locs = [...sitemapXml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
  const productUrls = locs.filter((u) => u.includes('/products/'));

  console.log(`Found ${productUrls.length} category URLs in sitemap.`);

  const results = [];
  let done = 0;

  for (const url of productUrls) {
    const path = new URL(url).pathname;
    try {
      const res = await fetch(`${baseUrl}${path}`);
      const html = await res.text();

      const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
      const mainHtml = mainMatch ? mainMatch[1] : html;
      const text = stripTags(mainHtml);
      const words = wordCount(text);

      const metaMatch = html.match(/<meta name="description" content="([^"]*)"/);
      const metaDesc = metaMatch ? metaMatch[1] : '';
      const seriesNameMatch = html.match(/<title>([^|<]*)/);
      const seriesName = seriesNameMatch ? seriesNameMatch[1].trim() : '';
      const fallbackTemplate = `Buy ${seriesName} hydraulic products from FluidPower Group. Available online with Australia-wide delivery.`;
      const usesFallbackTemplate = metaDesc === fallbackTemplate;

      results.push({ path, words, usesFallbackTemplate });
    } catch (err) {
      results.push({ path, words: 0, error: err.message });
    }
    done += 1;
    if (done % 50 === 0) console.log(`  ...${done}/${productUrls.length}`);
  }

  results.sort((a, b) => a.words - b.words);
  const thin = results.filter((r) => r.words < 40);

  const lines = [];
  lines.push('# Thin Content Report — SEO Fix Plan 2, Phase 3.2');
  lines.push('');
  lines.push(`Generated ${new Date().toISOString().slice(0, 10)} by \`scripts/audit-thin-pages.mjs\` against ${baseUrl}.`);
  lines.push('');
  lines.push(`${productUrls.length} category pages checked. ${thin.length} have under 40 words of unique body content (nav/header/footer excluded).`);
  lines.push('');
  lines.push('This is a report only — no CMS content was changed. Work through these in Swell, prioritising the highest-traffic ones first (cross-reference against Search Console impressions once available).');
  lines.push('');
  lines.push('| Path | Words | Notes |');
  lines.push('|---|---|---|');
  for (const r of thin) {
    const note = r.error ? `fetch error: ${r.error}` : (r.usesFallbackTemplate ? 'CMS description likely empty (meta falls back to template)' : '');
    lines.push(`| ${r.path} | ${r.words} | ${note} |`);
  }
  lines.push('');
  lines.push(`Full distribution (all ${results.length} pages, sorted thinnest first) for reference:`);
  lines.push('');
  lines.push('| Path | Words |');
  lines.push('|---|---|');
  for (const r of results) {
    lines.push(`| ${r.path} | ${r.words} |`);
  }

  const fs = await import('fs');
  fs.writeFileSync(new URL('../THIN_PAGES.md', import.meta.url), lines.join('\n'));
  console.log(`\nWrote THIN_PAGES.md — ${thin.length} thin pages out of ${results.length}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
