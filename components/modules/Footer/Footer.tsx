import { FiMail, FiMapPin } from "react-icons/fi";
import { BsFacebook, BsInstagram } from "react-icons/bs";
import { useRouter } from 'next/router';
import Anchor from "../Anchor";
import IconButton from "../IconButton";
import Logo from "../Logo";
import InfoFooter from "./InfoFooter";
import LinksFooter from "./LinksFooter/LinksFooter";

const Footer = () => {
  // Add router check
  const router = useRouter();
  const isBuyPage = router.pathname.includes('/buy') || router.asPath.includes('/buy');

  // Return null (nothing) when on Buy page
  if (isBuyPage) {
    return null;
  }

  // Normal return when not on Buy page
  return (
    <div className="bg-black/90 py-16 border-t text-white px-10">
      <div className="wrapper  flex flex-col gap-8  ">
        <div className="flex xl:flex-row flex-col-reverse gap-12 md:gap-64  ">
          <InfoFooter />
          <LinksFooter />
        </div>

        <div className=" flex flex-col sm:flex-row justify-between items-center gap-8 ">
          <div className="text-center">
            All Rights Reserved - {new Date().getFullYear()} FluidPower Group
          </div>

          <div className="flex gap-2">
            {/* Facebook */}
            <a 
              href="https://www.facebook.com/share/1754zF77w4/?mibextid=wwXlfr" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:no-underline"
            >
              <IconButton Icon={BsFacebook} />
            </a>
            
            {/* Instagram */}
            <button
              onClick={() => window.open('https://www.instagram.com/fluidpowergroup/', '_blank', 'noopener,noreferrer')}
              className="hover:no-underline bg-transparent border-0 p-0 cursor-pointer"
              aria-label="Visit our Instagram"
            >
              <IconButton Icon={BsInstagram} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Footer;