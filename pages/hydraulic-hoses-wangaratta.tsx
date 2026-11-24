import { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import GlassButton from "@/modules/GlassButton";

// Local landing page for "hydraulic hoses / fittings / tube bending Wangaratta"
// searches, and the destination for the local Google Ads campaign.
// Every claim here is taken from the site's own Services/About content or
// confirmed by the owner (2026-11-17): open 7 days, walk-ins welcome, same-day
// dispatch for orders before 4pm, flat A$12.85 shipping (A$80 for tubes over 1m,
// from lib/pricing/index.js), NO mobile service. Never mention Australia Post
// (owner: internal detail). Do not add towns served, 24/7 or delivery times.

const PAGE_URL = "https://www.fluidpowergroup.com.au/hydraulic-hoses-wangaratta";
const PHONE_DISPLAY = "03 4720 3323";
const PHONE_TEL = "tel:+61347203323";

const services = [
  {
    title: "Hydraulic hose assembly",
    image: "/hose-crimping-machine.jpg",
    alt: "Hydraulic hose crimping machine at the FluidPower Group workshop",
    points: [
      "Hose crimping up to 2\" diameter",
      "Multi-braid hose crimping",
      "Capacity for large quantities, with professional packing",
    ],
  },
  {
    title: "Tube bending, flaring & cutting",
    image: "/tube-bending-machine.jpg",
    alt: "CNC tube bending machine at the FluidPower Group workshop",
    points: [
      "CNC bending up to 28mm OD",
      "JIC 37° flaring, imperial and metric",
      "Cutting ring and ORFS end assembly",
    ],
  },
  {
    title: "Pressure testing",
    image: "/pressure-testing-equipment.jpg",
    alt: "Hydraulic pressure testing equipment at the FluidPower Group workshop",
    points: [
      "Hydrostatic testing up to 15,000psi",
      "Hoses, tubes, valves, cylinders and manifolds",
    ],
  },
];

const suite = [
  { name: "Hose360", text: "Custom hydraulic hose assemblies, priced as you build", href: "/suite360/hose360" },
  { name: "Trac360", text: "Tractor remote and hydraulic kits", href: "/suite360/trac360/start" },
  { name: "Function360", text: "3rd function kits", href: "/suite360/function360/start" },
  { name: "Tube360", text: "Bent steel tube to your design", href: "/suite360/tube360/start" },
];

const faqs = [
  {
    q: "What hydraulic services do you offer in Wangaratta?",
    a: "From our workshop at 44a Murrell Street we make hydraulic hose assemblies, bend, flare and cut hydraulic tube, assemble cutting ring and ORFS ends, and pressure test hoses, tubes, valves, cylinders and manifolds.",
  },
  {
    q: "Can I order a custom hydraulic hose online?",
    a: "Yes. Hose360 lets you choose the hose, fittings and length and shows your price as you build. Trac360, Function360 and Tube360 do the same for tractor hydraulic kits, 3rd function kits and bent tube.",
  },
  {
    q: "Which fittings and adapters do you supply?",
    a: "We supply JIC, BSP, ORFS, metric and SAE flange fittings and adapters, plus hoses, steel tubes, valves and quick couplings. Browse the full range in our online catalogue.",
  },
  {
    q: "How high a pressure can you test to?",
    a: "Our hydrostatic testing goes up to 15,000psi.",
  },
  {
    q: "When are you open?",
    a: "We're open 7 days: Monday to Friday 8:00am to 5:00pm, and Saturday and Sunday 9:00am to 5:00pm.",
  },
  {
    q: "Do you ship hydraulic parts and hoses?",
    a: "Yes. Orders placed before 4pm are dispatched the same day. Shipping is a flat A$12.85 per order (GST added at checkout). Tubes longer than 1 metre ship at a flat A$80 to cover the extra freight for longer lengths; it's the actual freight cost and we don't add a margin to it.",
  },
  {
    q: "Can I bring my hose or fittings in?",
    a: "Yes, walk-ins are welcome during opening hours at 44a Murrell Street, Wangaratta. Bring the old hose or part and we'll help you get the right replacement.",
  },
  {
    q: "Do you offer mobile or on-site hose repairs?",
    a: "Not at the moment. We're a workshop-based business: walk-ins are welcome at 44a Murrell Street, Wangaratta or build your hose or tube online and we'll make it up and send it.",
  },
  {
    q: "How do I get in touch?",
    a: `Call ${PHONE_DISPLAY} or email info@fluidpowergroup.com.au. For photos or technical details, text 0409 517 333 (text and MMS only).`,
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map(({ q, a }) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a },
  })),
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://www.fluidpowergroup.com.au/" },
    { "@type": "ListItem", position: 2, name: "Hydraulic hoses Wangaratta", item: PAGE_URL },
  ],
};

// Styles mirror the homepage: black "glass" pill buttons that turn yellow on
// hover, a yellow-gradient hero, and the dark #191919 / yellow section look used
// by ServicesHome.
const pill =
  "inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-4 py-1.5 text-sm text-slate-700 shadow-sm backdrop-blur-sm";

const WangarattaPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Hydraulic Hoses, Fittings & Tube Bending Wangaratta | FluidPower Group</title>
        <meta
          name="description"
          content="Hydraulic hose assembly, fittings, adapters, tube bending, flaring and pressure testing at 44a Murrell St, Wangaratta VIC. Build custom hoses online. Call 03 4720 3323."
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
      </Head>

      <div className="bg-white text-black">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 w-full md:w-[60%]"
            style={{
              background:
                "linear-gradient(to right, rgba(250, 204, 21, 0.6) 0%, rgba(250, 204, 21, 0.4) 30%, rgba(250, 204, 21, 0.2) 60%, rgba(250, 204, 21, 0) 100%)",
            }}
          />
          <div className="wrapper relative grid items-center gap-10 px-8 py-12 md:grid-cols-2 md:px-12 md:py-20">
            <div className="flex flex-col gap-5">
              <h1 className="text-3xl font-semibold sm:text-4xl xl:text-5xl">
                Hydraulic hoses, fittings &amp; tube bending in{" "}
                <span className="font-bold text-amber-600">Wangaratta</span>
              </h1>
              <p className="text-lg">
                FluidPower Group makes hydraulic hose assemblies, bends and
                flares tube, and pressure tests in our workshop at 44a Murrell
                Street, Wangaratta. Can&apos;t get in? Build your hose or tractor
                kit online and see the price as you go.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className={pill}>Open 7 days</span>
                <span className={pill}>Walk-ins welcome</span>
                <span className={pill}>Order before 4pm for same-day dispatch</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-4">
                <GlassButton href={PHONE_TEL}>Call {PHONE_DISPLAY}</GlassButton>
                <GlassButton href="/suite360">Build online with Suite360</GlassButton>
              </div>
              <a
                href="https://maps.app.goo.gl/GDwwS9JjkjVnNK1BA"
                target="_blank"
                rel="noreferrer"
                aria-label="5.0 stars from 19 Google reviews. Opens our Google Maps listing"
                className={`${pill} w-fit transition-colors hover:bg-white hover:text-black`}
              >
                <span aria-hidden="true" className="tracking-wider text-amber-500">★★★★★</span>
                <span className="font-semibold text-black">5.0</span>
                <span aria-hidden="true" className="text-slate-400">·</span>
                <span>19 Google reviews</span>
              </a>
            </div>
            <div className="overflow-hidden rounded-3xl border border-black/10 shadow-2xl">
              <Image
                src="/hose-crimping-machine.jpg"
                alt="Hydraulic hose crimping machine at the FluidPower Group workshop in Wangaratta"
                width={1600}
                height={872}
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </section>

        {/* Services (dark, as on the homepage) */}
        <section className="bg-[#191919]">
          <div className="wrapper flex flex-col gap-8 px-8 py-12 md:px-12 sm:py-16">
            <div className="flex flex-col gap-3">
              <div className="text-2xl font-semibold text-yellow-600 sm:text-3xl">Services</div>
              <h2 className="text-3xl font-bold text-yellow-500 sm:text-5xl">
                What we do at our Wangaratta workshop
              </h2>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {services.map((s) => (
                <div
                  key={s.title}
                  className="flex flex-col overflow-hidden rounded-2xl border border-yellow-600/50 bg-[#151515] transition-all duration-200 hover:border-yellow-500 hover:shadow-lg hover:shadow-yellow-400/40"
                >
                  <Image
                    src={s.image}
                    alt={s.alt}
                    width={800}
                    height={440}
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="h-48 w-full object-cover"
                  />
                  <div className="flex flex-col gap-3 p-5">
                    <h3 className="text-2xl font-semibold text-yellow-500">{s.title}</h3>
                    <ul className="flex list-disc flex-col gap-1 pl-5 text-lg text-yellow-600 marker:text-yellow-500">
                      {s.points.map((p) => (
                        <li key={p}>{p}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
            <div>
              <GlassButton href="/services" variant="yellow">
                See everything we offer
              </GlassButton>
            </div>
          </div>
        </section>

        {/* Parts */}
        <section className="wrapper flex max-w-4xl flex-col gap-5 px-8 py-12 md:px-12 sm:py-16">
          <h2 className="text-3xl font-semibold sm:text-4xl">Hoses, fittings &amp; adapters</h2>
          <p className="text-lg text-slate-700">
            Our online catalogue covers hydraulic hoses, JIC, BSP, ORFS, metric
            and SAE flange fittings and adapters, steel tubes, valves and quick
            couplings, with prices shown and secure checkout.
          </p>
          <div className="flex flex-wrap gap-4">
            <GlassButton href="/catalogue">Browse the catalogue</GlassButton>
            <GlassButton href="/products/hoses">Hydraulic hoses</GlassButton>
            <GlassButton href="/products/adapters">Adapters</GlassButton>
          </div>
        </section>

        {/* Suite360 */}
        <section className="bg-gradient-to-b from-yellow-50 to-white">
          <div className="wrapper flex flex-col gap-6 px-8 py-12 md:px-12 sm:py-16">
            <h2 className="text-3xl font-semibold sm:text-4xl">Build it online with Suite360</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {suite.map((s) => (
                <GlassButton key={s.name} href={s.href} variant="card">
                  <span className="text-2xl font-semibold">{s.name}</span>
                  <span className="text-lg opacity-80">{s.text}</span>
                </GlassButton>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="wrapper flex max-w-4xl flex-col gap-4 px-8 py-12 md:px-12 sm:py-16">
          <h2 className="text-3xl font-semibold sm:text-4xl">Common questions</h2>
          {faqs.map((f) => (
            <div
              key={f.q}
              className="flex flex-col gap-1 rounded-2xl border border-yellow-300/70 border-l-4 border-l-yellow-400 bg-yellow-50/60 p-5"
            >
              <h3 className="text-lg font-semibold">{f.q}</h3>
              <p className="text-slate-700">{f.a}</p>
            </div>
          ))}
        </section>

        {/* Find us */}
        <section className="bg-[#191919]">
          <div className="wrapper flex flex-col gap-6 px-8 py-12 md:px-12 sm:py-16 text-yellow-500">
            <h2 className="text-3xl font-bold sm:text-5xl">Find us</h2>
            <div className="grid gap-8 text-xl md:grid-cols-2">
              <address className="not-italic">
                <span className="font-semibold">FluidPower Group</span>
                <br />
                44a Murrell Street, Wangaratta VIC 3677
                <p className="mt-4">
                  Phone{" "}
                  <a href={PHONE_TEL} className="font-semibold text-yellow-400 underline underline-offset-4">
                    {PHONE_DISPLAY}
                  </a>
                  <br />
                  <a href="mailto:info@fluidpowergroup.com.au" className="text-yellow-400 underline underline-offset-4">
                    info@fluidpowergroup.com.au
                  </a>
                </p>
              </address>
              <div>
                <p className="font-semibold">Open 7 days · walk-ins welcome</p>
                <p className="text-yellow-600">Monday to Friday: 8:00am to 5:00pm</p>
                <p className="text-yellow-600">Saturday and Sunday: 9:00am to 5:00pm</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              <GlassButton href="https://maps.app.goo.gl/GDwwS9JjkjVnNK1BA" external variant="yellow">
                Open in Google Maps
              </GlassButton>
              <GlassButton href="/contact" variant="yellow">Contact us</GlassButton>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default WangarattaPage;
