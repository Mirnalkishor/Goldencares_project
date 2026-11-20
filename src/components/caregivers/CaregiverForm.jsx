import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { CITIES } from "@/lib/site";
import { isValidEmail, isValidPhoneNumber } from "@/lib/validation";
import { ArrowRight, Check, Loader2 } from "lucide-react";

const EXPERIENCE = ["Less than a year", "1–3 years", "3–5 years", "More than 5 years"];

export default function CaregiverForm() {
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    city: "",
    experience: EXPERIENCE[1],
    languages: "",
    availability: "",
    message: "",
  });
  const [state, setState] = useState("idle");
  const [error, setError] = useState("");

  const update = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  async function handleSubmit(event) {
    event.preventDefault();
    if (!form.full_name.trim() || !isValidPhoneNumber(form.phone) || !CITIES.includes(form.city)) {
      setError("Please add your name, a valid phone number and your city so we can reach you.");
      return;
    }
    if (form.email && !isValidEmail(form.email)) {
      setError("Please check your email address, or leave it blank.");
      return;
    }
    setError("");
    setState("saving");
    try {
      await base44.entities.CaregiverApplication.create({ ...form, status: "new" });
      setState("done");
    } catch (err) {
      setState("idle");
      setError(err?.message || "We could not send your application. Please try again.");
    }
  }

  if (state === "done") {
    return (
      <div className="rounded-[2rem] border border-border bg-card p-7 sm:p-10">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground">
          <Check className="h-6 w-6" />
        </span>
        <h2 className="mt-6 font-heading text-[2rem] leading-tight text-foreground">
          Thank you, {form.full_name.split(" ")[0]}.
        </h2>
        <p className="mt-3 max-w-lg text-[1rem] leading-relaxed text-muted-foreground">
          Your application is with our team. If your experience fits, we will call you for a short
          conversation, then meet in person in {form.city} before any visit is offered.
        </p>
        <p className="mt-4 text-[0.88rem] text-muted-foreground">
          Nothing more is needed from you right now.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="rounded-[2rem] border border-border bg-card p-6 sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="c-name" className="label-strong">Your name</label>
          <input id="c-name" value={form.full_name} onChange={update("full_name")} className="field" autoComplete="name" />
        </div>
        <div>
          <label htmlFor="c-phone" className="label-strong">Phone number</label>
          <input id="c-phone" type="tel" value={form.phone} onChange={update("phone")} className="field" autoComplete="tel" />
        </div>
        <div>
          <label htmlFor="c-email" className="label-strong">Email <span className="font-normal text-muted-foreground">(optional)</span></label>
          <input id="c-email" type="email" value={form.email} onChange={update("email")} className="field" autoComplete="email" />
        </div>
        <div>
          <label htmlFor="c-city" className="label-strong">City</label>
          <select id="c-city" value={form.city} onChange={update("city")} className="field">
            <option value="">Select city</option>
            {CITIES.map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="c-exp" className="label-strong">Experience with seniors</label>
          <select id="c-exp" value={form.experience} onChange={update("experience")} className="field">
            {EXPERIENCE.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="c-lang" className="label-strong">Languages you speak</label>
          <input
            id="c-lang"
            value={form.languages}
            onChange={update("languages")}
            placeholder="Hindi, Punjabi, English…"
            className="field"
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="c-avail" className="label-strong">When are you usually free?</label>
          <input
            id="c-avail"
            value={form.availability}
            onChange={update("availability")}
            placeholder="Weekday mornings, weekends, evenings after 5…"
            className="field"
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="c-msg" className="label-strong">Tell us about yourself</label>
          <textarea
            id="c-msg"
            rows={4}
            value={form.message}
            onChange={update("message")}
            placeholder="Your experience, why you enjoy time with older people, anything we should know."
            className="field-area"
          />
        </div>
      </div>

      {error ? (
        <p role="alert" className="mt-5 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-[0.88rem] text-destructive">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={state === "saving"}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 text-[0.95rem] font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
      >
        {state === "saving" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Sending application
          </>
        ) : (
          <>
            Send application <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>
      <p className="mt-3 text-[0.8rem] leading-relaxed text-muted-foreground">
        Every application is read by a person. We verify identity and references before offering visits.
      </p>
    </form>
  );
}