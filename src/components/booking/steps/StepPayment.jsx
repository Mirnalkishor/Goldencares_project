import { Banknote, CreditCard } from "lucide-react";
import ChoiceCard from "../ChoiceCard";
import { getServicePriceInr } from "@/lib/services";
import { COD_ENABLED } from "@/lib/paymentMethods";

export default function StepPayment({ form, setField }) {
  const amount = getServicePriceInr(form.service_slug, form.duration_hours);

  return (
    <div>
      <h2 className="font-heading text-[1.6rem] leading-tight text-foreground sm:text-[1.9rem]">
        How would you like to pay?
      </h2>
      <p className="mt-2 text-[0.95rem] text-muted-foreground">
        Pay online to place your request. We’ll confirm the companion and timing by phone after the payment is
        verified.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <ChoiceCard
          selected={form.payment_method === "online"}
          onClick={() => setField("payment_method", "online")}
          icon={CreditCard}
          title="Pay online"
          description="Pay by card or UPI through our secure Razorpay checkout."
          meta={amount === null ? "Price based on duration" : `₹${amount} now`}
        />
        <ChoiceCard
          selected={form.payment_method === "cod"}
          onClick={() => setField("payment_method", "cod")}
          icon={Banknote}
          title="Cash on delivery"
          description={
            COD_ENABLED
              ? "No online payment. Pay the companion after the visit is complete."
              : "Temporarily unavailable. Please pay securely online instead."
          }
          meta={COD_ENABLED ? (amount === null ? "Price based on duration" : `₹${amount} at the visit`) : "Unavailable"}
          disabled={!COD_ENABLED}
        />
      </div>

      <p className="mt-4 text-[0.82rem] leading-relaxed text-muted-foreground">
        Your request can’t be placed until online payment is selected and completed.
      </p>
    </div>
  );
}
