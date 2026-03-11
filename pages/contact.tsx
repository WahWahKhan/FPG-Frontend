import withLayout from "@/hoc/withLayout";
import { HeaderContact, ItemsContact } from "@/views/Contact";
import BannerHome from "@/views/Home/BannerHome/BannerHome";
import { NextPage } from "next";
import Head from 'next/head';

const ContactPage: NextPage = () => {
  return (
    <>
    <Head>
      <title>Contact Us | FluidPower Group</title>
      <meta name="description" content="Contact FluidPower Group for general queries at info@fluidpowergroup.com.au and order queries at orders@fluidpowergroup.com.au or call +61 409 517 333." />
    </Head>
    <div className="">
      <div className="wrapper px-8 md:px-12 py-6 sm:py-12 lg:py-16  flex flex-col gap-6 sm:gap-16">
        <HeaderContact />

        <ItemsContact />
      </div>
    </div>
    </>
  );
};

export default ContactPage;
