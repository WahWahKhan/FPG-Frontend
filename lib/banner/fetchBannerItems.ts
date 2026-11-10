// lib/banner/fetchBannerItems.ts
// Company news banner data (homepage). Moved out of CompanyNewsBanner.tsx so it
// runs on the server inside the homepage's getStaticProps (ISR, refreshed every
// 5 minutes) instead of in every visitor's browser.
//
// Why: the Google Sheets CSV export takes ~1.3-1.7s, goes through a redirect
// and is marked no-store, so the browser fetch could never be cached. The
// banner showed "Loading..." and then grew to its real height, pushing the
// whole page down (worst on mobile, where the three sections stack).
//
// Parsing and filtering rules are unchanged from the original component.

export interface BannerItem {
  id: string;
  type: 'announcement' | 'deal' | 'product';
  title: string;
  description: string;
  href: string;
  ctaText: string;
  target?: '_self' | '_blank';
  active: boolean;
  startDate: string;
  endDate: string;
}

const FETCH_TIMEOUT_MS = 8000;

/** Splits one CSV line, keeping commas inside double quotes (same as before). */
function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let j = 0; j < line.length; j++) {
    const char = line[j];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

/**
 * Fetches the sheet and returns every row marked active (TRUE).
 * Start/end dates are NOT applied here - see filterByDate - so the browser can
 * re-check them against its own clock (an item ending today disappears on
 * time even though the page is cached for up to 5 minutes).
 */
export async function fetchBannerItems(sheetId: string): Promise<BannerItem[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
    const response = await fetch(csvUrl, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const csvText = await response.text();
    const lines = csvText.split('\n').filter((line) => line.trim());
    if (lines.length < 2) {
      throw new Error('No data found in spreadsheet');
    }

    const items: BannerItem[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      const values = parseCsvLine(line);
      if (!values[0] || values[0].trim() === '') continue; // skip empty rows

      if (values.length >= 8) {
        const item: BannerItem = {
          id: `${values[0]}-${i}`,
          type: values[0] as BannerItem['type'],
          title: values[1],
          description: values[2],
          href: values[3],
          ctaText: values[4],
          active: values[5].toLowerCase() === 'true',
          startDate: values[6],
          endDate: values[7],
          target: '_self'
        };
        if (item.active) items.push(item);
      }
    }
    return items;
  } finally {
    clearTimeout(timer);
  }
}

/** Same date rule as before: compares YYYY-MM-DD strings against today's (UTC) date. */
export function filterByDate(items: BannerItem[], now: Date = new Date()): BannerItem[] {
  const today = now.toISOString().split('T')[0];
  return items.filter((item) => {
    if (item.startDate && item.startDate > today) return false;
    if (item.endDate && item.endDate < today) return false;
    return true;
  });
}
