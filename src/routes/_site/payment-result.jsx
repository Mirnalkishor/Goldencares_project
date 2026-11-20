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

  useEffect(() => {
    if (!ref) {
      setError("This payment link is incomplete.");
      return;
    }
    const controller = new AbortController();
    fetch(`/api/payu/status?ref=${encodeURIComponent(ref)}`, { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "We could not check this payment.");
        setResult(data);
      })
      .catch((cause) => {
        if (!controller.signal.aborted) setError(cause.message || "We could not check this payment.");
      });
    return () => controller.abort();
  }, [ref]);

  const successful = result?.status === "success";
  const waiting = !result && !error;
  const Icon = successful ? Check : waiting ? Loader2 : CircleAlert;

  return (
    <section className="container-page py-16">
      <div className="mx-auto max-w-xl rounded-[2rem] border border-border bg-card p-7 text-center sm:p-10">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground">
          <Icon className={`h-6 w-6 ${waiting ? "animate-spin" : ""}`} />
        </span>
        <h1 className="mt-6 font-heading text-[2rem] text-foreground">
          {successful ? "Payment received" : waiting ? "Checking your payment" : "Payment not confirmed"}
        </h1>
        <p className="mt-3 text-[0.95rem] leading-relaxed text-muted-foreground">
          {successful
            ? `We have verified your payment of ₹${result.amountInr}. Our team will contact you to confirm the visit details.`
            : waiting
              ? "Please wait while we verify the result with our payment records."
              : error || "The payment was not completed. You can try again or contact our team."}
        </p>
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
