import { test, expect } from "@playwright/test";

const EMAIL = process.env.TEST_EMAIL || "testuser@goldencares.in";
const PASSWORD = process.env.TEST_PASSWORD || "";
const BOOKING_NOTE = "Temporary cancellation verification";

async function signIn(page) {
  await page.goto("/login");
  await page.fill("#login-email", EMAIL);
  await page.fill("#login-password", PASSWORD);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/account$/, { timeout: 20000 });
}

test("a family user can cancel an active service", async ({ page }) => {
  await signIn(page);
  await page.getByRole("button", { name: "Bookings", exact: true }).click();

  const card = page.getByRole("listitem").filter({ hasText: BOOKING_NOTE }).first();
  await expect(card).toBeVisible({ timeout: 20000 });

  page.once("dialog", (dialog) => dialog.accept());
  await card.getByRole("button", { name: "Cancel service" }).click();

  await expect(card.getByText("Cancelled", { exact: true })).toBeVisible({ timeout: 20000 });
  await expect(card.getByRole("button", { name: /Cancel service/ })).toHaveCount(0);
});
