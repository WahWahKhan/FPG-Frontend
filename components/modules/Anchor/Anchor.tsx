import clsx from "clsx";
import { motion, MotionConfig } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/router";
import React from "react";
import { Children } from "types/general";

interface IAnchorProps {
  href: string;
  className?: string;
  children: Children;
}

const Anchor = ({ href, children, className }: IAnchorProps) => {
  return (
    <Link href={href} scroll={false} passHref>
      <motion.a
        className={clsx(className, "hover:no-underline")}
        layout="position"
      >
        {children}
      </motion.a>
    </Link>
  );
};

export default Anchor;