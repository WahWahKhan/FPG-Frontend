import Image from "next/image";
import React from "react";
import Anchor from "../Anchor";

type ILogoProps = {
  type?: "header" | "footer";
};

const Logo = ({ type = "header" }: ILogoProps) => {
  return (
    <Anchor href="/">
      <div className="relative h-[112px] w-[275px] overflow-hidden">
        <Image
        src={`${process.env.NEXT_PUBLIC_BASE_URL || ''}/logo-header.png`}
        alt="Site logo"
        width={275}
        height={140}
        className="object-contain w-full h-full"
        priority
        quality={100}
      />
    </div>
  </Anchor>
);
};

export default Logo;