const products = [
  ["Rolex", "Premium Date Watch", 0, 1, "Luxury Rolex selection available by inquiry and confirmation.", "41mm", "Stainless steel", "Automatic", "Luxury", true],
  ["Casio", "Digital Classic Watch", 120000, 8, "Reliable everyday Casio watch with clean styling and practical function.", "40mm", "Resin", "Quartz", "Everyday", true],
  ["Fossil", "Chronograph Dress Watch", 240000, 5, "Fossil chronograph styling for smart casual and formal looks.", "44mm", "Leather", "Quartz", "Dress", false],
  ["Seiko", "Automatic Dress Watch", 450000, 4, "Seiko automatic-style piece for customers who prefer mechanical character.", "42mm", "Stainless steel", "Automatic", "Dress", true],
  ["Citizen", "Solar Style Watch", 380000, 4, "Citizen-inspired clean watch option with practical daily wear appeal.", "41mm", "Stainless steel", "Quartz", "Everyday", false],
  ["Omega", "Luxury Diver Watch", 0, 1, "Omega luxury watch selection available by inquiry and confirmation.", "42mm", "Stainless steel", "Automatic", "Luxury", true],
  ["Tag Heuer", "Sport Chronograph Watch", 0, 1, "Tag Heuer sport watch selection available by inquiry and confirmation.", "43mm", "Stainless steel", "Quartz", "Sport", false],
  ["Timex", "Everyday Casual Watch", 140000, 7, "Timex everyday watch option for simple, reliable styling.", "40mm", "Nylon", "Quartz", "Casual", false],
  ["Naviforce", "Tactical Chrono Watch", 95000, 10, "Bold Naviforce-style watch for sporty daily wear.", "45mm", "Stainless steel", "Quartz", "Sport", true],
  ["AP", "Luxury Statement Watch", 0, 0, "AP luxury watch selection available by inquiry and confirmation.", "41mm", "Stainless steel", "Automatic", "Luxury", false],
  ["Michael Kors", "Ladies Rose Gold Watch", 260000, 5, "Elegant ladies watch with rose-gold styling for dress and daily looks.", "36mm", "Stainless steel", "Quartz", "Ladies", true],
  ["Daniel Wellington", "Ladies Slim Mesh Watch", 240000, 4, "Minimal ladies watch with a slim case and mesh bracelet look.", "32mm", "Mesh steel", "Quartz", "Ladies", false],
  ["Anne Klein", "Ladies Bracelet Watch", 180000, 6, "Ladies bracelet watch for elegant gifting and event wear.", "30mm", "Bracelet", "Quartz", "Ladies", false],
  ["Guess", "Ladies Crystal Watch", 220000, 3, "Ladies fashion watch with a dressy crystal-accent look.", "36mm", "Stainless steel", "Quartz", "Ladies", false],
  ["Olivia Burton", "Ladies Floral Dial Watch", 210000, 3, "Soft feminine watch style with a refined dial look.", "34mm", "Leather", "Quartz", "Ladies", false],
  ["Tissot", "Ladies Classic Watch", 420000, 2, "Classic ladies watch option for premium everyday wear.", "35mm", "Stainless steel", "Quartz", "Ladies", false],
];

const baseUrl = process.env.BASE_URL || "http://localhost:3000";
const password = process.env.ADMIN_PASSWORD || "wristmode2026";

async function request(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed: ${url}`);
  return { response, data };
}

(async () => {
  const login = await fetch(`${baseUrl}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  if (!login.ok) throw new Error("Admin login failed.");
  const cookie = login.headers.get("set-cookie");

  const { data: currentProducts } = await request(`${baseUrl}/api/products`);
  for (const product of currentProducts.filter((item) => item.category === "watch")) {
    await request(`${baseUrl}/api/admin/products/${product.id}`, {
      method: "DELETE",
      headers: { Cookie: cookie },
    });
  }

  for (const [brand, name, price, quantity, description, caseSize, strapMaterial, movementType, style, featured] of products) {
    const form = new FormData();
    form.set("category", "watch");
    form.set("brand", brand);
    form.set("name", name);
    form.set("price", String(price));
    form.set("quantity", String(quantity));
    form.set("description", description);
    form.set("specs", JSON.stringify({ caseSize, strapMaterial, movementType, style }));
    form.set("featured", featured ? "true" : "false");

    await fetch(`${baseUrl}/api/admin/products`, {
      method: "POST",
      headers: { Cookie: cookie },
      body: form,
    }).then(async (response) => {
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Failed to add ${brand}`);
      }
    });
  }

  console.log(`Synced ${products.length} watch products and brands.`);
})();
