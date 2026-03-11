import Footer from "@/modules/Footer";
import Header from "@/modules/Header";
import { useEffect, useState, useContext } from "react";
import { useRouter } from 'next/router';
import CartWrapper, { CartContext } from "context/CartWrapper";
import { Trac360Provider } from 'context/Trac360Context'; // ✅ IMPORTANT: Named import, NOT default
import { Function360Provider } from '../context/Function360Context';
import { AnimatePresence, motion } from "framer-motion";
import type { AppProps } from "next/app";
import InAppChat from '../components/InAppChat';
import Head from "next/head";
import "styles/globals.css";
import axios from "axios";
import { Category } from "types/products";

// Create a new component that has access to CartContext
function AppContent({ Component, pageProps, router }: AppProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const nextRouter = useRouter();
  
  // Access cart context here
  const { open: isCartOpen } = useContext(CartContext);

  useEffect(() => {
    const categories = async () => {
      let cat;
      do {
        cat = await axios.get(
          `/api/getCategories`
        );
      } while (cat.data.categories[0].subCategories.length === 0);
      return cat;
    };

    categories().then((result: any) => {
      setCategories(result.data.categories);
    });
  }, [Component]);

  // Add payment debug logging
  useEffect(() => {
    // Only log if we're in the browser (not during SSR)
    if (typeof window !== 'undefined') {
    }
  }, [nextRouter.asPath, nextRouter.query, nextRouter.pathname]);

  // Log when routes change
  useEffect(() => {
    const handleRouteChange = (url: string) => {
    };

    nextRouter.events.on('routeChangeComplete', handleRouteChange);

    return () => {
      nextRouter.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [nextRouter.events]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header categories={categories} />
      <main className="flex-grow">
        <Head>
          <title>FluidPower Group</title>
          <meta name="google-site-verification" content="_gR0pKYQplY_yqDv8fZIJfD_FWFNrKhcgWpvGf9kMFg" />
        </Head>

        <AnimatePresence
          exitBeforeEnter
          onExitComplete={() => window.scrollTo(0, 0)}
        >
          <motion.div
            key={router.route}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full"
          >
            <Component {...pageProps} />
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />

      {/* Chat component now has access to cart state */}
      <InAppChat 
        buttonColor="#ffc100" 
        companyName="FluidPower Group"
        customerName="Guest"
        hideWhenCartOpen={isCartOpen}
      />
    </div>
  );
}

function MyApp(props: AppProps) {
  return (
    <CartWrapper>
      <Trac360Provider>
      <Function360Provider>
        <AppContent {...props} />
        </Function360Provider>
      </Trac360Provider>
    </CartWrapper>
  );
}

export default MyApp;