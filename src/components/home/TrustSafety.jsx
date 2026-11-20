import { BadgeCheck, BellRing, ClipboardList, ShieldAlert } from "lucide-react";
import Reveal from "@/components/site/Reveal";
import { Link } from "@tanstack/react-router";

const vetting = [
  {
    icon: BadgeCheck,
    title: "Verified before the first visit",
    text: "Identity and address checked, police verification reviewed, and a face-to-face interview with our team — not a form and a phone call.",
  },
  {
    icon: ClipboardList,
    title: "Briefed before every visit",
    text: "Your parent's routine, language, mobility, gate code and the things they enjoy are shared with the companion in advance.",
  },
  {
    icon: BellRing,
    title: "A family update afterwards",
    text: "A short message or call after each visit: what you did, how they seemed, and anything you should know about.",
  },
];

const never = [
  "No overnight or live-in care",
  "No nursing, injections or physiotherapy",
  "No medical advice or medication decisions",
  "No strangers sent without a briefing",
];

export default function TrustSafety() {
  return (
    <section className="py-16 lg:py-24">
      <div className="container-page grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
        <div>
          <Reveal>
            <p className="eyebrow text-primary/70">Trust &amp; safety</p>
            <h2 className="mt-4 font-heading text-[2rem] leading-[1.08] text-foreground text-balance sm:text-[2.7rem]">
              You are handing us someone you love. We treat it that way.
            </h2>
            <p className="mt-4 max-w-lg text-[1rem] leading-relaxed text-muted-foreground">
              Every part of how we work is built for the family who cannot be there in person — and wants
              to know, precisely, what happens next.
            </p>
          </Reveal>

          <div className="mt-8 space-y-4">
            {vetting.map(({ icon: Icon, title, text }, index) => (
              <Reveal key={title} delay={index * 0.07}>
                <div className="flex gap-4 rounded-[1.5rem] border border-border bg-card p-5">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-secondary text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-heading text-[1.18rem] leading-snug text-foreground">{title}</h3>
                    <p className="mt-1 text-[0.92rem] leading-relaxed text-muted-foreground">{text}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        <Reveal delay={0.1} className="lg:sticky lg:top-32">
          <div className="rounded-[2rem] border border-border bg-primary p-7 text-primary-foreground sm:p-9">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-primary-foreground/10">
              <ShieldAlert className="h-5 w-5 text-accent" />
            </span>
            <h3 className="mt-5 font-heading text-[1.7rem] leading-tight">What we are not</h3>
            <p className="mt-3 text-[0.95rem] leading-relaxed text-primary-foreground/75">
              We would rather be clear than sound impressive. GoldenCares provides companionship and
              assistance only.
            </p>
            <ul className="mt-6 space-y-3">
              {never.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-[0.92rem] text-primary-foreground/85">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-6 border-t border-primary-foreground/15 pt-4 text-[0.85rem] leading-relaxed text-primary-foreground/60">
              For medical or nursing needs, please consult healthcare professionals.
            </p>
            <Link
              to="/policies"
              className="mt-5 inline-flex text-[0.85rem] font-semibold text-primary-foreground underline decoration-accent decoration-2 underline-offset-4"
            >
              Read our policies
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
