import Anchor from "@/modules/Anchor";
import React from "react";
import { FiChevronRight } from "react-icons/fi";

// Same black-resting / yellow-hover glass button used by all hero CTAs.
const HeroButtonStyle = ({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) => (
  <button
    onClick={onClick}
    className="w-full flex items-center justify-center gap-2 relative overflow-hidden"
    style={{
      all: "unset",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      padding: "18px 32px",
      borderRadius: "40px",
      fontSize: "1.1rem",
      fontWeight: "600",
      color: "#fff",
      textDecoration: "none",
      transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
      position: "relative",
      whiteSpace: "nowrap",
      minWidth: "max-content",
      width: "100%",
      background: `radial-gradient(ellipse at center, rgba(0, 0, 0, 0.9) 20%, rgba(0, 0, 0, 0.8) 70%, rgba(20, 20, 20, 0.85) 100%), rgba(0, 0, 0, 0.8)`,
      backdropFilter: "blur(15px)",
      border: "1px solid rgba(255, 255, 255, 0.2)",
      boxShadow: `
        0 4px 15px rgba(0, 0, 0, 0.3),
        inset 0 1px 0 rgba(255, 255, 255, 0.3),
        inset 0 2px 8px rgba(255, 255, 255, 0.1),
        inset 0 -1px 0 rgba(0, 0, 0, 0.2)
      `,
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
      e.currentTarget.style.background = `radial-gradient(ellipse at center, rgba(250, 204, 21, 0.9) 20%, rgba(250, 204, 21, 0.8) 60%, rgba(255, 215, 0, 0.9) 100%), rgba(250, 204, 21, 0.7)`;
      e.currentTarget.style.border = "1px solid rgba(255, 215, 0, 0.9)";
      e.currentTarget.style.color = "#000";
      e.currentTarget.style.boxShadow = `
        0 10px 30px rgba(250, 204, 21, 0.6),
        inset 0 2px 0 rgba(255, 255, 255, 0.8),
        inset 0 3px 10px rgba(255, 255, 255, 0.4),
        inset 0 -1px 0 rgba(255, 215, 0, 0.4)
      `;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = "translateY(0px) scale(1)";
      e.currentTarget.style.background = `radial-gradient(ellipse at center, rgba(0, 0, 0, 0.9) 20%, rgba(0, 0, 0, 0.8) 70%, rgba(20, 20, 20, 0.85) 100%), rgba(0, 0, 0, 0.8)`;
      e.currentTarget.style.border = "1px solid rgba(255, 255, 255, 0.2)";
      e.currentTarget.style.color = "#fff";
      e.currentTarget.style.boxShadow = `
        0 4px 15px rgba(0, 0, 0, 0.3),
        inset 0 1px 0 rgba(255, 255, 255, 0.3),
        inset 0 2px 8px rgba(255, 255, 255, 0.1),
        inset 0 -1px 0 rgba(0, 0, 0, 0.2)
      `;
    }}
  >
    <span
      style={{
        position: "absolute",
        top: "1px",
        left: "8px",
        right: "8px",
        height: "50%",
        background: "linear-gradient(180deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%)",
        borderRadius: "40px 40px 20px 20px",
        pointerEvents: "none",
        transition: "all 0.4s ease",
      }}
    />
    {children}
  </button>
);

const InfoHeroHome = () => {
  return (
    <div className="md:w-1/2 h-full flex flex-col justify-center gap-4 items-center text-left md:text-left md:items-start relative z-20">
      <h1 className="text-3xl sm:text-4xl xl:text-4xl font-semibold">
        Welcome to{" "}
        <span className="text-yellow-400 font-bold">FluidPower Group</span>
      </h1>
      <h2 className="text-lg">
        A growing hydraulics company investing in talented personnel & new
        technology to deliver cutting edge services and products with
        competitive prices.
      </h2>

      {/* Buttons Container */}
      <div className="flex flex-col gap-6 mt-6 w-full max-w-[280px] items-start">
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: "80%" }}>
          <Anchor href="/suite360" className="hover:no-underline">
            <HeroButtonStyle>
              Suite360 <FiChevronRight className="text-xl" />
            </HeroButtonStyle>
          </Anchor>

          <Anchor href="/catalogue" className="hover:no-underline">
            <HeroButtonStyle>
              Browse Products <FiChevronRight className="text-xl" />
            </HeroButtonStyle>
          </Anchor>

          <Anchor href="/services" className="hover:no-underline">
            <HeroButtonStyle>
              Browse Services <FiChevronRight className="text-xl" />
            </HeroButtonStyle>
          </Anchor>
        </div>
      </div>
    </div>
  );
};

export default InfoHeroHome;
