import ChoiceCard from "../ChoiceCard";
import { serviceBySlug } from "@/lib/services";

const NOTES = {
  1: "Good for a short visit, a walk or a single errand.",
  2: "Most families start here — enough time to settle in.",
  3: "Best for outings, appointments with waiting, or films.",
};

export default function StepDuration({ form, setField }) {
  const service = serviceBySlug(form.service_slug);
  const durations = service?.durations || [1, 2, 3];

  return (
    <div>
      <h2 className="font-heading text-[1.6rem] leading-tight text-foreground sm:text-[1.9rem]">
        How long should the visit be?
      </h2>
      <p className="mt-2 text-[0.95rem] text-muted-foreground">
        {service ? `${service.name} visits run for ` : "Visits run for "}
        {durations.join(", ")} hours. You can extend a visit later by asking us.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {durations.map((hours) => (
          <ChoiceCard
            key={hours}
            selected={Number(form.duration_hours) === hours}
            onClick={() => setField("duration_hours", hours)}
            title={`${hours} ${hours === 1 ? "hour" : "hours"}`}
            description={NOTES[hours] || "Flexible, unhurried time."}
          />
        ))}
      </div>

      <p className="mt-5 rounded-xl border border-border bg-secondary/50 p-4 text-[0.85rem] leading-relaxed text-muted-foreground">
        Not sure? Two hours is the safest choice — long enough to settle in without feeling rushed, and we
        can always adjust it when we call.
      </p>
    </div>
  );
}
