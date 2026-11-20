import ChoiceCard from "../ChoiceCard";
import { services } from "@/lib/services";

export default function StepService({ form, setField }) {
  return (
    <div>
      <h2 className="font-heading text-[1.6rem] leading-tight text-foreground sm:text-[1.9rem]">
        What would help most this week?
      </h2>
      <p className="mt-2 text-[0.95rem] text-muted-foreground">
        Choose one service. You can book another visit later for something else.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {services.map((service) => {
          const Icon = service.icon;
          return (
            <ChoiceCard
              key={service.slug}
              icon={Icon}
              selected={form.service_slug === service.slug}
              onClick={() => setField("service_slug", service.slug)}
              title={service.name}
              description={service.benefit}
            />
          );
        })}
      </div>
    </div>
  );
}
