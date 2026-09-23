// utils/useLockBodyScrollForOverlay.ts
// ============================================================================
// Locks background scroll while an overlay (cart drawer, etc.) is open -
// WITHOUT breaking scrolling inside the overlay's own content on iOS.
//
// Why this exists instead of react-use's useLockBodyScroll: that hook's iOS
// branch (overflow:hidden doesn't stop background scroll on iOS, so it needs
// a different trick) attaches ONE global `document` touchmove listener that
// calls preventDefault() on every touchmove anywhere on the page, with NO
// check of what element the touch started on. That blocks scrolling
// everywhere while locked, including inside the very overlay it's meant to
// protect - which is exactly why the cart drawer's item list couldn't
// scroll past ~3-4 items on real iPhones (confirmed via Safari on a live
// preview deployment, not just code reading).
//
// SINGLETON, not per-instance: Header.tsx mounts TWO <Cart> instances at
// once (one styled for desktop nav, one for mobile, both bound to the same
// `open` state - see components/modules/Header/Header.tsx lines ~150/~417).
// Both instances lock simultaneously, so a naive per-instance listener that
// only knows its OWN scrollable ref still breaks scrolling: instance A
// correctly exempts its own (visible) list, but instance B's listener has
// no idea that element is fine and blocks it anyway - and either listener
// calling preventDefault() cancels the event regardless of what the other
// one decided. Confirmed this exact failure mode live before fixing it:
// dispatching a touchmove at the visible list still came back
// defaultPrevented=true with a naive per-instance version.
//
// Fix: one shared document-level listener (reference-counted, like the
// original library's lock counter) checks against a shared SET of exempt
// elements, so any currently-locked overlay's scrollable content is
// exempted regardless of which component instance registered it.
// ============================================================================

import { useEffect } from 'react';
import type { RefObject } from 'react';

function isIosDevice(): boolean {
  return (
    typeof window !== 'undefined' &&
    !!window.navigator &&
    !!window.navigator.platform &&
    /iP(ad|hone|od)/.test(window.navigator.platform)
  );
}

const exemptElements = new Set<HTMLElement>();
let activeLocks = 0;
let touchListenerAttached = false;
let overflowLockCount = 0;
let originalBodyOverflow = '';

function handleGlobalTouchmove(rawEvent: TouchEvent) {
  // Don't interfere with multi-touch gestures (pinch-to-zoom).
  if (rawEvent.touches.length > 1) return;
  const target = rawEvent.target as Node | null;
  if (!target) {
    rawEvent.preventDefault();
    return;
  }
  for (const el of exemptElements) {
    if (el.contains(target)) return; // some locked overlay's own content - let it scroll
  }
  rawEvent.preventDefault();
}

export function useLockBodyScrollForOverlay(locked: boolean, scrollableRef: RefObject<HTMLElement>) {
  useEffect(() => {
    if (!locked || typeof document === 'undefined') return;

    const el = scrollableRef.current;
    if (el) exemptElements.add(el);
    activeLocks += 1;

    if (isIosDevice()) {
      if (!touchListenerAttached) {
        document.addEventListener('touchmove', handleGlobalTouchmove, { passive: false });
        touchListenerAttached = true;
      }
    } else {
      if (overflowLockCount === 0) {
        originalBodyOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
      }
      overflowLockCount += 1;
    }

    return () => {
      if (el) exemptElements.delete(el);
      activeLocks = Math.max(0, activeLocks - 1);

      if (isIosDevice()) {
        if (activeLocks === 0 && touchListenerAttached) {
          document.removeEventListener('touchmove', handleGlobalTouchmove);
          touchListenerAttached = false;
        }
      } else {
        overflowLockCount = Math.max(0, overflowLockCount - 1);
        if (overflowLockCount === 0) {
          document.body.style.overflow = originalBodyOverflow;
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locked, scrollableRef.current]);
}
