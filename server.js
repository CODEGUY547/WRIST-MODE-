const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const express = require("express");
const multer = require("multer");
const initSqlJs = require("sql.js");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "wristmode2026";

const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, "public");
const DATA_DIR = path.join(ROOT, "data");
const UPLOAD_DIR = process.env.UPLOAD_DIR ? path.resolve(process.env.UPLOAD_DIR) : path.join(ROOT, "uploads");
const DB_FILE = process.env.DB_FILE ? path.resolve(process.env.DB_FILE) : path.join(DATA_DIR, "wrist-mode.sqlite");

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const sessions = new Map();
let db;

const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (req, file, cb) => {
      const safeExt = path.extname(file.originalname || "").toLowerCase() || ".jpg";
      cb(null, `${Date.now()}-${crypto.randomBytes(5).toString("hex")}${safeExt}`);
    },
  }),
  limits: { fileSize: 6 * 1024 * 1024, files: 6 },
});

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(UPLOAD_DIR));
app.use("/vendor/three", express.static(path.join(ROOT, "node_modules", "three")));

function now() {
  return new Date().toISOString();
}

function saveDb() {
  fs.writeFileSync(DB_FILE, Buffer.from(db.export()));
}

function query(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function get(sql, params = []) {
  return query(sql, params)[0] || null;
}

function lastId() {
  return get("SELECT last_insert_rowid() AS id").id;
}

function jsonParse(value, fallback) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function htmlEscape(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[character]);
}

function stockStatus(quantity) {
  const qty = Number(quantity || 0);
  if (qty <= 0) return "Out of Stock";
  if (qty <= 3) return "Low Stock";
  return "In Stock";
}

function productFromRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    category: row.category,
    brand: row.brand,
    name: row.name,
    price: row.price,
    quantity: row.quantity,
    stockStatus: stockStatus(row.quantity),
    description: row.description,
    specs: jsonParse(row.specs, {}),
    images: jsonParse(row.images, []),
    featured: Boolean(row.featured),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

app.get("/share/product/:id", (req, res) => {
  const product = productFromRow(get("SELECT * FROM products WHERE id = ?", [Number(req.params.id)]));
  if (!product) {
    res.status(404).send("Product not found.");
    return;
  }

  const origin = `${req.protocol}://${req.get("host")}`;
  const imagePath = product.images[0] || "/assets/watch-hero.jpg";
  const imageUrl = new URL(imagePath, origin).toString();
  const title = `${product.brand} ${product.name} | Wrist Mode`;
  const description = `${product.stockStatus}. Contact Wrist Mode to confirm availability and price.`;

  res.type("html").send(`<!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${htmlEscape(title)}</title>
        <meta name="description" content="${htmlEscape(description)}" />
        <meta property="og:type" content="product" />
        <meta property="og:title" content="${htmlEscape(title)}" />
        <meta property="og:description" content="${htmlEscape(description)}" />
        <meta property="og:image" content="${htmlEscape(imageUrl)}" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="${htmlEscape(title)}" />
        <meta name="twitter:description" content="${htmlEscape(description)}" />
        <meta name="twitter:image" content="${htmlEscape(imageUrl)}" />
        <style>body{margin:0;background:#07100e;color:#fff4cf;font-family:Arial,sans-serif;padding:32px}main{max-width:620px;margin:auto}img{width:100%;max-height:480px;object-fit:cover;border-radius:10px}a{display:inline-block;margin-top:20px;padding:12px 18px;border-radius:999px;background:#d8a441;color:#11100b;font-weight:700;text-decoration:none}</style>
      </head>
      <body><main><img src="${htmlEscape(imageUrl)}" alt="${htmlEscape(product.name)}" /><p>${htmlEscape(product.brand)}</p><h1>${htmlEscape(product.name)}</h1><p>${htmlEscape(description)}</p><a href="/">Visit Wrist Mode</a></main></body>
    </html>`);
});

app.use(express.static(PUBLIC_DIR));

function orderFromRow(row) {
  return {
    id: row.id,
    receipt: row.receipt,
    customer: jsonParse(row.customer, {}),
    items: jsonParse(row.items, []),
    total: row.total,
    paymentMethod: row.payment_method,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function customFromRow(row) {
  return {
    id: row.id,
    requestCode: row.request_code,
    customer: jsonParse(row.customer, {}),
    details: jsonParse(row.details, {}),
    referenceImage: row.reference_image,
    status: row.status,
    quoteAmount: row.quote_amount,
    adminMessage: row.admin_message,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function cookieValue(req, name) {
  const cookies = String(req.headers.cookie || "").split(";").map((part) => part.trim());
  const found = cookies.find((part) => part.startsWith(`${name}=`));
  return found ? decodeURIComponent(found.slice(name.length + 1)) : "";
}

function requireAdmin(req, res, next) {
  const token = cookieValue(req, "wm_admin");
  if (!token || !sessions.has(token)) {
    res.status(401).json({ error: "Admin login required." });
    return;
  }
  next();
}

function createNotification(type, recipient, channel, message) {
  db.run(
    "INSERT INTO notifications (type, recipient, channel, message, status, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    [type, recipient || "Admin", channel || "Dashboard", message, "Pending", now()],
  );
}

function notifyStockWatchers(product, eventName) {
  const alerts = query("SELECT * FROM stock_alerts WHERE product_id = ? AND active = 1", [product.id]);
  const message =
    eventName === "back"
      ? `${product.name} is back in stock at Wrist Mode.`
      : `${product.name} is currently out of stock at Wrist Mode.`;

  for (const alert of alerts) {
    const recipient = alert.email || alert.phone;
    const channel = alert.email ? "Email" : "WhatsApp";
    createNotification("Stock", recipient, channel, message);
  }

  if (eventName === "back") {
    db.run("UPDATE stock_alerts SET active = 0, notified_at = ? WHERE product_id = ? AND active = 1", [
      now(),
      product.id,
    ]);
  }
}

function imagePaths(files) {
  return (files || []).map((file) => `/uploads/${file.filename}`);
}

function normalizeSpecs(body) {
  const specs = {};
  const raw = jsonParse(body.specs, null);
  if (raw && typeof raw === "object") return raw;

  for (const key of ["caseSize", "strapMaterial", "movementType", "material", "finish", "size"]) {
    if (body[key]) specs[key] = body[key];
  }

  return specs;
}

function seedProducts() {
  const seed = [
      {
        category: "watch",
        brand: "Rolex",
        name: "Premium Date Watch",
        price: 0,
        quantity: 1,
        description: "Luxury Rolex selection available by inquiry and confirmation.",
        specs: { caseSize: "41mm", strapMaterial: "Stainless steel", movementType: "Automatic", style: "Luxury" },
        images: ["/assets/products/catalog-fill/men-rolex-style-watch.jpeg"],
        featured: 1,
      },
      {
        category: "watch",
        brand: "Casio",
        name: "Digital Classic Watch",
        price: 120000,
        quantity: 8,
        description: "Reliable everyday Casio watch with clean styling and practical function.",
        specs: { caseSize: "40mm", strapMaterial: "Resin", movementType: "Quartz", style: "Everyday" },
        images: ["/assets/products/watches/064-casio-black-digital-watch.jpeg"],
        featured: 1,
      },
      {
        category: "watch",
        brand: "Fossil",
        name: "Chronograph Dress Watch",
        price: 240000,
        quantity: 5,
        description: "Fossil chronograph styling for smart casual and formal looks.",
        specs: { caseSize: "44mm", strapMaterial: "Leather", movementType: "Quartz", style: "Dress" },
        images: ["/assets/products/catalog-fill/fossil-watch.jpeg"],
        featured: 0,
      },
      {
        category: "watch",
        brand: "Seiko",
        name: "Automatic Dress Watch",
        price: 450000,
        quantity: 4,
        description: "Seiko automatic-style piece for customers who prefer mechanical character.",
        specs: { caseSize: "42mm", strapMaterial: "Stainless steel", movementType: "Automatic", style: "Dress" },
        images: ["/assets/products/catalog-fill/seiko-watch.jpeg"],
        featured: 1,
      },
      {
        category: "watch",
        brand: "Citizen",
        name: "Solar Style Watch",
        price: 380000,
        quantity: 4,
        description: "Citizen-inspired clean watch option with practical daily wear appeal.",
        specs: { caseSize: "41mm", strapMaterial: "Stainless steel", movementType: "Quartz", style: "Everyday" },
        images: ["/assets/products/catalog-fill/citizen-watch.jpeg"],
        featured: 0,
      },
      {
        category: "watch",
        brand: "Omega",
        name: "Luxury Diver Watch",
        price: 0,
        quantity: 1,
        description: "Omega luxury watch selection available by inquiry and confirmation.",
        specs: { caseSize: "42mm", strapMaterial: "Stainless steel", movementType: "Automatic", style: "Luxury" },
        images: ["/assets/products/watches/031-omega-seamaster-blue-rubber-watch.jpeg"],
        featured: 1,
      },
      {
        category: "watch",
        brand: "Tag Heuer",
        name: "Sport Chronograph Watch",
        price: 0,
        quantity: 1,
        description: "Tag Heuer sport watch selection available by inquiry and confirmation.",
        specs: { caseSize: "43mm", strapMaterial: "Stainless steel", movementType: "Quartz", style: "Sport" },
        images: ["/assets/products/watches/077-tag-heuer-blue-steel-chronograph-watch.jpeg"],
        featured: 0,
      },
      {
        category: "watch",
        brand: "Timex",
        name: "Everyday Casual Watch",
        price: 140000,
        quantity: 7,
        description: "Timex everyday watch option for simple, reliable styling.",
        specs: { caseSize: "40mm", strapMaterial: "Nylon", movementType: "Quartz", style: "Casual" },
        images: ["/assets/products/catalog-fill/timex-watch.jpeg"],
        featured: 0,
      },
      {
        category: "watch",
        brand: "Naviforce",
        name: "Tactical Chrono Watch",
        price: 95000,
        quantity: 10,
        description: "Bold Naviforce-style watch for sporty daily wear.",
        specs: { caseSize: "45mm", strapMaterial: "Stainless steel", movementType: "Quartz", style: "Sport" },
        images: ["/assets/products/catalog-fill/men-chronograph-watch.jpeg"],
        featured: 1,
      },
      {
        category: "watch",
        brand: "AP",
        name: "Luxury Statement Watch",
        price: 0,
        quantity: 0,
        description: "AP luxury watch selection available by inquiry and confirmation.",
        specs: { caseSize: "41mm", strapMaterial: "Stainless steel", movementType: "Automatic", style: "Luxury" },
        images: ["/assets/products/catalog-fill/ap-watch.jpeg"],
        featured: 0,
      },
      {
        category: "watch",
        brand: "Michael Kors",
        name: "Ladies Rose Gold Watch",
        price: 260000,
        quantity: 5,
        description: "Elegant ladies watch with rose-gold styling for dress and daily looks.",
        specs: { caseSize: "36mm", strapMaterial: "Stainless steel", movementType: "Quartz", style: "Ladies" },
        images: ["/assets/products/women-watches/rose-gold-bracelet-watch-sets-003.jpeg"],
        featured: 1,
      },
      {
        category: "watch",
        brand: "Daniel Wellington",
        name: "Ladies Slim Mesh Watch",
        price: 240000,
        quantity: 4,
        description: "Minimal ladies watch with a slim case and mesh bracelet look.",
        specs: { caseSize: "32mm", strapMaterial: "Mesh steel", movementType: "Quartz", style: "Ladies" },
        images: ["/assets/products/watches/006-daniel-wellington-blue-crystal-gift-set.jpeg"],
        featured: 0,
      },
      {
        category: "watch",
        brand: "Anne Klein",
        name: "Ladies Bracelet Watch",
        price: 180000,
        quantity: 6,
        description: "Ladies bracelet watch for elegant gifting and event wear.",
        specs: { caseSize: "30mm", strapMaterial: "Bracelet", movementType: "Quartz", style: "Ladies" },
        images: ["/assets/products/women-watches/silver-bracelet-watch-sets-023.jpeg"],
        featured: 0,
      },
      {
        category: "watch",
        brand: "Guess",
        name: "Ladies Crystal Watch",
        price: 220000,
        quantity: 3,
        description: "Ladies fashion watch with a dressy crystal-accent look.",
        specs: { caseSize: "36mm", strapMaterial: "Stainless steel", movementType: "Quartz", style: "Ladies" },
        images: ["/assets/products/women-watches/compact-ladies-watch-gift-sets-004.jpeg"],
        featured: 0,
      },
      {
        category: "watch",
        brand: "Olivia Burton",
        name: "Ladies Floral Dial Watch",
        price: 210000,
        quantity: 3,
        description: "Soft feminine watch style with a refined dial look.",
        specs: { caseSize: "34mm", strapMaterial: "Leather", movementType: "Quartz", style: "Ladies" },
        images: ["/assets/products/women-watches/plain-leather-strap-ladies-watches-010.jpeg"],
        featured: 0,
      },
      {
        category: "watch",
        brand: "Tissot",
        name: "Ladies Classic Watch",
        price: 420000,
        quantity: 2,
        description: "Classic ladies watch option for premium everyday wear.",
        specs: { caseSize: "35mm", strapMaterial: "Stainless steel", movementType: "Quartz", style: "Ladies" },
        images: ["/assets/products/women-watches/plain-ladies-watch-collection-006.jpeg"],
        featured: 0,
      },
    {
      category: "jewelry",
      brand: "Wrist Mode Jewelry",
      name: "Bar Necklace Trio",
      price: 0,
      quantity: 8,
      description: "Plain vertical bar necklaces in gold, silver, and black finishes, ready to wear or customize later.",
      specs: { collection: "Ready Jewelry", material: "Pendant and chain", finish: "Gold, silver, black", size: "Bar pendant" },
      images: ["/assets/products/catalog-fill/bar-necklace-trio.png"],
      featured: 1,
    },
    {
      category: "jewelry",
      brand: "Wrist Mode Jewelry",
      name: "Pendant Necklace",
      price: 0,
      quantity: 6,
      description: "Simple pendant necklace option for customers who want a clean piece before personalization.",
      specs: { collection: "Ready Jewelry", material: "Pendant and chain", finish: "Gold tone", size: "Standard chain" },
      images: ["/assets/products/catalog-fill/ready-pendant-necklace.jpeg"],
      featured: 0,
    },
    {
      category: "jewelry",
      brand: "Wrist Mode Jewelry",
      name: "Bracelet Collection",
      price: 0,
      quantity: 6,
      description: "Ready bracelet styles customers can wear plain or choose for later personalization.",
      specs: { collection: "Ready Jewelry", material: "Bracelet", finish: "Mixed finishes", size: "Adjustable options" },
      images: ["/assets/products/catalog-fill/ready-bracelets.jpeg"],
      featured: 0,
    },
    {
      category: "jewelry",
      brand: "Wrist Mode Jewelry",
      name: "Bangle Collection",
      price: 0,
      quantity: 6,
      description: "Ready bangle styles for clean everyday wear and gifting.",
      specs: { collection: "Ready Jewelry", material: "Bangle", finish: "Mixed finishes", size: "Standard bangle" },
      images: ["/assets/products/catalog-fill/ready-bangles.jpeg"],
      featured: 0,
    },
    {
      category: "wooden",
      brand: "Wrist Mode Wooden",
      name: "Gold Bamboo Wood Watch",
      price: 0,
      quantity: 5,
      description: "Natural bamboo-look wooden watch. Contact Wrist Mode to confirm current price and availability.",
      specs: { caseSize: "Standard fit", strapMaterial: "Wood", movementType: "Quartz", style: "Minimal" },
      images: ["/assets/products/wooden-watches/gold-bamboo-wood-watch.jpeg"],
      featured: 1,
    },
    {
      category: "women",
      brand: "Wrist Mode Women",
      name: "Ladies Luxury Full Gift Set Collection",
      price: 0,
      quantity: 5,
      description: "Full ladies gift boxes with a watch and matching jewelry pieces. Contact Wrist Mode to confirm current price and availability.",
      specs: {
        collection: "Full Gift Sets",
        included: "Watch, necklace, earrings, bracelet or ring depending on set",
        colorOptions: "Teal, gold, rose gold, black, silver, green",
        caseSize: "Ladies fit",
        strapMaterial: "Watch set",
        movementType: "Quartz",
        style: "Full Gift Sets",
      },
      images: ["/assets/products/women-watches/ladies-luxury-full-gift-set-collection-001.jpeg"],
      featured: 1,
    },
    {
      category: "jewelry",
      brand: "Wrist Mode Custom",
      name: "Photo Pendant Gift Box",
      price: 0,
      quantity: 5,
      description: "Gift-boxed photo pendant customized with a customer photo, name, date, or message.",
      specs: { material: "Pendant and chain", finish: "Photo print", size: "Custom photo pendant" },
      images: ["/assets/products/custom-jewelry/photo-pendant-gift-box.jpeg"],
      featured: 1,
    },
    {
      category: "jewelry",
      brand: "Wrist Mode Rings",
      name: "Matching Ring Set",
      price: 180000,
      quantity: 4,
      description: "Matching ring set with a polished white-gold look.",
      specs: { material: "Plated alloy", finish: "White gold", size: "Multiple sizes" },
      images: ["/assets/ring-set.jpg"],
      featured: 1,
    },
  ];

  const insertedAt = now();
  for (const item of seed) {
    db.run(
      `INSERT INTO products
       (category, brand, name, price, quantity, description, specs, images, featured, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        item.category,
        item.brand,
        item.name,
        item.price,
        item.quantity,
        item.description,
        JSON.stringify(item.specs),
        JSON.stringify(item.images),
        item.featured,
        insertedAt,
        insertedAt,
      ],
    );
  }
}

function migrate() {
  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      brand TEXT NOT NULL,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0,
      description TEXT NOT NULL DEFAULT '',
      specs TEXT NOT NULL DEFAULT '{}',
      images TEXT NOT NULL DEFAULT '[]',
      featured INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      receipt TEXT UNIQUE NOT NULL,
      customer TEXT NOT NULL,
      items TEXT NOT NULL,
      total REAL NOT NULL,
      payment_method TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS custom_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      request_code TEXT UNIQUE NOT NULL,
      customer TEXT NOT NULL,
      details TEXT NOT NULL,
      reference_image TEXT,
      status TEXT NOT NULL,
      quote_amount REAL,
      admin_message TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS stock_alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      notified_at TEXT
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      recipient TEXT NOT NULL,
      channel TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  const count = get("SELECT COUNT(*) AS count FROM products").count;
  if (!count) seedProducts();
  saveDb();
}

app.get("/api/health", (req, res) => {
  res.json({ ok: true, name: "Wrist Mode", time: now() });
});

app.post("/api/admin/login", (req, res) => {
  if (String(req.body.password || "") !== ADMIN_PASSWORD) {
    res.status(401).json({ error: "Wrong admin password." });
    return;
  }

  const token = crypto.randomBytes(32).toString("hex");
  sessions.set(token, { createdAt: Date.now() });
  res.setHeader("Set-Cookie", `wm_admin=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=86400`);
  res.json({ ok: true });
});

app.post("/api/admin/logout", (req, res) => {
  sessions.delete(cookieValue(req, "wm_admin"));
  res.setHeader("Set-Cookie", "wm_admin=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0");
  res.json({ ok: true });
});

app.get("/api/admin/session", (req, res) => {
  const token = cookieValue(req, "wm_admin");
  res.json({ isAdmin: Boolean(token && sessions.has(token)) });
});

app.get("/api/products", (req, res) => {
  const filters = [];
  const params = [];
  const { category, brand, q, minPrice, maxPrice, availability, featured } = req.query;

  if (category && category !== "all") {
    filters.push("category = ?");
    params.push(category);
  }
  if (brand && brand !== "all") {
    filters.push("brand = ?");
    params.push(brand);
  }
  if (q) {
    filters.push("(LOWER(name) LIKE ? OR LOWER(brand) LIKE ? OR LOWER(description) LIKE ?)");
    params.push(`%${String(q).toLowerCase()}%`, `%${String(q).toLowerCase()}%`, `%${String(q).toLowerCase()}%`);
  }
  if (minPrice) {
    filters.push("price >= ?");
    params.push(Number(minPrice));
  }
  if (maxPrice) {
    filters.push("price <= ?");
    params.push(Number(maxPrice));
  }
  if (featured === "1") {
    filters.push("featured = 1");
  }

  const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
  let products = query(`SELECT * FROM products ${where} ORDER BY featured DESC, created_at DESC`, params).map(productFromRow);

  if (availability && availability !== "all") {
    products = products.filter((product) => product.stockStatus === availability);
  }

  res.json(products);
});

app.get("/api/brands", (req, res) => {
  const brands = query("SELECT DISTINCT brand FROM products ORDER BY brand").map((row) => row.brand);
  res.json(brands);
});

app.get("/api/products/:id", (req, res) => {
  const product = productFromRow(get("SELECT * FROM products WHERE id = ?", [Number(req.params.id)]));
  if (!product) {
    res.status(404).json({ error: "Product not found." });
    return;
  }
  res.json(product);
});

app.post("/api/admin/products", requireAdmin, upload.array("images", 6), (req, res) => {
  const body = req.body;
  const files = imagePaths(req.files);
  const fallbackImages = {
    jewelry: "/assets/products/catalog-fill/bar-necklace-trio.png",
    women: "/assets/products/women-watches/ladies-luxury-full-gift-set-collection-001.jpeg",
    wooden: "/assets/products/wooden-watches/gold-bamboo-wood-watch.jpeg",
    watch: "/assets/watch-hero.jpg",
  };
  const images = files.length ? files : [fallbackImages[body.category] || fallbackImages.watch];
  const created = now();

  db.run(
    `INSERT INTO products
     (category, brand, name, price, quantity, description, specs, images, featured, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      body.category || "watch",
      body.brand || "Wrist Mode",
      body.name || "New Product",
      Number(body.price || 0),
      Number(body.quantity || 0),
      body.description || "",
      JSON.stringify(normalizeSpecs(body)),
      JSON.stringify(images),
      body.featured === "true" || body.featured === "on" ? 1 : 0,
      created,
      created,
    ],
  );
  saveDb();
  res.status(201).json(productFromRow(get("SELECT * FROM products WHERE id = ?", [lastId()])));
});

app.put("/api/admin/products/:id", requireAdmin, upload.array("images", 6), (req, res) => {
  const id = Number(req.params.id);
  const current = productFromRow(get("SELECT * FROM products WHERE id = ?", [id]));
  if (!current) {
    res.status(404).json({ error: "Product not found." });
    return;
  }

  const uploaded = imagePaths(req.files);
  const kept = jsonParse(req.body.existingImages, current.images);
  const images = uploaded.length ? [...kept, ...uploaded] : kept;
  const nextQuantity = Number(req.body.quantity ?? current.quantity);
  const updated = now();

  db.run(
    `UPDATE products
     SET category = ?, brand = ?, name = ?, price = ?, quantity = ?, description = ?, specs = ?, images = ?, featured = ?, updated_at = ?
     WHERE id = ?`,
    [
      req.body.category || current.category,
      req.body.brand || current.brand,
      req.body.name || current.name,
      Number(req.body.price ?? current.price),
      nextQuantity,
      req.body.description || current.description,
      JSON.stringify(normalizeSpecs(req.body)),
      JSON.stringify(images),
      req.body.featured === "true" || req.body.featured === "on" ? 1 : 0,
      updated,
      id,
    ],
  );

  const updatedProduct = productFromRow(get("SELECT * FROM products WHERE id = ?", [id]));
  if (current.quantity > 0 && nextQuantity <= 0) notifyStockWatchers(updatedProduct, "out");
  if (current.quantity <= 0 && nextQuantity > 0) notifyStockWatchers(updatedProduct, "back");

  saveDb();
  res.json(updatedProduct);
});

app.delete("/api/admin/products/:id", requireAdmin, (req, res) => {
  db.run("DELETE FROM products WHERE id = ?", [Number(req.params.id)]);
  saveDb();
  res.json({ ok: true });
});

app.post("/api/stock-alerts", (req, res) => {
  const product = productFromRow(get("SELECT * FROM products WHERE id = ?", [Number(req.body.productId)]));
  if (!product) {
    res.status(404).json({ error: "Product not found." });
    return;
  }

  db.run(
    "INSERT INTO stock_alerts (product_id, name, email, phone, active, created_at) VALUES (?, ?, ?, ?, 1, ?)",
    [product.id, req.body.name || "Customer", req.body.email || "", req.body.phone || "", now()],
  );
  createNotification("Interest", "Admin", "Dashboard", `${req.body.name || "A customer"} requested stock updates for ${product.name}.`);
  saveDb();
  res.status(201).json({ ok: true, message: "We will notify you when stock changes." });
});

app.post("/api/orders", (req, res) => {
  const items = Array.isArray(req.body.items) ? req.body.items : [];
  if (!items.length) {
    res.status(400).json({ error: "Cart is empty." });
    return;
  }

  const orderItems = [];
  let total = 0;

  for (const item of items) {
    const product = productFromRow(get("SELECT * FROM products WHERE id = ?", [Number(item.productId)]));
    const quantity = Math.max(1, Number(item.quantity || 1));
    if (!product) {
      res.status(404).json({ error: "One product was not found." });
      return;
    }
    if (product.quantity < quantity) {
      res.status(409).json({ error: `${product.name} does not have enough stock.` });
      return;
    }

    orderItems.push({
      productId: product.id,
      name: product.name,
      brand: product.brand,
      price: product.price,
      quantity,
      image: product.images[0],
    });
    total += product.price * quantity;
  }

  const created = now();
  const receipt = `WM-${Date.now().toString().slice(-8)}`;
  const customer = {
    name: req.body.customer?.name || "",
    phone: req.body.customer?.phone || "",
    email: req.body.customer?.email || "",
    address: req.body.customer?.address || "",
  };

  db.run(
    "INSERT INTO orders (receipt, customer, items, total, payment_method, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [receipt, JSON.stringify(customer), JSON.stringify(orderItems), total, req.body.paymentMethod || "Pay on Delivery", "Confirmed", created, created],
  );

  for (const item of orderItems) {
    const before = productFromRow(get("SELECT * FROM products WHERE id = ?", [item.productId]));
    const nextQty = before.quantity - item.quantity;
    db.run("UPDATE products SET quantity = ?, updated_at = ? WHERE id = ?", [nextQty, now(), item.productId]);
    if (before.quantity > 0 && nextQty <= 0) {
      notifyStockWatchers(productFromRow(get("SELECT * FROM products WHERE id = ?", [item.productId])), "out");
    }
  }

  createNotification("Order", "Admin", "Dashboard", `New standard order ${receipt} received from ${customer.name || "a customer"}.`);
  createNotification("Order", customer.email || customer.phone || "Customer", customer.email ? "Email" : "WhatsApp", `Your Wrist Mode order ${receipt} is confirmed.`);
  saveDb();
  res.status(201).json({ ok: true, receipt, total, status: "Confirmed" });
});

app.post("/api/custom-orders", upload.single("referenceImage"), (req, res) => {
  const created = now();
  const requestCode = `WM-CUSTOM-${Date.now().toString().slice(-7)}`;
  const customer = {
    name: req.body.name || "",
    phone: req.body.phone || "",
    email: req.body.email || "",
    deliveryDate: req.body.deliveryDate || "",
  };
  const details = {
    jewelryType: req.body.jewelryType || "",
    choice: req.body.choice || "",
    selectedProduct: req.body.selectedProduct || "",
    designPiece: req.body.designPiece || "",
    designVariant: req.body.designVariant || "",
    side: req.body.side || "",
    designFont: req.body.designFont || "",
    chainStyle: req.body.chainStyle || "",
    textSize: req.body.textSize || "",
    textX: req.body.textX || "",
    textY: req.body.textY || "",
    rotateY: req.body.rotateY || "",
    finish: req.body.finish || "",
    material: req.body.material || "",
    measurements: req.body.measurements || "",
    engraving: req.body.engraving || "",
    budget: req.body.budget || "",
    notes: req.body.notes || "",
  };
  const referenceImage = req.file ? `/uploads/${req.file.filename}` : "";

  db.run(
    "INSERT INTO custom_requests (request_code, customer, details, reference_image, status, quote_amount, admin_message, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [requestCode, JSON.stringify(customer), JSON.stringify(details), referenceImage, "Requested", null, "", created, created],
  );

  createNotification("Custom Request", "Admin", "Dashboard", `New custom jewelry request ${requestCode} received from ${customer.name || "a customer"}.`);
  createNotification("Custom Request", customer.email || customer.phone || "Customer", customer.email ? "Email" : "WhatsApp", `Your Wrist Mode custom request ${requestCode} has been received.`);
  saveDb();
  res.status(201).json({ ok: true, requestCode, status: "Requested" });
});

app.get("/api/track", (req, res) => {
  const code = String(req.query.code || "").trim();
  const results = [];

  if (code) {
    const order = get("SELECT * FROM orders WHERE receipt = ?", [code]);
    if (order) results.push({ type: "order", ...orderFromRow(order) });

    const custom = get("SELECT * FROM custom_requests WHERE request_code = ?", [code]);
    if (custom) results.push({ type: "custom", ...customFromRow(custom) });
  }

  res.json(results);
});

app.get("/api/admin/analytics", requireAdmin, (req, res) => {
  const products = query("SELECT * FROM products").map(productFromRow);
  const orders = query("SELECT * FROM orders ORDER BY created_at DESC").map(orderFromRow);
  const customRequests = query("SELECT * FROM custom_requests ORDER BY created_at DESC").map(customFromRow);
  const revenue = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const itemTotals = new Map();

  for (const order of orders) {
    for (const item of order.items) {
      const current = itemTotals.get(item.name) || 0;
      itemTotals.set(item.name, current + Number(item.quantity || 0));
    }
  }

  const bestSelling = [...itemTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, quantity]) => ({ name, quantity }));

  res.json({
    totalProducts: products.length,
    totalOrders: orders.length,
    revenue,
    customRequests: customRequests.length,
    lowStock: products.filter((product) => product.quantity > 0 && product.quantity <= 3).length,
    outOfStock: products.filter((product) => product.quantity <= 0).length,
    bestSelling,
  });
});

app.get("/api/admin/orders", requireAdmin, (req, res) => {
  res.json(query("SELECT * FROM orders ORDER BY created_at DESC").map(orderFromRow));
});

app.patch("/api/admin/orders/:id", requireAdmin, (req, res) => {
  const order = orderFromRow(get("SELECT * FROM orders WHERE id = ?", [Number(req.params.id)]));
  if (!order) {
    res.status(404).json({ error: "Order not found." });
    return;
  }

  const status = req.body.status || order.status;
  db.run("UPDATE orders SET status = ?, updated_at = ? WHERE id = ?", [status, now(), order.id]);
  createNotification("Order Status", order.customer.email || order.customer.phone || "Customer", order.customer.email ? "Email" : "WhatsApp", `Your Wrist Mode order ${order.receipt} is now ${status}.`);
  saveDb();
  res.json(orderFromRow(get("SELECT * FROM orders WHERE id = ?", [order.id])));
});

app.get("/api/admin/custom-requests", requireAdmin, (req, res) => {
  res.json(query("SELECT * FROM custom_requests ORDER BY created_at DESC").map(customFromRow));
});

app.patch("/api/admin/custom-requests/:id", requireAdmin, (req, res) => {
  const custom = customFromRow(get("SELECT * FROM custom_requests WHERE id = ?", [Number(req.params.id)]));
  if (!custom) {
    res.status(404).json({ error: "Custom request not found." });
    return;
  }

  const status = req.body.status || custom.status;
  const quoteAmount = req.body.quoteAmount === "" || req.body.quoteAmount == null ? custom.quoteAmount : Number(req.body.quoteAmount);
  const adminMessage = req.body.adminMessage ?? custom.adminMessage ?? "";
  db.run("UPDATE custom_requests SET status = ?, quote_amount = ?, admin_message = ?, updated_at = ? WHERE id = ?", [
    status,
    quoteAmount,
    adminMessage,
    now(),
    custom.id,
  ]);
  createNotification("Custom Status", custom.customer.email || custom.customer.phone || "Customer", custom.customer.email ? "Email" : "WhatsApp", `Your Wrist Mode custom request ${custom.requestCode} is now ${status}.`);
  saveDb();
  res.json(customFromRow(get("SELECT * FROM custom_requests WHERE id = ?", [custom.id])));
});

app.get("/api/admin/notifications", requireAdmin, (req, res) => {
  res.json(query("SELECT * FROM notifications ORDER BY created_at DESC LIMIT 100"));
});

app.get("*", (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "index.html"));
});

async function start() {
  const SQL = await initSqlJs({
    locateFile: (file) => path.join(ROOT, "node_modules", "sql.js", "dist", file),
  });
  db = fs.existsSync(DB_FILE) ? new SQL.Database(fs.readFileSync(DB_FILE)) : new SQL.Database();
  migrate();
  app.listen(PORT, () => {
    console.log(`Wrist Mode is running at http://localhost:${PORT}`);
  });
}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
