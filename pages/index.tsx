import { HeroHome } from "@/views/Home";
import CompanyNewsBanner from "../components/CompanyNewsBanner";
import type { GetStaticProps, NextPage } from "next";
import { BannerItem, fetchBannerItems } from "../lib/banner/fetchBannerItems";
import Head from "next/head";

// Google Sheet that feeds the company news banner
const BANNER_SHEET_ID = "1SU_ZgDtJ0iAx95Bey0J-KfjuBMafs0vviuarjZtZSYk";

type HomeProps = {
  bannerItems: BannerItem[] | null;
  bannerAsOf: string;
};

const Home: NextPage<HomeProps> = ({ bannerItems, bannerAsOf }) => {
  return (
    <>
      <Head>
        <title>FluidPower Group</title>
        <meta name="description" content="Australia's growing hydraulics company providing competitive prices using new technology and cutting edge services to deliver products & custom solutions. Strength & reliability delivered." />
      </Head>
      <div className="flex flex-col w-full">
        <CompanyNewsBanner items={bannerItems} asOf={bannerAsOf} />
        <HeroHome />
      </div>
    </>
  );
};

// ISR: the banner's Google Sheet is read here on the server (at most once every
// 5 minutes) instead of in every visitor's browser, so the banner is part of the
// page from the first paint. Sheet edits appear within 5 minutes.
const REVALIDATE_SECONDS = 300;

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  const bannerAsOf = new Date().toISOString().split('T')[0];
  try {
    const bannerItems = await fetchBannerItems(BANNER_SHEET_ID);
    return { props: { bannerItems, bannerAsOf }, revalidate: REVALIDATE_SECONDS };
  } catch (err) {
    console.error('getStaticProps error in index.tsx (banner sheet):', err);

    // During a background regeneration, throwing keeps the last good page
    // (with its banner) instead of replacing it.
    if (process.env.NEXT_PHASE !== 'phase-production-build') {
      throw err;
    }

    // At build time there is no previous version - ship the page without the
    // banner (nothing appears later, so no layout shift) and retry in a minute.
    return { props: { bannerItems: null, bannerAsOf }, revalidate: 60 };
  }
};

export default Home;
