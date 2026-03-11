import { HeroHome } from "@/views/Home";
import CompanyNewsBanner from "../components/CompanyNewsBanner";
import type { NextPage } from "next";
import Head from "next/head";

const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>FluidPower Group</title>
        <meta name="description" content="Australia's growing hydraulics company providing competitive prices using new technology and cutting edge services to deliver products & custom solutions. Strength & reliability delivered." />
      </Head>
      <div className="flex flex-col w-full">
        <CompanyNewsBanner sheetId="1SU_ZgDtJ0iAx95Bey0J-KfjuBMafs0vviuarjZtZSYk" />
        <HeroHome />
      </div>
    </>
  );
};

export default Home;