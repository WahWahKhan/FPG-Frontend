import { HeroHome } from "@/views/Home";
import CompanyNewsBanner from "../components/CompanyNewsBanner";
import type { NextPage } from "next";
import Head from "next/head";
import Anchor from "@/modules/Anchor";

const CATEGORY_LINKS = [
  { slug: "hydraulic-hoses", title: "Hydraulic Hoses" },
  { slug: "carbon-steel-tubes", title: "Carbon Steel Tubes" },
  { slug: "steel-tubes-stainless-steel-tubes", title: "Stainless Steel Tubes" },
  { slug: "hose-fittings-sae-flange-3000psi", title: "SAE Flange 3000PSI Fittings" },
  { slug: "crimp-fittings-orfs-crimp-fittings", title: "ORFS Crimp Fittings" },
  { slug: "crimp-fittings-metric-crimp-fittings", title: "Metric Crimp Fittings" },
];

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
        <div className="wrapper px-8 md:px-12 py-12 flex flex-col gap-6">
          <h2 className="text-2xl font-bold text-center">Shop by Category</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {CATEGORY_LINKS.map((category) => (
              <Anchor
                key={category.slug}
                href={`/products/${category.slug}`}
                className="text-center py-4 px-3 rounded-lg border border-gray-200 hover:border-yellow-400 hover:bg-yellow-50 transition-colors text-sm font-medium"
              >
                {category.title}
              </Anchor>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;