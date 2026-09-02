const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const baseUrl = process.env.BASE_URL || "http://localhost:3000";
const root = path.resolve(__dirname, "..");
const shots = path.join(root, "screenshots", "qa");
fs.mkdirSync(shots, { recursive: true });

const viewChecks = {
  home: "Wrist Mode",
  watches: "Watches",
  women: "Gift Sets, Bracelet Sets, Plain Styles",
  wooden: "Wooden Watches",
  jewelry: "Jewelry",
  customize: "Plain or Customized, Your Choice",
  about: "Time, Style, Mode",
  contact: "Talk to Wrist Mode",
  faq: "Common Questions",
};

async function checkNoHorizontalOverflow(page, label) {
  const overflow = await page.evaluate(() => {
    const root = document.documentElement;
    return Math.max(0, root.scrollWidth - root.clientWidth);
  });
  assert(overflow <= 2, `${label} has horizontal overflow of ${overflow}px`);
}

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

async function visitView(page, view, label) {
  await page.click(`[data-view="${view}"]`);
  await page.waitForTimeout(250);
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForSelector(`text=${viewChecks[view]}`);
  if (["watches", "jewelry", "wooden", "women"].includes(view)) {
    await warmProductImages(page);
    await waitForImages(page, view === "women" ? ".women-look-card img" : ".product-grid img");
  }
  await checkNoHorizontalOverflow(page, label);
  await page.screenshot({ path: path.join(shots, `${label}-${view}.png`), fullPage: true });
}

async function runViewport(name, viewport) {
  const browserPath =
    [
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    ].find((candidate) => fs.existsSync(candidate)) || undefined;
  let browser;
  try {
    browser = await chromium.launch({ headless: true, executablePath: browserPath });
  } catch (error) {
    if (!browserPath) throw error;
    browser = await chromium.launch({ headless: true });
  }
  const page = await browser.newPage({ viewport, isMobile: viewport.width < 700 });
  const problems = [];

  page.on("pageerror", (error) => problems.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") problems.push(message.text());
  });

  try {
    await page.addInitScript(() => localStorage.clear());
    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".hero h1");
    await waitForImages(page, ".hero img, .category-grid img, .product-grid img");
    await checkNoHorizontalOverflow(page, `${name}-home`);
    await page.screenshot({ path: path.join(shots, `${name}-home.png`), fullPage: true });

    for (const view of Object.keys(viewChecks).filter((view) => view !== "home")) {
      await visitView(page, view, name);
    }

    await page.click('[data-view="admin"]');
    await page.fill('input[name="password"]', "wristmode2026");
    await page.click("#adminLoginForm .primary-button");
    await page.waitForSelector("text=Manage Wrist Mode");
    await page.waitForTimeout(3800);
    await checkNoHorizontalOverflow(page, `${name}-admin`);
    await page.screenshot({ path: path.join(shots, `${name}-admin-overview.png`), fullPage: true });

    for (const tab of ["products", "orders", "custom", "notifications"]) {
      await page.click(`[data-admin-tab="${tab}"]`);
      await page.waitForTimeout(250);
      await checkNoHorizontalOverflow(page, `${name}-admin-${tab}`);
      await page.screenshot({ path: path.join(shots, `${name}-admin-${tab}.png`), fullPage: true });
    }

    assert.strictEqual(problems.length, 0, `${name} console/page errors:\n${problems.join("\n")}`);
  } finally {
    await browser.close();
  }
}

(async () => {
  await runViewport("desktop", { width: 1366, height: 900 });
  await runViewport("mobile", { width: 390, height: 844 });
})();
