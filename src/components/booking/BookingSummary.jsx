import { Link } from "@tanstack/react-router";
import { Clock, ShieldCheck } from "lucide-react";
import { formatDate, formatDuration } from "@/lib/format";
import { getServicePriceInr, serviceBySlug } from "@/lib/services";
import { CONTACT } from "@/lib/site";

export default function BookingSummary({ form, steps, current, onJump }) {
  const service = serviceBySlug(form.service_slug);
  const quote = getServicePriceInr(form.service_slug, form.duration_hours);

  const rows = [
    { label: "Service", value: service?.name || "Not chosen", step: 0 },
    { label: "Hours", value: formatDuration(form.duration_hours), step: 1 },
    {
      label: "Quote",
      value: quote === null ? "Choose duration" : `₹${quote}`,
      step: 1,
    },
    {
      label: "Address",
      value: form.city ? `${form.city}${form.address ? ` · ${form.address}` : ""}` : "Not chosen",
      step: 2,
    },
    {
      label: "Senior",
      value: form.elderName
        ? `${form.elderName}${form.elderGender ? ` · ${form.elderGender}` : ""}${form.elderAge ? ` · ${form.elderAge} yrs` : ""}`
        : "Not added",
      step: 2,
    },
    {
      label: "When",
      value: `${formatDate(form.preferred_date)}${form.preferred_time ? ` · ${form.preferred_time}` : ""}`,
      step: 3,
    },
    { label: "Contact", value: form.phone || "Not added", step: 2 },
    {
      label: "Payment",
      value:
        form.payment_method === "cod"
          ? "Cash on delivery"
          : form.payment_method === "online"
            ? "Pay online"
            : "Not chosen",
      step: 4,
    },
  ];

  return (
    <aside className="rounded-[1.75rem] border border-border bg-card p-6 lg:sticky lg:top-32">
      <h2 className="font-heading text-[1.3rem] text-foreground">Your request</h2>
      <p className="mt-1 text-[0.82rem] text-muted-foreground">Online payment is required to place your request.</p>

      <dl className="mt-5 space-y-3">
        {rows.map((row) => (
          <div key={row.label} className="flex items-start justify-between gap-3 border-b border-border/70 pb-3 last:border-0 last:pb-0">
            <dt className="text-[0.75rem] uppercase text-muted-foreground" style={{ letterSpacing: "0.12em" }}>
              {row.label}
            </dt>
            <dd className="max-w-[62%] text-right text-[0.88rem] font-medium leading-snug text-foreground">
              {row.value}
              {row.step < current ? (
                <button
                  type="button"
                  onClick={() => onJump(row.step)}
                  className="ml-1 text-[0.75rem] font-semibold text-primary underline decoration-accent decoration-2 underline-offset-2"
                >
                  edit
                </button>
              ) : null}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-5 space-y-2.5 rounded-xl bg-secondary/60 p-4 text-[0.8rem] leading-relaxed text-foreground/75">
        <p className="flex items-start gap-2">
          <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
          We call to confirm the companion and time — usually within a couple of hours.
        </p>
        <p className="flex items-start gap-2">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
          Companions are background-checked and briefed before the visit.
        </p>
      </div>

      <p className="mt-4 text-[0.78rem] text-muted-foreground">
        Need help now?{" "}
        <a href={`mailto:${CONTACT.email}`} className="font-semibold text-primary">
          {CONTACT.email}
        </a>
      </p>
      <p className="sr-only">
        Booking progress: step {current + 1} of {steps.length}.
      </p>
      <Link to="/services" className="mt-3 inline-flex text-[0.78rem] font-medium text-muted-foreground underline underline-offset-4">
        Review all services
      </Link>
    </aside>
  );
}
