import { FiMail, FiMapPin } from "react-icons/fi";
import { BsFacebook, BsInstagram } from "react-icons/bs";
import { useRouter } from 'next/router';
import Anchor from "../Anchor";
import IconButton from "../IconButton";
import Logo from "../Logo";
import InfoFooter from "./InfoFooter";
import LinksFooter from "./LinksFooter/LinksFooter";

// Version stamp: the last 2 characters of the build's git commit hash, paired
// with the commit date. Deliberately not the full hash — 2 hex characters
// alone repeat often enough (~50% chance of two different deploys sharing
// one within ~19 commits) to be useless on their own, but the accompanying
// date is what actually disambiguates: two deploys landing on the same day
// AND the same 2 characters is negligible in practice, while staying as
// short as intended. Both values come from next.config.js at BUILD time
// (git command run once, baked into the bundle) — never `new Date()` at
// render time, which would make it wrong the moment a page is server-
// rendered on a different day than it was built. Renders nothing in any
// environment without a real build (this sandbox has no .git) rather than
// showing a broken partial stamp.
const BUILD_HASH = process.env.NEXT_PUBLIC_BUILD_HASH || '';
const BUILD_DATE = process.env.NEXT_PUBLIC_BUILD_DATE || '';
const VERSION_TAG = BUILD_HASH ? `v-X${BUILD_HASH.slice(-2)}` : null;

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Parses only the date portion by hand rather than via Date/toLocaleDateString
// — those are timezone/locale dependent, and this same string renders during
// SSR and then again on the client; a mismatch here would be exactly the
// class of hydration bug already fixed once in this file (see IconButton.tsx).
// A plain string match can never disagree with itself between server and
// client, since BUILD_DATE is a fixed compile-time constant either way.
const formatBuildDate = (iso: string): string | null => {
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  const [, year, month, day] = match;
  return `${parseInt(day, 10)} ${MONTH_NAMES[parseInt(month, 10) - 1]} ${year}`;
};

const BUILD_DATE_FORMATTED = BUILD_DATE ? formatBuildDate(BUILD_DATE) : null;

const Footer = () => {
  // Add router check
  const router = useRouter();
  const isBuyPage = router.pathname.startsWith('/suite360/');

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
            <div>All Rights Reserved - {new Date().getFullYear()} FluidPower Group</div>
            {VERSION_TAG && BUILD_DATE_FORMATTED && (
              <div className="text-[10px] text-white/30 mt-1">
                {VERSION_TAG} &middot; Updated {BUILD_DATE_FORMATTED}
              </div>
            )}
          </div>

          <div className="flex gap-2 md:mr-32">
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