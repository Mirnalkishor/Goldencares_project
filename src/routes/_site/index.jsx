import { createFileRoute } from "@tanstack/react-router";
import Hero from "@/components/home/Hero";
import HourWithUs from "@/components/home/HourWithUs";
import Steps from "@/components/home/Steps";
import ServicesGrid from "@/components/home/ServicesGrid";
import TrustSafety from "@/components/home/TrustSafety";
import FaqTeaser from "@/components/home/FaqTeaser";
import Testimonials from "@/components/home/Testimonials";
import CtaSection from "@/components/site/CtaSection";
import { CITIES, CONTACT, DISCLAIMER } from "@/lib/site";

const structuredData = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "GoldenCares",
  description:
    "Companionship and assistance services for senior citizens at home in Chandigarh, Mohali and Panchkula.",
  email: CONTACT.email,
  areaServed: CITIES.map((city) => ({ "@type": "City", name: city })),
  address: {
    "@type": "PostalAddress",
    addressLocality: "Chandigarh",
    addressRegion: "Chandigarh",
    addressCountry: "IN",
  },
  openingHours: "Mo-Su 07:00-21:00",
  knowsAbout: [
    "senior companion care",
    "elderly companionship",
    "senior assistance",
    "accompanied doctor visits",
  ],
  disambiguatingDescription: DISCLAIMER,
};

export const Route = createFileRoute("/_site/")({
  head: () => ({
    meta: [
      { title: "GoldenCares | Senior Companion Care in Chandigarh, Mohali & Panchkula" },
      {
        name: "description",
        content:
          "Verified companions for seniors in Chandigarh, Mohali and Panchkula. Temple visits, walks, doctor visits, shopping and everyday help — care that can start within hours.",
      },
      { property: "og:title", content: "GoldenCares — companionship for seniors in the Tricity" },
      {
        property: "og:description",
        content:
          "Someone kind at your parent's door, often within hours. Background-checked companions across Chandigarh, Mohali and Panchkula.",
      },
    ],
    scripts: [{ type: "application/ld+json", children: JSON.stringify(structuredData) }],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <>
      <Hero />
      <HourWithUs />
      <Steps />
      <ServicesGrid />
      <TrustSafety />
      <Testimonials />
      <FaqTeaser />
      <CtaSection className="py-16 lg:py-24" />
    </>
  );
}
