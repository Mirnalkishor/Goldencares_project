import { createFileRoute } from "@tanstack/react-router";
import { HeartHandshake, Sparkles, CalendarClock } from "lucide-react";
import PageHero from "@/components/site/PageHero";
import Reveal from "@/components/site/Reveal";
import CaregiverForm from "@/components/caregivers/CaregiverForm";
import { Image } from "@/components/ui/image";
import { IMAGES } from "@/lib/images";

export const Route = createFileRoute("/_site/join")({
  head: () => ({
    meta: [
      { title: "Become a Senior Companion in Chandigarh, Mohali or Panchkula | GoldenCares" },
      {
        name: "description",
        content:
          "Apply to become a GoldenCares companion. Flexible hours, respectful work and real training for patient, dependable people across the Tricity.",
      },
    ],
  }),
  component: JoinPage,
});

const reasons = [
  {
    icon: HeartHandshake,
    title: "Work that means something",
    text: "An hour of your time can change an older person's whole week. Our companions tell us it goes both ways.",
  },
  {
    icon: CalendarClock,
    title: "Hours that fit your life",
    text: "Visits are booked in one, two or three hour blocks between 7 am and 9 pm. You tell us when you are free.",
  },
  {
    icon: Sparkles,
    title: "Prepared, never thrown in",
    text: "You are briefed on the family's routine before every visit, and you always have someone to call.",
  },
];

function JoinPage() {
  return (
    <>
      <PageHero
        eyebrow="Join as a caregiver"
        title="Good company is a skill. If you have it, we would like to meet you."
        intro="GoldenCares companions are patient, dependable people who genuinely enjoy older people's company. Apply below and we will call you for a short conversation."
        aside={
          <Image
            src={IMAGES.digital}
            alt="A GoldenCares companion helping an elderly woman use a smartphone at home"
            className="aspect-[5/4] w-full rounded-[2rem] border border-border object-cover shadow-soft"
          />
        }
      />

      <section className="container-page py-14 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_0.7fr] lg:items-start">
          <div>
            <Reveal>
              <h2 className="font-heading text-[1.9rem] leading-tight text-foreground">Apply to join the team</h2>
              <p className="mt-2 max-w-xl text-[0.95rem] leading-relaxed text-muted-foreground">
                Fields marked with nothing are optional — we only need your name, phone and city to start.
              </p>
            </Reveal>
            <div className="mt-7">
              <CaregiverForm />
            </div>
          </div>

          <aside className="space-y-4">
            {reasons.map(({ icon: Icon, title, text }, index) => (
              <Reveal key={title} delay={index * 0.07}>
                <div className="rounded-[1.5rem] border border-border bg-card p-6">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 font-heading text-[1.2rem] leading-snug text-foreground">{title}</h3>
                  <p className="mt-1.5 text-[0.9rem] leading-relaxed text-muted-foreground">{text}</p>
                </div>
              </Reveal>
            ))}
            <div className="rounded-[1.5rem] border border-border bg-secondary/60 p-6">
              <p className="text-[0.85rem] leading-relaxed text-foreground/75">
                We never ask companions to provide nursing or medical care, and we never send anyone to a
                home without a briefing first.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
