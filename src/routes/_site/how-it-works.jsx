import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BellRing, CalendarCheck, Check, ClipboardList, PhoneCall, ShieldCheck } from "lucide-react";
import PageHero from "@/components/site/PageHero";
import Reveal from "@/components/site/Reveal";
import { DisclaimerBand } from "@/components/site/Disclaimer";
import CtaSection from "@/components/site/CtaSection";
import { CONTACT } from "@/lib/site";

export const Route = createFileRoute("/_site/how-it-works")({
  head: () => ({
    meta: [
      { title: "How GoldenCares Works | Booking a Senior Companion" },
      {
        name: "description",
        content:
          "From a two-minute booking to a verified companion at your parent's door: how GoldenCares vets, briefs and updates families across Chandigarh, Mohali and Panchkula.",
      },
    ],
  }),
  component: HowItWorksPage,
});

const steps = [
  {
    icon: PhoneCall,
    title: "You tell us what you need",
    text: "Five short steps online — service, hours, city and area, date and time, then how to reach you. If you would rather talk, write to us and we will call.",
    points: [
      "Sign in or create an account before booking",
      "Phone number and email required for booking",
      "Inline validation, so nothing is lost on submit",
    ],
  },
  {
    icon: ClipboardList,
    title: "We match, brief and confirm",
    text: "We choose a verified companion for your parent's area, language and interests, brief them on the routine, and call you to confirm the details and timing.",
    points: [
      "Matched on locality, language and interests",
      "Briefed before the visit, never on the doorstep",
      "You see the fixed quote before submitting the request",
    ],
  },
  {
    icon: CalendarCheck,
    title: "The visit happens — and you hear about it",
    text: "The companion arrives at the agreed time and stays for the hours you booked. Afterwards you receive a short update, and the same familiar face where possible.",
    points: [
      "On-time arrival, agreed hours, no surprises",
      "A short update after every visit",
      "Reschedule or cancel whenever you need to",
    ],
  },
];

function HowItWorksPage() {
  return (
    <>
      <PageHero
        eyebrow="How it works"
        title="From a worried afternoon to a booked visit, in three steps."
        intro="No long forms, no waiting for a sales call, no guessing what it will cost. Here is exactly what happens after you press Book Care Now."
      />

      <section className="container-page py-14 lg:py-20">
        <ol className="space-y-5">
          {steps.map(({ icon: Icon, title, text, points }, index) => (
            <Reveal
              key={title}
              as="li"
              delay={index * 0.06}
              className="grid gap-7 rounded-[1.75rem] border border-border bg-card p-6 sm:p-8 md:grid-cols-[0.4fr_0.6fr]"
            >
              <div>
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-secondary text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="font-heading text-[0.95rem] text-accent-foreground/70">Step 0{index + 1}</span>
                </div>
                <h2 className="mt-4 font-heading text-[1.7rem] leading-tight text-foreground">{title}</h2>
              </div>
              <div>
                <p className="text-[0.98rem] leading-relaxed text-muted-foreground">{text}</p>
                <ul className="mt-5 space-y-2.5">
                  {points.map((point) => (
                    <li key={point} className="flex items-start gap-2.5 text-[0.92rem] text-foreground/80">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {point}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </ol>
      </section>

      <section className="border-y border-border bg-secondary/40 py-14 lg:py-20">
        <div className="container-page grid gap-8 md:grid-cols-3">
          {[
            {
              icon: ShieldCheck,
              title: "Verified people only",
              text: "Identity, address and police verification reviewed, plus an in-person interview with our team.",
            },
            {
              icon: BellRing,
              title: "You are never in the dark",
              text: "A short update after every visit, and a person you can call between them.",
            },
            {
              icon: CalendarCheck,
              title: "Cancel without drama",
              text: `Tell us as early as you can at ${CONTACT.email} and we will move or cancel the visit.`,
            },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-[1.5rem] border border-border bg-card p-6">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-primary">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-heading text-[1.2rem] text-foreground">{title}</h3>
              <p className="mt-1.5 text-[0.9rem] leading-relaxed text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <DisclaimerBand className="py-12" />

      <section className="container-page py-6 lg:py-10">
        <div className="flex flex-col items-start justify-between gap-5 rounded-[1.75rem] border border-border bg-card p-7 sm:flex-row sm:items-center sm:p-9">
          <div>
            <h2 className="font-heading text-[1.7rem] leading-tight text-foreground">Ready when you are.</h2>
            <p className="mt-1.5 text-[0.93rem] text-muted-foreground">
              Most requests are confirmed within a couple of hours during {CONTACT.hours.toLowerCase()}.
            </p>
          </div>
          <Link
            to="/book"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-[0.92rem] font-semibold text-primary-foreground"
          >
            Book Care Now <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <CtaSection className="py-10 lg:py-16" />
    </>
  );
}
