import { Link } from "@tanstack/react-router";
import { ArrowRight, CalendarCheck, HeartHandshake, PhoneCall } from "lucide-react";
import Reveal from "@/components/site/Reveal";

const steps = [
  {
    icon: PhoneCall,
    title: "Tell us what you need",
    text: "Two minutes, five short steps: the service, the hours, your city, and how to reach you. No account needed, no long forms.",
    meta: "Takes about 2 minutes",
  },
  {
    icon: HeartHandshake,
    title: "We match and confirm",
    text: "We pick a verified companion who suits your parent's area, language and interests, then call you to confirm the time and charges.",
    meta: "Usually within a couple of hours",
  },
  {
    icon: CalendarCheck,
    title: "Care begins, and you hear about it",
    text: "The companion arrives on time and spends the booked hours as agreed. Afterwards you get a short update — and the same companion next time.",
    meta: "Same-day starts are common",
  },
];

export default function Steps() {
  return (
    <section className="py-16 lg:py-24">
      <div className="container-page">
        <Reveal className="max-w-2xl">
          <p className="eyebrow text-primary/70">How it works</p>
          <h2 className="mt-4 font-heading text-[2rem] leading-[1.08] text-foreground text-balance sm:text-[2.7rem]">
            Three calm steps from worry to company
          </h2>
          <p className="mt-4 text-[1rem] leading-relaxed text-muted-foreground">
            Designed for a family that is anxious and short on time. Nothing here asks you to fill a
            fourteen-field form or wait days for a callback.
          </p>
        </Reveal>

        <div className="relative mt-12">
          <div aria-hidden="true" className="absolute left-0 right-0 top-[1.6rem] hidden border-t border-dashed border-border lg:block" />
          <ol className="grid gap-8 lg:grid-cols-3 lg:gap-10">
            {steps.map(({ icon: Icon, title, text, meta }, index) => (
              <Reveal key={title} as="li" delay={index * 0.08} className="relative">
                <div className="flex items-center gap-3">
                  <span className="relative z-10 grid place-items-center rounded-full border border-border bg-card text-primary shadow-lifted" style={{ height: "3.25rem", width: "3.25rem" }}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="font-heading text-[0.95rem] text-accent-foreground/70">Step 0{index + 1}</span>
                </div>
                <h3 className="mt-5 font-heading text-[1.45rem] leading-snug text-foreground">{title}</h3>
                <p className="mt-2 text-[0.95rem] leading-relaxed text-muted-foreground">{text}</p>
                <p className="mt-3 inline-flex rounded-full bg-secondary px-3 py-1 text-[0.75rem] font-medium text-secondary-foreground">
                  {meta}
                </p>
              </Reveal>
            ))}
          </ol>
        </div>

        <Reveal delay={0.1}>
          <div className="mt-12 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <Link
              to="/book"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-[0.95rem] font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
            >
              Start a booking <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="text-[0.88rem] text-muted-foreground">
              Not sure yet?{" "}
              <Link to="/contact" className="font-semibold text-primary underline decoration-accent decoration-2 underline-offset-4">
                Ask us to call you
              </Link>
              .
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
