// utils/useLockBodyScrollForOverlay.ts
// ============================================================================
// Locks background scroll while an overlay (cart drawer, nav menu, etc.) is
// open - WITHOUT breaking scrolling inside the overlay's own content on iOS.
//
// REWRITE (previous approach didn't hold up on a real iPhone after 4 rounds
// of testing): the first version of this hook tried to fight iOS Safari's
// touch-gesture engine with a `touchmove` listener that called
// preventDefault() on everything except an "exempt" set of elements. That
// looked correct in code review and even passed synthetic TouchEvent tests
// dispatched from this session's Chromium-based browser tool - but synthetic
// dispatchEvent() calls do NOT go through WebKit's real gesture recognizer,
// so that test was never actually proof it worked on a real device, and it
// didn't: the owner confirmed on a real iPhone it was still broken, while
// the same build worked fine on Android the whole time (Android never uses
// the iOS preventDefault branch at all - overflow:hidden alone is enough
// there, which is why Android "working" never validated the iOS path).
//
// NEW APPROACH: don't try to selectively block touchmove at all. Instead,
// pin <body> itself out of the document flow with `position: fixed` while
// locked (restoring the exact scroll offset via a negative `top`, and
// restoring real scroll position on unlock). This is the standard iOS
// scroll-lock technique precisely because it sidesteps the touch-event
// battle entirely - there's no gesture to intercept, since body literally
// isn't scrollable while locked. The overlay's own scrollable content
// (Cart's item list, etc.) is unaffected: it's already `position: fixed`
// itself (see Cart.tsx's outer wrapper), so it scrolls natively via its own
// overflow-y-auto, independent of whatever body is doing.
//
// SINGLETON / ref-counted, not per-instance: Header.tsx mounts TWO <Cart>
// instances at once (desktop + mobile nav, both bound to the same `open`
// state), and the mobile nav menu (Snackbar) can be open at the same time as
// the cart. A plain non-counted lock/unlock would have one overlay's close
// prematurely unlock the body while another overlay is still open. A shared
// counter (and shared saved-scroll-state, restored only when the count hits
// zero) handles any number of simultaneously-locked overlays correctly.
// ============================================================================

import { useEffect } from 'react';
import type { RefObject } from 'react';

let activeLocks = 0;
let savedScrollY = 0;
let savedBodyStyle: {
  position: string;
  top: string;
  left: string;
  right: string;
  width: string;
  overflow: string;
} | null = null;

function lockBody() {
  if (activeLocks === 0) {
    savedScrollY = window.scrollY;
    savedBodyStyle = {
      position: document.body.style.position,
      top: document.body.style.top,
      left: document.body.style.left,
      right: document.body.style.right,
      width: document.body.style.width,
      overflow: document.body.style.overflow,
    };
    document.body.style.position = 'fixed';
    document.body.style.top = `-${savedScrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';
  }
  activeLocks += 1;
}

function unlockBody() {
  activeLocks = Math.max(0, activeLocks - 1);
  if (activeLocks === 0 && savedBodyStyle) {
    const restore = savedBodyStyle;
    savedBodyStyle = null;
    document.body.style.position = restore.position;
    document.body.style.top = restore.top;
    document.body.style.left = restore.left;
    document.body.style.right = restore.right;
    document.body.style.width = restore.width;
    document.body.style.overflow = restore.overflow;
    window.scrollTo(0, savedScrollY);
  }
}

// `scrollableRef` is kept in the signature for call-site compatibility
// (Cart.tsx / Snackbar.tsx both already pass one) but is no longer used -
// the position:fixed technique doesn't need to know which element to exempt.
export function useLockBodyScrollForOverlay(locked: boolean, _scrollableRef?: RefObject<HTMLElement>) {
  useEffect(() => {
    if (!locked || typeof document === 'undefined') return;

    lockBody();
    return () => {
      unlockBody();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locked]);
}
