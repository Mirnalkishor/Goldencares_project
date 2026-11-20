import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, CircleAlert, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_site/payment-result")({
  validateSearch: (search) => ({
    ref: typeof search.ref === "string" ? search.ref.slice(0, 128) : "",
  }),
  head: () => ({
    meta: [
      { title: "Payment status | GoldenCares" },
      { name: "robots", content: "noindex, nofollow" },
      { name: "referrer", content: "no-referrer" },
    ],
  }),
  component: PaymentResultPage,
});

function PaymentResultPage() {
  const { ref } = Route.useSearch();
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [paymentAccess, setPaymentAccess] = useState(null);
  const [checkout, setCheckout] = useState(null);
  const [paying, setPaying] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  useEffect(() => {
    if (!ref) {
      setError("This payment link is incomplete.");
      return;
    }
    const controller = new AbortController();
    try {
      const saved = window.sessionStorage.getItem(`goldencares-payment-${ref}`);
      if (saved) setPaymentAccess(JSON.parse(saved));
    } catch {
      setPaymentError("This browser could not restore the payment session.");
    }
    fetch(`/api/payu/status?ref=${encodeURIComponent(ref)}`, { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "We could not check this payment.");
        setResult(data);
        if (data.status === "success") window.sessionStorage.removeItem(`goldencares-payment-${ref}`);
      })
      .catch((cause) => {
        if (!controller.signal.aborted) setError(cause.message || "We could not check this payment.");
      });
    return () => controller.abort();
  }, [ref]);

  async function retryPayment() {
    if (!paymentAccess || paying) return;
    setPaying(true);
    setPaymentError("");
    try {
      const response = await fetch("/api/payu/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentAccess),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "We could not start another payment.");
      if (!["https://test.payu.in/_payment", "https://secure.payu.in/_payment"].includes(data.action)) {
        throw new Error("The payment service returned an invalid checkout destination.");
      }
      setCheckout(data);
      try {
        sessionStorage.setItem(
          `goldencares-payment-${data.attemptId}`,
          JSON.stringify(paymentAccess),
        );
      } catch {
        setPaymentError("Your browser cannot save a retry session. You can still continue to PayU.");
      }
    } catch (cause) {
      setPaymentError(cause.message || "We could not start another payment.");
    } finally {
      setPaying(false);
    }
  }

  const successful = result?.status === "success";
  const pending = result?.status === "pending";
  const waiting = (!result && !error) || pending;
  const canRetry = result?.status === "failed" || result?.status === "expired";
  const Icon = successful ? Check : waiting ? Loader2 : CircleAlert;

  return (
    <section className="container-page py-16">
      <div className="mx-auto max-w-xl rounded-[2rem] border border-border bg-card p-7 text-center sm:p-10">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground">
          <Icon className={`h-6 w-6 ${waiting ? "animate-spin" : ""}`} />
        </span>
        <h1 className="mt-6 font-heading text-[2rem] text-foreground">
          {successful ? "Payment received" : pending ? "Payment processing" : waiting ? "Checking your payment" : "Payment not confirmed"}
        </h1>
        <p className="mt-3 text-[0.95rem] leading-relaxed text-muted-foreground">
          {successful
            ? `We have verified your payment of ₹${result.amountInr}. Our team will contact you to confirm the visit details.`
            : pending
              ? "PayU is still processing this transaction. Please wait a moment and refresh this page."
              : waiting
              ? "Please wait while we verify the result with our payment records."
              : error || "The payment was not completed. You can retry securely or contact our team."}
        </p>
        {canRetry && paymentAccess ? (
          <div className="mt-5">
            {paymentError ? <p role="alert" className="mb-3 text-[0.86rem] text-destructive">{paymentError}</p> : null}
            {checkout ? (
              <form action={checkout.action} method="post">
                {Object.entries(checkout.fields).map(([name, value]) => (
                  <input key={name} type="hidden" name={name} value={value} />
                ))}
                <button
                  type="submit"
                  className="rounded-full bg-primary px-6 py-3 text-[0.9rem] font-semibold text-primary-foreground"
                >
                  Continue to PayU
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={retryPayment}
                disabled={paying}
                className="rounded-full bg-primary px-6 py-3 text-[0.9rem] font-semibold text-primary-foreground disabled:opacity-60"
              >
                {paying ? "Preparing secure payment…" : "Try payment again"}
              </button>
            )}
          </div>
        ) : null}
        <Link
          to="/"
          className="mt-7 inline-flex rounded-full bg-primary px-6 py-3 text-[0.9rem] font-semibold text-primary-foreground"
        >
          Return home
        </Link>
      </div>
    </section>
  );
}
