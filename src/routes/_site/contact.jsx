import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, Mail, MapPin, ArrowRight } from "lucide-react";
import PageHero from "@/components/site/PageHero";
import Reveal from "@/components/site/Reveal";
import CallbackForm from "@/components/contact/CallbackForm";
import { DisclaimerNote } from "@/components/site/Disclaimer";
import { CallAction, WhatsAppAction } from "@/components/site/ContactActions";
import { CITIES, CONTACT } from "@/lib/site";

export const Route = createFileRoute("/_site/contact")({
  head: () => ({
    meta: [
      { title: "Contact GoldenCares | Chandigarh, Mohali & Panchkula" },
      {
        name: "description",
        content:
          "Talk to GoldenCares about companionship for your parent. Email info@goldencares.in, request a call back, or book a visit online.",
      },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="One conversation is usually enough."
        intro="Tell us what is worrying you about your parent, and we will tell you honestly whether we can help — and what it would look like."
      />

      <section className="container-page py-14 lg:py-20">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <Reveal>
            <div className="space-y-4">
              <a
                href={`mailto:${CONTACT.email}`}
                className="flex items-start gap-4 rounded-[1.5rem] border border-border bg-card p-5 transition-colors hover:border-primary/40"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-secondary text-primary">
                  <Mail className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-[0.7rem] font-semibold uppercase text-muted-foreground" style={{ letterSpacing: "0.16em" }}>
                    Email us
                  </span>
                  <span className="mt-1 block text-[1rem] font-medium text-foreground">{CONTACT.email}</span>
                  <span className="mt-1 block text-[0.85rem] text-muted-foreground">
                    A person replies, usually the same day.
                  </span>
                </span>
              </a>

              <div className="flex items-start gap-4 rounded-[1.5rem] border border-border bg-card p-5">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-secondary text-primary">
                  <Clock className="h-5 w-5" />
                </span>
                <div>
                  <span className="block text-[0.7rem] font-semibold uppercase text-muted-foreground" style={{ letterSpacing: "0.16em" }}>
                    When we are reachable
                  </span>
                  <p className="mt-1 text-[1rem] font-medium text-foreground">{CONTACT.hours}</p>
                  <p className="mt-1 text-[0.85rem] text-muted-foreground">
                    Visits are booked in 1, 2 or 3 hour blocks within these hours.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 rounded-[1.5rem] border border-border bg-card p-5">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-secondary text-primary">
                  <MapPin className="h-5 w-5" />
                </span>
                <div>
                  <span className="block text-[0.7rem] font-semibold uppercase text-muted-foreground" style={{ letterSpacing: "0.16em" }}>
                    Where we work
                  </span>
                  <p className="mt-1 text-[1rem] font-medium text-foreground">{CITIES.join(" · ")}</p>
                  <p className="mt-1 text-[0.85rem] text-muted-foreground">{CONTACT.address}</p>
                </div>
              </div>

              <div className="rounded-[1.5rem] bg-primary p-6 text-primary-foreground">
                <h2 className="font-heading text-[1.4rem] leading-tight">Prefer to book straight away?</h2>
                <p className="mt-2 text-[0.9rem] leading-relaxed text-primary-foreground/75">
                  Five short steps, two minutes, no account needed. We confirm everything by phone before
                  the visit.
                </p>
                <Link
                  to="/book"
                  className="mt-5 inline-flex items-center gap-2 rounded-full bg-background px-6 py-3 text-[0.9rem] font-semibold text-primary"
                >
                  Book Care Now <ArrowRight className="h-4 w-4" />
                </Link>
                <div className="mt-5 flex flex-wrap gap-2">
                  <CallAction className="border border-primary-foreground/25 px-4 py-2.5 text-primary-foreground" />
                  <WhatsAppAction className="border border-primary-foreground/25 px-4 py-2.5 text-primary-foreground" />
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="lg:sticky lg:top-32">
              <CallbackForm />
              <DisclaimerNote className="mt-5 px-1" />
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
