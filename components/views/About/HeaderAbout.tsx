import Image from "next/image";

const HeaderAbout = () => {
  return (
    <div className="relative lg:w-full">      
      {/* Extended White Faded Background - covers both text and photo area */}
      <div 
        className="flex lg:flex-row flex-col gap-6 lg:w-full relative z-10 p-6 rounded-lg" 
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)' }}
      >
        {/* Text Content - Left Side */}
        <div className="flex flex-col gap-4 lg:w-1/2">
          <h1 className="text-4xl font-semibold">Who are we</h1>
          <main className="text-justify font-light text-lg">
            We offer wide range of hydraulic hose & fittings, adaptors, hydraulic
            tubes and all other miscellaneous parts that are needed in the fluid and
            hydraulic industry.<br></br> <br></br>Tube bending, flaring & cutting
            ring assembly, pressure testing and hose crimping are our main services.
            <br></br>
            <br></br>We design and build hydraulic systems and circuits according to
            your needs and requirements.<br></br>
            <br></br>We are also into design and drafting services. Bring us your
            idea and we will shape it into a reality.
          </main>
        </div>
        
        {/* Photo - Right Side, hidden on mobile, no rounded corners */}
        <div className="lg:w-1/2">
          <div className="aspect-video relative w-full overflow-hidden">
            <Image 
              alt="team" 
              width={5009}
              height={2505}
              className="object-cover w-full h-full"
              src={`${process.env.NEXT_PUBLIC_BASE_URL || ''}/About.jpeg`}
              quality={100}
              priority
              unoptimized
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeaderAbout;