import { Link } from "@tanstack/react-router";
import { ArrowRight, Check, Clock, PhoneCall } from "lucide-react";
import { formatDate, formatDuration } from "@/lib/format";
import { serviceBySlug } from "@/lib/services";
import { CONTACT } from "@/lib/site";
import { getVisitPriceInr } from "@/lib/payu";
import { useState } from "react";

export default function BookingConfirmed({ form, isAuthenticated, bookingId, paymentToken, onReset }) {
  const service = serviceBySlug(form.service_slug);
  const [checkout, setCheckout] = useState(null);
  const [paymentError, setPaymentError] = useState("");
  const [paying, setPaying] = useState(false);
  const amountInr = getVisitPriceInr(form.duration_hours);

  async function beginPayment() {
    setPaying(true);
    setPaymentError("");
    try {
      const response = await fetch("/api/payu/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, token: paymentToken }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "We could not start the payment.");
      if (!["https://test.payu.in/_payment", "https://secure.payu.in/_payment"].includes(data.action)) {
        throw new Error("The payment service returned an invalid checkout destination.");
      }
      setCheckout(data);
      try {
        sessionStorage.setItem(
          `goldencares-payment-${data.attemptId}`,
          JSON.stringify({ bookingId, token: paymentToken }),
        );
      } catch {
        setPaymentError("Your browser cannot save a retry session. You can still continue to PayU.");
      }
    } catch (error) {
      setPaymentError(error.message || "We could not start the payment.");
    } finally {
      setPaying(false);
    }
  }

  return (
    <div className="rounded-[2rem] border border-border bg-card p-6 sm:p-9">
      <span className="grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground">
        <Check className="h-6 w-6" />
      </span>
      <h1 className="mt-6 font-heading text-[2rem] leading-tight text-foreground sm:text-[2.4rem]">
        Thank you, {form.full_name.split(" ")[0]}.
      </h1>
      <p className="mt-3 max-w-lg text-[1rem] leading-relaxed text-muted-foreground">
        Your request is with our team. We will call {form.phone} to confirm the companion and time — usually
        within a couple of hours during {CONTACT.hours.toLowerCase()}.
      </p>

      <div className="mt-6 rounded-[1.5rem] border border-border bg-background p-5">
        <dl className="space-y-3 text-[0.92rem]">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Quoted price</dt>
            <dd className="text-right font-semibold text-foreground">₹{amountInr}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Service</dt>
            <dd className="text-right font-medium text-foreground">{service?.name || form.service_name}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Duration</dt>
            <dd className="text-right font-medium text-foreground">{formatDuration(form.duration_hours)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">City</dt>
            <dd className="text-right font-medium text-foreground">
              {form.city}
              {form.address ? ` · ${form.address}` : ""}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Senior</dt>
            <dd className="text-right font-medium text-foreground">
              {form.elderName || "—"}
              {form.elderAge ? ` · ${form.elderAge} years` : ""}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">When</dt>
            <dd className="text-right font-medium text-foreground">
              {formatDate(form.preferred_date)}
              {form.preferred_time ? ` · ${form.preferred_time}` : ""}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">We'll reach you by</dt>
            <dd className="text-right font-medium text-foreground">{form.preferred_contact || "Phone call"}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-4">
        <p className="text-[0.9rem] font-semibold text-foreground">Pay securely with PayU</p>
        <p className="mt-1 text-[0.82rem] leading-relaxed text-muted-foreground">
          This request is not yet a confirmed visit. You can pay the quoted ₹{amountInr} now; our team will still
          call to confirm availability and timing.
        </p>
        {paymentError ? (
          <p role="alert" className="mt-3 text-[0.85rem] text-destructive">{paymentError}</p>
        ) : null}
        {checkout ? (
          <form action={checkout.action} method="post" className="mt-4">
            {Object.entries(checkout.fields).map(([name, value]) => (
              <input key={name} type="hidden" name={name} value={value} />
            ))}
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-[0.9rem] font-semibold text-primary-foreground"
            >
              Continue to PayU
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={beginPayment}
            disabled={paying}
            className="mt-4 inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-[0.9rem] font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-70"
          >
            {paying ? "Preparing secure payment…" : `Pay ₹${amountInr} securely`}
          </button>
        )}
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {[
          { icon: PhoneCall, title: "We call you", text: "To confirm the companion and the visit details." },
          { icon: Clock, title: "The visit happens", text: "On time, for the hours you booked, as agreed." },
        ].map(({ icon: Icon, title, text }) => (
          <div key={title} className="rounded-xl border border-border p-4">
            <Icon className="h-4 w-4 text-primary" />
            <p className="mt-2 text-[0.88rem] font-semibold text-foreground">{title}</p>
            <p className="mt-0.5 text-[0.82rem] leading-relaxed text-muted-foreground">{text}</p>
          </div>
        ))}
      </div>

      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        {isAuthenticated ? (
          <Link
            to="/account"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-[0.92rem] font-semibold text-primary-foreground"
          >
            See my bookings <ArrowRight className="h-4 w-4" />
          </Link>
        ) : (
          <Link
            to="/register"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-[0.92rem] font-semibold text-primary-foreground"
          >
            Create an account <ArrowRight className="h-4 w-4" />
          </Link>
        )}
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-6 py-3 text-[0.92rem] font-semibold text-foreground"
        >
          Book another visit
        </button>
        <Link
          to="/"
          className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-[0.92rem] font-semibold text-muted-foreground"
        >
          Back home
        </Link>
      </div>

      {!isAuthenticated ? (
        <p className="mt-5 text-[0.82rem] leading-relaxed text-muted-foreground">
          With an account, every request you send appears in your family portal — handy if more than one
          person in the family is helping.
        </p>
      ) : null}
    </div>
  );
}