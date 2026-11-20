import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import Reveal from "@/components/site/Reveal";
import { services } from "@/lib/services";

export default function ServicesGrid() {
  return (
    <section className="border-y border-border bg-secondary/40 py-16 lg:py-24">
      <div className="container-page">
        <Reveal className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="eyebrow text-primary/70">Services</p>
            <h2 className="mt-4 font-heading text-[2rem] leading-[1.08] text-foreground text-balance sm:text-[2.7rem]">
              Eight small things that change a week
            </h2>
            <p className="mt-4 text-[1rem] leading-relaxed text-muted-foreground">
              Each service is bookable for one, two or three hours. Choose one, and we will do it properly.
            </p>
          </div>
          <Link
            to="/services"
            className="inline-flex shrink-0 items-center gap-2 text-[0.92rem] font-semibold text-primary"
          >
            All services <ArrowRight className="h-4 w-4" />
          </Link>
        </Reveal>

        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <Reveal
                key={service.slug}
                as="li"
                delay={(index % 4) * 0.05}
                className="group relative flex h-full flex-col rounded-[1.5rem] border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-lifted"
              >
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-secondary text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 font-heading text-[1.25rem] leading-snug text-foreground">
                    <Link to="/services/$slug" params={{ slug: service.slug }} className="after:absolute after:inset-0">
                      {service.name}
                    </Link>
                  </h3>
                  <p className="mt-2 flex-1 text-[0.9rem] leading-relaxed text-muted-foreground">
                    {service.benefit}
                  </p>
                  <div className="relative mt-5 flex items-center justify-between border-t border-border pt-4">
                    <span className="text-[0.72rem] uppercase text-muted-foreground" style={{ letterSpacing: "0.14em" }}>
                      {service.durations.join(" · ")} hr
                    </span>
                    <Link
                      to="/book"
                      search={{ service: service.slug }}
                      className="relative z-10 inline-flex items-center gap-1 text-[0.82rem] font-semibold text-primary"
                      aria-label={`Book ${service.name}`}
                    >
                      Book <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
              </Reveal>
            );
          })}
        </ul>
      </div>
    </section>
  );
}