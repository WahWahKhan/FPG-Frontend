import Image from "next/image";
import { FiMail, FiMapPin } from "react-icons/fi";

const InfoFooter = () => {
  return (
    <div className="flex flex-col gap-4  items-center md:items-start ">
      <Image
        className="relative bg-transparent"
        src="/logoFooter.png"
        alt="Fluid Power Group logo"
        width={220}
        height={90}
      />

      <div className=" text-lg flex items-center gap-2">
        <FiMail className=" hidden sm:block" />{" "}
        <a href="mailto:info@fluidpowergroup.com.au">
          info@fluidpowergroup.com.au
        </a>
      </div>
      <div className=" text-lg flex   gap-2 text-center sm:text-left">
        <FiMapPin className="mt-1 hidden sm:block" />
        <div>44a Murrell Street, Wangaratta VIC 3677</div>
      </div>
    </div>
  );
};

export default InfoFooter;
