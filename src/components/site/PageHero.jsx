import Reveal from "./Reveal";

export default function PageHero({ eyebrow, title, intro, children, aside }) {
  return (
    <section className="relative overflow-hidden border-b border-border bg-secondary/40 hero-glow">
      <div className="container-page relative py-14 sm:py-16 lg:py-20">
        <div className={aside ? "grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center" : ""}>
          <div>
            <Reveal>
              {eyebrow ? <p className="eyebrow text-primary/70">{eyebrow}</p> : null}
              <h1 className="mt-4 max-w-3xl font-heading text-[2.4rem] leading-[1.05] text-foreground text-balance sm:text-[3.1rem] lg:text-[3.4rem]">
                {title}
              </h1>
              {intro ? (
                <p className="mt-5 max-w-2xl text-[1.05rem] leading-relaxed text-muted-foreground sm:text-[1.1rem]">
                  {intro}
                </p>
              ) : null}
              {children ? <div className="mt-8">{children}</div> : null}
            </Reveal>
          </div>
          {aside ? <Reveal delay={0.1}>{aside}</Reveal> : null}
        </div>
      </div>
    </section>
  );
}
