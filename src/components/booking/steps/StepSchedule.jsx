import ChoiceCard from "../ChoiceCard";

const SLOTS = [
  { value: "Morning (8–11 am)", title: "Morning", description: "8 am – 11 am, good for walks and temples." },
  { value: "Afternoon (12–4 pm)", title: "Afternoon", description: "12 pm – 4 pm, good for clinics and errands." },
  { value: "Evening (4–8 pm)", title: "Evening", description: "4 pm – 8 pm, good for parks and company." },
];

function isoOffset(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export default function StepSchedule({ form, setField }) {
  const quick = [
    { label: "Today", value: isoOffset(0) },
    { label: "Tomorrow", value: isoOffset(1) },
    { label: "In a few days", value: isoOffset(3) },
  ];

  return (
    <div>
      <h2 className="font-heading text-[1.6rem] leading-tight text-foreground sm:text-[1.9rem]">
        When suits your parent?
      </h2>
      <p className="mt-2 text-[0.95rem] text-muted-foreground">
        Choose a day and a rough time. Nothing is fixed until we confirm it with you by phone.
      </p>

      <div className="mt-6">
        <label htmlFor="date" className="label-strong">
          Preferred date
        </label>
        <input
          id="date"
          type="date"
          value={form.preferred_date}
          onChange={(event) => setField("preferred_date", event.target.value)}
          className="field max-w-xs"
        />
        <div className="mt-2.5 flex flex-wrap gap-2">
          {quick.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => setField("preferred_date", item.value)}
              className={`rounded-full border px-3.5 py-1.5 text-[0.8rem] font-medium transition-colors ${
                form.preferred_date === item.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground/75 hover:border-primary/40"
              }`}
            >
              {item.label}
            </button>
          ))}
          {form.preferred_date ? (
            <button
              type="button"
              onClick={() => setField("preferred_date", "")}
              className="rounded-full px-3 py-1.5 text-[0.8rem] font-medium text-muted-foreground underline underline-offset-4"
            >
              Clear
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-6">
        <span className="label-strong">Preferred time</span>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          {SLOTS.map((slot) => (
            <ChoiceCard
              key={slot.title}
              selected={form.preferred_time === slot.value}
              onClick={() => setField("preferred_time", slot.value)}
              title={slot.title}
              description={slot.description}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
