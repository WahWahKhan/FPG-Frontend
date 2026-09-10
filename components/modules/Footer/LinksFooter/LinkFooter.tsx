import Anchor from "@/modules/Anchor";
import React from "react";
import { Children } from "types/general";

type ILinkFooterProps = {
  href?: string;
  children: Children;
};

// Hover feedback, two layered effects:
//  1. Text shifts to the brand yellow (tailwind.config.js's "primary").
//  2. A soft white "misty cloud" glow fades in behind the text — an oval
//     radial gradient (dense at the centre, fading to nothing at the edges),
//     further softened with a blur so the edge itself is hazy rather than a
//     hard gradient cutoff.
//
// Built as a `before:` pseudo-element rather than a sibling <span>, so no
// extra markup and no changes needed to Anchor.tsx (shared by nav menus and
// product cards, which don't want this effect).
//
// Sizing is free: the anchor is `inline-block` + `relative`, which makes its
// own box exactly as wide as its text content (no JS measurement needed).
// The glow is positioned via `inset` offsets AGAINST THAT BOX, so it tracks
// text length automatically — a longer link label gets a wider glow purely
// because the box it's centered against is wider. `-inset-x-3 -inset-y-2`
// extends the glow slightly past the text's own edges so it reads as an
// ambient halo rather than being clipped tight to the letters.
//
// Stacking needs two things, not one — this shipped with only the first and
// the glow was completely invisible as a result (confirmed against a real
// render, not just this sandbox's dev server):
//  1. `before:-z-10` — an absolutely positioned pseudo-element with a
//     DEFAULT z-index paints ON TOP of the anchor's own in-flow text, not
//     behind it, so the glow needs to be pushed back explicitly.
//  2. `isolate` — `-z-10` alone isn't enough, because `relative` with
//     z-index left at `auto` does NOT establish a local stacking context.
//     Without one, the negative z-index doesn't just go behind THIS link's
//     text — it escapes to the nearest ancestor that DOES form a stacking
//     context, which in this tree is effectively the page root, so the glow
//     was painting behind the footer's own opaque black background instead
//     of behind its own text. `isolate` (isolation: isolate) forces the
//     anchor itself to be a self-contained stacking-context root, so -z-10
//     can only ever mean "behind this link's own text" and can never
//     interact with sibling links or ancestor backgrounds.
const LinkFooter = ({ href = "/", children }: ILinkFooterProps) => {
  return (
    <Anchor
      href={href}
      className="relative isolate inline-block text-lg text-white/90 hover:text-primary transition-colors duration-300 before:content-[''] before:absolute before:-z-10 before:-inset-x-3 before:-inset-y-2 before:rounded-full before:bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.65)_0%,_rgba(255,255,255,0.32)_45%,_rgba(255,255,255,0)_75%)] before:blur-md before:opacity-0 before:pointer-events-none before:transition-opacity before:duration-300 hover:before:opacity-100"
    >
      {children}
    </Anchor>
  );
};

export default LinkFooter;
