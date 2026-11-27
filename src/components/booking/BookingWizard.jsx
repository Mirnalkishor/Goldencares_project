import { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import {
  getServiceDurationLabel,
  getServicePriceInr,
  serviceBySlug,
} from "@/lib/services";
import { ArrowLeft, ArrowRight, Loader2, Lock } from "lucide-react";
import BookingProgress from "./BookingProgress";
import BookingSummary from "./BookingSummary";
import BookingConfirmed from "./BookingConfirmed";
import StepService from "./steps/StepService";
import StepDuration from "./steps/StepDuration";
import StepAddress, { validateAddressDraft } from "./steps/StepAddress";
import StepSchedule from "./steps/StepSchedule";
import StepPayment from "./steps/StepPayment";

const STEPS = [
  { key: "service", label: "Service" },
  { key: "duration", label: "Hours" },
  { key: "address", label: "Address" },
  { key: "schedule", label: "When" },
  { key: "payment", label: "Payment" },
];

const ADDRESS_FIELDS = [
  "address_label",
  "city",
  "address",
  "full_name",
  "phone",
  "email",
  "relationship",
  "language_preference",
  "preferred_contact",
  "notes",
  "elderName",
  "elderAge",
  "elderGender",
];

function formFromAddress(address) {
  if (!address) return {};
  return {
    ...Object.fromEntries(ADDRESS_FIELDS.map((field) => [field, address[field] ?? ""])),
    address_label: address.address_label || address.label || "",
  };
}

function addressFromForm(form, id) {
  const label = form.address_label || form.label || "";
  return {
    id,
    ...Object.fromEntries(ADDRESS_FIELDS.map((field) => [field, form[field] ?? ""])),
    address_label: label,
    label,
    updatedAt: new Date().toISOString(),
  };
}

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
    address_label: "",
    city: "",
    address: "",
    preferred_date: "",
    preferred_time: "",
    payment_method: "",
    full_name: "",
    phone: "",
    email: "",
    relationship: "",
    language_preference: "",
    preferred_contact: "Phone call",
    notes: "",
    elderName: "",
    elderAge: "",
    elderGender: "",
  };
}

export default function BookingWizard({ initialService, initialDuration }) {
  const { user, isAuthenticated } = useAuth();
  const [form, setForm] = useState(() => emptyForm(initialService, initialDuration));
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [state, setState] = useState("idle");
  const [submitted, setSubmitted] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [activeAddressId, setActiveAddressId] = useState(null);
  const [accountName, setAccountName] = useState(user?.full_name || "");
  const topRef = useRef(null);
  const mounted = useRef(false);

  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    base44.entities.User.get(user.id)
      .then((doc) => {
        if (!active) return;
        const addresses = Array.isArray(doc?.savedAddresses) ? doc.savedAddresses : [];
        const name = doc?.name || doc?.full_name || user.full_name || "";
        setAccountName(name);
        setSavedAddresses(addresses);
        const preferred =
          addresses.find((address) => address.id === doc?.lastUsedAddressId) || addresses[0] || null;
        setActiveAddressId(preferred?.id || null);
        setForm((prev) => {
          const fromAddress = formFromAddress(preferred);
          return {
            ...prev,
            ...fromAddress,
            full_name: fromAddress.full_name || prev.full_name || name || user.full_name || "",
            email: fromAddress.email || prev.email || user.email || "",
            preferred_contact: fromAddress.preferred_contact || prev.preferred_contact || "Phone call",
          };
        });
      })
      .catch(() => {
        if (!active) return;
        setAccountName(user.full_name || "");
        setForm((prev) => ({
          ...prev,
          full_name: prev.full_name || user.full_name || "",
          email: prev.email || user.email || "",
        }));
      });
    return () => {
      active = false;
    };
  }, [user?.id, user?.full_name, user?.email]);

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

  function applyAddress(address) {
    const fields = formFromAddress(address);
    setForm((prev) => ({
      ...prev,
      ...fields,
      full_name: fields.full_name || prev.full_name || user?.full_name || "",
      email: fields.email || prev.email || user?.email || "",
      preferred_contact: fields.preferred_contact || prev.preferred_contact || "Phone call",
    }));
  }

  function selectAddress(address) {
    if (user?.id) setActiveAddressId(address.id);
    applyAddress(address);
    setError("");
    if (user?.id) {
      base44.entities.User.update(user.id, { lastUsedAddressId: address.id }).catch(() => {});
    }
  }

  async function saveAddress(draft, editingId) {
    const id = editingId || `addr_${Date.now()}`;
    const entry = addressFromForm(draft, id);
    const next = editingId
      ? savedAddresses.map((address) => (address.id === editingId ? entry : address))
      : [...savedAddresses, entry];

    if (user?.id) {
      await base44.entities.User.update(user.id, { savedAddresses: next, lastUsedAddressId: id });
      setSavedAddresses(next);
    }

    if (user?.id) setActiveAddressId(id);
    applyAddress(entry);
    setError("");
    return entry;
  }

  async function deleteAddress(id) {
    if (!user?.id || !window.confirm("Remove this saved address?")) return;
    const next = savedAddresses.filter((address) => address.id !== id);
    const patch = { savedAddresses: next };
    if (activeAddressId === id) patch.lastUsedAddressId = next[0]?.id || "";
    try {
      await base44.entities.User.update(user.id, patch);
      setSavedAddresses(next);
      if (activeAddressId === id) {
        const preferred = next[0] || null;
        setActiveAddressId(preferred?.id || null);
        setForm({ ...emptyForm(initialService, initialDuration), ...formFromAddress(preferred) });
      }
    } catch (err) {
      setError(err?.message || "We could not remove that address. Please try again.");
    }
  }

  function validate(index) {
    if (index === 0 && !serviceBySlug(form.service_slug)) return "Please choose a service to continue.";
    if (
      index === 1 &&
      !serviceBySlug(form.service_slug)?.durations.includes(Number(form.duration_hours))
    ) {
      return "Please choose an available duration for this service.";
    }
    if (index === 2) return validateAddressDraft(form);
    if (index === 4 && !["online", "cod"].includes(form.payment_method)) {
      return "Choose how you’d like to pay: online or cash on delivery.";
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
    for (let index = 0; index < STEPS.length; index += 1) {
      const message = validate(index);
      if (message) {
        setStep(index);
        setError(message);
        return;
      }
    }

    setState("saving");
    setError("");
    try {
      const service = serviceBySlug(form.service_slug);
      const isCod = form.payment_method === "cod";
      const duration = Number(form.duration_hours);
      const priceInr = getServicePriceInr(form.service_slug, duration);
      const payload = {
        request_type: "visit",
        service_name: service?.name || "Companion visit",
        // The Razorpay callables resolve live pricing from `services` using
        // these fields, so they must be present on every new web booking.
        serviceId: service?.serviceId || "",
        serviceName: service?.name || "Companion visit",
        duration: getServiceDurationLabel(form.service_slug, duration),
        duration_hours: duration,
        price: priceInr,
        userId: user.id,
        payment_method: form.payment_method,
        paymentStatus: isCod ? "cod" : "pending_payment",
        paymentId: "",
        transactionId: "",
        city: form.city,
        address: form.address,
        address_label: form.address_label,
        preferred_date: form.preferred_date,
        preferred_time: form.preferred_time,
        full_name: form.full_name,
        phone: form.phone,
        email: form.email,
        elderName: form.elderName,
        elderAge: Number(form.elderAge),
        elderGender: form.elderGender,
        relationship: form.relationship,
        bookingMode: form.relationship === "I'm the senior" ? "self" : "other",
        relationToRecipient: form.relationship || "other",
        language_preference: form.language_preference,
        preferred_contact: form.preferred_contact,
        notes: form.notes,
        status: "new",
      };
      const booking = await base44.entities.BookingRequest.create(payload);
      if (!booking?.id) throw new Error("The booking was saved but no booking reference was returned.");
      setState("idle");
      setSubmitted({ form, bookingId: booking.id, paymentMethod: form.payment_method });
    } catch (err) {
      setState("idle");
      setError(err?.message || "We could not send your request. Please try again, or email info@goldencares.in.");
    }
  }

  function reset() {
    const preferred =
      savedAddresses.find((address) => address.id === activeAddressId) || savedAddresses[0] || null;
    setForm({ ...emptyForm(initialService, initialDuration), ...formFromAddress(preferred) });
    setActiveAddressId(preferred?.id || null);
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
          paymentMethod={submitted.paymentMethod}
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
          {step === 2 ? (
            <StepAddress
              form={form}
              savedAddresses={savedAddresses}
              activeAddressId={activeAddressId}
              onSelectAddress={selectAddress}
              onDeleteAddress={deleteAddress}
              onSaveAddress={saveAddress}
              defaultName={accountName || user?.full_name || ""}
              defaultEmail={user?.email || ""}
              isAuthenticated={isAuthenticated}
            />
          ) : null}
          {step === 3 ? <StepSchedule form={form} setField={setField} /> : null}
          {step === 4 ? <StepPayment form={form} setField={setField} /> : null}

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