import { useLayoutEffect, useRef } from 'react';

/**
 * A floating price bar (Trac360/Function360) is fixed a set offset above the
 * viewport bottom, but its own height varies with content (one line vs. an
 * "Add-ons" line wrapping, mobile vs. desktop layout, etc). A static
 * bottom-padding guess on the page can't track that, so on shorter or
 * narrower viewports the page's Continue button ends up rendered behind it.
 *
 * This measures the bar's real rendered height and republishes the total
 * clearance it needs (height + its fixed offset + a margin) as a CSS custom
 * property on the document root, so the page layout can reserve exactly
 * enough bottom padding — at any viewport size — without either side needing
 * to know the other's implementation details.
 */
export function usePriceBarClearance(cssVarName: string, bottomOffsetPx: number, marginPx = 24) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;

    const update = () => {
      document.documentElement.style.setProperty(
        cssVarName,
        `${el.offsetHeight + bottomOffsetPx + marginPx}px`
      );
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [cssVarName, bottomOffsetPx, marginPx]);

  return ref;
}
