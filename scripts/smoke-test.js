const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const baseUrl = process.env.BASE_URL || "http://localhost:3000";
const root = path.resolve(__dirname, "..");

async function waitForImages(page, selector) {
  await page
    .waitForFunction(
      (imageSelector) =>
        [...document.querySelectorAll(imageSelector)].every((image) => image.complete && image.naturalWidth > 0),
      selector,
      { timeout: 15000 },
    )
    .catch(() => {});
}

async function warmProductImages(page) {
  await page.evaluate(async () => {
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const step = Math.max(360, Math.floor(window.innerHeight * 0.75));
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await delay(80);
    }
    window.scrollTo(0, 0);
  });
}

(async () => {
  const browserPath =
    [
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    ].find((candidate) => fs.existsSync(candidate)) || undefined;
  const browser = await chromium.launch({ headless: true, executablePath: browserPath });
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });

  try {
    await page.addInitScript(() => localStorage.clear());
    await page.goto(baseUrl, { waitUntil: "networkidle" });
    await waitForImages(page, ".hero img, .category-grid img, .product-grid img");
    await page.screenshot({ path: path.join(root, "screenshots", "home.png"), fullPage: true });
    assert(await page.locator("text=Wrist Mode").first().isVisible(), "Homepage brand text is not visible");

    await page.click('[data-view="watches"]');
    await page.waitForSelector(".product-card");
    const watchCount = await page.locator(".product-card").count();
    assert(watchCount >= 1, "Watch catalog has no products");
    await page.click('[data-filter="q"]');
    await page.keyboard.type("Casio");
    const searchValue = await page.locator('[data-filter="q"]').inputValue();
    assert.strictEqual(searchValue, "Casio", "Search input lost focus while typing");
    assert(await page.locator("text=Digital Classic Watch").isVisible(), "Search result did not stay visible");
    await page.fill('[data-filter="q"]', "");
    await warmProductImages(page);
    await waitForImages(page, ".product-grid img");
    await page.screenshot({ path: path.join(root, "screenshots", "watches.png"), fullPage: true });

    await page.fill('[data-filter="q"]', "Digital Classic Watch");
    await page.waitForSelector("[data-add]");
    await page.locator("[data-add]").first().click();
    await page.click("[data-cart-toggle]");
    await page.waitForSelector("#checkoutForm");
    assert(await page.locator("#cartCount").textContent(), "Cart count did not update");

    await page.click("[data-cart-close]");
    await page.waitForTimeout(3800);
    await page.click('[data-view="customize"]');
    await page.waitForSelector("#customForm");
    await waitForImages(page, ".custom-showcase img");
    await page.screenshot({ path: path.join(root, "screenshots", "customize.png"), fullPage: true });

    await page.click('[data-view="admin"]');
    await page.fill('input[name="password"]', "wristmode2026");
    await page.click("#adminLoginForm .primary-button");
    await page.waitForSelector("text=Manage Wrist Mode");
    await page.waitForTimeout(3800);
    await page.screenshot({ path: path.join(root, "screenshots", "admin.png"), fullPage: true });
  } finally {
    await browser.close();
  }
})();
