import { NextPage } from "next";
import Head from "next/head";

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col gap-3">
    <h2 className="text-xl sm:text-2xl font-semibold">{title}</h2>
    <div className="flex flex-col gap-3 text-base font-light text-gray-700 leading-relaxed">
      {children}
    </div>
  </div>
);

const PrivacyPolicyPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Privacy Policy | FluidPower Group</title>
        <meta
          name="description"
          content="How FluidPower Group Pty Ltd collects, holds, uses and discloses your personal information, in accordance with the Privacy Act 1988 (Cth) and the Australian Privacy Principles."
        />
      </Head>

      <div className="wrapper px-8 md:px-12 py-6 sm:py-12 lg:py-16 flex flex-col gap-6 sm:gap-16">
        <div className="flex flex-col gap-4 sm:gap-8 items-center text-center">
          <h1 className="text-3xl lg:text-5xl font-semibold">Privacy Policy</h1>
          <p className="text-lg font-light text-gray-500">
            FluidPower Group Pty Ltd
          </p>
          <p className="text-sm font-light text-gray-400">
            Last updated: 17 August 2026
          </p>
        </div>

        <div className="max-w-3xl mx-auto w-full flex flex-col gap-10 pb-8">
          <Section title="1. About This Policy">
            <p>
              FluidPower Group Pty Ltd (&ldquo;we,&rdquo; &ldquo;us,&rdquo;
              &ldquo;our&rdquo;) is committed to protecting your privacy in
              accordance with the Privacy Act 1988 (Cth) and the Australian
              Privacy Principles (APPs). This policy explains how we collect,
              hold, use, and disclose your personal information.
            </p>
            <p>
              By providing your personal information to us, or by using our
              website or services, you agree to the terms of this policy.
            </p>
          </Section>

          <Section title="2. What Personal Information We Collect">
            <p>We may collect the following types of personal information:</p>
            <ul className="list-disc list-outside pl-5 flex flex-col gap-1">
              <li>Name, email address, phone number, and postal/business address</li>
              <li>Business details (for trade or wholesale customers)</li>
              <li>Payment and billing information</li>
              <li>Details of products or services purchased, quoted, or enquired about</li>
              <li>Website usage data (via cookies and analytics/tracking tools)</li>
              <li>Any other information you voluntarily provide to us (e.g. via forms, phone, or email)</li>
            </ul>
          </Section>

          <Section title="3. How We Collect Personal Information">
            <p>We collect personal information directly from you when you:</p>
            <ul className="list-disc list-outside pl-5 flex flex-col gap-1">
              <li>Purchase products or services from us</li>
              <li>Request a quote or make an enquiry</li>
              <li>Subscribe to our mailing list or newsletter</li>
              <li>Contact us by phone, email, or through our website</li>
              <li>Interact with our website (including via cookies and tracking pixels)</li>
            </ul>
          </Section>

          <Section title="4. How We Use Your Personal Information">
            <p>We use your personal information to:</p>
            <ul className="list-disc list-outside pl-5 flex flex-col gap-1">
              <li>Provide, process, and deliver products and services you have requested</li>
              <li>Communicate with you about orders, quotes, and enquiries</li>
              <li>Send you marketing communications about our products and services, including via email and social media platforms</li>
              <li>Improve our website, products, and customer service</li>
              <li>Comply with our legal obligations</li>
            </ul>
          </Section>

          <Section title="5. Disclosure to Third Parties, Including for Advertising">
            <p>We may disclose your personal information to trusted third parties, including:</p>
            <ul className="list-disc list-outside pl-5 flex flex-col gap-1">
              <li>IT service providers, payment processors, and delivery/logistics partners</li>
              <li>Professional advisers (accountants, lawyers) where necessary</li>
              <li>
                Advertising and marketing platforms, including Meta
                (Facebook/Instagram) and Google, to help us reach customers and
                prospective customers with relevant advertising. Where this
                occurs, personal information such as your email address may be
                securely hashed (encrypted) before being shared with these
                platforms, in accordance with the platform&rsquo;s own privacy
                and data handling terms.
              </li>
            </ul>
            <p>We do not sell your personal information to third parties.</p>
          </Section>

          <Section title="6. Direct Marketing">
            <p>
              We may use your personal information to send you direct
              marketing communications about our products, services, and
              promotions, including through email, SMS, and third-party
              advertising platforms such as Meta.
            </p>
            <p>You may opt out of receiving direct marketing communications from us at any time by:</p>
            <ul className="list-disc list-outside pl-5 flex flex-col gap-1">
              <li>Clicking &ldquo;unsubscribe&rdquo; on any marketing email</li>
              <li>Contacting us using the details below</li>
            </ul>
            <p>
              If you opt out, we will take reasonable steps to stop using
              your information for direct marketing purposes, including
              removing you from any advertising audiences where practicable.
            </p>
          </Section>

          <Section title="7. Overseas Disclosure">
            <p>
              Some third parties we disclose information to (such as Meta
              Platforms, Inc.) may store or process data outside Australia,
              including in the United States. Where this occurs, we take
              reasonable steps to ensure these providers handle your
              information in a manner consistent with the Australian Privacy
              Principles.
            </p>
          </Section>

          <Section title="8. Data Security">
            <p>
              We take reasonable steps to protect personal information we
              hold from misuse, interference, loss, unauthorised access,
              modification, or disclosure, including through the use of
              secure systems and access controls.
            </p>
          </Section>

          <Section title="9. Access and Correction">
            <p>
              You may request access to, or correction of, the personal
              information we hold about you by contacting us using the
              details below. We will respond to your request within a
              reasonable timeframe in accordance with the Privacy Act.
            </p>
          </Section>

          <Section title="10. Complaints">
            <p>
              If you have a concern about how we have handled your personal
              information, please contact us using the details below. If you
              are not satisfied with our response, you may lodge a complaint
              with the Office of the Australian Information Commissioner
              (OAIC) at{" "}
              <a
                href="https://www.oaic.gov.au"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-primary"
              >
                www.oaic.gov.au
              </a>
              .
            </p>
          </Section>

          <Section title="11. Changes to This Policy">
            <p>
              We may update this policy from time to time. The most current
              version will always be available on our website.
            </p>
          </Section>

          <Section title="12. Contact Us">
            <p>For any questions about this policy or your personal information, please contact:</p>
            <div className="flex flex-col gap-1">
              <p className="font-medium text-black">FluidPower Group Pty Ltd</p>
              <p>4a Murrell Street</p>
              <p>Wangaratta, Victoria 3677 Australia</p>
              <p>A.B.N: 29 644 885 932</p>
              <p>
                Tel:{" "}
                <a href="tel:0409517333" className="underline hover:text-primary">
                  0409 517 333
                </a>
              </p>
              <p>
                <a
                  href="https://www.fluidpowergroup.com.au"
                  className="underline hover:text-primary"
                >
                  www.fluidpowergroup.com.au
                </a>
              </p>
              <p>
                <a
                  href="mailto:info@fluidpowergroup.com.au"
                  className="underline hover:text-primary"
                >
                  info@fluidpowergroup.com.au
                </a>
              </p>
            </div>
          </Section>
        </div>
      </div>
    </>
  );
};

export default PrivacyPolicyPage;
