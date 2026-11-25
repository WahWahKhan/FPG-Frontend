import Header from "@/modules/Header";
import InfoHeroHome from "./InfoHeroHome";
import ProductsHeroHome from "./ProductsHeroHome";
import BackgroundPhotosSlideshow from "../../../BackgroundPhotosSlideshow";

const HeroHome = () => {
  // Mobile: the hero grows with its content (a fixed 600px height clipped the
  // heading under the news banner and pushed the last button into the footer).
  return (
    <div className="flex flex-col min-h-[600px] md:h-[1100px] md:min-h-[40rem] wrapper w-full items-center overflow-hidden relative">
      {/* Background Photos - First for lowest layer */}
      <BackgroundPhotosSlideshow />
      
      {/* Horizontal fade layer - positioned between CompanyNewsBanner and Footer */}
      <div 
        className="hidden md:block absolute left-0"
        style={{
          top: "0px", // Starts right after CompanyNewsBanner
          bottom: "0px", // Ends right before Footer
          width: "60%", // Covers text area and fades out - Desktop only
          background: "linear-gradient(to right, rgba(250, 204, 21, 0.6) 0%, rgba(250, 204, 21, 0.4) 30%, rgba(250, 204, 21, 0.2) 60%, rgba(250, 204, 21, 0) 100%)",
          pointerEvents: "none", // Ensures it doesn't block interactions
          zIndex: 15
        }}
      />

      {/* Mobile fade layer - covers 30% width for text and buttons */}
      <div 
        className="md:hidden absolute left-0"
        style={{
          top: "0px",
          bottom: "0px", 
          width: "50%", // Reduced from 100% to 30% for mobile
          background: "linear-gradient(to right, rgba(250, 204, 21, 0.6) 0%, rgba(250, 204, 21, 0.4) 50%, rgba(250, 204, 21, 0.2) 80%, rgba(250, 204, 21, 0) 100%)",
          pointerEvents: "none",
          zIndex: 15
        }}
      />
      
      <div className="h-full flex flex-col-reverse md:flex-row px-8 pt-12 md:pt-8 md:pb-0 pb-14 lg:max-w-none lg:justify-start lg:pl-8 lg:pr-0 lg:pt-0 lg:pb-0 gap-8 md:gap-0 relative z-20">
        <InfoHeroHome />
        <ProductsHeroHome />
      </div>
    </div>
  );
};

export default HeroHome;