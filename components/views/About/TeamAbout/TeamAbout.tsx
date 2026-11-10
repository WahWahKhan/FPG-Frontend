import Image from "next/image";

const TeamAbout = () => {
  return (
    <div className="flex flex-col gap-8">
      {/*<h2 className="text-4xl font-semibold">Meet the team</h2>

      <div className="grid grid-cols-4 gap-8">
        {Array(2)
          .fill({})
          .map((_, i) => (
            <div
              className="col-span-4 sm:col-span-2 max-w-xs mx-auto w-full  xl:col-span-1   flex flex-col gap-4"
              key={i}
            >
              <div className="w-full h-80  relative">
                <Image
                  alt="portrait"
                  fill sizes="320px" style={{ objectFit: "cover" }}
                  src="https://images.unsplash.com/flagged/photo-1573603867003-89f5fd7a7576?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=892&q=80"
                />
              </div>

              <div className="">
                <h3 className="text-3xl">Dan Newman</h3>
                <h4 className="text-xl text-black/50 ">Co-Founder</h4>
          </div>
            </div>
          ))}
          </div>*/}
    </div>
  );
};

export default TeamAbout;
