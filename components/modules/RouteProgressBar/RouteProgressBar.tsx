// Thin brand-yellow bar across the top of the viewport while a client-side
// route change is in flight. Next 12 keeps the old page on screen until the
// new page's code + data have arrived, so without this a slow navigation
// looks like the click did nothing.
//
// Only appears if the navigation takes longer than SHOW_DELAY_MS, so fast
// (prefetched / cached) page changes don't flash a bar at all.

import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";

const SHOW_DELAY_MS = 150;
const TRICKLE_MS = 250;
const MAX_TRICKLE = 90; // never reaches 100% until the route actually completes

const RouteProgressBar = () => {
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const showTimer = useRef<number>();
  const hideTimer = useRef<number>();
  const trickle = useRef<number>();

  useEffect(() => {
    const clearTimers = () => {
      window.clearTimeout(showTimer.current);
      window.clearTimeout(hideTimer.current);
      window.clearInterval(trickle.current);
    };

    const handleStart = (_url: string, { shallow }: { shallow: boolean }) => {
      if (shallow) return;
      clearTimers();
      showTimer.current = window.setTimeout(() => {
        setProgress(15);
        setVisible(true);
        trickle.current = window.setInterval(() => {
          // Eases toward MAX_TRICKLE: big steps early, smaller as it waits.
          setProgress((p) => p + (MAX_TRICKLE - p) * 0.12);
        }, TRICKLE_MS);
      }, SHOW_DELAY_MS);
    };

    const handleDone = () => {
      clearTimers();
      setProgress(100);
      // Let the bar visibly fill before fading it out; if it was never
      // shown (fast navigation) the fade is invisible anyway.
      hideTimer.current = window.setTimeout(() => {
        setVisible(false);
        hideTimer.current = window.setTimeout(() => setProgress(0), 300);
      }, 200);
    };

    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeComplete", handleDone);
    router.events.on("routeChangeError", handleDone);

    return () => {
      clearTimers();
      router.events.off("routeChangeStart", handleStart);
      router.events.off("routeChangeComplete", handleDone);
      router.events.off("routeChangeError", handleDone);
    };
  }, [router.events]);

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 pointer-events-none"
      style={{
        zIndex: 9999,
        height: 3,
        opacity: visible ? 1 : 0,
        transition: "opacity 300ms ease",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${progress}%`,
          background: "#ffc100",
          boxShadow: "0 0 8px rgba(255, 193, 0, 0.8)",
          transition: progress === 0 ? "none" : "width 250ms ease-out",
        }}
      />
    </div>
  );
};

export default RouteProgressBar;
