import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import db from "db";
import Head from 'next/head';

const Services = () => {
  const [hoveredService, setHoveredService] = useState<string | null>(null);
  const [expandedService, setExpandedService] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const services = [
    {
      id: 'bending',
      title: db.services_Bending?.[0] || "Tube Bending",
      subtitle: "CNC Precision Technology",
      image: "/tube-bending-machine.jpg",
      features: [
        "±0.5mm & 0.15° accuracy",
        "Bending up to 28mm OD",
        "Bend Radius as tight as 2x OD",
        "STL & STEP file compatibility"
      ],
      color: "from-slate-600/30 to-slate-800/40",
      accent: "slate-400",
      textColor: "text-slate-600",
      hoverColor: "hover:border-slate-400/60"
    },
    {
      id: 'flaring',
      title: db.services_Flaring?.[0] || "Tube Flaring & Assembly",
      subtitle: "JIC 37° Precision Flaring",
      image: "/tube-flaring-assembly.jpg",
      features: [
        "JIC 37° Imperial & Metric Flaring",
        "3/8\" to 1\" OR 10mm to 28mm range",
        "High accuracy clean flares",
        "Metric and Imperial Cutting Ring Assembly",
        "ORFS Ends Assembly"
      ],
      color: "from-yellow-400/30 to-amber-500/40",
      accent: "yellow-500",
      textColor: "text-amber-600",
      hoverColor: "hover:border-yellow-400/60"
    },
    {
      id: 'pressure',
      title: db.services_Pressure?.[0] || "Pressure Testing",
      subtitle: "Up to 15,000psi Testing",
      image: "/pressure-testing-equipment.jpg",
      features: [
        "Hydrostatic Testing up to 15,000psi",
        "Hydraulic Valves Testing",
        "Hydraulic Hoses & Tubes Testing",
        "Hydraulic Cylinder Testing",
        "Manifold Testing"
      ],
      color: "from-slate-600/30 to-slate-800/40",
      accent: "slate-400",
      textColor: "text-slate-600",
      hoverColor: "hover:border-slate-400/60"
    },
    {
      id: 'assembly',
      title: db.services_Assembly?.[0] || "Hydraulic Hose Assembly",
      subtitle: "Hose Crimping up to 2\" diameter",
      image: "/hose-crimping-machine.jpg",
      features: [
        "Latest Bending Machines",
        "Multi-Braid Hose Crimping",
        "Large quantity handling capacity",
        "Professional packing services"
      ],
      color: "from-yellow-400/30 to-amber-500/40",
      accent: "yellow-500",
      textColor: "text-amber-600",
      hoverColor: "hover:border-yellow-400/60"
    },
    {
      id: 'cutting',
      title: db.services_Cutting?.[0] || "Laser Cutting",
      subtitle: "Advanced FIBRE Laser",
      image: "/laser-cutting-machine.jpg",
      features: [
        "Latest LASER cutting machines",
        "Sheetmetal and Tube Laser Cutting",
        "Up to 16mm Sheetmetal cutting",
        "Complex shape capability",
        "High precision cutting"
      ],
      color: "from-slate-600/30 to-slate-800/40",
      accent: "slate-400",
      textColor: "text-slate-600",
      hoverColor: "hover:border-slate-400/60"
    },
    {
      id: 'metal',
      title: db.services_Metal?.[0] || "Sheet Metal Bending",
      subtitle: "Complex Shape Capabilities",
      image: "/metal-bending-press.jpg",
      features: [
        "Long length processing",
        "Up to 12mm thick plates",
        "Precision forming technology",
        "Complex shape bending capability",
        "Custom fabrication solutions"
      ],
      color: "from-yellow-400/30 to-amber-500/40",
      accent: "yellow-500",
      textColor: "text-amber-600",
      hoverColor: "hover:border-yellow-400/60"
    }
  ];

  return (
    <>
    <Head>
        <title>Design | FluidPower Group</title>
        <meta name="description" content="Offering Range of Services including Tube Bending, Hose Assembly, Laser Sheet Metal Cutting, Sheet Metal Press Bending, Tube Flaring & Cutting Ring Assembly and Pressure Testing." />
      </Head>
    <div className="flex flex-col w-full">
      <div className="bg-white min-h-screen relative overflow-hidden">
        {/* Background gradient overlay */}
        <div className="absolute inset-0 pointer-events-none z-0 bg-gradient-to-br from-yellow-50/30 via-white to-amber-50/30"></div>

        <div className="w-full wrapper text-black flex relative z-10">
          <div className="h-full w-full">
            {/* Header Section */}
            <div className="wrapper px-8 md:px-12  flex flex-col gap-10 mb-32">
            <div className="flex flex-col gap-4 p-8 pt-16">
              <div className="text-[4rem] md:text-[6rem] lg:text-[8rem] xl:text-[10rem] font-semibold text-slate-200/50 ">
                Services
              </div>
            </div>

            {/* Services Mosaic Grid */}
            <div className="container mx-auto px-6 pb-20">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
                {services.map((service) => (
                  <div
                    key={service.id}
                    className={`relative group cursor-pointer transition-all duration-700 ease-out ${
                      expandedService === service.id ? 'md:col-span-2 lg:col-span-2 row-span-2 z-20' : ''
                    } ${hoveredService === service.id ? 'scale-105 z-10' : 'scale-100'}`}
                    onMouseEnter={() => setHoveredService(service.id)}
                    onMouseLeave={() => setHoveredService(null)}
                    onClick={() => setExpandedService(expandedService === service.id ? null : service.id)}
                    style={{
                      transform: `perspective(1000px) rotateX(${hoveredService === service.id ? -2 : 0}deg) rotateY(${hoveredService === service.id ? 2 : 0}deg)`,
                      transition: 'all 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                    }}
                  >
                    {/* Glass Mosaic Card */}
                    <div className={`relative h-80 ${expandedService === service.id ? 'md:h-96 lg:h-full' : ''} rounded-2xl backdrop-blur-lg border border-gray-200/60 overflow-hidden transition-all duration-700 ${service.hoverColor} shadow-lg hover:shadow-2xl bg-white/20`}>
                      {/* Background Image */}
                      <div className="absolute inset-0">
                        <Image
                          src={service.image}
                          alt={`${service.title} - ${service.subtitle}`}
                          width={800}
                          height={600}
                          className={`w-full h-full object-cover transition-all duration-700 ${
                            hoveredService === service.id ? 'scale-110 brightness-90' : 'scale-100 brightness-70'
                          }`}
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                        <div className={`absolute inset-0 bg-gradient-to-br ${service.color} transition-opacity duration-500`}></div>
                      </div>

                      {/* Glass overlay */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-sm"></div>

                      {/* Content */}
                      <div className="relative z-10 h-full flex flex-col justify-between p-6">
                        {/* Header */}
                        <div>
                          <h3 className={`text-2xl md:text-3xl font-bold text-gray-800 mb-2 transition-all duration-500 ${
                            hoveredService === service.id ? 'transform translate-y-0' : 'transform translate-y-1'
                          }`}>
                            {service.title}
                          </h3>
                          <p className={`text-lg text-black-600 font-medium transition-all duration-500 delay-100 ${
                            hoveredService === service.id ? 'opacity-100 transform translate-y-0' : 'opacity-80 transform translate-y-1'
                          }`}>
                            {service.subtitle}
                          </p>
                        </div>

                        {/* Features - Show on hover or expand, OR always show on mobile */}
                        <div className={`space-y-3 transition-all duration-500 delay-200 ${
                          hoveredService === service.id || expandedService === service.id || isMobile
                            ? 'opacity-100 transform translate-y-0' 
                            : 'opacity-0 transform translate-y-4'
                        }`}>
                          {service.features.map((feature, featureIndex) => (
                            <div
                              key={featureIndex}
                              className="flex items-center text-gray-700 text-sm md:text-base font-medium"
                              style={{
                                transitionDelay: isMobile ? '0ms' : `${200 + featureIndex * 100}ms`,
                                transition: isMobile ? 'none' : undefined
                              }}
                            >
                              <div className={`w-2 h-2 bg-${service.accent} rounded-full mr-3 flex-shrink-0 shadow-sm`}></div>
                              {feature}
                            </div>
                          ))}
                        </div>

                        {/* Expand/Collapse indicator */}
                        <div 
                          className={`absolute bottom-4 right-4 w-10 h-10 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center transition-all duration-300 border border-white/20 ${
                            hoveredService === service.id ? 'scale-110 bg-white/40' : 'scale-100'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedService(expandedService === service.id ? null : service.id);
                          }}
                        >
                          <svg 
                            className={`w-5 h-5 text-gray-700 transition-transform duration-300 ${
                              expandedService === service.id ? 'rotate-45' : 'rotate-0'
                            }`} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </div>
                      </div>

                      {/* Floating accent elements */}
                      <div className={`absolute top-4 left-4 w-3 h-3 bg-${service.accent} rounded-full transition-all duration-700 shadow-lg ${
                        hoveredService === service.id ? 'animate-pulse' : ''
                      }`}></div>
                      
                      {/* Shimmer effect on hover */}
                      <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12 transition-all duration-1000 ${
                        hoveredService === service.id ? 'translate-x-full' : '-translate-x-full'
                      }`}></div>

                      {/* Glow effect for expanded cards */}
                      {expandedService === service.id && (
                        <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400/20 to-amber-400/20 rounded-2xl blur-sm"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Photo Modal */}
            {expandedService && (
              <div 
                className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 pt-40 pb-8 modal-fade-in"
                onClick={() => setExpandedService(null)}
              >
                <div className="relative max-w-6xl max-h-full w-full h-full modal-scale-in">
                  {(() => {
                    const service = services.find(s => s.id === expandedService);
                    return service ? (
                      <Image
                        src={service.image}
                        alt={`${service.title} - Equipment Photo`}
                        width={1200}
                        height={800}
                        className="w-full h-full object-contain rounded-lg shadow-2xl"
                        sizes="90vw"
                        priority
                      />
                    ) : null;
                  })()}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedService(null);
                    }}
                    className="absolute -top-4 -right-4 w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-gray-700 hover:bg-white hover:scale-110 transition-all duration-300 border border-gray-200 shadow-lg modal-bounce-in"
                    aria-label="Close photo modal"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Animation Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes modal-fade-in {
            from {
              opacity: 0;
              backdrop-filter: blur(0px);
            }
            to {
              opacity: 1;
              backdrop-filter: blur(8px);
            }
          }
          
          @keyframes modal-scale-in {
            from {
              opacity: 0;
              transform: scale(0.8) translateY(20px);
            }
            to {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
          }
          
          @keyframes modal-bounce-in {
            from {
              opacity: 0;
              transform: scale(0.3);
            }
            50% {
              transform: scale(1.1);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          
          .modal-fade-in {
            animation: modal-fade-in 0.3s ease-out forwards;
          }
          
          .modal-scale-in {
            animation: modal-scale-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          }
          
          .modal-bounce-in {
            animation: modal-bounce-in 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) 0.2s forwards;
            opacity: 0;
          }
        `
      }} />
    </div>
    </div>
    </>
  );
};

export default Services;