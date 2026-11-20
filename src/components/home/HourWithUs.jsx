import { Link } from "@tanstack/react-router";
import { ArrowRight, CupSoda, Footprints, MessageSquareHeart } from "lucide-react";
import { Image } from "@/components/ui/image";
import Reveal from "@/components/site/Reveal";
import { IMAGES } from "@/lib/images";

const moments = [
  {
    time: "First 10 minutes",
    icon: CupSoda,
    title: "A familiar hello, and chai on",
    text: "Your companion arrives on time, settles in, and starts with the thing your parent actually wants: someone to talk to.",
  },
  {
    time: "The middle of the hour",
    icon: Footprints,
    title: "The plan you agreed, at their pace",
    text: "A temple visit, a market run, a slow walk in the park, a video call with grandchildren — whatever was booked, done unhurriedly.",
  },
  {
    time: "Before leaving",
    icon: MessageSquareHeart,
    title: "A tidy finish and a note to you",
    text: "Cups rinsed, bags unpacked, the door locked. Then a short message to you about how it went, and anything worth knowing.",
  },
];

export default function HourWithUs() {
  return (
    <section className="border-y border-border bg-secondary/40 py-16 lg:py-24">
      <div className="container-page grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <Reveal className="order-2 lg:order-1">
          <div className="relative">
            <Image
              src={IMAGES.tea}
              alt="A GoldenCares companion sharing tea and conversation with an elderly man in his living room"
              className="aspect-[5/4] w-full rounded-[2rem] border border-border object-cover shadow-soft"
            />
            <div className="absolute bottom-4 left-4 rounded-2xl bg-card/95 px-4 py-3 shadow-lifted backdrop-blur">
              <p className="font-heading text-[1.05rem] text-foreground">One hour. Real company.</p>
              <p className="text-[0.78rem] text-muted-foreground">Booked in minutes, remembered for days.</p>
            </div>
          </div>
        </Reveal>

        <div className="order-1 lg:order-2">
          <Reveal>
            <p className="eyebrow text-primary/70">The visit</p>
            <h2 className="mt-4 font-heading text-[2rem] leading-[1.08] text-foreground text-balance sm:text-[2.7rem]">
              What an hour with a GoldenCares companion looks like
            </h2>
            <p className="mt-4 max-w-lg text-[1rem] leading-relaxed text-muted-foreground">
              No uniforms, no clipboards, no clinical language. Just a thoughtful person who turns up
              when they said they would, and spends the hour well.
            </p>
          </Reveal>

          <ol className="mt-8 space-y-5">
            {moments.map(({ time, icon: Icon, title, text }, index) => (
              <Reveal key={title} as="li" delay={index * 0.08} className="flex gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-primary/15 bg-card text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-[0.7rem] font-semibold uppercase text-accent-foreground/60" style={{ letterSpacing: "0.16em" }}>
                    {time}
                  </p>
                  <h3 className="mt-1 font-heading text-[1.2rem] leading-snug text-foreground">{title}</h3>
                  <p className="mt-1 text-[0.93rem] leading-relaxed text-muted-foreground">{text}</p>
                </div>
              </Reveal>
            ))}
          </ol>

          <Link
            to="/how-it-works"
            className="mt-8 inline-flex items-center gap-2 text-[0.92rem] font-semibold text-primary"
          >
            See exactly how a booking works <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
