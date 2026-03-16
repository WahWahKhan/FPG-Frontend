import withLayout from "@/hoc/withLayout";
import {
  HeaderAbout,
  HeroAbout,
  HighlightsAbout,
  LocationAbout,
  TeamAbout,
} from "@/views/About";
import { NextPage } from "next";
import Head from 'next/head';

const AboutPage: NextPage = () => {
  return (
    <>
    <Head>
        <title>About | FluidPower Group</title>
        <meta name="description" content="We offer wide range of hydraulic hose & fittings, adaptors, hydraulic tubes and all other miscellaneous parts that are needed in the fluid and hydraulic industry." />
      </Head>
      {/* Reduced bottom padding from pb-10 to pb-4, and reduced gap from gap-16 to gap-8 */}
      <div className="wrapper px-8 md:px-12 pt-6 pb-4 sm:py-8 lg:py-12 flex flex-col items-center gap-8">
        {/* Added left padding control to move text section right */}
        <div className="flex lg:flex-row flex-col gap-8 lg:gap-16 w-full items-start lg:pl-32">
          <HeaderAbout />
          <HeroAbout />
        </div>
      </div>
      {/*<HighlightsAbout /> */}
      {/* Added same left padding to Location section to match About section alignment */}
      <div className="wrapper px-8 md:px-12 pt-4 pb-12 sm:pt-6 sm:pb-20 flex flex-col gap-8 lg:pl-44">
        <TeamAbout />
        <LocationAbout />
      </div>
    </>
  );
};

export default AboutPage;