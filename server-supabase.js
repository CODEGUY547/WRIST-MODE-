const crypto = require("crypto");
const path = require("path");

const express = require("express");
const multer = require("multer");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PUBLIC_DIR = path.join(__dirname, "public");
const PRODUCT_BUCKET = "Product-images";
const CUSTOM_BUCKET = "custom-request-images";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !ADMIN_PASSWORD) {
  throw new Error("SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and ADMIN_PASSWORD must be configured.");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const sessions = new Map();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 6 * 1024 * 1024, files: 6 } });

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/vendor/three", express.static(path.join(__dirname, "node_modules", "three")));
app.use(express.static(PUBLIC_DIR));

function now() { return new Date().toISOString(); }
function asyncRoute(handler) { return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next); }
function failIfError(error) { if (error) throw new Error(error.message); }
function htmlEscape(value = "") { return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]); }
function stockStatus(quantity) { const qty = Number(quantity || 0); return qty <= 0 ? "Out of Stock" : qty <= 3 ? "Low Stock" : "In Stock"; }
function jsonValue(value, fallback) { if (value && typeof value === "object") return value; try { return value ? JSON.parse(value) : fallback; } catch { return fallback; } }
function productFromRow(row) {
  if (!row) return null;
  return { id: row.id, category: row.category, brand: row.brand, name: row.name, price: Number(row.price || 0), quantity: Number(row.quantity || 0), stockStatus: stockStatus(row.quantity), description: row.description, specs: jsonValue(row.specs, {}), images: jsonValue(row.images, []), featured: Boolean(row.featured), createdAt: row.created_at, updatedAt: row.updated_at };
}
function orderFromRow(row) { return { id: row.id, receipt: row.receipt, customer: jsonValue(row.customer, {}), items: jsonValue(row.items, []), total: Number(row.total || 0), paymentMethod: row.payment_method, status: row.status, createdAt: row.created_at, updatedAt: row.updated_at }; }
async function customFromRow(row) {
  if (!row) return null;
  let referenceImage = row.reference_image || "";
  if (referenceImage && !referenceImage.startsWith("http")) {
    const { data, error } = await supabase.storage.from(CUSTOM_BUCKET).createSignedUrl(referenceImage, 60 * 30);
    if (!error && data) referenceImage = data.signedUrl;
  }
  return { id: row.id, requestCode: row.request_code, customer: jsonValue(row.customer, {}), details: jsonValue(row.details, {}), referenceImage, status: row.status, quoteAmount: row.quote_amount == null ? null : Number(row.quote_amount), adminMessage: row.admin_message, createdAt: row.created_at, updatedAt: row.updated_at };
}
function cookieValue(req, name) { const found = String(req.headers.cookie || "").split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`)); return found ? decodeURIComponent(found.slice(name.length + 1)) : ""; }
function requireAdmin(req, res, next) { const token = cookieValue(req, "wm_admin"); if (!token || !sessions.has(token)) return res.status(401).json({ error: "Admin login required." }); next(); }
function normalizeSpecs(body) { const raw = jsonValue(body.specs, null); if (raw && typeof raw === "object") return raw; const specs = {}; for (const key of ["caseSize", "strapMaterial", "movementType", "material", "finish", "size"]) if (body[key]) specs[key] = body[key]; return specs; }
function publicImageUrl(pathname) { return supabase.storage.from(PRODUCT_BUCKET).getPublicUrl(pathname).data.publicUrl; }
async function uploadFiles(files, bucket) {
  const paths = [];
  for (const file of files || []) {
    const ext = path.extname(file.originalname || "").toLowerCase() || ".jpg";
    const objectPath = `${Date.now()}-${crypto.randomBytes(5).toString("hex")}${ext}`;
    const { error } = await supabase.storage.from(bucket).upload(objectPath, file.buffer, { contentType: file.mimetype, upsert: false });
    failIfError(error);
    paths.push(bucket === PRODUCT_BUCKET ? publicImageUrl(objectPath) : objectPath);
  }
  return paths;
}
async function createNotification(type, recipient, channel, message) {
  const { error } = await supabase.from("notifications").insert({ type, recipient: recipient || "Admin", channel: channel || "Dashboard", message, status: "Pending", created_at: now() });
  failIfError(error);
}
async function notifyStockWatchers(product, eventName) {
  const { data: alerts, error } = await supabase.from("stock_alerts").select("*").eq("product_id", product.id).eq("active", true);
  failIfError(error);
  const message = eventName === "back" ? `${product.name} is back in stock at Wrist Mode.` : `${product.name} is currently out of stock at Wrist Mode.`;
  for (const alert of alerts || []) await createNotification("Stock", alert.email || alert.phone, alert.email ? "Email" : "WhatsApp", message);
  if (eventName === "back") { const { error: updateError } = await supabase.from("stock_alerts").update({ active: false, notified_at: now() }).eq("product_id", product.id).eq("active", true); failIfError(updateError); }
}
async function getProduct(id) { const { data, error } = await supabase.from("products").select("*").eq("id", id).maybeSingle(); failIfError(error); return productFromRow(data); }

app.get("/share/product/:id", asyncRoute(async (req, res) => {
  const product = await getProduct(Number(req.params.id));
  if (!product) return res.status(404).send("Product not found.");
  const origin = `${req.protocol}://${req.get("host")}`;
  const imageUrl = new URL(product.images[0] || "/assets/watch-hero.jpg", origin).toString();
  const title = `${product.brand} ${product.name} | Wrist Mode`;
  const description = `${product.stockStatus}. Contact Wrist Mode to confirm availability and price.`;
  res.type("html").send(`<!doctype html><html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>${htmlEscape(title)}</title><meta name="description" content="${htmlEscape(description)}" /><meta property="og:type" content="product" /><meta property="og:title" content="${htmlEscape(title)}" /><meta property="og:description" content="${htmlEscape(description)}" /><meta property="og:image" content="${htmlEscape(imageUrl)}" /><meta name="twitter:card" content="summary_large_image" /><meta name="twitter:title" content="${htmlEscape(title)}" /><meta name="twitter:description" content="${htmlEscape(description)}" /><meta name="twitter:image" content="${htmlEscape(imageUrl)}" /></head><body><main><img src="${htmlEscape(imageUrl)}" alt="${htmlEscape(product.name)}" /><p>${htmlEscape(product.brand)}</p><h1>${htmlEscape(product.name)}</h1><p>${htmlEscape(description)}</p><a href="/">Visit Wrist Mode</a></main></body></html>`);
}));

app.get("/api/health", (req, res) => res.json({ ok: true, name: "Wrist Mode", time: now() }));
app.post("/api/admin/login", (req, res) => { if (String(req.body.password || "") !== ADMIN_PASSWORD) return res.status(401).json({ error: "Wrong admin password." }); const token = crypto.randomBytes(32).toString("hex"); sessions.set(token, { createdAt: Date.now() }); res.setHeader("Set-Cookie", `wm_admin=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=86400`); res.json({ ok: true }); });
app.post("/api/admin/logout", (req, res) => { sessions.delete(cookieValue(req, "wm_admin")); res.setHeader("Set-Cookie", "wm_admin=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0"); res.json({ ok: true }); });
app.get("/api/admin/session", (req, res) => res.json({ isAdmin: Boolean(cookieValue(req, "wm_admin") && sessions.has(cookieValue(req, "wm_admin"))) }));

app.get("/api/products", asyncRoute(async (req, res) => {
  const { category, brand, q, minPrice, maxPrice, availability, featured } = req.query;
  let query = supabase.from("products").select("*").order("featured", { ascending: false }).order("created_at", { ascending: false });
  if (category && category !== "all") query = query.eq("category", category);
  if (brand && brand !== "all") query = query.eq("brand", brand);
  if (minPrice) query = query.gte("price", Number(minPrice));
  if (maxPrice) query = query.lte("price", Number(maxPrice));
  if (featured === "1") query = query.eq("featured", true);
  const { data, error } = await query; failIfError(error);
  let products = (data || []).map(productFromRow);
  if (q) { const term = String(q).toLowerCase(); products = products.filter((item) => `${item.name} ${item.brand} ${item.description}`.toLowerCase().includes(term)); }
  if (availability && availability !== "all") products = products.filter((item) => item.stockStatus === availability);
  res.json(products);
}));
app.get("/api/brands", asyncRoute(async (req, res) => { const { data, error } = await supabase.from("products").select("brand").order("brand"); failIfError(error); res.json([...new Set((data || []).map((row) => row.brand))]); }));
app.get("/api/products/:id", asyncRoute(async (req, res) => { const product = await getProduct(Number(req.params.id)); if (!product) return res.status(404).json({ error: "Product not found." }); res.json(product); }));

app.post("/api/admin/products", requireAdmin, upload.array("images", 6), asyncRoute(async (req, res) => {
  const fallback = { jewelry: "/assets/products/catalog-fill/bar-necklace-trio.png", women: "/assets/products/women-watches/ladies-luxury-full-gift-set-collection-001.jpeg", wooden: "/assets/products/wooden-watches/gold-bamboo-wood-watch.jpeg", watch: "/assets/watch-hero.jpg" };
  const uploaded = await uploadFiles(req.files, PRODUCT_BUCKET);
  const created = now();
  const record = { category: req.body.category || "watch", brand: req.body.brand || "Wrist Mode", name: req.body.name || "New Product", price: Number(req.body.price || 0), quantity: Number(req.body.quantity || 0), description: req.body.description || "", specs: normalizeSpecs(req.body), images: uploaded.length ? uploaded : [fallback[req.body.category] || fallback.watch], featured: req.body.featured === "true" || req.body.featured === "on", created_at: created, updated_at: created };
  const { data, error } = await supabase.from("products").insert(record).select().single(); failIfError(error); res.status(201).json(productFromRow(data));
}));
app.put("/api/admin/products/:id", requireAdmin, upload.array("images", 6), asyncRoute(async (req, res) => {
  const id = Number(req.params.id); const current = await getProduct(id); if (!current) return res.status(404).json({ error: "Product not found." });
  const uploaded = await uploadFiles(req.files, PRODUCT_BUCKET); const kept = jsonValue(req.body.existingImages, current.images); const nextQuantity = Number(req.body.quantity ?? current.quantity);
  const updates = { category: req.body.category || current.category, brand: req.body.brand || current.brand, name: req.body.name || current.name, price: Number(req.body.price ?? current.price), quantity: nextQuantity, description: req.body.description || current.description, specs: normalizeSpecs(req.body), images: uploaded.length ? [...kept, ...uploaded] : kept, featured: req.body.featured === "true" || req.body.featured === "on", updated_at: now() };
  const { data, error } = await supabase.from("products").update(updates).eq("id", id).select().single(); failIfError(error); const product = productFromRow(data);
  if (current.quantity > 0 && nextQuantity <= 0) await notifyStockWatchers(product, "out"); if (current.quantity <= 0 && nextQuantity > 0) await notifyStockWatchers(product, "back"); res.json(product);
}));
app.delete("/api/admin/products/:id", requireAdmin, asyncRoute(async (req, res) => { const { error } = await supabase.from("products").delete().eq("id", Number(req.params.id)); failIfError(error); res.json({ ok: true }); }));

app.post("/api/stock-alerts", asyncRoute(async (req, res) => { const product = await getProduct(Number(req.body.productId)); if (!product) return res.status(404).json({ error: "Product not found." }); const { error } = await supabase.from("stock_alerts").insert({ product_id: product.id, name: req.body.name || "Customer", email: req.body.email || "", phone: req.body.phone || "", active: true, created_at: now() }); failIfError(error); await createNotification("Interest", "Admin", "Dashboard", `${req.body.name || "A customer"} requested stock updates for ${product.name}.`); res.status(201).json({ ok: true, message: "We will notify you when stock changes." }); }));
app.post("/api/orders", asyncRoute(async (req, res) => {
  const items = Array.isArray(req.body.items) ? req.body.items : []; if (!items.length) return res.status(400).json({ error: "Cart is empty." });
  const orderItems = []; let total = 0;
  for (const item of items) { const product = await getProduct(Number(item.productId)); const quantity = Math.max(1, Number(item.quantity || 1)); if (!product) return res.status(404).json({ error: "One product was not found." }); if (product.quantity < quantity) return res.status(409).json({ error: `${product.name} does not have enough stock.` }); orderItems.push({ productId: product.id, name: product.name, brand: product.brand, price: product.price, quantity, image: product.images[0] }); total += product.price * quantity; }
  const created = now(); const receipt = `WM-${Date.now().toString().slice(-8)}`; const customer = { name: req.body.customer?.name || "", phone: req.body.customer?.phone || "", email: req.body.customer?.email || "", address: req.body.customer?.address || "" };
  const { error } = await supabase.from("orders").insert({ receipt, customer, items: orderItems, total, payment_method: req.body.paymentMethod || "Pay on Delivery", status: "Confirmed", created_at: created, updated_at: created }); failIfError(error);
  for (const item of orderItems) { const before = await getProduct(item.productId); const nextQuantity = before.quantity - item.quantity; const { data, error: stockError } = await supabase.from("products").update({ quantity: nextQuantity, updated_at: now() }).eq("id", item.productId).select().single(); failIfError(stockError); if (before.quantity > 0 && nextQuantity <= 0) await notifyStockWatchers(productFromRow(data), "out"); }
  await createNotification("Order", "Admin", "Dashboard", `New standard order ${receipt} received from ${customer.name || "a customer"}.`); await createNotification("Order", customer.email || customer.phone || "Customer", customer.email ? "Email" : "WhatsApp", `Your Wrist Mode order ${receipt} is confirmed.`); res.status(201).json({ ok: true, receipt, total, status: "Confirmed" });
}));
app.post("/api/custom-orders", upload.single("referenceImage"), asyncRoute(async (req, res) => {
  const requestCode = `WM-CUSTOM-${Date.now().toString().slice(-7)}`; const created = now(); const customer = { name: req.body.name || "", phone: req.body.phone || "", email: req.body.email || "", deliveryDate: req.body.deliveryDate || "" };
  const details = Object.fromEntries(["jewelryType", "choice", "selectedProduct", "designPiece", "designVariant", "side", "designFont", "chainStyle", "textSize", "textX", "textY", "rotateY", "finish", "material", "measurements", "engraving", "budget", "notes"].map((key) => [key, req.body[key] || ""]));
  const uploaded = await uploadFiles(req.file ? [req.file] : [], CUSTOM_BUCKET); const { error } = await supabase.from("custom_requests").insert({ request_code: requestCode, customer, details, reference_image: uploaded[0] || "", status: "Requested", quote_amount: null, admin_message: "", created_at: created, updated_at: created }); failIfError(error);
  await createNotification("Custom Request", "Admin", "Dashboard", `New custom jewelry request ${requestCode} received from ${customer.name || "a customer"}.`); await createNotification("Custom Request", customer.email || customer.phone || "Customer", customer.email ? "Email" : "WhatsApp", `Your Wrist Mode custom request ${requestCode} has been received.`); res.status(201).json({ ok: true, requestCode, status: "Requested" });
}));
app.get("/api/track", asyncRoute(async (req, res) => { const code = String(req.query.code || "").trim(); if (!code) return res.json([]); const results = []; const { data: order, error: orderError } = await supabase.from("orders").select("*").eq("receipt", code).maybeSingle(); failIfError(orderError); if (order) results.push({ type: "order", ...orderFromRow(order) }); const { data: custom, error: customError } = await supabase.from("custom_requests").select("*").eq("request_code", code).maybeSingle(); failIfError(customError); if (custom) results.push({ type: "custom", ...(await customFromRow(custom)) }); res.json(results); }));

app.get("/api/admin/analytics", requireAdmin, asyncRoute(async (req, res) => { const [{ data: productRows, error: productError }, { data: orderRows, error: orderError }, { data: customRows, error: customError }] = await Promise.all([supabase.from("products").select("*"), supabase.from("orders").select("*").order("created_at", { ascending: false }), supabase.from("custom_requests").select("*").order("created_at", { ascending: false })]); failIfError(productError); failIfError(orderError); failIfError(customError); const products = (productRows || []).map(productFromRow); const orders = (orderRows || []).map(orderFromRow); const totals = new Map(); for (const order of orders) for (const item of order.items) totals.set(item.name, (totals.get(item.name) || 0) + Number(item.quantity || 0)); res.json({ totalProducts: products.length, totalOrders: orders.length, revenue: orders.reduce((sum, order) => sum + Number(order.total || 0), 0), customRequests: (customRows || []).length, lowStock: products.filter((item) => item.quantity > 0 && item.quantity <= 3).length, outOfStock: products.filter((item) => item.quantity <= 0).length, bestSelling: [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, quantity]) => ({ name, quantity })) }); }));
app.get("/api/admin/orders", requireAdmin, asyncRoute(async (req, res) => { const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false }); failIfError(error); res.json((data || []).map(orderFromRow)); }));
app.patch("/api/admin/orders/:id", requireAdmin, asyncRoute(async (req, res) => { const { data: before, error: beforeError } = await supabase.from("orders").select("*").eq("id", Number(req.params.id)).maybeSingle(); failIfError(beforeError); if (!before) return res.status(404).json({ error: "Order not found." }); const order = orderFromRow(before); const { data, error } = await supabase.from("orders").update({ status: req.body.status || order.status, updated_at: now() }).eq("id", order.id).select().single(); failIfError(error); await createNotification("Order Status", order.customer.email || order.customer.phone || "Customer", order.customer.email ? "Email" : "WhatsApp", `Your Wrist Mode order ${order.receipt} is now ${data.status}.`); res.json(orderFromRow(data)); }));
app.get("/api/admin/custom-requests", requireAdmin, asyncRoute(async (req, res) => { const { data, error } = await supabase.from("custom_requests").select("*").order("created_at", { ascending: false }); failIfError(error); res.json(await Promise.all((data || []).map(customFromRow))); }));
app.patch("/api/admin/custom-requests/:id", requireAdmin, asyncRoute(async (req, res) => { const { data: before, error: beforeError } = await supabase.from("custom_requests").select("*").eq("id", Number(req.params.id)).maybeSingle(); failIfError(beforeError); if (!before) return res.status(404).json({ error: "Custom request not found." }); const custom = await customFromRow(before); const updates = { status: req.body.status || custom.status, quote_amount: req.body.quoteAmount === "" || req.body.quoteAmount == null ? custom.quoteAmount : Number(req.body.quoteAmount), admin_message: req.body.adminMessage ?? custom.adminMessage ?? "", updated_at: now() }; const { data, error } = await supabase.from("custom_requests").update(updates).eq("id", custom.id).select().single(); failIfError(error); await createNotification("Custom Status", custom.customer.email || custom.customer.phone || "Customer", custom.customer.email ? "Email" : "WhatsApp", `Your Wrist Mode custom request ${custom.requestCode} is now ${data.status}.`); res.json(await customFromRow(data)); }));
app.get("/api/admin/notifications", requireAdmin, asyncRoute(async (req, res) => { const { data, error } = await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(100); failIfError(error); res.json(data || []); }));

app.get("*", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "index.html")));
app.use((error, req, res, next) => { console.error(error); res.status(500).json({ error: error.message || "Unexpected server error." }); });
app.listen(PORT, () => console.log(`Wrist Mode is running at http://localhost:${PORT}`));
