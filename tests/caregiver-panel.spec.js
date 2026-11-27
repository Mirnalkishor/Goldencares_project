import { test, expect } from "@playwright/test";

const CAREGIVER_EMAIL = process.env.CAREGIVER_EMAIL || "testcaregiver@goldencares.in";
const CAREGIVER_PASSWORD = process.env.CAREGIVER_PASSWORD || process.env.TEST_PASSWORD || "";
const FAMILY_EMAIL = process.env.TEST_EMAIL || "testuser@goldencares.in";
const FAMILY_PASSWORD = process.env.TEST_PASSWORD || "";

async function login(page, email, password, expectedUrl = /\/account$/) {
  await page.goto("/login");
  await page.fill("#login-email", email);
  await page.fill("#login-password", password);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(expectedUrl, { timeout: 20000 });
}

test("caregiver lands on the panel and renders its tabs", async ({ page }) => {
  await login(page, CAREGIVER_EMAIL, CAREGIVER_PASSWORD, /\/caregiver$/);

  await expect(page.getByRole("heading", { name: /Welcome back/i })).toBeVisible();

  // Caregivers must never see the family account portal.
  await page.goto("/account");
  await expect(page).toHaveURL(/\/caregiver$/, { timeout: 20000 });

  for (const name of ["Dashboard", "Bookings", "All orders", "Availability", "Earnings", "Profile"]) {
    await expect(page.getByRole("button", { name, exact: true })).toBeVisible();
  }

  await page.getByRole("button", { name: "All orders", exact: true }).click();
  await expect(page.getByRole("heading", { name: "All orders" })).toBeVisible();
  await expect(page.getByRole("list", { name: "All orders list" }).getByRole("listitem")).toHaveCount(7);

  await page.getByRole("button", { name: "Availability", exact: true }).click();
  await expect(page.getByText("Duty status")).toBeVisible();

  await page.getByRole("button", { name: "Earnings", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Payout destination" })).toBeVisible();

  await page.getByRole("button", { name: "Profile", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Verification" })).toBeVisible();
});

test("family account cannot open the caregiver panel", async ({ page }) => {
  await login(page, FAMILY_EMAIL, FAMILY_PASSWORD);

  await page.getByRole("button", { name: "Your account" }).click();
  await expect(page.getByRole("menuitem", { name: "Caregiver panel" })).toHaveCount(0);

  await page.goto("/caregiver");
  await expect(page.getByRole("heading", { name: "This page is for caregivers." })).toBeVisible();
});
