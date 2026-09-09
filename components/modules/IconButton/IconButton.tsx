import { FC } from "react";
import clsx from "clsx";

type IIconButtonProps = {
  Icon: FC;
  className?: string;
};

// Deliberately renders a plain <div>, not its own <a>. This is only ever
// used INSIDE an interactive wrapper the caller provides — an <a> for a real
// link, a <button> for a JS-driven action (see Footer.tsx, its only caller).
// It used to render its own inner <a>, so both call sites nested an <a>
// inside another interactive element. <a> inside <a> is invalid HTML5
// (interactive content can't contain interactive content) — the browser's
// parser "fixes" it by breaking the outer anchor open early, which produces
// a hydration mismatch AND, live, leaves the outer <a> empty: its icon gets
// hoisted out as a sibling instead of rendering inside it. Confirmed live on
// /about — the Facebook link rendered as an empty, iconless, effectively
// dead anchor every page load, not just occasionally.
const IconButton = ({ Icon, className }: IIconButtonProps) => {
  return (
    <div className={clsx("text-2xl p-2 hover:bg-white/10 rounded-full", className)}>
      <Icon />
    </div>
  );
};

export default IconButton;
