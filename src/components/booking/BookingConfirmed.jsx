import { Link } from "@tanstack/react-router";
import { ArrowRight, Banknote, Check, Clock, Loader2, Lock, PhoneCall } from "lucide-react";
import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { formatDate, formatDuration } from "@/lib/format";
import { openRazorpayCheckout, paymentErrorMessage } from "@/lib/razorpay";
import { getServicePriceInr, serviceBySlug } from "@/lib/services";
import { CONTACT } from "@/lib/site";

const PAYING_STATES = new Set(["starting", "awaiting", "verifying"]);

export default function BookingConfirmed({
  form,
  isAuthenticated,
  bookingId,
  paymentMethod,
  onReset,
}) {
  const service = serviceBySlug(form.service_slug);
  const [paymentState, setPaymentState] = useState("idle");
  const [paymentMessage, setPaymentMessage] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const amountInr = getServicePriceInr(form.service_slug, form.duration_hours);
  const isCod = paymentMethod === "cod";
  const paying = PAYING_STATES.has(paymentState);
  const paid = paymentState === "success";

  useEffect(() => {
    if (!isCod && amountInr === null) {
      setPaymentMessage("We could not confirm the price for this service. Please contact support before paying.");
    }
  }, [amountInr, isCod]);

  async function beginPayment() {
    if (!amountInr) {
      setPaymentMessage("We could not confirm the price for this service. Please contact support before paying.");
      return;
    }
    setPaymentState("starting");
    setPaymentMessage("");
    try {
      const order = await base44.functions.invoke("createRazorpayOrder", { bookingId });
      if (!order?.orderId || !order?.keyId || !Number.isFinite(Number(order.amount))) {
        throw new Error("The payment service returned an incomplete order. Please try again.");
      }
      setTransactionId(order.transactionId || "");
      setPaymentState("awaiting");

      await openRazorpayCheckout({
        keyId: order.keyId,
        orderId: order.orderId,
        amountPaise: order.amount,
        description: `${service?.name || form.service_name || "Companion visit"} · ${formatDuration(form.duration_hours)}`,
        customerName: form.full_name,
        email: form.email,
        phone: form.phone,
        onDismiss: () => {
          setPaymentState("idle");
          setPaymentMessage("Payment was cancelled. Your request has not been placed yet — you can try again whenever you are ready.");
        },
        onFailure: (message) => {
          setPaymentState("error");
          setPaymentMessage(message || "Payment failed. Please try again.");
        },
        onSuccess: async ({ paymentId, orderId, signature }) => {
          if (!paymentId || !signature) {
            setPaymentState("error");
            setPaymentMessage("Razorpay did not return a payment signature. Please contact support with your booking details.");
            return;
          }
          setPaymentState("verifying");
          setPaymentMessage("");
          try {
            const result = await base44.functions.invoke("verifyRazorpayPayment", {
              transactionId: order.transactionId,
              orderId,
              paymentId,
              signature,
            });
            if (result?.success) {
              setPaymentState("success");
              setPaymentMessage(result.message || "Payment verified. Your booking is confirmed.");
            } else {
              setPaymentState("error");
              setPaymentMessage("We could not verify this payment. Please contact support with your booking details.");
            }
          } catch (error) {
            setPaymentState("error");
            setPaymentMessage(
              "Razorpay received your payment, but we could not verify it automatically. Please contact support with your booking details so we can confirm it manually."
            );
          }
        },
      });
    } catch (error) {
      setPaymentState("error");
      setPaymentMessage(paymentErrorMessage(error));
    }
  }

  return (
    <div data-booking-id={bookingId} className="rounded-[2rem] border border-border bg-card p-6 sm:p-9">
      <span className="grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground">
        <Check className="h-6 w-6" />
      </span>
      <h1 className="mt-6 font-heading text-[2rem] leading-tight text-foreground sm:text-[2.4rem]">
        {paid ? "Thank you" : "One last step"}, {form.full_name.split(" ")[0]}.
      </h1>
      <p className="mt-3 max-w-lg text-[1rem] leading-relaxed text-muted-foreground">
        {paid ? (
          <>
            Payment received. Your request is now with our team. We will call {form.phone} to confirm the
            companion and timing — usually within a couple of hours, {CONTACT.hours.toLowerCase()}.
          </>
        ) : (
          <>
            Your visit details are ready. Pay the quoted amount below to place your request. We will call{" "}
            {form.phone} to confirm the companion and timing only after payment succeeds.
          </>
        )}
      </p>

      <div className="mt-6 rounded-[1.5rem] border border-border bg-background p-5">
        <dl className="space-y-3 text-[0.92rem]">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Quoted price</dt>
            <dd className="text-right font-semibold text-foreground">
              {amountInr === null ? "See quote in booking" : `₹${amountInr}`}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Payment method</dt>
            <dd className="text-right font-medium text-foreground">
              {isCod ? "Cash on delivery" : "Online · Razorpay"}
            </dd>
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
              {form.elderGender ? ` · ${form.elderGender}` : ""}
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

      {isCod ? (
        <div className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-4">
          <p className="inline-flex items-center gap-2 text-[0.9rem] font-semibold text-foreground">
            <Banknote className="h-4 w-4 text-primary" /> Pay ₹{amountInr ?? "the quoted amount"} at the visit
          </p>
          <p className="mt-1 text-[0.82rem] leading-relaxed text-muted-foreground">
            You’ve chosen cash on delivery. Please keep the quoted amount ready and pay the companion after the
            visit is complete. No online payment is needed.
          </p>
          <p className="mt-2 text-[0.8rem] text-muted-foreground">
            Our team will still call {form.phone} to confirm the companion and timing.
          </p>
        </div>
      ) : (
        <div className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-4">
          <p className="inline-flex items-center gap-2 text-[0.9rem] font-semibold text-foreground">
            <Lock className="h-4 w-4 text-primary" /> Pay securely with Razorpay
          </p>
          <p className="mt-1 text-[0.82rem] leading-relaxed text-muted-foreground">
            {paid
              ? "Payment received. Your request has been placed and our team will call to confirm the companion before the visit."
              : "Your request has not been placed yet. Pay the quoted amount now; our team will call to confirm availability and timing only after payment succeeds."}
          </p>

          {paymentMessage ? (
            <p role="status" className={`mt-3 text-[0.85rem] ${paymentState === "error" ? "text-destructive" : "text-foreground"}`}>
              {paymentMessage}
            </p>
          ) : null}

          {transactionId && paymentState === "error" ? (
            <p className="mt-2 text-[0.78rem] text-muted-foreground">Payment reference: {transactionId}</p>
          ) : null}

          {paymentState === "success" ? (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-[0.88rem] font-semibold text-primary-foreground">
              <Check className="h-4 w-4" /> Payment confirmed
            </div>
          ) : (
            <button
              type="button"
              onClick={beginPayment}
              disabled={paying || amountInr === null}
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-[0.9rem] font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-70"
            >
              {paying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {paymentState === "verifying" ? "Verifying payment…" : "Opening secure checkout…"}
                </>
              ) : (
                `Pay ${amountInr === null ? "" : `₹${amountInr} `}securely`
              )}
            </button>
          )}
        </div>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {[
          { icon: PhoneCall, title: "We call you", text: "After payment succeeds, to confirm the companion and visit details." },
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
