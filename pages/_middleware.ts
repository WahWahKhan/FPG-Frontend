// /pages/_middleware.ts
// Redirects legacy query string URLs to clean slug-based paths
// Uses pages/_middleware.ts convention (Next.js < 12.2)
//
// Handles:
//   /products?subcategory=orfs-adapters  →  /products/orfs-adapters  (301)
//   /products?category=hydraulic-hoses   →  /products/hydraulic-hoses (301)
//
// Does NOT interfere with:
//   /products/[uuid]   — UUID-based routes continue to work unchanged
//   /products/[slug]   — already a clean URL, passes straight through
//   Any other route    — pathname check at top exits immediately

import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Only act on /products (with query strings) — not /products/something
  if (pathname !== '/products') {
    return NextResponse.next();
  }

  const subcategory = searchParams.get('subcategory');
  const category = searchParams.get('category');

  const slug = subcategory || category;

  // No relevant query param — let the request through as-is
  if (!slug) {
    return NextResponse.next();
  }

  // Build clean destination URL, preserving any other query params
  const destination = request.nextUrl.clone();
  destination.pathname = `/products/${slug}`;
  destination.searchParams.delete('subcategory');
  destination.searchParams.delete('category');

  // Pass status as a plain number (Next.js < 12.2 signature)
  return NextResponse.redirect(destination, 301);
}