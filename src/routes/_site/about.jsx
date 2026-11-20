import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Clock, HeartHandshake, MapPin, ShieldCheck } from "lucide-react";
import { Image } from "@/components/ui/image";
import PageHero from "@/components/site/PageHero";
import Reveal from "@/components/site/Reveal";
import CtaSection from "@/components/site/CtaSection";
import { DisclaimerBand } from "@/components/site/Disclaimer";
import { IMAGES } from "@/lib/images";
import { CITIES, CONTACT } from "@/lib/site";

export const Route = createFileRoute("/_site/about")({
  head: () => ({
    meta: [
      { title: "About GoldenCares | Senior Companionship in the Tricity" },
      {
        name: "description",
        content:
          "GoldenCares is a Chandigarh-based companionship service for seniors, built on verification, briefing and honest updates — never on medical claims.",
      },
    ],
  }),
  component: AboutPage,
});

const values = [
  { icon: HeartHandshake, title: "Dignity first", text: "Our companions are guests in your parent's home, never managers of it." },
  { icon: ShieldCheck, title: "Trust, earned slowly", text: "Verification, briefing and an honest update after every single visit." },
  { icon: Clock, title: "Reliability you can plan around", text: "Agreed hours, on-time arrivals, and a person to speak with when plans change." },
];

function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About us"
        title="Care that feels like family, in the city we call home."
        intro="GoldenCares began in Chandigarh with a simple observation: many seniors are not short of things, but short of company — and their families need help they can trust at short notice."
      />

      <section className="container-page py-14 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <Reveal>
            <div className="space-y-5 text-[1rem] leading-relaxed text-muted-foreground">
              <p>
                We built GoldenCares for the families of Chandigarh, Mohali and Panchkula who live close by
                but cannot always be there: the daughter in another city, the son between meetings, the
                neighbour who checks in when they can.
              </p>
              <p>
                Our companions are local, background-checked and interviewed in person. They accompany
                seniors to temples, markets, clinics and parks. They sit for tea and conversation. They help
                with a video call to a grandchild. Small things, done warmly and reliably.
              </p>
              <p>
                We are deliberately clear about what we are not: GoldenCares provides companionship and
                assistance only. We do not offer overnight care, nursing or clinical treatment. When a family
                needs medical support, we say so and point them to healthcare professionals.
              </p>
            </div>

            <div className="mt-8 grid gap-3 rounded-[1.5rem] border border-border bg-card p-6 text-[0.9rem] text-foreground/80 sm:grid-cols-2">
              <p className="flex items-center gap-2.5">
                <MapPin className="h-4 w-4 text-primary" /> {CITIES.join(" · ")}
              </p>
              <p className="flex items-center gap-2.5">
                <Clock className="h-4 w-4 text-primary" /> {CONTACT.hours}
              </p>
              <a href={`mailto:${CONTACT.email}`} className="flex items-center gap-2.5 hover:text-primary">
                {CONTACT.email}
              </a>
              <Link to="/policies" className="flex items-center gap-2.5 font-semibold text-primary">
                Our policies <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <Image
              src={IMAGES.walk}
              alt="An elderly couple walking with a companion in a tree-lined Chandigarh park"
              className="aspect-[4/5] w-full rounded-[2rem] border border-border object-cover shadow-soft"
            />
          </Reveal>
        </div>
      </section>

      <section className="border-y border-border bg-secondary/40 py-14 lg:py-20">
        <div className="container-page">
          <Reveal>
            <h2 className="font-heading text-[2rem] leading-tight text-foreground">What we hold ourselves to</h2>
          </Reveal>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {values.map(({ icon: Icon, title, text }, index) => (
              <Reveal key={title} delay={index * 0.07}>
                <div className="h-full rounded-[1.75rem] border border-border bg-card p-7">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-secondary text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 font-heading text-[1.3rem] text-foreground">{title}</h3>
                  <p className="mt-2 text-[0.92rem] leading-relaxed text-muted-foreground">{text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <DisclaimerBand className="py-12" />
      <CtaSection className="py-10 lg:py-16" />
    </>
  );
}
