import { test, expect } from "@playwright/test";
import fs from "node:fs";

// Live login test with network capture. Uses credentials from env (never hardcode).
const EMAIL = process.env.TEST_EMAIL || "sagarkumarweebly@gmail.com";
const PASSWORD = process.env.TEST_PASSWORD || "";

test("login page + live Firebase sign-in + network logs", async ({ page }, testInfo) => {
  const network = [];
  const consoleMsgs = [];
  const pageErrors = [];

  page.on("request", (r) => network.push({ type: "request", method: r.method(), url: r.url(), resourceType: r.resourceType() }));
  page.on("requestfailed", (r) => network.push({ type: "requestfailed", method: r.method(), url: r.url(), errorText: r.failure()?.errorText }));
  page.on("requestfinished", async (r) => {
    const resp = await r.response().catch(() => null);
    network.push({ type: "requestfinished", method: r.method(), url: r.url(), status: resp?.status() });
  });
  page.on("response", async (resp) => {
    let body;
    try { body = (await resp.text()).slice(0, 800); } catch { /* ignore */ }
    network.push({ type: "response", url: resp.url(), status: resp.status(), body });
  });
  page.on("console", (m) => consoleMsgs.push({ type: m.type(), text: m.text() }));
  page.on("pageerror", (e) => pageErrors.push(String(e)));

  await page.goto("/login");
  await expect(page.locator("#login-email")).toBeVisible();
  await page.fill("#login-email", EMAIL);
  await page.fill("#login-password", PASSWORD); // from TEST_PASSWORD env; not printed
  await page.click('button[type="submit"]');

  // Wait for either redirect off /login or an error message.
  await page.waitForTimeout(8000);

  const out = {
    finalUrl: page.url(),
    bodyHasError: await page.locator("body").innerText().then((t) => /invalid|error|unable|not/i.test(t)).catch(() => null),
    bodyTextTail: await page.locator("body").innerText().then((t) => t.slice(-400)).catch(() => null),
    consoleMsgs,
    pageErrors,
    networkCount: network.length,
    failedRequests: network.filter((n) => n.type === "requestfailed"),
    firebaseRequests: network.filter((n) => /firebase|firestore|googleapis|identitytoolkit|securetoken|google\.com/i.test(n.url)),
    network,
  };
  const path = testInfo.outputPath("network-log.json");
  fs.writeFileSync(path, JSON.stringify(out, null, 2));
  console.log("FINAL_URL", out.finalUrl);
  console.log("PAGE_ERRORS", JSON.stringify(pageErrors));
  console.log("FAILED_REQUESTS", JSON.stringify(out.failedRequests, null, 2));
  console.log("FIREBASE_REQUESTS", JSON.stringify(out.firebaseRequests, null, 2));
  console.log("CONSOLE", JSON.stringify(consoleMsgs, null, 2));
  console.log("BODY_TAIL", out.bodyTextTail);
  console.log("NETWORK_LOG_FILE", path);
});
