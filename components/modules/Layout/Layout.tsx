
import { Children } from "types/general";
import React from "react"

interface ILayoutProps {
  children: Children;
  categories?: any;
  seriesList?: any;
}
const Layout = ({ children}: ILayoutProps) => {
  return (
    <div>
      {children}
    </div>
  );
};

export default Layout;