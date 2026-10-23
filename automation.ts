import { chromium } from "playwright";

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

    // Replace with your actual form field selectors:
    // await page.fill('input[name="name"]', process.env.USER_NAME || '');
    // await page.fill('input[type="email"]', process.env.USER_EMAIL || '');
    // await page.click('button[type="submit"]');

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
