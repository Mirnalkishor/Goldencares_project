import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { CITIES } from "@/lib/site";
import { isValidPhoneNumber } from "@/lib/validation";
import { ArrowRight, Check, Loader2 } from "lucide-react";

const SLOTS = ["Any time", "Morning (8–11 am)", "Afternoon (12–4 pm)", "Evening (4–8 pm)"];

export default function CallbackForm() {
  const [form, setForm] = useState({ full_name: "", phone: "", city: "", preferred_time: SLOTS[0] });
  const [state, setState] = useState("idle");
  const [error, setError] = useState("");

  const update = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  async function handleSubmit(event) {
    event.preventDefault();
    if (!form.full_name.trim() || !isValidPhoneNumber(form.phone) || !CITIES.includes(form.city)) {
      setError("Please add your name, a valid phone number and your city so we can call you back.");
      return;
    }
    setError("");
    setState("saving");
    try {
      await base44.entities.BookingRequest.create({
        request_type: "callback",
        service_name: "Callback request",
        full_name: form.full_name,
        phone: form.phone,
        city: form.city,
        preferred_time: form.preferred_time === "Any time" ? "" : form.preferred_time,
        notes: "Requested a call back from the contact page.",
        status: "new",
      });
      setState("done");
    } catch (err) {
      setState("idle");
      setError(err?.message || "We could not send your request. Please try again, or email info@goldencares.in.");
    }
  }

  if (state === "done") {
    return (
      <div className="rounded-[1.75rem] border border-border bg-card p-7">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-foreground">
          <Check className="h-5 w-5" />
        </span>
        <h3 className="mt-5 font-heading text-[1.5rem] text-foreground">We have your number.</h3>
        <p className="mt-2 text-[0.95rem] leading-relaxed text-muted-foreground">
          We will call {form.phone} to talk through what your parent needs. Nothing is booked until you
          agree to it.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="rounded-[1.75rem] border border-border bg-card p-6 sm:p-7">
      <h3 className="font-heading text-[1.45rem] text-foreground">Schedule a call</h3>
      <p className="mt-1.5 text-[0.9rem] leading-relaxed text-muted-foreground">
        Leave your number and we will call you back — no forms about your parent, no pressure.
      </p>

      <div className="mt-5 space-y-4">
        <div>
          <label htmlFor="cb-name" className="label-strong">Your name</label>
          <input id="cb-name" value={form.full_name} onChange={update("full_name")} className="field" autoComplete="name" />
        </div>
        <div>
          <label htmlFor="cb-phone" className="label-strong">Phone number</label>
          <input id="cb-phone" type="tel" value={form.phone} onChange={update("phone")} className="field" autoComplete="tel" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="cb-city" className="label-strong">City</label>
            <select id="cb-city" value={form.city} onChange={update("city")} className="field">
              <option value="">Select city</option>
              {CITIES.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="cb-time" className="label-strong">Best time</label>
            <select id="cb-time" value={form.preferred_time} onChange={update("preferred_time")} className="field">
              {SLOTS.map((slot) => (
                <option key={slot} value={slot}>{slot}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error ? (
        <p role="alert" className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-[0.86rem] text-destructive">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={state === "saving"}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-[0.92rem] font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:opacity-70"
      >
        {state === "saving" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Sending
          </>
        ) : (
          <>
            Request a call <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>
      <p className="mt-3 text-[0.78rem] text-muted-foreground">
        We call back during 7 am – 9 pm, every day.
      </p>
    </form>
  );
}
