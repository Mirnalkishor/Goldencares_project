import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import {
  amountInPaise,
  createPayuRequestHash,
  getVisitPriceInr,
  verifyPayuResponseHash,
} from "../src/lib/payu.js";

const digest = (value) => createHash("sha512").update(value, "utf8").digest("hex");

test("creates the PayU request hash using the documented parameter order", async () => {
  const params = {
    key: "merchant-key",
    txnid: "transaction-123",
    amount: "299.00",
    productinfo: "GoldenCares companion visit",
    firstname: "Test User",
    email: "test@example.com",
    udf1: "attempt-123",
  };
  const expected = digest(
    "merchant-key|transaction-123|299.00|GoldenCares companion visit|Test User|test@example.com|attempt-123||||||||||merchant-salt",
  );
  assert.equal(await createPayuRequestHash(params, "merchant-salt"), expected);
});

test("verifies reverse hashes and rejects changed response values", async () => {
  const response = {
    key: "merchant-key",
    txnid: "transaction-123",
    amount: "299.00",
    productinfo: "GoldenCares companion visit",
    firstname: "Test User",
    email: "test@example.com",
    udf1: "attempt-123",
    status: "success",
  };
  const reverseHash = [
    "merchant-salt",
    "success",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "attempt-123",
    "test@example.com",
    "Test User",
    "GoldenCares companion visit",
    "299.00",
    "transaction-123",
    "merchant-key",
  ].join("|");
  response.hash = digest(reverseHash);
  assert.equal(await verifyPayuResponseHash(response, "merchant-salt"), true);
  assert.equal(
    await verifyPayuResponseHash({ ...response, amount: "1.00" }, "merchant-salt"),
    false,
  );
});

test("uses fixed INR prices and rejects invalid amounts", () => {
  assert.equal(getVisitPriceInr(1), 299);
  assert.equal(getVisitPriceInr(2), 399);
  assert.equal(getVisitPriceInr(3), 599);
  assert.equal(getVisitPriceInr(4), null);
  assert.equal(amountInPaise("299.00"), 29_900);
  assert.equal(amountInPaise("1.234"), null);
});
