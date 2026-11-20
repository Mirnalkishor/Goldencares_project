import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, HeartHandshake, ShieldCheck, UserCheck, Clock, Check } from "lucide-react";
import { Image } from "@/components/ui/image";
import PageHero from "@/components/site/PageHero";
import Reveal from "@/components/site/Reveal";
import CtaSection from "@/components/site/CtaSection";
import { IMAGES } from "@/lib/images";
import { CITIES } from "@/lib/site";

export const Route = createFileRoute("/_site/caregivers")({
  head: () => ({
    meta: [
      { title: "Find a Verified Senior Companion | GoldenCares Tricity" },
      {
        name: "description",
        content:
          "How GoldenCares matches families with background-checked companions in Chandigarh, Mohali and Panchkula, what they can do, and what we never ask them to do.",
      },
    ],
  }),
  component: CaregiversPage,
});

const checks = [
  { icon: ShieldCheck, title: "Background checked", text: "Identity and address verified, with police verification reviewed before any visit." },
  { icon: UserCheck, title: "Interviewed in person", text: "We meet every companion face to face and assess patience, warmth and reliability." },
  { icon: HeartHandshake, title: "Matched, not assigned", text: "Chosen for locality, language and shared interests — someone your parent can actually talk to." },
  { icon: Clock, title: "Reliable by design", text: "Companions arrive on time, and you hear from us immediately if anything changes." },
];

const canDo = [
  "Conversation, tea-time company and gentle encouragement",
  "Accompanying to temples, markets, clinics, parks and events",
  "Walking, light hobbies, board games and reading together",
  "Help with phones, video calls, bills and online tasks",
];

const cannotDo = [
  "Overnight stays or live-in care",
  "Nursing, injections, physiotherapy or clinical treatment",
  "Medical advice or medication decisions",
  "Household work unrelated to the booked visit",
];

function CaregiversPage() {
  return (
    <>
      <PageHero
        eyebrow="Find caregivers"
        title="A companion who fits your family, not just your pin code."
        intro="We keep a small, carefully vetted group of companions across the Tricity. Tell us what your parent enjoys, and we will match someone who genuinely suits them."
      >
        <div className="flex flex-wrap gap-3">
          <Link
            to="/book"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-[0.95rem] font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
          >
            Request a match <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/join"
            className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-card px-7 py-3.5 text-[0.95rem] font-semibold text-primary"
          >
            I want to be a caregiver
          </Link>
        </div>
      </PageHero>

      <section className="container-page py-14 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <Reveal>
            <Image
              src={IMAGES.caregiver}
              alt="A GoldenCares companion standing in a sunlit home doorway"
              className="aspect-[4/5] w-full rounded-[2rem] border border-border object-cover shadow-soft"
            />
          </Reveal>
          <div>
            <Reveal>
              <h2 className="font-heading text-[2rem] leading-tight text-foreground text-balance sm:text-[2.6rem]">
                Four checks before anyone meets your parent
              </h2>
            </Reveal>
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              {checks.map(({ icon: Icon, title, text }, index) => (
                <Reveal key={title} delay={index * 0.06}>
                  <div>
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-primary">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="mt-3 text-[1rem] font-semibold text-foreground">{title}</h3>
                    <p className="mt-1.5 text-[0.88rem] leading-relaxed text-muted-foreground">{text}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-secondary/40 py-14 lg:py-20">
        <div className="container-page grid gap-5 md:grid-cols-2">
          <div className="rounded-[1.75rem] border border-border bg-card p-7">
            <h2 className="font-heading text-[1.55rem] text-foreground">What a companion can do</h2>
            <ul className="mt-5 space-y-3">
              {canDo.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-[0.94rem] leading-relaxed text-foreground/80">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[1.75rem] border border-border bg-card p-7">
            <h2 className="font-heading text-[1.55rem] text-foreground">What we do not offer</h2>
            <ul className="mt-5 space-y-3">
              {cannotDo.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-[0.94rem] leading-relaxed text-muted-foreground">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" /> {item}
                </li>
              ))}
            </ul>
            <p className="mt-6 border-t border-border pt-4 text-[0.82rem] leading-relaxed text-muted-foreground">
              For medical needs, please consult healthcare professionals.
            </p>
          </div>
        </div>
        <p className="container-page mt-6 text-[0.85rem] text-muted-foreground">
          Currently matching families in {CITIES.join(", ")}.
        </p>
      </section>

      <CtaSection
        className="py-14 lg:py-20"
        title="Tell us about your parent. We'll find the right person."
        text="Two minutes now, and we will call you back to talk through the companion, the timing and the charges."
      />
    </>
  );
}
