import { test, expect } from "@playwright/test";

const EMAIL = process.env.TEST_EMAIL || "testuser@goldencares.in";
const PASSWORD = process.env.TEST_PASSWORD || "";

async function signIn(page) {
  await page.goto("/login");
  await page.fill("#login-email", EMAIL);
  await page.fill("#login-password", PASSWORD);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/account$/, { timeout: 20000 });
}

async function goToPaymentStep(page) {
  await page.goto("/book");
  await page.getByRole("button", { name: /^Temple Visit/ }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
}

test("a booking cannot be placed until a payment method is chosen", async ({ page }) => {
  await signIn(page);
  await goToPaymentStep(page);

  await expect(page.getByRole("heading", { name: /How would you like to pay/i })).toBeVisible();
  await page.getByRole("button", { name: /Confirm request/ }).click();
  await expect(page.getByRole("alert")).toContainText("Choose how you’d like to pay");
  await expect(page.getByRole("heading", { name: /How would you like to pay/i })).toBeVisible();

  await page.getByRole("button", { name: /Cash on delivery/ }).click();
  await expect(page.getByRole("button", { name: /Cash on delivery/ })).toHaveAttribute("aria-pressed", "true");
});
