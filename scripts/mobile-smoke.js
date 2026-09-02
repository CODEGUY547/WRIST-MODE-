const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const baseUrl = process.env.BASE_URL || "http://localhost:3000";
const root = path.resolve(__dirname, "..");

(async () => {
  const browserPath =
    [
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    ].find((candidate) => fs.existsSync(candidate)) || undefined;
  const browser = await chromium.launch({ headless: true, executablePath: browserPath });
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
  });

  try {
    await page.addInitScript(() => localStorage.clear());
    await page.goto(baseUrl, { waitUntil: "networkidle" });
    await page.screenshot({ path: path.join(root, "screenshots", "mobile-home.png"), fullPage: true });
    assert(await page.locator("h1").filter({ hasText: "Wrist Mode" }).first().isVisible(), "Mobile homepage brand is not visible");

    await page.click('[data-view="watches"]');
    await page.waitForSelector(".product-card");
    await page.screenshot({ path: path.join(root, "screenshots", "mobile-watches.png"), fullPage: true });
  } finally {
    await browser.close();
  }
})();
