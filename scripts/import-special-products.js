const fs = require("fs");
const path = require("path");

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "wristmode2026";
const CUSTOM_MARKER = "Imported " + "from Wrist Mode " + "custom jewelry stock.";
const WOODEN_MARKER = "Imported " + "from Wrist Mode " + "wooden watch stock.";

const customProducts = [
  {
    category: "jewelry",
    brand: "Wrist Mode Custom",
    name: "Custom Photo Keyholders",
    image: "/assets/products/custom-jewelry/custom-photo-keyholders.jpeg",
    description: "Photo keyholders with a picture, date, calendar detail, name, or short message.",
    specs: { material: "Metal tag", finish: "Black or silver", size: "Custom photo and message" },
    featured: true,
  },
  {
    category: "jewelry",
    brand: "Wrist Mode Custom",
    name: "Photo Pendant Necklace",
    image: "/assets/products/custom-jewelry/photo-pendant-closeup-box.jpeg",
    description: "Personalized pendant necklace with a customer photo printed on the tag.",
    specs: { material: "Pendant and chain", finish: "Photo print", size: "Custom photo pendant" },
    featured: true,
  },
  {
    category: "jewelry",
    brand: "Wrist Mode Custom",
    name: "Photo Pendant Gift Box",
    image: "/assets/products/custom-jewelry/photo-pendant-gift-box.jpeg",
    description: "Gift-boxed photo pendant for birthdays, couples, memorial pieces, and special days.",
    specs: { material: "Pendant and chain", finish: "Gift boxed", size: "Custom photo pendant" },
  },
  {
    category: "jewelry",
    brand: "Wrist Mode Custom",
    name: "Engraved Message Pendant",
    image: "/assets/products/custom-jewelry/engraved-message-pendant-box.jpeg",
    description: "Pendant with a personal message, quote, names, or dates engraved on the tag.",
    specs: { material: "Pendant and chain", finish: "Engraved text", size: "Custom message" },
  },
  {
    category: "jewelry",
    brand: "Wrist Mode Custom",
    name: "Gold Name Bracelet",
    image: "/assets/products/custom-jewelry/engraved-name-bracelet-gold.jpeg",
    description: "Custom name bracelet in a polished gold look for personal wear or gifting.",
    specs: { material: "Bracelet", finish: "Gold tone", size: "Adjustable bracelet" },
  },
  {
    category: "jewelry",
    brand: "Wrist Mode Custom",
    name: "Blue Name Bracelet",
    image: "/assets/products/custom-jewelry/blue-rolex-name-bracelet.jpeg",
    description: "Statement name bracelet with a blue and silver look and personalized center plate.",
    specs: { material: "Bracelet", finish: "Blue and silver", size: "Adjustable bracelet" },
  },
  {
    category: "jewelry",
    brand: "Wrist Mode Custom",
    name: "Silver Name Bar Necklace",
    image: "/assets/products/custom-jewelry/silver-name-bar-necklace.jpeg",
    description: "Slim bar necklace customized with a name, nickname, or short word.",
    specs: { material: "Bar pendant and chain", finish: "Silver tone", size: "Custom name bar" },
  },
  {
    category: "jewelry",
    brand: "Wrist Mode Custom",
    name: "Personal Message Dog Tag",
    image: "/assets/products/custom-jewelry/engraved-message-dog-tag.jpeg",
    description: "Dark dog-tag pendant with engraved personal wording for meaningful gifts.",
    specs: { material: "Dog-tag pendant", finish: "Black engraved", size: "Custom message tag" },
  },
  {
    category: "jewelry",
    brand: "Wrist Mode Custom",
    name: "Custom Bracelet Collection",
    image: "/assets/products/custom-jewelry/custom-bracelet-display.jpeg",
    description: "Multiple bracelet colors and finishes available for names and special wording.",
    specs: { material: "Bracelets", finish: "Mixed finishes", size: "Custom bracelet fit" },
  },
];

const woodenProducts = [
  ["Black Minimal Wood Watch", "black-minimal-wood-watch.jpeg", "Minimal black wooden watch with a clean dial.", "Minimal"],
  ["Gold Bamboo Wood Watch", "gold-bamboo-wood-watch.jpeg", "Light bamboo-look wooden watch with warm gold grain.", "Minimal"],
  ["Amber Grain Wood Watch", "amber-grain-wood-watch.jpeg", "Amber wood-grain watch with a natural dial texture.", "Dress"],
  ["Striped Zebrawood Watch", "striped-zebrawood-watch.jpeg", "Striped zebrawood-style watch with a polished bracelet.", "Dress"],
  ["Rosewood Silver Dial Watch", "rosewood-silver-dial-watch.jpeg", "Rosewood-style case with a clean silver dial.", "Minimal"],
  ["Light Bamboo Silver Watch", "light-bamboo-silver-watch.jpeg", "Light wood bracelet watch with a bright silver dial.", "Minimal"],
  ["Engraved Face Wood Watch", "engraved-face-wood-watch.jpeg", "Natural wood dial watch with decorative dial markings.", "Dress"],
  ["Black Brown Wood Chronograph", "black-brown-wood-chronograph.jpeg", "Dark wood chronograph-style watch with gold accents.", "Chronograph"],
  ["Dual Dial Bamboo Chronograph", "dual-dial-bamboo-chronograph.jpeg", "Two-dial bamboo-look chronograph-style wooden watch.", "Chronograph"],
  ["Black Round Wood Watch", "black-round-wood-watch.jpeg", "Round black wooden watch with a pale dial.", "Minimal"],
  ["Black Steel Wood Chronograph", "black-steel-wood-chronograph.jpeg", "Black chronograph-style wood watch with steel accent links.", "Chronograph"],
  ["Brown Dual Time Wood Watch", "brown-dual-time-wood-watch.jpeg", "Brown wooden watch with two subdials and sporty character.", "Sport"],
  ["Gold Wood Moonphase Watch", "gold-wood-moonphase-watch.jpeg", "Gold wood-look watch with moonphase-style detailing.", "Dress"],
  ["Orange Black Wood Chronograph", "orange-black-wood-chronograph.jpeg", "Orange and black wooden chronograph-style watch.", "Chronograph"],
  ["Burgundy Gold Wood Watch", "burgundy-gold-wood-watch.jpeg", "Burgundy dial wooden watch with gold-tone detailing.", "Dress"],
  ["White Black Bamboo Chronograph", "white-black-bamboo-chronograph.jpeg", "Bamboo and black chronograph-style watch with a white dial.", "Chronograph"],
  ["Black Red Wood Sport Watch", "black-red-wood-sport-watch.jpeg", "Black wooden sport watch with red dial accents.", "Sport"],
  ["Blue Dial Zebrawood Chronograph", "blue-dial-zebrawood-chronograph.jpeg", "Zebrawood-style chronograph watch with a blue dial.", "Chronograph"],
  ["Black Gold Wood Dress Watch", "black-gold-wood-dress-watch.jpeg", "Black wood dress watch with gold markers.", "Dress"],
  ["Black Gold Wood Compass Watch", "black-gold-wood-compass-watch.jpeg", "Black and gold wood watch with compass-style dial detail.", "Sport"],
  ["Bold Number Zebrawood Watch", "bold-number-zebrawood-watch.jpeg", "Zebrawood-style watch with bold number dial styling.", "Sport"],
  ["Rectangular Subdial Wood Watch", "rectangular-subdial-wood-watch.jpeg", "Wooden watch with rectangular subdial styling.", "Sport"],
  ["Dark Wood Skeleton Look Watch", "dark-wood-skeleton-look-watch.jpeg", "Dark wooden watch with a skeleton-look dial.", "Dress"],
  ["Gold Black Wood Sport Watch", "gold-black-wood-sport-watch.jpeg", "Gold and black wooden sport watch with bold contrast.", "Sport"],
  ["Blue Black Wood Chronograph", "blue-black-wood-chronograph.jpeg", "Blue and black chronograph-style wooden watch.", "Chronograph"],
  ["Multi Dial Brown Wood Watch", "multi-dial-brown-wood-watch.jpeg", "Brown wood watch with multiple dial accents.", "Chronograph"],
  ["Black Cream Dial Wood Watch", "black-cream-dial-wood-watch.jpeg", "Black wooden watch with a cream dial and bold numerals.", "Minimal"],
  ["Black Gold Luxury Wood Watch", "black-gold-luxury-wood-watch.jpeg", "Black and gold wooden watch with a premium dress look.", "Dress"],
  ["White Multicolor Wood Watch", "white-multicolor-wood-watch.jpeg", "White dial wood watch with multicolor accent details.", "Sport"],
  ["Green Chronograph Wood Watch", "green-chronograph-wood-watch.jpeg", "Green chronograph-style wooden watch with dark links.", "Chronograph"],
  ["Navy Rugged Wood Watch", "navy-rugged-wood-watch.jpeg", "Rugged wooden watch with navy and yellow dial accents.", "Sport"],
].map(([name, fileName, copy, style], index) => ({
  category: "wooden",
  brand: "Wrist Mode Wooden",
  name,
  image: `/assets/products/wooden-watches/${fileName}`,
  description: `${copy} Contact Wrist Mode to confirm current price and availability.`,
  specs: { caseSize: "Standard fit", strapMaterial: "Wood", movementType: "Quartz", style },
  featured: index < 2,
}));

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
    const localPath = path.join(__dirname, "..", "public", product.image.replace(/^\//, ""));
    if (!fs.existsSync(localPath)) throw new Error(`Missing image for ${product.name}: ${localPath}`);
  }
}

async function upsertProduct(product, cookie) {
  const fields = {
    category: product.category,
    brand: product.brand,
    name: product.name,
    price: 0,
    quantity: 5,
    description: product.description,
    specs: JSON.stringify(product.specs),
    featured: product.featured ? "true" : "false",
  };

  const { data: created } = await request(`${BASE_URL}/api/admin/products`, {
    method: "POST",
    headers: {
      Cookie: cookie,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formBody(fields),
  });

  const createdId = created?.id;
  let productId = createdId;
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
    body: formBody({
      ...fields,
      existingImages: JSON.stringify([product.image]),
    }),
  });
}

async function main() {
  const products = [...customProducts, ...woodenProducts];
  assertAssets(products);

  const { response: loginResponse } = await request(`${BASE_URL}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: ADMIN_PASSWORD }),
  });
  const cookie = loginResponse.headers.get("set-cookie")?.split(";")[0];
  if (!cookie) throw new Error("Admin login did not return a session cookie.");

  const { data: existingProducts } = await request(`${BASE_URL}/api/products`);
  const removable = existingProducts.filter((product) => {
    const description = String(product.description || "");
    const oldNecklace = product.category === "jewelry" && product.name === "Personalized Pendant Chain";
    return description.startsWith(CUSTOM_MARKER) || description.startsWith(WOODEN_MARKER) || oldNecklace;
  });

  for (const product of removable) {
    await request(`${BASE_URL}/api/admin/products/${product.id}`, {
      method: "DELETE",
      headers: { Cookie: cookie },
    });
  }

  for (const product of products) {
    await upsertProduct(product, cookie);
  }

  console.log(`Removed ${removable.length} previous special products.`);
  console.log(`Imported ${customProducts.length} custom jewelry products.`);
  console.log(`Imported ${woodenProducts.length} wooden watch products.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
