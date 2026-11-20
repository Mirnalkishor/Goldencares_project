import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import Reveal from "@/components/site/Reveal";
import FaqList from "@/components/faq/FaqList";
import { homeFaqs } from "@/lib/faqs";

export default function FaqTeaser() {
  return (
    <section className="border-y border-border bg-secondary/40 py-16 lg:py-24">
      <div className="container-page grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
        <Reveal>
          <p className="eyebrow text-primary/70">Worries, answered</p>
          <h2 className="mt-4 font-heading text-[2rem] leading-[1.08] text-foreground text-balance sm:text-[2.7rem]">
            The questions families ask us first
          </h2>
          <p className="mt-4 text-[1rem] leading-relaxed text-muted-foreground">
            Safety, cost, cancellation, and the things we deliberately do not do. If your question is not
            here, write to us and a person will answer.
          </p>
          <Link
            to="/faq"
            className="mt-6 inline-flex items-center gap-2 text-[0.92rem] font-semibold text-primary"
          >
            All questions <ArrowRight className="h-4 w-4" />
          </Link>
        </Reveal>

        <Reveal delay={0.08}>
          <FaqList items={homeFaqs} />
        </Reveal>
      </div>
    </section>
  );
}
