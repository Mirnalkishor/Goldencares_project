import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, Clock, ShieldCheck } from "lucide-react";
import Reveal from "@/components/site/Reveal";
import CtaSection from "@/components/site/CtaSection";
import { CallAction, EmailAction } from "@/components/site/ContactActions";
import { serviceBySlug, services } from "@/lib/services";
import { CITIES, CONTACT } from "@/lib/site";

export const Route = createFileRoute("/_site/services/$slug")({
  loader: ({ params }) => {
    const service = serviceBySlug(params.slug);
    if (!service) throw notFound();
    return { slug: service.slug, name: service.name, benefit: service.benefit, intro: service.intro };
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData
          ? `${loaderData.name} for Seniors in Chandigarh, Mohali & Panchkula | GoldenCares`
          : "Service | GoldenCares",
      },
      {
        name: "description",
        content: loaderData
          ? `${loaderData.benefit} ${loaderData.intro}`.slice(0, 158)
          : "Companionship and assistance for seniors in the Tricity.",
      },
    ],
  }),
  component: ServiceDetailPage,
});

function ServiceDetailPage() {
  const loaderData = Route.useLoaderData();
  const service = serviceBySlug(loaderData.slug);
  const related = services.filter((item) => item.slug !== service.slug).slice(0, 3);
  const Icon = service.icon;

  return (
    <>
      <section className="relative overflow-hidden border-b border-border bg-secondary/40 hero-glow">
        <div className="container-page py-10 lg:py-16">
          <Link
            to="/services"
            className="inline-flex items-center gap-1.5 text-[0.82rem] font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> All services
          </Link>

          <div className="mt-6 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
            <Reveal>
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-foreground">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="rounded-full border border-border bg-card px-3 py-1 text-[0.7rem] font-semibold uppercase text-muted-foreground" style={{ letterSpacing: "0.14em" }}>
                  {service.category}
                </span>
              </div>
              <h1 className="mt-5 font-heading text-[2.4rem] leading-[1.04] text-foreground text-balance sm:text-[3.2rem]">
                {service.name}
              </h1>
              <p className="mt-3 text-[1.1rem] font-medium text-primary/80">{service.benefit}</p>
              <p className="mt-4 max-w-xl text-[1rem] leading-relaxed text-muted-foreground">{service.intro}</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  to="/book"
                  search={{ service: service.slug }}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-[0.95rem] font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
                >
                  Book this service <ArrowRight className="h-4 w-4" />
                </Link>
                <CallAction className="border border-primary/25 bg-card px-6 py-3.5 text-primary hover:border-primary/50" />
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <div className="rounded-[1.75rem] border border-border bg-card p-6 sm:p-7">
                <h2 className="font-heading text-[1.3rem] text-foreground">What it includes</h2>
                <ul className="mt-4 space-y-3">
                  {service.looks.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-[0.93rem] leading-relaxed text-foreground/80">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {item}
                    </li>
                  ))}
                </ul>

                <div className="mt-6 space-y-2.5 border-t border-border pt-5 text-[0.85rem] text-muted-foreground">
                  <p className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" /> Book for {service.durations.join(", ")} hours
                  </p>
                  <p className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary" /> Verified, briefed companion
                  </p>
                </div>

                <p className="mt-4 text-[0.82rem] leading-relaxed text-muted-foreground">
                  Charges are confirmed with you on the phone before the visit. Nothing is charged on this
                  website.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="container-page py-14 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <h2 className="font-heading text-[1.8rem] leading-tight text-foreground">
              How a {service.name.toLowerCase()} visit usually goes
            </h2>
            <ol className="mt-6 space-y-4">
              {[
                "You book the service, hours and city — two minutes online, no account needed.",
                `We call you to confirm the companion, the timing and the charges for ${CITIES.join(", ")}.`,
                "The companion arrives on time and stays for the hours you booked.",
                "You get a short update afterwards, and the same companion next time where possible.",
              ].map((step, index) => (
                <li key={step} className="flex gap-4 rounded-[1.25rem] border border-border bg-card p-5">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-secondary text-[0.78rem] font-semibold text-primary">
                    {index + 1}
                  </span>
                  <p className="text-[0.94rem] leading-relaxed text-foreground/80">{step}</p>
                </li>
              ))}
            </ol>

            {service.note ? (
              <p className="mt-6 rounded-[1.25rem] border border-accent/40 bg-accent/10 p-5 text-[0.9rem] leading-relaxed text-foreground/80">
                <strong className="font-semibold">Please note:</strong> {service.note}
              </p>
            ) : null}

            <p className="mt-6 text-[0.85rem] leading-relaxed text-muted-foreground">
              GoldenCares provides companionship and assistance only. No overnight care, no medical or
              nursing services, no clinical treatment. Questions? Write to{" "}
              <a href={`mailto:${CONTACT.email}`} className="font-semibold text-primary">
                {CONTACT.email}
              </a>
              .
            </p>
          </div>

          <aside className="rounded-[1.75rem] border border-border bg-secondary/50 p-6">
            <h2 className="font-heading text-[1.25rem] text-foreground">Choose your hours</h2>
            <p className="mt-2 text-[0.88rem] leading-relaxed text-muted-foreground">
              Pick a duration and we will take you straight to the booking form.
            </p>
            <div className="mt-4 flex flex-col gap-2.5">
              {service.durations.map((hours) => (
                <Link
                  key={hours}
                  to="/book"
                  search={{ service: service.slug, duration: hours }}
                  className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-[0.92rem] font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary"
                >
                  {hours} {hours === 1 ? "hour" : "hours"} <ArrowRight className="h-4 w-4" />
                </Link>
              ))}
            </div>
            <div className="mt-5 border-t border-border pt-4">
              <EmailAction className="w-full justify-start px-0 text-[0.85rem] font-medium text-muted-foreground" />
            </div>
          </aside>
        </div>
      </section>

      <section className="container-page pb-14">
        <h2 className="font-heading text-[1.6rem] text-foreground">Other services families book</h2>
        <ul className="mt-5 grid gap-4 sm:grid-cols-3">
          {related.map((item) => {
            const RelatedIcon = item.icon;
            return (
              <li key={item.slug} className="rounded-[1.25rem] border border-border bg-card p-5">
                <RelatedIcon className="h-5 w-5 text-primary" />
                <h3 className="mt-3 font-heading text-[1.1rem] text-foreground">
                  <Link to="/services/$slug" params={{ slug: item.slug }}>
                    {item.name}
                  </Link>
                </h3>
                <p className="mt-1.5 text-[0.86rem] leading-relaxed text-muted-foreground">{item.benefit}</p>
              </li>
            );
          })}
        </ul>
      </section>

      <CtaSection className="py-10 lg:py-16" />
    </>
  );
}
