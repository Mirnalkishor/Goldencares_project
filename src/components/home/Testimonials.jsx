import { Quote } from "lucide-react";
import Reveal from "@/components/site/Reveal";

const placeholders = [
  {
    prompt: "[REAL TESTIMONIAL]",
    detail: "Daughter, Sector 21 Chandigarh — one line about the first visit and how her mother seemed afterwards.",
  },
  {
    prompt: "[REAL TESTIMONIAL]",
    detail: "Son living in Bengaluru, booking for a father in Mohali — one line about trust and updates.",
  },
  {
    prompt: "[REAL TESTIMONIAL]",
    detail: "Senior in Panchkula — one line, in their own words, about the companion and the walk they take.",
  },
];

export default function Testimonials() {
  return (
    <section className="py-16 lg:py-24">
      <div className="container-page">
        <Reveal className="max-w-2xl">
          <p className="eyebrow text-primary/70">Families</p>
          <h2 className="mt-4 font-heading text-[2rem] leading-[1.08] text-foreground text-balance sm:text-[2.7rem]">
            In their words
          </h2>
          <p className="mt-4 text-[1rem] leading-relaxed text-muted-foreground">
            We only publish quotes we can verify and names we have permission to use. This section is
            reserved for the first families who agree to be quoted.
          </p>
        </Reveal>

        <ul className="mt-10 grid gap-4 md:grid-cols-3">
          {placeholders.map((item, index) => (
            <Reveal
              key={item.detail}
              as="li"
              delay={index * 0.07}
              className="flex h-full flex-col rounded-[1.5rem] border border-dashed border-border bg-card/60 p-6"
            >
                <Quote className="h-6 w-6 text-accent" aria-hidden="true" />
                <p className="mt-4 font-heading text-[1.1rem] text-foreground/70">{item.prompt}</p>
                <p className="mt-2 flex-1 text-[0.86rem] leading-relaxed text-muted-foreground">{item.detail}</p>
                <span className="mt-5 inline-flex w-fit rounded-full bg-secondary px-3 py-1 text-[0.7rem] font-semibold uppercase text-secondary-foreground" style={{ letterSpacing: "0.12em" }}>
                  Awaiting verified quote
                </span>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}