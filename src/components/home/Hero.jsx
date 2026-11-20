import { Link } from "@tanstack/react-router";
import { ArrowRight, Clock, MapPin, ShieldCheck } from "lucide-react";
import { Image } from "@/components/ui/image";
import Reveal from "@/components/site/Reveal";
import { DisclaimerNote } from "@/components/site/Disclaimer";
import { IMAGES } from "@/lib/images";
import { CITIES } from "@/lib/site";

const chips = [
  { icon: ShieldCheck, label: "Background-checked companions" },
  { icon: Clock, label: "Care starts within hours" },
  { icon: MapPin, label: CITIES.join(" · ") },
];

export default function Hero() {
  return (
    <section className="relative overflow-hidden hero-glow">
      <div className="container-page grid gap-14 pb-16 pt-9 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:gap-14 lg:pb-24 lg:pt-14">
        <div>
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-card/80 px-4 py-1.5 text-[0.78rem] font-medium text-primary">
              <span className="relative flex h-2 w-2" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
              </span>
              Companions available today across the Tricity
            </span>

            <h1 className="mt-6 font-heading text-[2.65rem] leading-[1.02] text-foreground text-balance sm:text-[3.5rem] lg:text-[3.9rem]">
              Someone kind at your parent&rsquo;s door.{" "}
              <span className="italic text-primary">Often within hours.</span>
            </h1>

            <p className="mt-5 max-w-xl text-[1.05rem] leading-relaxed text-muted-foreground sm:text-[1.12rem]">
              GoldenCares sends verified, warm-hearted companions to seniors in Chandigarh, Mohali and
              Panchkula — for temple visits, walks, appointments and everyday help. Companionship that can
              start today, not next month.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                to="/book"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 text-[0.97rem] font-semibold text-primary-foreground shadow-lifted transition-transform hover:-translate-y-0.5"
              >
                Book Care Now <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-primary/25 bg-card px-7 py-3.5 text-[0.97rem] font-semibold text-primary transition-colors hover:border-primary/50"
              >
                Schedule a Call
              </Link>
            </div>

            <ul className="mt-8 flex flex-wrap gap-2.5">
              {chips.map(({ icon: Icon, label }) => (
                <li
                  key={label}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3.5 py-1.5 text-[0.8rem] font-medium text-foreground/80"
                >
                  <Icon className="h-3.5 w-3.5 text-primary" /> {label}
                </li>
              ))}
            </ul>

            <DisclaimerNote className="mt-6 max-w-md" />
          </Reveal>
        </div>

        <Reveal delay={0.12} className="relative mb-6 lg:mb-0">
          <div aria-hidden="true" className="absolute -inset-6 rounded-[3rem] bg-accent/10 blur-3xl" />
          <Image
            src={IMAGES.hero}
            alt="An adult daughter laughing with her elderly mother over tea on a sunlit verandah in Chandigarh"
            className="relative aspect-[4/5] w-full rounded-[2rem] border border-border object-cover shadow-soft"
          />
        </Reveal>
      </div>
    </section>
  );
}