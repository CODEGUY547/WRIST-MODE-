const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const MANIFEST = path.join(__dirname, "women-watch-products.json");
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "wristmode2026";
const IMPORT_MARKER = "Imported " + "from Wrist Mode " + "women watch stock.";

function slug(value) {
  return String(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function imagePathFor(product, index) {
  return `/assets/products/women-watches/${slug(product.name)}-${String(index).padStart(3, "0")}.jpeg`;
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

function assertAssets(products) {
  for (const product of products) {
    for (const image of product.images) {
      const localPath = path.join(ROOT, "public", image.replace(/^\//, ""));
      if (!fs.existsSync(localPath)) throw new Error(`Missing image for ${product.name}: ${localPath}`);
    }
  }
}

function fieldsFor(product, overrides = {}) {
  return {
    category: product.category,
    brand: product.brand,
    name: product.name,
    price: product.price,
    quantity: product.quantity,
    description: product.description,
    specs: JSON.stringify(product.specs),
    featured: product.featured ? "true" : "false",
    ...overrides,
  };
}

async function createProduct(product, cookie) {
  const fields = fieldsFor(product);
  const { data: created } = await request(`${BASE_URL}/api/admin/products`, {
    method: "POST",
    headers: {
      Cookie: cookie,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formBody(fields),
  });

  let productId = created?.id;
  if (!productId) {
    const { data: latestProducts } = await request(`${BASE_URL}/api/products`);
    productId = latestProducts.find(
      (item) =>
        item.category === product.category &&
        item.brand === product.brand &&
        item.name === product.name &&
        item.description === product.description,
    )?.id;
  }
  if (!productId) throw new Error(`Could not create ${product.name}`);

  await request(`${BASE_URL}/api/admin/products/${productId}`, {
    method: "PUT",
    headers: {
      Cookie: cookie,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formBody(fieldsFor(product, { existingImages: JSON.stringify(product.images) })),
  });
}

async function cleanupJewelry(existingProducts, cookie) {
  let deletedBridal = 0;
  let renamedRing = false;

  for (const product of existingProducts) {
    const isBridalNecklace = product.category === "jewelry" && product.name === "Bridal Necklace Set";
    if (isBridalNecklace) {
      await request(`${BASE_URL}/api/admin/products/${product.id}`, {
        method: "DELETE",
        headers: { Cookie: cookie },
      });
      deletedBridal += 1;
      continue;
    }

    const isBridalRing = product.category === "jewelry" && product.brand === "Wrist Mode Bridal" && product.name === "His and Hers Ring Set";
    if (isBridalRing) {
      const updated = {
        category: product.category,
        brand: "Wrist Mode Rings",
        name: "Matching Ring Set",
        price: Number(product.price || 0),
        quantity: Number(product.quantity || 0),
        description: "Matching ring set with a polished white-gold look.",
        specs: product.specs || {},
        images: product.images || [],
        featured: Boolean(product.featured),
      };
      await request(`${BASE_URL}/api/admin/products/${product.id}`, {
        method: "PUT",
        headers: {
          Cookie: cookie,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formBody(fieldsFor(updated, { existingImages: JSON.stringify(updated.images) })),
      });
      renamedRing = true;
    }
  }

  return { deletedBridal, renamedRing };
}

async function main() {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
  const products = manifest.map((item, index) => {
    const images = item.indices.map((imageIndex) => imagePathFor(item, imageIndex));
    return {
      category: "women",
      brand: "Wrist Mode Women",
      name: item.name,
      price: 0,
      quantity: 5,
      description: `${item.description} Contact Wrist Mode to confirm current price and availability.`,
      specs: {
        collection: item.collection,
        included: item.included,
        colorOptions: item.colorOptions,
        caseSize: "Ladies fit",
        strapMaterial: item.collection === "Plain Watches" ? "Mixed straps" : "Watch set",
        movementType: "Quartz",
        style: item.collection,
      },
      images,
      featured: Boolean(item.featured || index < 2),
    };
  });

  assertAssets(products);

  const { response: loginResponse } = await request(`${BASE_URL}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: ADMIN_PASSWORD }),
  });
  const cookie = loginResponse.headers.get("set-cookie")?.split(";")[0];
  if (!cookie) throw new Error("Admin login did not return a session cookie.");

  const { data: existingProducts } = await request(`${BASE_URL}/api/products`);
  const previousImports = existingProducts.filter(
    (product) => product.category === "women" || String(product.description || "").startsWith(IMPORT_MARKER),
  );

  for (const product of previousImports) {
    await request(`${BASE_URL}/api/admin/products/${product.id}`, {
      method: "DELETE",
      headers: { Cookie: cookie },
    });
  }

  const cleanup = await cleanupJewelry(
    existingProducts.filter((product) => !previousImports.some((previous) => previous.id === product.id)),
    cookie,
  );

  for (const product of products) {
    await createProduct(product, cookie);
  }

  console.log(`Removed ${previousImports.length} previous women watch imports.`);
  console.log(`Deleted ${cleanup.deletedBridal} bridal necklace product(s).`);
  console.log(`Renamed bridal ring product: ${cleanup.renamedRing ? "yes" : "no"}.`);
  console.log(`Imported ${products.length} women watch product families using ${products.reduce((sum, product) => sum + product.images.length, 0)} photos.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
