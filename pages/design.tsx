import ItemDesignHome from "@/views/Home/DesignHome/ItemDesignHome";
import { ItemDesignsHome } from "@/views/Home/DesignHome/ItemDesignHome";
import db from "db";
import type { NextPage } from "next";

const Design: NextPage = () => {
  return (
    <div className="flex flex-col w-full">
      {/* Design Section - Moved from homepage */}
      <div className="wrapper px-8 md:px-12  flex flex-col gap-10 mb-32">
            <div className="flex flex-col gap-4 p-8 pt-16">
              <div className="text-[4rem] md:text-[6rem] lg:text-[8rem] xl:text-[10rem] font-semibold text-slate-200/50 ">
                Design
            <div className="grid grid-cols-1 lg:grid-cols-4 xl:grid-cols-6 grid-flow-row gap-8 mt-8">
            {db.design_Hydraulic.map((item, i) => (
              <ItemDesignHome key={i} title={item} />
            ))}
            {db.design_Drafting.map((item, i) => (
              <ItemDesignsHome key={i} title={item} />
            ))}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default Design;