const CHECKOUT_SCRIPT_ID = "razorpay-checkout-js";
const CHECKOUT_SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

let checkoutPromise = null;

function loadCheckoutScript() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Razorpay checkout is available in the browser only."));
  }
  if (window.Razorpay) return Promise.resolve(window.Razorpay);
  if (checkoutPromise) return checkoutPromise;

  checkoutPromise = new Promise((resolve, reject) => {
    const existing = window.document.getElementById(CHECKOUT_SCRIPT_ID);
    if (existing && window.Razorpay) {
      resolve(window.Razorpay);
      return;
    }

    const script = existing || window.document.createElement("script");
    if (!existing) {
      script.id = CHECKOUT_SCRIPT_ID;
      script.src = CHECKOUT_SCRIPT_SRC;
      script.async = true;
      window.document.head.appendChild(script);
    }

    script.addEventListener("load", () => {
      if (window.Razorpay) resolve(window.Razorpay);
      else reject(new Error("The payment gateway did not load. Please refresh and try again."));
    });
    script.addEventListener("error", () => {
      checkoutPromise = null;
      existing?.remove();
      reject(new Error("The payment gateway could not be loaded. Check your connection and try again."));
    });
  });

  return checkoutPromise;
}

/**
 * Opens the Razorpay checkout modal using the same options as the Flutter web
 * client: order id, server-returned key id, and server-returned amount in paise.
 * Exactly one terminal callback fires per checkout session because Razorpay
 * can emit both `payment.failed` and `ondismiss` for the same attempt.
 */
export async function openRazorpayCheckout({
  keyId,
  orderId,
  amountPaise,
  name = "Golden Cares",
  description = "Senior companion visit",
  customerName = "",
  email = "",
  phone = "",
  onSuccess,
  onDismiss,
  onFailure,
}) {
  const Razorpay = await loadCheckoutScript();
  let settled = false;

  function finishSuccess(response = {}) {
    if (settled) return;
    settled = true;
    onSuccess?.({
      paymentId: response.razorpay_payment_id || "",
      orderId: response.razorpay_order_id || orderId,
      signature: response.razorpay_signature || "",
    });
  }

  function finishFailure(message) {
    if (settled) return;
    settled = true;
    onFailure?.(message);
  }

  function finishDismiss() {
    if (settled) return;
    settled = true;
    onDismiss?.();
  }

  const options = {
    key: keyId,
    amount: Number(amountPaise),
    currency: "INR",
    name,
    description,
    order_id: orderId,
    prefill: {
      name: customerName,
      email,
      contact: phone,
    },
    notes: {
      orderId,
    },
    theme: { color: "#B8860B" },
    handler: finishSuccess,
    modal: { ondismiss: finishDismiss },
  };

  try {
    const checkout = new Razorpay(options);
    checkout.on("payment.failed", (response) => {
      const error = response?.error || {};
      finishFailure(error.description || error.reason || "Payment failed. Please try again.");
    });
    checkout.open();
  } catch (error) {
    finishFailure(error?.message || "Could not open the payment gateway. Please try again.");
  }
}

export function paymentErrorMessage(error) {
  const message = error?.message || error?.details?.message || "";
  const code = error?.code || "";
  if (code === "unauthenticated" || /session expired/i.test(message)) {
    return "Your session expired. Please sign out and sign in again, then retry the payment.";
  }
  if (code === "failed-precondition") {
    const details = error?.details;
    if (details?.code === "PRICE_CHANGED") {
      return `The price changed from ₹${details.previousAmount} to ₹${details.latestAmount}. Please go back and confirm the new quote before paying.`;
    }
    return message || "This booking cannot be paid for right now. Please try again later.";
  }
  if (code === "permission-denied") {
    return "This booking is not available for payment under your account.";
  }
  return message || "We could not start the payment. Please try again.";
}
