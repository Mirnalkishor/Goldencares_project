import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function FaqList({ items, className = "" }) {
  return (
    <Accordion type="single" collapsible className={`space-y-3 ${className}`}>
      {items.map((faq, index) => (
        <AccordionItem
          key={faq.q}
          value={`faq-${index}`}
          className="rounded-[1.25rem] border border-border bg-card px-5 transition-colors data-[state=open]:border-primary/30 sm:px-6"
        >
          <AccordionTrigger className="py-5 text-left font-heading text-[1.08rem] leading-snug text-foreground hover:no-underline sm:text-[1.15rem]">
            {faq.q}
          </AccordionTrigger>
          <AccordionContent className="pb-5 pr-6 text-[0.95rem] leading-relaxed text-muted-foreground">
            {faq.a}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}