import assert from "node:assert/strict";
import test from "node:test";
import { COD_ENABLED, isPaymentMethodAvailable } from "../src/lib/paymentMethods.js";
import { paymentErrorMessage } from "../src/lib/razorpay.js";

test("payment errors explain stale sessions and changed prices", () => {
  assert.match(paymentErrorMessage({ code: "unauthenticated" }), /session expired/i);
  assert.match(
    paymentErrorMessage({
      code: "failed-precondition",
      details: { code: "PRICE_CHANGED", previousAmount: 499, latestAmount: 699 },
    }),
    /₹499 to ₹699/,
  );
  assert.match(paymentErrorMessage({ code: "permission-denied" }), /not available for payment/i);
  assert.match(paymentErrorMessage({}), /could not start the payment/i);
});

test("cash on delivery is temporarily disabled", () => {
  assert.equal(COD_ENABLED, false);
  assert.equal(isPaymentMethodAvailable("online"), true);
  assert.equal(isPaymentMethodAvailable("cod"), false);
  assert.equal(isPaymentMethodAvailable(""), false);
});
