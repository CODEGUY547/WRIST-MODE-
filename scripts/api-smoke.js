const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const root = path.resolve(__dirname, "..");
const port = 3100;
const baseUrl = `http://localhost:${port}`;
const tempDb = path.join(root, "data", "smoke-test.sqlite");
const tempUploads = path.join(root, "uploads-smoke-test");

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.ok) return;
    } catch {
      await delay(250);
    }
  }
  throw new Error("Smoke test server did not start.");
}

async function json(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed: ${url}`);
  return { response, data };
}

(async () => {
  fs.rmSync(tempDb, { force: true });
  fs.rmSync(tempUploads, { recursive: true, force: true });

  const child = spawn(process.execPath, ["server.js"], {
    cwd: root,
    env: {
      ...process.env,
      PORT: String(port),
      DB_FILE: tempDb,
      UPLOAD_DIR: tempUploads,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  try {
    await waitForServer();

    const { data: products } = await json(`${baseUrl}/api/products`);
    assert(products.length >= 6, "Seed products were not created");

    const inStock = products.find((product) => product.quantity > 0 && product.price > 0);
    const outOfStock = products.find((product) => product.quantity === 0);
    assert(inStock, "Expected at least one in-stock product");
    assert(outOfStock, "Expected at least one out-of-stock product");

    await json(`${baseUrl}/api/stock-alerts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: outOfStock.id,
        name: "Smoke Tester",
        phone: "+256700000000",
      }),
    });

    const form = new FormData();
    form.set("jewelryType", "Pendant");
    form.set("finish", "Gold");
    form.set("material", "Stainless steel");
    form.set("measurements", "45cm");
    form.set("engraving", "WM");
    form.set("budget", "UGX 100000");
    form.set("notes", "Smoke test");
    form.set("name", "Smoke Tester");
    form.set("phone", "+256700000000");
    form.set("email", "tester@example.com");
    const { data: custom } = await json(`${baseUrl}/api/custom-orders`, { method: "POST", body: form });
    assert(custom.requestCode, "Custom request did not return a tracking code");

    const { data: order } = await json(`${baseUrl}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: [{ productId: inStock.id, quantity: 1 }],
        paymentMethod: "MTN Mobile Money",
        customer: {
          name: "Smoke Tester",
          phone: "+256700000000",
          email: "tester@example.com",
          address: "Kampala",
        },
      }),
    });
    assert(order.receipt, "Order did not return a receipt");

    const login = await fetch(`${baseUrl}/api/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: "wristmode2026" }),
    });
    assert(login.ok, "Admin login failed");
    const cookie = login.headers.get("set-cookie");

    const { data: analytics } = await json(`${baseUrl}/api/admin/analytics`, {
      headers: { Cookie: cookie },
    });
    assert(analytics.totalOrders === 1, "Analytics did not count the test order");
    assert(analytics.customRequests === 1, "Analytics did not count the custom request");

    const { data: notifications } = await json(`${baseUrl}/api/admin/notifications`, {
      headers: { Cookie: cookie },
    });
    assert(notifications.length >= 3, "Notifications were not logged");
  } finally {
    child.kill();
    fs.rmSync(tempDb, { force: true });
    fs.rmSync(tempUploads, { recursive: true, force: true });
  }
})();
