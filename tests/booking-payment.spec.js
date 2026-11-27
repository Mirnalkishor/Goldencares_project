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

  // Older saved addresses may not include the senior's gender yet.
  const edit = page.getByRole("button", { name: "Edit", exact: true }).first();
  if (await edit.count()) {
    await edit.click();
    const dialog = page.getByRole("dialog");
    const gender = dialog.locator("#elderGender");
    if ((await gender.inputValue()) === "") await gender.selectOption("Female");
    await dialog.getByRole("button", { name: "Save address" }).click();
  }

  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
}

test("cash on delivery is temporarily unavailable and online payment is required", async ({ page }) => {
  await signIn(page);
  await goToPaymentStep(page);

  await expect(page.getByRole("heading", { name: /How would you like to pay/i })).toBeVisible();
  const cod = page.getByRole("button", { name: /Cash on delivery/ });
  await expect(cod).toBeDisabled();
  await expect(cod).toContainText("Temporarily unavailable");

  await page.getByRole("button", { name: /Confirm request/ }).click();
  await expect(page.getByRole("alert")).toContainText("Online payment is required right now");
  await expect(page.getByRole("heading", { name: /How would you like to pay/i })).toBeVisible();

  await page.getByRole("button", { name: /Pay online/ }).click();
  await expect(page.getByRole("button", { name: /Pay online/ })).toHaveAttribute("aria-pressed", "true");
});
