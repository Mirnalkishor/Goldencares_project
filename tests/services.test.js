import assert from "node:assert/strict";
import test from "node:test";
import {
  getServiceDurationLabel,
  getServicePriceInr,
  serviceBySlug,
} from "../src/lib/services.js";

test("service metadata carries the live Firestore reference and prices", () => {
  assert.equal(serviceBySlug("temple-visit")?.serviceId, "1");
  assert.equal(getServicePriceInr("temple-visit", 1), 499);
  assert.equal(getServicePriceInr("temple-visit", 2), 699);
  assert.equal(getServicePriceInr("movie-and-theatre", 2), 599);
});

test("duration labels match the live service option strings", () => {
  assert.equal(getServiceDurationLabel("temple-visit", 1), "1 hours");
  assert.equal(getServiceDurationLabel("evening-outing", 1), "1 hour");
  assert.equal(getServiceDurationLabel("movie-and-theatre", 3), "3 hours");
});
