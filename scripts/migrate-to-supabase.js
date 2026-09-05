const fs = require("fs");
const path = require("path");
const initSqlJs = require("sql.js");
const { createClient } = require("@supabase/supabase-js");

const ROOT = path.join(__dirname, "..");
const DB_FILE = path.join(ROOT, "data", "wrist-mode.sqlite");
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) throw new Error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before migrating.");
if (!fs.existsSync(DB_FILE)) throw new Error(`Local database not found: ${DB_FILE}`);

function query(db, sql) {
  const result = db.exec(sql)[0];
  if (!result) return [];
  return result.values.map((values) => Object.fromEntries(result.columns.map((column, index) => [column, values[index]])));
}

function json(value, fallback) {
  try { return value ? JSON.parse(value) : fallback; } catch { return fallback; }
}

async function upsert(client, table, rows, conflict) {
  if (!rows.length) return;
  const { error } = await client.from(table).upsert(rows, { onConflict: conflict });
  if (error) throw new Error(`${table}: ${error.message}`);
}

async function main() {
  const SQL = await initSqlJs({ locateFile: (file) => path.join(ROOT, "node_modules", "sql.js", "dist", file) });
  const db = new SQL.Database(fs.readFileSync(DB_FILE));
  const client = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

  const products = query(db, "SELECT * FROM products").map((row) => ({ ...row, price: Number(row.price || 0), quantity: Number(row.quantity || 0), specs: json(row.specs, {}), images: json(row.images, []), featured: Boolean(row.featured) }));
  const orders = query(db, "SELECT * FROM orders").map((row) => ({ ...row, total: Number(row.total || 0), customer: json(row.customer, {}), items: json(row.items, []) }));
  const customRequests = query(db, "SELECT * FROM custom_requests").map((row) => ({ ...row, customer: json(row.customer, {}), details: json(row.details, {}), quote_amount: row.quote_amount == null ? null : Number(row.quote_amount) }));
  const stockAlerts = query(db, "SELECT * FROM stock_alerts").map((row) => ({ ...row, active: Boolean(row.active) }));
  const notifications = query(db, "SELECT * FROM notifications");

  await upsert(client, "products", products, "id");
  await upsert(client, "orders", orders, "receipt");
  await upsert(client, "custom_requests", customRequests, "request_code");
  await upsert(client, "stock_alerts", stockAlerts, "id");
  await upsert(client, "notifications", notifications, "id");
  console.log(`Migrated ${products.length} products, ${orders.length} orders, and ${customRequests.length} custom requests.`);
}

main().catch((error) => { console.error(error.message); process.exit(1); });
