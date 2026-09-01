/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      "fluidpowergroup.s3.ap-southeast-2.amazonaws.com",
      "images.unsplash.com",
      "cdn.schema.io",
      "cdn.swell.store" 
    ],
    formats: ['image/webp', 'image/avif'],
  },
  
  async redirects() {
    return [
      // ========================================
      // NON-WWW TO WWW REDIRECT (SEO canonical fix)
      // ========================================
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'fluidpowergroup.com.au' }],
        destination: 'https://www.fluidpowergroup.com.au/:path*',
        permanent: true,
      },

      // ========================================
      // PHASE 1: URL MIGRATION - PERMANENT REDIRECTS
      // ========================================
      {
        source: '/buy',
        destination: '/suite360',
        permanent: true
      },
      {
        source: '/hosebuilder/hose360',
        destination: '/suite360/hose360',
        permanent: true
      },
      {
        source: '/hosebuilder/trac360/start',
        destination: '/suite360/trac360/start',
        permanent: true
      },
      {
        source: '/hosebuilder/trac360/:step',
        destination: '/suite360/trac360/:step',
        permanent: true
      },
      {
        source: '/hosebuilder/function360',
        destination: '/suite360/function360',
        permanent: true
      },
      {
        source: '/hosebuilder/:path*',
        destination: '/suite360/:path*',
        permanent: true
      },
      {
        source: '/static/media/:path*',
        destination: '/suite360/static/media/:path*',
        permanent: true
      },
      {
        source: '/hosebuilder/static/:path*',
        destination: '/suite360/static/:path*',
        permanent: true
      },

      // ========================================
      // PHASE 2: QUERY STRING → SLUG REDIRECTS
      // NOTE: middleware.ts never ran in production (Next 12.1.0 does
      // not support root middleware), so these are handled here instead.
      //
      //   /products?subcategory=[slug]  →  /products/[slug]
      //   /products?category=[slug]     →  /products/[slug]
      // ========================================
      {
        source: '/products',
        has: [{ type: 'query', key: 'subcategory', value: '(?<slug>.*)' }],
        destination: '/products/:slug',
        permanent: true,
      },
      {
        source: '/products',
        has: [{ type: 'query', key: 'category', value: '(?<slug>.*)' }],
        destination: '/products/:slug',
        permanent: true,
      },

      // ========================================
      // PHASE 3: BLANK CLIENT-REDIRECT STUB PAGES
      // ========================================
      {
        source: '/suite360/trac360',
        destination: '/suite360/trac360/start',
        permanent: false,
      },
      {
        source: '/suite360/function360',
        destination: '/suite360/function360/start',
        permanent: false,
      },
    ]
  },
  async rewrites() {
    return [
      { source: '/sitemap.xml', destination: '/api/sitemap.xml' },
    ]
  },
};

module.exports = nextConfig