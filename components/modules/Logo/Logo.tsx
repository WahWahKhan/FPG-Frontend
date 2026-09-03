import Image from "next/image";
import React, { useState } from "react";
import Anchor from "../Anchor";

type ILogoProps = {
  type?: "header" | "footer";
};

const Logo = ({ type = "header" }: ILogoProps) => {
  const [logoError, setLogoError] = useState(false);

  const handleImageError = () => {
    console.log('GIF logo failed to load, falling back to PNG');
    setLogoError(true);
  };

  return (
    <Anchor href="/">
      <div className="relative h-[112px] w-[275px] overflow-hidden">
        <Image
        src={`${process.env.NEXT_PUBLIC_BASE_URL || ''}${logoError ? '/logo-header.png' : '/fluidpower_logo_transparent.gif'}`}
        alt="Site logo"
        width={275}
        height={140}
        className="object-contain w-full h-full"
        priority
        quality={100}
        unoptimized
        onError={handleImageError}
      />
    </div>
  </Anchor>
);
};

export default Logo;