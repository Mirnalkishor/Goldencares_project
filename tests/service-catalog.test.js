import assert from "node:assert/strict";
import test from "node:test";
import { normalizeService } from "../src/lib/serviceCatalog.js";

test("live service documents override static prices and duration labels", () => {
  const service = normalizeService("1", {
    name: "Temple Visit",
    category: "Faith",
    price: 499,
    options: [
      { duration: "1 hours", durationHours: 1, price: 549 },
      { duration: "2 hours", durationHours: 2, price: 749 },
    ],
  });

  assert.equal(service.slug, "temple-visit");
  assert.equal(service.serviceId, "1");
  assert.equal(service.prices[1], 549);
  assert.equal(service.prices[2], 749);
  assert.equal(service.durationLabels[1], "1 hours");
  assert.deepEqual(service.durations, [1, 2]);
  assert.equal(service.category, "Faith");
});

test("new admin-created services get stable URLs and live variant prices", () => {
  const service = normalizeService("new-id", {
    name: "New Service",
    description: "A new live listing.",
    options: [{ duration: "90 minutes", durationHours: 1.5, price: 999 }],
  });

  assert.equal(service.slug, "service-new-id");
  assert.equal(service.prices[1.5], 999);
  assert.equal(service.durationLabels[1.5], "90 minutes");
  assert.equal(service.intro, "A new live listing.");
  assert.equal(service.isActive, true);
});

test("explicitly disabled services stay out of the public catalogue", () => {
  const service = normalizeService("4", { isActive: false, isPopular: false });
  assert.equal(service.isActive, false);
});
