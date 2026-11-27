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

async function goToAddressStep(page) {
  await page.goto("/book");
  await page.getByRole("button", { name: /^Temple Visit/ }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
}

test("saved address edit opens a popup with prefilled fields", async ({ page }) => {
  await signIn(page);
  await goToAddressStep(page);

  const homeCard = page.locator("div.rounded-2xl").filter({ hasText: "Home · Chandigarh" }).first();
  await expect(homeCard).toBeVisible({ timeout: 10000 });
  await homeCard.getByRole("button", { name: "Edit" }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.locator("#address_label")).toHaveValue("Home");
  await expect(dialog.locator("#full_name")).toHaveValue("Test User");
  await expect(dialog.locator("#phone")).toHaveValue("+919955638062");
  await expect(dialog.locator("#email")).toHaveValue("testuser@goldencares.in");
  await expect(dialog.locator("#elderName")).toHaveValue("Test Senior");
  await expect(dialog.locator("#elderAge")).toHaveValue("72");
  await dialog.getByRole("button", { name: "Cancel" }).click();

  await expect(page.getByText("Selected address")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Home" })).toBeVisible();
});

test("a new address named Dad is saved, previewed and reused", async ({ page }) => {
  await signIn(page);
  await goToAddressStep(page);

  await page.getByRole("button", { name: "Add a new address" }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.locator("#full_name")).toHaveValue("Test User");
  await expect(dialog.locator("#email")).toHaveValue("testuser@goldencares.in");
  await dialog.locator("#address_label").fill("Dad");
  await dialog.getByRole("button", { name: /^Mohali/ }).click();
  await dialog.locator("#address").fill("Phase 9, near the park");
  await dialog.locator("#full_name").fill("Test User");
  await dialog.locator("#phone").fill("+919955638063");
  await dialog.locator("#email").fill("testuser@goldencares.in");
  await dialog.getByRole("button", { name: "Hindi" }).click();
  await dialog.getByRole("button", { name: /^WhatsApp/ }).click();
  await dialog.locator("#elderName").fill("Dad Senior");
  await dialog.locator("#elderAge").fill("72");
  await dialog.locator("#notes").fill("Ring the second bell.");
  await dialog.getByRole("button", { name: "Save address" }).click();

  await expect(dialog).toBeHidden();
  await expect(page.getByRole("heading", { name: "Dad" })).toBeVisible();
  await expect(page.getByText("Phase 9, near the park").first()).toBeVisible();
  await expect(page.getByText("Dad Senior", { exact: true })).toBeVisible();
  await expect(page.getByText("72 years")).toBeVisible();
  await expect(page.getByText("WhatsApp").first()).toBeVisible();

  await page.reload();
  await goToAddressStep(page);

  const dadCard = page.locator("div.rounded-2xl").filter({ hasText: "Dad · Mohali" }).first();
  await expect(dadCard).toBeVisible({ timeout: 10000 });
  await expect(page.getByRole("heading", { name: "Dad" })).toBeVisible();

  await dadCard.getByRole("button", { name: "Edit" }).click();
  await expect(page.getByRole("dialog").locator("#elderName")).toHaveValue("Dad Senior");
  await expect(page.getByRole("dialog").locator("#elderAge")).toHaveValue("72");
  await page.getByRole("dialog").getByRole("button", { name: "Cancel" }).click();

  page.once("dialog", (confirm) => confirm.accept());
  await dadCard.getByRole("button", { name: /Delete/ }).click();
  await expect(dadCard).toHaveCount(0);
});

test.describe("mobile address popup", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("opens without horizontal overflow", async ({ page }) => {
    await signIn(page);
    await goToAddressStep(page);
    await page.getByRole("button", { name: "Add a new address" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    const box = await dialog.boundingBox();
    expect(box.width).toBeLessThanOrEqual(390);
    expect(box.height).toBeLessThanOrEqual(844);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    await dialog.getByRole("button", { name: "Cancel" }).click();
  });
});
