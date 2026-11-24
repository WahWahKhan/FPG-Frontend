import Link from "next/link";
import React from "react";

// The site's signature 3D glass pill button, same look as the homepage hero
// buttons (InfoHeroHome.tsx): black glass at rest, yellow glass on hover, with
// the glossy top highlight.
//  - "dark":   black at rest, yellow on hover (homepage buttons)
//  - "yellow": yellow at rest, black on hover (for dark sections where a black
//              button would disappear)
//  - "card":   a glass tile (dark, yellow text) that turns yellow on hover;
//              children keep their own layout and inherit the text colour

type Variant = "dark" | "yellow" | "card";

const DARK = {
  background: `radial-gradient(ellipse at center, rgba(0, 0, 0, 0.9) 20%, rgba(0, 0, 0, 0.8) 70%, rgba(20, 20, 20, 0.85) 100%), rgba(0, 0, 0, 0.8)`,
  border: "1px solid rgba(255, 255, 255, 0.2)",
  color: "#fff",
  boxShadow: `
    0 4px 15px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.3),
    inset 0 2px 8px rgba(255, 255, 255, 0.1),
    inset 0 -1px 0 rgba(0, 0, 0, 0.2)
  `,
};

const YELLOW = {
  background: `radial-gradient(ellipse at center, rgba(250, 204, 21, 0.9) 20%, rgba(250, 204, 21, 0.8) 60%, rgba(255, 215, 0, 0.9) 100%), rgba(250, 204, 21, 0.7)`,
  border: "1px solid rgba(255, 215, 0, 0.9)",
  color: "#000",
  boxShadow: `
    0 10px 30px rgba(250, 204, 21, 0.6),
    inset 0 2px 0 rgba(255, 255, 255, 0.8),
    inset 0 3px 10px rgba(255, 255, 255, 0.4),
    inset 0 -1px 0 rgba(255, 215, 0, 0.4)
  `,
};

const CARD = { ...DARK, color: "#eab308" };

type Props = {
  href: string;
  children: React.ReactNode;
  variant?: Variant;
  external?: boolean;
  fullWidth?: boolean;
};

const GlassButton = ({
  href,
  children,
  variant = "dark",
  external = false,
  fullWidth = false,
}: Props) => {
  const isCard = variant === "card";
  const rest = variant === "yellow" ? YELLOW : isCard ? CARD : DARK;
  const hover = variant === "yellow" ? DARK : YELLOW;

  const layout: React.CSSProperties = isCard
    ? {
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "flex-start",
        gap: "8px",
        padding: "20px",
        borderRadius: "24px",
        fontSize: "1rem",
        fontWeight: 400,
        textAlign: "left",
        whiteSpace: "normal",
        width: "100%",
        height: "100%",
      }
    : {
        display: fullWidth ? "flex" : "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        padding: "18px 32px",
        borderRadius: "40px",
        fontSize: "1.1rem",
        fontWeight: 600,
        whiteSpace: "nowrap",
        width: fullWidth ? "100%" : "auto",
      };

  const style: React.CSSProperties = {
    all: "unset",
    cursor: "pointer",
    boxSizing: "border-box",
    textDecoration: "none",
    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
    position: "relative",
    overflow: "hidden",
    backdropFilter: "blur(15px)",
    WebkitBackdropFilter: "blur(15px)",
    ...layout,
    ...rest,
  };

  const apply = (e: React.MouseEvent<HTMLElement>, s: typeof DARK, transform: string) => {
    const el = e.currentTarget;
    el.style.transform = transform;
    el.style.background = s.background;
    el.style.border = s.border;
    el.style.color = s.color;
    el.style.boxShadow = s.boxShadow;
  };

  const handlers = {
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) =>
      apply(e, hover, "translateY(-2px) scale(1.02)"),
    onMouseLeave: (e: React.MouseEvent<HTMLElement>) =>
      apply(e, rest, "translateY(0px) scale(1)"),
  };

  const shine = (
    <span
      aria-hidden="true"
      style={{
        position: "absolute",
        top: "1px",
        left: "8px",
        right: "8px",
        height: "50%",
        background:
          "linear-gradient(180deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%)",
        borderRadius: isCard ? "24px 24px 12px 12px" : "40px 40px 20px 20px",
        pointerEvents: "none",
      }}
    />
  );

  if (external || href.startsWith("tel:") || href.startsWith("mailto:")) {
    return (
      <a
        href={href}
        style={style}
        className="hover:no-underline"
        {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
        {...handlers}
      >
        {shine}
        {children}
      </a>
    );
  }

  return (
    <Link href={href} style={style} className="hover:no-underline" {...handlers}>
      {shine}
      {children}
    </Link>
  );
};

export default GlassButton;
