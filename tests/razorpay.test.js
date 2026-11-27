import assert from "node:assert/strict";
import test from "node:test";
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
