import { Banknote, CreditCard } from "lucide-react";
import ChoiceCard from "../ChoiceCard";
import { getServicePriceInr } from "@/lib/services";

export default function StepPayment({ form, setField }) {
  const amount = getServicePriceInr(form.service_slug, form.duration_hours);

  return (
    <div>
      <h2 className="font-heading text-[1.6rem] leading-tight text-foreground sm:text-[1.9rem]">
        How would you like to pay?
      </h2>
      <p className="mt-2 text-[0.95rem] text-muted-foreground">
        Choose one option to place your request. We’ll confirm the companion and timing by phone either way.
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
          description="No online payment. Pay the companion after the visit is complete."
          meta={amount === null ? "Price based on duration" : `₹${amount} at the visit`}
        />
      </div>

      <p className="mt-4 text-[0.82rem] leading-relaxed text-muted-foreground">
        Your request can’t be placed until you choose one of these options.
      </p>
    </div>
  );
}
