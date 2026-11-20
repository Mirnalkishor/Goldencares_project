import { Link } from "@tanstack/react-router";
import { ArrowRight, Clock } from "lucide-react";
import Reveal from "./Reveal";
import { CallAction, WhatsAppAction } from "./ContactActions";
import { CONTACT } from "@/lib/site";

export default function CtaSection({
  title = "Book care today. Peace of mind tonight.",
  text = "Tell us what your parent needs. See the price before you submit, pay securely with PayU if you choose, and we will call to confirm the visit details.",
  className = "",
}) {
  return (
    <section className={`container-page ${className}`}>
      <Reveal>
        <div className="relative overflow-hidden rounded-[2rem] bg-primary px-6 py-12 text-primary-foreground sm:px-10 lg:px-14 lg:py-16">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent/20 blur-3xl"
          />
          <div className="relative max-w-2xl">
            <p className="text-[0.7rem] font-semibold uppercase text-primary-foreground/60" style={{ letterSpacing: "0.24em" }}>
              Start here
            </p>
            <h2 className="mt-4 font-heading text-[2rem] leading-[1.08] text-balance sm:text-[2.6rem]">{title}</h2>
            <p className="mt-4 text-[1rem] leading-relaxed text-primary-foreground/75">{text}</p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                to="/book"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-background px-7 py-3.5 text-[0.95rem] font-semibold text-primary transition-transform hover:-translate-y-0.5"
              >
                Book Care Now <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-primary-foreground/25 px-7 py-3.5 text-[0.95rem] font-semibold text-primary-foreground transition-colors hover:border-primary-foreground/60"
              >
                Schedule a Call
              </Link>
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 text-[0.85rem] text-primary-foreground/70">
              <span className="inline-flex items-center gap-2">
                <Clock className="h-4 w-4" /> {CONTACT.hoursShort}
              </span>
              <a href={`mailto:${CONTACT.email}`} className="hover:text-primary-foreground">
                {CONTACT.email}
              </a>
              <CallAction className="text-primary-foreground/80 hover:text-primary-foreground" label="Call" />
              <WhatsAppAction className="text-primary-foreground/80 hover:text-primary-foreground" />
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}