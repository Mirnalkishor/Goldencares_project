import { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { serviceBySlug } from "@/lib/services";
import { createPaymentToken, hashPaymentToken } from "@/lib/payu";
import { CITIES } from "@/lib/site";
import { isValidEmail, isValidPhoneNumber } from "@/lib/validation";
import { ArrowLeft, ArrowRight, Loader2, Lock } from "lucide-react";
import BookingProgress from "./BookingProgress";
import BookingSummary from "./BookingSummary";
import BookingConfirmed from "./BookingConfirmed";
import StepService from "./steps/StepService";
import StepDuration from "./steps/StepDuration";
import StepLocation from "./steps/StepLocation";
import StepSchedule from "./steps/StepSchedule";
import StepContact from "./steps/StepContact";

const STEPS = [
  { key: "service", label: "Service" },
  { key: "duration", label: "Hours" },
  { key: "location", label: "City" },
  { key: "schedule", label: "When" },
  { key: "contact", label: "Contact" },
];

function emptyForm(initialService, initialDuration) {
  const service = serviceBySlug(initialService);
  const durations = service?.durations || [1, 2, 3];
  const duration = durations.includes(Number(initialDuration))
    ? Number(initialDuration)
    : durations.includes(2)
      ? 2
      : durations[0];

  return {
    service_slug: service?.slug || "",
    duration_hours: duration,
    city: "",
    address: "",
    preferred_date: "",
    preferred_time: "",
    full_name: "",
    phone: "",
    email: "",
    relationship: "",
    language_preference: "",
    preferred_contact: "Phone call",
    notes: "",
  };
}

export default function BookingWizard({ initialService, initialDuration }) {
  const { user, isAuthenticated } = useAuth();
  const [form, setForm] = useState(() => emptyForm(initialService, initialDuration));
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [state, setState] = useState("idle");
  const [submitted, setSubmitted] = useState(false);
  const topRef = useRef(null);
  const mounted = useRef(false);

  useEffect(() => {
    if (!user) return;
    setForm((prev) => ({
      ...prev,
      full_name: prev.full_name || user.full_name || "",
      email: prev.email || user.email || "",
    }));
  }, [user]);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [step, submitted]);

  const setField = (key, value) => {
    setForm((prev) => {
      if (key !== "service_slug") return { ...prev, [key]: value };
      const service = serviceBySlug(value);
      return {
        ...prev,
        service_slug: value,
        duration_hours: service?.durations.includes(Number(prev.duration_hours))
          ? Number(prev.duration_hours)
          : service?.durations[0] ?? prev.duration_hours,
      };
    });
    setError("");
  };

  function validate(index) {
    if (index === 0 && !serviceBySlug(form.service_slug)) return "Please choose a service to continue.";
    if (
      index === 1 &&
      !serviceBySlug(form.service_slug)?.durations.includes(Number(form.duration_hours))
    ) {
      return "Please choose an available duration for this service.";
    }
    if (index === 2 && !CITIES.includes(form.city)) return "Please choose a city so we can match someone nearby.";
    if (index === 4) {
      if (!form.full_name.trim()) return "Please add your name so we know who to speak with.";
      if (!isValidPhoneNumber(form.phone)) {
        return "Please enter a valid phone number.";
      }
      if (!isValidEmail(form.email)) {
        return "Please enter a valid email address for your payment receipt.";
      }
    }
    return "";
  }

  function handleNext() {
    const message = validate(step);
    if (message) {
      setError(message);
      return;
    }
    setStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (step < STEPS.length - 1) {
      handleNext();
      return;
    }
    const message = validate(STEPS.length - 1);
    if (message) {
      setError(message);
      return;
    }

    setState("saving");
    setError("");
    try {
      const service = serviceBySlug(form.service_slug);
      const paymentToken = createPaymentToken();
      const paymentTokenHash = await hashPaymentToken(paymentToken);
      const booking = await base44.entities.BookingRequest.create({
        request_type: "visit",
        service_name: service?.name || "Companion visit",
        duration_hours: Number(form.duration_hours),
        city: form.city,
        address: form.address,
        preferred_date: form.preferred_date,
        preferred_time: form.preferred_time,
        full_name: form.full_name,
        phone: form.phone,
        email: form.email,
        relationship: form.relationship,
        language_preference: form.language_preference,
        preferred_contact: form.preferred_contact,
        notes: form.notes,
        payment_token_hash: paymentTokenHash,
        status: "new",
      });
      if (!booking?.id) throw new Error("The booking was saved but no booking reference was returned.");
      setState("idle");
      setSubmitted({ form, bookingId: booking.id, paymentToken });
    } catch (err) {
      setState("idle");
      setError(err?.message || "We could not send your request. Please try again, or email info@goldencares.in.");
    }
  }

  function reset() {
    setForm(emptyForm(initialService, initialDuration));
    setStep(0);
    setSubmitted(false);
    setError("");
  }

  if (submitted) {
    return (
      <div>
        <div ref={topRef} className="scroll-mt-28" />
        <BookingConfirmed
          form={submitted.form}
          isAuthenticated={isAuthenticated}
          bookingId={submitted.bookingId}
          paymentToken={submitted.paymentToken}
          onReset={reset}
        />
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.45fr_0.55fr] lg:items-start">
      <div>
        <div ref={topRef} className="scroll-mt-28" />
        <BookingProgress steps={STEPS} current={step} onJump={setStep} />

        <form onSubmit={handleSubmit} noValidate className="rounded-[2rem] border border-border bg-card p-5 sm:p-8">
          {step === 0 ? <StepService form={form} setField={setField} /> : null}
          {step === 1 ? <StepDuration form={form} setField={setField} /> : null}
          {step === 2 ? <StepLocation form={form} setField={setField} /> : null}
          {step === 3 ? <StepSchedule form={form} setField={setField} /> : null}
          {step === 4 ? <StepContact form={form} setField={setField} /> : null}

          {error ? (
            <p
              role="alert"
              className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-[0.88rem] text-destructive"
            >
              {error}
            </p>
          ) : null}

          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => setStep((prev) => Math.max(prev - 1, 0))}
              disabled={step === 0}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-6 py-3 text-[0.9rem] font-semibold text-foreground transition-colors hover:border-primary/40 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>

            <button
              type="submit"
              disabled={state === "saving"}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 text-[0.95rem] font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {state === "saving" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Sending request
                </>
              ) : step === STEPS.length - 1 ? (
                <>
                  Confirm request <ArrowRight className="h-4 w-4" />
                </>
              ) : (
                <>
                  Continue <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>

          <p className="mt-4 flex items-start gap-2 text-[0.78rem] leading-relaxed text-muted-foreground">
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            Your details are visible only to the GoldenCares team and the companion assigned to your visit.
          </p>
        </form>
      </div>

      <BookingSummary form={form} steps={STEPS} current={step} onJump={setStep} />
    </div>
  );
}