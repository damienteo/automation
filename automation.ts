import { chromium } from "playwright";

import { loadEnvFile } from "node:process";

loadEnvFile();

export const isUpcomingWednesdayLastOfMonth = (
  baseDate: Date = new Date(),
): boolean => {
  const today = new Date(baseDate);
  const upcomingWednesday = new Date(today);
  upcomingWednesday.setDate(today.getDate() + 4);

  const currentMonth = upcomingWednesday.getMonth();
  const nextWeekWednesday = new Date(upcomingWednesday);
  nextWeekWednesday.setDate(upcomingWednesday.getDate() + 7);

  return nextWeekWednesday.getMonth() !== currentMonth;
};

const runAutomation = async (): Promise<void> => {
  if (isUpcomingWednesdayLastOfMonth()) {
    console.log(
      "Skipping registration: The upcoming Wednesday is the last Wednesday of the month (in-person event day).",
    );
    process.exit(0);
  }

  console.log("Proceeding with registration for the online Zoom event...");

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(
      "https://nihongocafeota.wixsite.com/home/application-form",
      {
        waitUntil: "domcontentloaded",
      },
    );

    console.log("Selecting the first Zoom event...");

    // Find the first event card containing 'ZOOM 日本語カフェ' and click its registration button
    const zoomEventCard = page
      .locator('li[data-hook="events-card"]')
      .filter({ hasText: "ZOOM 日本語カフェ" })
      .first();

    await zoomEventCard.getByRole("link", { name: "参加申込" }).click();

    console.log("Clicked registration for the Zoom event.");

    // Wait for the event detail page/modal to render
    await page.waitForLoadState("domcontentloaded");

    // Extract event date (e.g., "11月04日(水)")
    const eventDateText = await page
      .locator("text=/\\d{1,2}月\\d{1,2}日/")
      .first()
      .textContent();

    console.log(`Event Date: ${eventDateText?.trim()}`);

    // 受付開始後に表示される「参加申込」ボタンをクリックしてフォーム画面へ移動
    console.log("Navigating to the application form...");
    await page
      .getByRole("link", { name: "参加申込" })
      .or(page.getByRole("button", { name: "参加申込" }))
      .first()
      .click();

    // フォーム画面の読み込み待機
    await page.waitForSelector("input", { state: "visible" });
    console.log("Successfully reached the registration form.");

    await page.fill("#firstName", process.env.USER_FIRST_NAME || "");
    await page.fill("#lastName", process.env.USER_LAST_NAME || "");
    await page.fill("#email", process.env.USER_EMAIL || "");

    console.log("Form fields filled successfully.");

    // Verify that the fields have been successfully filled
    const firstNameValue = await page.inputValue("#firstName");
    const lastNameValue = await page.inputValue("#lastName");
    const emailValue = await page.inputValue("#email");

    console.log("Verifying input values...");
    if (
      firstNameValue !== process.env.USER_FIRST_NAME ||
      lastNameValue !== process.env.USER_LAST_NAME ||
      emailValue !== process.env.USER_EMAIL
    ) {
      throw new Error(
        "Form validation failed: Input fields do not match environment variables.",
      );
    }
    console.log("All required fields verified successfully.");

    // Ensure the "いいえ no" (No) checkbox for Ota-ku residency is checked
    console.log("Checking 'No' for Ota-ku residency...");

    const noCheckbox = page
      .locator('div[role="checkbox"]')
      .filter({ hasText: "いいえ no" });

    // Check its current state, click only if it's not already checked
    const isChecked = await noCheckbox.getAttribute("aria-checked");
    if (isChecked !== "true") {
      await noCheckbox.click();
      console.log("'No' checkbox clicked.");
    } else {
      console.log("'No' checkbox is already checked.");
    }

    // Click the Submit button (送信 Submit)
    console.log("Submitting the form...");
    // Click the Form button (handles "次へ" / Next or "送信" / Submit)
    console.log("Verifying the form button is present...");
    const formButton = page
      .locator('button[data-hook="form-button"]')
      .or(page.getByRole("button", { name: /次へ|送信|Submit|Next/i }));
    await formButton.waitFor({ state: "visible" });
    console.log("Form button successfully found.");

    // Brief stabilization pause and forced click to bypass Wix layout shifts/overlays
    await page.waitForTimeout(500);
    await formButton.click({ force: true });
    console.log("Form action completed successfully!");

    // --- STEP 2: Event Policy Agreement ---
    console.log("Handling event policy agreement step...");

    // 1. Check the agreement checkbox ("次に同意します")
    const policyCheckbox = page
      .locator('div[role="checkbox"]')
      .filter({ hasText: "次に同意します" });
    const isPolicyChecked = await policyCheckbox.getAttribute("aria-checked");
    if (isPolicyChecked !== "true") {
      await policyCheckbox.click();
      console.log("Policy agreement checkbox checked.");
    }

    // 2. Click the final Submit button (送信 Submit)
    console.log("Locating final submit button...");
    const finalSubmitButton = page
      .locator('button[data-hook="form-button"]')
      .filter({ hasText: /送信|Submit/i });
    await finalSubmitButton.waitFor({ state: "visible" });

    await page.waitForTimeout(500);
    await finalSubmitButton.click({ force: true });
    console.log("Final registration submitted successfully!");

    await page.waitForTimeout(3000);
    await page.screenshot({ path: "submission-result.png", fullPage: true });
    console.log("Automation executed successfully.");

    await page.waitForTimeout(3000);
    await page.screenshot({ path: "submission-result.png", fullPage: true });
    console.log("Automation executed successfully.");
  } catch (error) {
    console.error("Error during execution:", error);
    process.exit(1);
  } finally {
    await browser.close();
  }
};

runAutomation();
