import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import PageHero from "@/components/site/PageHero";
import Reveal from "@/components/site/Reveal";
import FaqList from "@/components/faq/FaqList";
import { DisclaimerBand } from "@/components/site/Disclaimer";
import { faqs } from "@/lib/faqs";
import { CONTACT } from "@/lib/site";

export const Route = createFileRoute("/_site/faq")({
  head: () => ({
    meta: [
      { title: "Senior Companion Care FAQs | GoldenCares Tricity" },
      {
        name: "description",
        content:
          "Answers about safety, vetting, cost, cancellation, overnight care and what GoldenCares does not do — honest answers for families in Chandigarh, Mohali and Panchkula.",
      },
    ],
  }),
  component: FaqPage,
});

function FaqPage() {
  return (
    <>
      <PageHero
        eyebrow="Support"
        title="Questions families ask us."
        intro="If something is not answered here, write to us and a person will reply — usually the same day."
      />

      <section className="container-page py-14 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <Reveal>
            <FaqList items={faqs} />
          </Reveal>

          <Reveal delay={0.1} className="lg:sticky lg:top-32">
            <div className="rounded-[1.75rem] border border-border bg-card p-6">
              <h2 className="font-heading text-[1.4rem] leading-tight text-foreground">Still unsure?</h2>
              <p className="mt-2 text-[0.92rem] leading-relaxed text-muted-foreground">
                Most families have one specific worry. Tell us yours and we will answer it directly.
              </p>
              <a
                href={`mailto:${CONTACT.email}`}
                className="mt-4 inline-flex text-[0.9rem] font-semibold text-primary underline decoration-accent decoration-2 underline-offset-4"
              >
                {CONTACT.email}
              </a>
              <Link
                to="/contact"
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-[0.9rem] font-semibold text-primary-foreground"
              >
                Request a call <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <DisclaimerBand className="pb-6" />
    </>
  );
}
