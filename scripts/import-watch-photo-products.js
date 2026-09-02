const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const PHOTO_RECORDS = path.join(ROOT, "incoming", "watch-contact-sheets", "image-records.json");
const MANIFEST = path.join(__dirname, "watch-photo-products.json");
const ASSET_DIR = path.join(ROOT, "public", "assets", "products", "watches");
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "wristmode2026";
const IMPORT_MARKER = "Imported " + "from Wrist Mode " + "photo stock.";

function slug(value) {
  return String(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function specsFor(product) {
  return {
    caseSize: product.style.includes("Ladies") ? "Ladies fit" : "Standard fit",
    strapMaterial: product.name.includes("Leather")
      ? "Leather"
      : product.name.includes("Rubber") || product.name.includes("Silicone")
        ? "Rubber"
        : product.name.includes("Digital") || product.name.includes("Sport")
          ? "Mixed"
          : "Stainless steel",
    movementType: product.style === "Digital" ? "Digital" : "Quartz",
    style: product.style,
  };
}

function formBody(fields) {
  const body = new URLSearchParams();
  for (const [key, value] of Object.entries(fields)) body.set(key, String(value));
  return body;
}

async function request(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!response.ok) {
    throw new Error(`${options.method || "GET"} ${url} failed: ${response.status} ${JSON.stringify(data)}`);
  }
  return { response, data };
}

async function main() {
  if (!fs.existsSync(PHOTO_RECORDS)) {
    throw new Error(`Photo records not found at ${PHOTO_RECORDS}. Extract the zip and run the contact sheet step first.`);
  }

  const records = JSON.parse(fs.readFileSync(PHOTO_RECORDS, "utf8"));
  const byIndex = new Map(records.map((record) => [Number(record.idx), record]));
  const products = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
  fs.mkdirSync(ASSET_DIR, { recursive: true });

  const { response: loginResponse } = await request(`${BASE_URL}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: ADMIN_PASSWORD }),
  });
  const cookie = loginResponse.headers.get("set-cookie")?.split(";")[0];
  if (!cookie) throw new Error("Admin login did not return a session cookie.");

  const { data: existingProducts } = await request(`${BASE_URL}/api/products`);
  const previousImports = existingProducts.filter(
    (product) => product.category === "watch" && String(product.description || "").startsWith(IMPORT_MARKER),
  );

  for (const product of previousImports) {
    await request(`${BASE_URL}/api/admin/products/${product.id}`, {
      method: "DELETE",
      headers: { Cookie: cookie },
    });
  }

  const copied = [];
  for (const product of products) {
    const record = byIndex.get(Number(product.idx));
    if (!record) throw new Error(`No source image found for index ${product.idx}`);

    const source = record.path;
    const fileName = `${String(product.idx).padStart(3, "0")}-${slug(product.brand)}-${slug(product.name)}.jpeg`;
    const destination = path.join(ASSET_DIR, fileName);
    if (!fs.existsSync(destination)) fs.copyFileSync(source, destination);
    copied.push(`/assets/products/watches/${fileName}`);

    const description = `${product.brand} ${product.name}. Contact Wrist Mode to confirm current price and availability.`;
    const fields = {
      category: "watch",
      brand: product.brand,
      name: product.name,
      price: 0,
      quantity: 4,
      description,
      specs: JSON.stringify(specsFor(product)),
      featured: "true",
    };

    const { data: created } = await request(`${BASE_URL}/api/admin/products`, {
      method: "POST",
      headers: {
        Cookie: cookie,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formBody(fields),
    });
    let createdId = created?.id;
    if (!createdId) {
      const { data: latestProducts } = await request(`${BASE_URL}/api/products`);
      createdId = latestProducts.find(
        (item) => item.category === "watch" && item.brand === product.brand && item.name === product.name && item.description === description,
      )?.id;
    }
    if (!createdId) throw new Error(`Could not find created product for ${product.brand} ${product.name}`);

    await request(`${BASE_URL}/api/admin/products/${createdId}`, {
      method: "PUT",
      headers: {
        Cookie: cookie,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formBody({
        ...fields,
        existingImages: JSON.stringify([`/assets/products/watches/${fileName}`]),
      }),
    });
  }

  console.log(`Removed ${previousImports.length} previous photo imports.`);
  console.log(`Imported ${products.length} watch photo products.`);
  console.log(`Copied ${copied.length} images into ${ASSET_DIR}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
