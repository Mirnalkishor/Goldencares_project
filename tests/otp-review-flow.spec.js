import { test, expect } from "@playwright/test";

const CAREGIVER_EMAIL = process.env.CAREGIVER_EMAIL || "testcaregiver@goldencares.in";
const CAREGIVER_PASSWORD = process.env.CAREGIVER_PASSWORD || process.env.TEST_PASSWORD || "";
const FAMILY_EMAIL = process.env.TEST_EMAIL || "testuser@goldencares.in";
const FAMILY_PASSWORD = process.env.TEST_PASSWORD || "";

// The disposable booking is created immediately before this suite by
// /tmp/opencode/create_otp_booking.sh and removed afterwards.
const BOOKING_NOTE = "Temporary OTP flow verification";

async function login(page, email, password, expectedUrl) {
  await page.goto("/login");
  await page.fill("#login-email", email);
  await page.fill("#login-password", password);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(expectedUrl, { timeout: 20000 });
}

function familyCard(page) {
  return page.getByRole("listitem").filter({ hasText: BOOKING_NOTE });
}

function caregiverCard(page) {
  return page.getByRole("listitem").filter({ hasText: "OTP Flow Test" });
}

test("family and caregiver complete the OTP journey, then the family reviews", async ({ browser }) => {
  test.setTimeout(150000);

  const familyContext = await browser.newContext();
  const caregiverContext = await browser.newContext();
  const family = await familyContext.newPage();
  const caregiver = await caregiverContext.newPage();

  try {
    await login(family, FAMILY_EMAIL, FAMILY_PASSWORD, /\/account$/);
    await family.getByRole("button", { name: "Bookings", exact: true }).click();

    const familyJourney = familyCard(family).locator("[data-testid='booking-journey']");
    await expect(familyJourney).toBeVisible({ timeout: 20000 });
    const arrivalCode = (await familyJourney.locator("[data-testid='arrival-code']").textContent()).trim();
    expect(arrivalCode).toBe("728988");
    await expect(familyJourney).not.toContainText("Valid until");
    await expect(
      familyJourney.getByRole("button", { name: /Show code again|Get a new code|Show arrival code/ }),
    ).toHaveCount(0);

    await login(caregiver, CAREGIVER_EMAIL, CAREGIVER_PASSWORD, /\/caregiver$/);
    await caregiver.getByRole("button", { name: "Bookings", exact: true }).click();
    await expect(caregiverCard(caregiver)).toBeVisible({ timeout: 20000 });
    await caregiverCard(caregiver).getByRole("button", { name: "View details" }).click();
    await caregiver.getByRole("textbox", { name: "Start OTP" }).fill(arrivalCode);
    await caregiver.getByRole("button", { name: "Verify start code" }).click();
    await expect(caregiver.getByRole("dialog")).toHaveCount(0);

    await family.reload();
    await family.getByRole("button", { name: "Bookings", exact: true }).click();
    const completionJourney = familyCard(family).locator("[data-testid='booking-journey']");
    const completionCode = (
      await completionJourney.locator("[data-testid='completion-code']").textContent()
    ).trim();
    expect(completionCode).toBe("728988");
    await expect(completionJourney).not.toContainText("Valid until");
    await expect(
      completionJourney.getByRole("button", { name: /Show code again|Get a new code|Show completion code/ }),
    ).toHaveCount(0);

    await caregiver.reload();
    await caregiver.getByRole("button", { name: "Bookings", exact: true }).click();
    await caregiverCard(caregiver).getByRole("button", { name: "View details" }).click();
    await caregiver.getByRole("textbox", { name: "Completion OTP" }).fill(completionCode);
    await caregiver.getByRole("button", { name: "Verify completion code" }).click();
    await expect(caregiver.getByRole("dialog")).toHaveCount(0);

    await family.reload();
    await family.getByRole("button", { name: "Bookings", exact: true }).click();
    const review = familyCard(family).locator("[data-testid='review-form']");
    await expect(review).toBeVisible({ timeout: 20000 });
    await family.getByRole("button", { name: "5 stars" }).click();
    await family.getByRole("textbox", { name: "Comment" }).fill("Arrived on time and was very kind.");
    await family.getByRole("button", { name: "Submit review" }).click();
    await expect(familyCard(family).getByText("Thanks for your review")).toBeVisible({ timeout: 20000 });
  } finally {
    await familyContext.close();
    await caregiverContext.close();
  }
});
