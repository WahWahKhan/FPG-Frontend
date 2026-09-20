import { useLayoutEffect, useState, useCallback } from 'react';

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
 *
 * The returned ref is a CALLBACK ref, not a useRef object: the price bar's
 * element is conditionally rendered (hidden until config hydrates, then
 * swapped between separate desktop/mobile JSX branches), so the underlying
 * DOM node is replaced during the component's lifetime. A one-shot
 * useRef + effect measures whichever node existed the first time the effect
 * ran and never re-attaches its ResizeObserver — silently freezing the
 * clearance at a stale (often 0) value once the node swaps, e.g. every
 * mobile viewport (desktop-branch node measured, then unmounted in favour of
 * the mobile-branch node, whose real height is never observed). A callback
 * ref re-fires this hook on every node swap, so it always measures the node
 * actually on screen.
 */
export function usePriceBarClearance(cssVarName: string, bottomOffsetPx: number, marginPx = 24) {
  const [el, setEl] = useState<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
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
  }, [el, cssVarName, bottomOffsetPx, marginPx]);

  return useCallback((node: HTMLDivElement | null) => setEl(node), []);
}
