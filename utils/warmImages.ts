// utils/warmImages.ts
// Quietly pre-loads next/image thumbnails into the browser cache while the page
// is idle, so menus that open later (BuyProducts mega-menu) show their images
// instantly instead of empty boxes.
//
// Uses next/image's own getImageProps() so the srcset/sizes are identical to
// what the real <Image> renders - the browser picks the same candidate URL and
// the later render is a straight cache hit (no second download).
import { getImageProps } from 'next/image';

type WarmOptions = {
  sizes: string;        // must match the sizes="" on the <Image> being warmed
  concurrency?: number; // keep low so warming never competes with page content
};

const warmed = new Set<string>();

export function warmImages(srcs: string[], { sizes, concurrency = 3 }: WarmOptions): void {
  if (typeof window === 'undefined') return;

  // Respect data-saver / very slow connections
  const conn = (navigator as any).connection;
  if (conn?.saveData || /(^|-)2g$/.test(conn?.effectiveType || '')) return;

  const queue = Array.from(new Set(srcs.filter(Boolean))).filter((s) => !warmed.has(`${s}|${sizes}`));
  if (queue.length === 0) return;

  const loadOne = (src: string) =>
    new Promise<void>((resolve) => {
      warmed.add(`${src}|${sizes}`);
      const { props } = getImageProps({ src, alt: '', fill: true, sizes });
      const img = new window.Image();
      img.decoding = 'async';
      img.onload = img.onerror = () => resolve();
      if (props.sizes) img.sizes = props.sizes;
      if (props.srcSet) img.srcset = props.srcSet;
      img.src = props.src;
    });

  const worker = async () => {
    while (queue.length) await loadOne(queue.shift() as string);
  };

  const start = () => {
    for (let i = 0; i < Math.min(concurrency, queue.length); i++) worker();
  };

  const ric = (window as any).requestIdleCallback as
    | ((cb: () => void, opts?: { timeout: number }) => number)
    | undefined;
  if (ric) ric(start, { timeout: 3000 });
  else setTimeout(start, 1500);
}
