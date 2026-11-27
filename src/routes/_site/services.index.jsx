import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import PageHero from "@/components/site/PageHero";
import Reveal from "@/components/site/Reveal";
import { DisclaimerBand } from "@/components/site/Disclaimer";
import CtaSection from "@/components/site/CtaSection";
import { useLiveServices } from "@/lib/serviceCatalog";

export const Route = createFileRoute("/_site/services/")({
  head: () => ({
    meta: [
      { title: "Senior Companion Services in Chandigarh, Mohali & Panchkula | GoldenCares" },
      {
        name: "description",
        content:
          "Temple visits, shopping, community visits, evening outings, doctor visit accompaniment, films, walks and online help for seniors. Bookable for 1, 2 or 3 hours.",
      },
    ],
  }),
  component: ServicesPage,
});

function ServicesPage() {
  const { services } = useLiveServices();
  return (
    <>
      <PageHero
        eyebrow="Services"
        title="Small hours, spent well."
        intro={`${services.length} services, each with clear, upfront pricing. Choose what your parent actually needs this week — we handle the rest, properly.`}
      >
        <Link
          to="/book"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-[0.95rem] font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
        >
          Book Care Now <ArrowRight className="h-4 w-4" />
        </Link>
      </PageHero>

      <section className="container-page py-14 lg:py-20">
        <ul className="grid gap-5 md:grid-cols-2">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <Reveal
                key={service.slug}
                as="li"
                delay={(index % 2) * 0.06}
                className="group flex h-full flex-col rounded-[1.75rem] border border-border bg-card p-6 transition-all duration-300 hover:border-primary/25 hover:shadow-lifted sm:p-8"
              >
                  <div className="flex items-start justify-between gap-4">
                    <span className="grid h-12 w-12 place-items-center rounded-full bg-secondary text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="rounded-full border border-border px-3 py-1 text-[0.68rem] font-semibold uppercase text-muted-foreground" style={{ letterSpacing: "0.14em" }}>
                      {service.category}
                    </span>
                  </div>
                  <h2 className="mt-5 font-heading text-[1.6rem] leading-tight text-foreground">{service.name}</h2>
                  <p className="mt-2 text-[1rem] font-medium text-primary/80">{service.benefit}</p>
                  <p className="mt-3 flex-1 text-[0.94rem] leading-relaxed text-muted-foreground">{service.intro}</p>

                  <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
                    <span className="text-[0.75rem] uppercase text-muted-foreground" style={{ letterSpacing: "0.14em" }}>
                      {service.durations.join(" · ")} hours
                    </span>
                    <div className="flex items-center gap-4">
                      <Link
                        to="/services/$slug"
                        params={{ slug: service.slug }}
                        className="text-[0.85rem] font-semibold text-foreground/70 transition-colors hover:text-primary"
                      >
                        Details
                      </Link>
                      <Link
                        to="/book"
                        search={{ service: service.slug }}
                        className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-[0.82rem] font-semibold text-primary-foreground"
                        aria-label={`Book ${service.name}`}
                      >
                        Book <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
              </Reveal>
            );
          })}
        </ul>
      </section>

      <DisclaimerBand className="pb-4" />
      <CtaSection className="py-14 lg:py-20" />
    </>
  );
}
