import React from "react";
import LinkFooter from "./LinkFooter";

type Props = {};

const LinksFooter = (props: Props) => {
  return (
    <div className="flex flex-col items-center md:items-start md:flex-row flex-wrap gap-8 md:gap-16">
      <div className="flex flex-col gap-3 items-center md:items-start">
        <h3 className="header-link-footer">Shop by Category</h3>
        <LinkFooter href="/products/hydraulic-hoses">Hydraulic Hoses</LinkFooter>
        <LinkFooter href="/products/carbon-steel-tubes">Carbon Steel Tubes</LinkFooter>
        <LinkFooter href="/products/steel-tubes-stainless-steel-tubes">Stainless Steel Tubes</LinkFooter>
        <LinkFooter href="/products/hose-fittings-sae-flange-3000psi">SAE Flange 3000PSI Fittings</LinkFooter>
        <LinkFooter href="/products/crimp-fittings-orfs-crimp-fittings">ORFS Crimp Fittings</LinkFooter>
        <LinkFooter href="/products/crimp-fittings-metric-crimp-fittings">Metric Crimp Fittings</LinkFooter>
      </div>
      <div className="flex flex-col gap-3 items-center md:items-start">
        <h3 className="header-link-footer">Navigate</h3>
        <LinkFooter href="/downloads">Downloads</LinkFooter>
        <LinkFooter href="/catalogue">Products</LinkFooter>
        <LinkFooter href="/services">Services</LinkFooter>
        <LinkFooter href="/design">Design</LinkFooter>
        <LinkFooter href="/about">About</LinkFooter>
      </div>
      <div className="flex flex-col gap-3 items-center md:items-start">
        <h3 className="header-link-footer">Need help?</h3>
        <LinkFooter href="/contact">Contact us</LinkFooter>
        <LinkFooter href="/contact">Customer service</LinkFooter>
      </div>
      <div className="flex flex-col gap-3 items-center md:items-start">
        <h3 className="header-link-footer">Legal</h3>
        <LinkFooter>Terms & Conditions</LinkFooter>
        <LinkFooter href="/privacy-policy">Privacy Policy</LinkFooter>
      </div>
    </div>
  );
};

export default LinksFooter;
