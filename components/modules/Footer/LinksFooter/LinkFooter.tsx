import Anchor from "@/modules/Anchor";
import React from "react";
import { Children } from "types/general";

type ILinkFooterProps = {
  href?: string;
  children: Children;
};

// Hover feedback: text shifts to the brand yellow (tailwind.config.js's
// "primary") with a matching underline, so a footer link visibly signals
// "you're about to click this" — previously there was none. A plain
// hover:underline can't be added here because Anchor.tsx hardcodes
// hover:no-underline for its OTHER callers (nav menus, product cards) that
// deliberately don't want one; stacking both classes at equal specificity
// leaves it to Tailwind's internal build order which one wins. A
// border-bottom sidesteps that entirely — different CSS property, so no
// conflict — and it's always rendered at the same width (just transparent
// by default), so nothing shifts layout when it turns yellow on hover.
const LinkFooter = ({ href = "/", children }: ILinkFooterProps) => {
  return (
    <Anchor
      href={href}
      className="text-lg text-white/90 border-b-2 border-transparent hover:text-primary hover:border-primary transition-colors duration-200"
    >
      {children}
    </Anchor>
  );
};

export default LinkFooter;
