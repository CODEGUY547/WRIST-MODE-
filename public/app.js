const appEl = document.querySelector("#app");
const cartDrawer = document.querySelector("#cartDrawer");
const cartContent = document.querySelector("#cartContent");
const cartCount = document.querySelector("#cartCount");
const modalRoot = document.querySelector("#modalRoot");
const toastEl = document.querySelector("#toast");

const money = new Intl.NumberFormat("en-UG", {
  style: "currency",
  currency: "UGX",
  maximumFractionDigits: 0,
});

const orderStatuses = ["Requested", "Quoted", "Confirmed", "In Production", "Ready", "Delivered", "Cancelled"];
const finishes = [
  ["Gold", "#d8a441"],
  ["Silver", "#d7dce0"],
  ["Rose Gold", "#d8a28e"],
  ["Black", "#111111"],
  ["Two Tone", "linear-gradient(135deg, #d8a441 0 50%, #d7dce0 50% 100%)"],
];

const customStudioAsset = "/assets/custom-studio/";

const customizerPieces = [
  {
    id: "bar-necklace",
    label: "4-Side Bar Necklace",
    shortLabel: "Bar",
    placeholder: "I will always be here",
    copy: "Slim bar pendant with front, back, and side engraving options for names, dates, or short messages.",
    surface: "bar",
    mockup: `${customStudioAsset}bar-gold-clean.png`,
    variants: [
      {
        id: "clean-bar",
        label: "Clean Bar",
        mockups: {
          Gold: `${customStudioAsset}bar-gold-clean.png`,
          Silver: `${customStudioAsset}bar-silver-clean.png`,
          Black: `${customStudioAsset}bar-black-clean.png`,
          "Rose Gold": `${customStudioAsset}bar-gold-clean.png`,
          "Two Tone": `${customStudioAsset}bar-side-silver.png`,
        },
      },
      {
        id: "side-message",
        label: "Side Message",
        mockups: {
          Gold: `${customStudioAsset}bar-side-silver.png`,
          Silver: `${customStudioAsset}bar-side-silver.png`,
          Black: `${customStudioAsset}bar-black-clean.png`,
          "Rose Gold": `${customStudioAsset}bar-gold-clean.png`,
          "Two Tone": `${customStudioAsset}bar-side-silver.png`,
        },
      },
    ],
  },
  {
    id: "photo-pendant",
    label: "Picture Dog Tag",
    shortLabel: "Photo Tag",
    placeholder: "Forever",
    copy: "Photo dog tag where the customer uploads the picture for the front, with optional text on the back.",
    surface: "dogtag",
    mockup: `${customStudioAsset}dogtag-photo-single.png`,
    photo: true,
    variants: [
      {
        id: "photo-front",
        label: "Photo Front",
        mockups: {
          Gold: `${customStudioAsset}dogtag-photo-single.png`,
          Silver: `${customStudioAsset}dogtag-blank-pair.png`,
          Black: `${customStudioAsset}dogtag-photo-single.png`,
          "Rose Gold": `${customStudioAsset}dogtag-photo-text-pair.png`,
          "Two Tone": `${customStudioAsset}dogtag-photo-text-pair.png`,
        },
      },
      {
        id: "photo-and-text",
        label: "Photo + Text",
        mockups: {
          Gold: `${customStudioAsset}dogtag-photo-text-pair.png`,
          Silver: `${customStudioAsset}dogtag-blank-pair.png`,
          Black: `${customStudioAsset}dogtag-photo-text-pair.png`,
          "Rose Gold": `${customStudioAsset}dogtag-photo-text-pair.png`,
          "Two Tone": `${customStudioAsset}dogtag-blank-pair.png`,
        },
      },
    ],
  },
  {
    id: "dog-tag",
    label: "Message Dog Tag",
    shortLabel: "Dog Tag",
    placeholder: "I can do all things",
    copy: "Blank dog tag for scripture, coordinates, vows, names, or short dedication messages.",
    surface: "dogtag",
    mockup: `${customStudioAsset}dogtag-verse.png`,
    variants: [
      {
        id: "single-tag",
        label: "Single Tag",
        mockups: {
          Gold: `${customStudioAsset}dogtag-verse.png`,
          Silver: `${customStudioAsset}dogtag-blank-pair.png`,
          Black: `${customStudioAsset}dogtag-verse.png`,
          "Rose Gold": `${customStudioAsset}dogtag-verse.png`,
          "Two Tone": `${customStudioAsset}dogtag-blank-pair.png`,
        },
      },
      {
        id: "blank-pair",
        label: "Blank Pair",
        mockups: {
          Gold: `${customStudioAsset}dogtag-blank-pair.png`,
          Silver: `${customStudioAsset}dogtag-blank-pair.png`,
          Black: `${customStudioAsset}dogtag-blank-pair.png`,
          "Rose Gold": `${customStudioAsset}dogtag-blank-pair.png`,
          "Two Tone": `${customStudioAsset}dogtag-blank-pair.png`,
        },
      },
    ],
  },
  {
    id: "name-necklace",
    label: "Name Necklace",
    shortLabel: "Name",
    placeholder: "Amina",
    copy: "Calligraphy name necklace styles for script names, gothic names, wings, infinity, hearts, and butterfly accents.",
    surface: "name",
    mockup: `${customStudioAsset}name-script-butterfly.png`,
    variants: [
      { id: "script-butterfly", label: "Script Butterfly", charm: "butterfly", mockup: `${customStudioAsset}name-script-butterfly.png` },
      { id: "gothic", label: "Gothic", mockup: `${customStudioAsset}name-gothic.png` },
      { id: "angel-wings", label: "Angel Wings", charm: "wings", mockup: `${customStudioAsset}name-angel-wings.png` },
      { id: "infinity", label: "Infinity Names", charm: "infinity", mockup: `${customStudioAsset}name-infinity.png` },
      { id: "butterfly", label: "Butterfly", charm: "butterfly", mockup: `${customStudioAsset}name-butterfly.png` },
      { id: "heart", label: "Heart", charm: "heart", mockup: `${customStudioAsset}name-heart.png` },
    ],
  },
  {
    id: "name-bracelet",
    label: "Name Plate Bracelet",
    shortLabel: "Bracelet",
    placeholder: "Custom Name",
    copy: "Metal link bracelet with the customer's name or message engraved across the front plate.",
    surface: "bracelet",
    mockup: `${customStudioAsset}bracelet-gold.png`,
    variants: [
      {
        id: "front-name",
        label: "Front Name",
        mockups: {
          Gold: `${customStudioAsset}bracelet-gold.png`,
          Silver: `${customStudioAsset}bracelet-two-tone.png`,
          Black: `${customStudioAsset}bracelet-black.png`,
          "Rose Gold": `${customStudioAsset}bracelet-gold.png`,
          "Two Tone": `${customStudioAsset}bracelet-two-tone.png`,
        },
      },
      {
        id: "inside-message",
        label: "Inside Message",
        mockups: {
          Gold: `${customStudioAsset}bracelet-back-black.png`,
          Silver: `${customStudioAsset}bracelet-back-black.png`,
          Black: `${customStudioAsset}bracelet-back-black.png`,
          "Rose Gold": `${customStudioAsset}bracelet-back-black.png`,
          "Two Tone": `${customStudioAsset}bracelet-two-tone.png`,
        },
      },
    ],
  },
  {
    id: "envelope-necklace",
    label: "Envelope Necklace",
    shortLabel: "Envelope",
    placeholder: "Open When...",
    copy: "Envelope pendant for a tiny letter, date, initials, or simple message on the front or inside.",
    surface: "envelope",
    mockup: `${customStudioAsset}envelope-gold.png`,
    variants: [
      {
        id: "open-envelope",
        label: "Open Envelope",
        mockups: {
          Gold: `${customStudioAsset}envelope-gold.png`,
          Silver: `${customStudioAsset}envelope-silver.png`,
          "Rose Gold": `${customStudioAsset}envelope-rose.png`,
          Black: `${customStudioAsset}envelope-silver.png`,
          "Two Tone": `${customStudioAsset}envelope-gold.png`,
        },
      },
    ],
  },
  {
    id: "book-pendant",
    label: "Book Pendant",
    shortLabel: "Book",
    placeholder: "A + M",
    copy: "Opening book-style pendant for names, dates, verses, initials, or a heart detail.",
    surface: "book",
    mockup: `${customStudioAsset}book-heart-gold.png`,
    variants: [
      {
        id: "gold-heart",
        label: "Gold Heart",
        mockups: {
          Gold: `${customStudioAsset}book-heart-gold.png`,
          Silver: `${customStudioAsset}book-heart-black.png`,
          Black: `${customStudioAsset}book-heart-black.png`,
          "Rose Gold": `${customStudioAsset}book-heart-gold.png`,
          "Two Tone": `${customStudioAsset}book-heart-gold.png`,
        },
      },
      {
        id: "black-heart",
        label: "Black Heart",
        mockups: {
          Gold: `${customStudioAsset}book-heart-black.png`,
          Silver: `${customStudioAsset}book-heart-black.png`,
          Black: `${customStudioAsset}book-heart-black.png`,
          "Rose Gold": `${customStudioAsset}book-heart-gold.png`,
          "Two Tone": `${customStudioAsset}book-heart-black.png`,
        },
      },
    ],
  },
  {
    id: "keyholder",
    label: "Photo Keyholder",
    shortLabel: "Keyholder",
    placeholder: "M & K",
    copy: "Keyholder tag for a photo, calendar date, name, or short message.",
    surface: "keyholder",
    mockup: "/assets/products/custom-jewelry/custom-photo-keyholders.jpeg",
    photo: true,
  },
  {
    id: "bangle",
    label: "Cuff Bangle",
    shortLabel: "Cuff",
    placeholder: "God is within her",
    copy: "Slim cuff bangle for verse lines, names, dates, or meaningful inside/outside messages.",
    surface: "cuff",
    mockup: `${customStudioAsset}cuff-multi.png`,
    variants: [
      {
        id: "verse-cuff",
        label: "Verse Cuff",
        mockups: {
          Gold: `${customStudioAsset}cuff-multi.png`,
          Silver: `${customStudioAsset}cuff-verse.png`,
          Black: `${customStudioAsset}cuff-black.png`,
          "Rose Gold": `${customStudioAsset}cuff-rose.png`,
          "Two Tone": `${customStudioAsset}cuff-multi.png`,
        },
      },
      {
        id: "clean-cuff",
        label: "Clean Cuff",
        mockups: {
          Gold: `${customStudioAsset}cuff-multi.png`,
          Silver: `${customStudioAsset}cuff-silver.png`,
          Black: `${customStudioAsset}cuff-black.png`,
          "Rose Gold": `${customStudioAsset}cuff-rose.png`,
          "Two Tone": `${customStudioAsset}cuff-multi.png`,
        },
      },
    ],
  },
];

const customizerFonts = [
  ["serif", "Classic Serif"],
  ["great-vibes", "Great Vibes"],
  ["allura", "Allura"],
  ["dancing", "Dancing Script"],
  ["parisienne", "Parisienne"],
  ["imperial", "Imperial Script"],
  ["alex", "Alex Brush"],
  ["tangerine", "Tangerine"],
  ["script", "Signature Italic"],
  ["playfair", "Luxury Serif"],
  ["gothic", "Gothic Blackletter"],
  ["cinzel", "Engraved Caps"],
  ["sans", "Modern Sans"],
  ["caps", "Bold Caps"],
];

const viewMeta = {
  home: [
    "Wrist Mode | Watches and Customized Jewelry",
    "Shop premium watches and request customized jewelry from Wrist Mode.",
  ],
  watches: [
    "Watches | Wrist Mode",
    "Browse Wrist Mode watches by brand, price, and stock availability.",
  ],
  women: [
    "Women Watches | Wrist Mode",
    "Shop Wrist Mode women watches, bracelet watch sets, full gift sets, and plain ladies watches.",
  ],
  wooden: [
    "Wooden Watches | Wrist Mode",
    "Shop Wrist Mode wooden watches with natural grain, light bamboo, dark wood, and chronograph styles.",
  ],
  jewelry: [
    "Jewelry | Wrist Mode",
    "Shop ready-made rings, photo pendants, keyholders, bracelets, engraving, and personalized accessories.",
  ],
  customize: [
    "Customize Your Jewelry | Wrist Mode",
    "Request plain or customized photo pendants, keyholders, bracelets, bar necklaces, names, dates, and messages.",
  ],
  about: [
    "About | Wrist Mode",
    "Learn the Wrist Mode brand story for watches, jewelry, and personal style accessories.",
  ],
  contact: [
    "Contact | Wrist Mode",
    "Contact Wrist Mode for orders, custom jewelry quotes, availability, and delivery support.",
  ],
  faq: [
    "FAQ | Wrist Mode",
    "Answers about Wrist Mode customization, delivery, mobile money, returns, and stock alerts.",
  ],
  admin: [
    "Admin Dashboard | Wrist Mode",
    "Manage Wrist Mode products, stock, orders, custom requests, and notifications.",
  ],
};

const heroSlides = [
  {
    eyebrow: "Watches and customized jewelry",
    title: "Premium Watch Selection",
    copy: "Browse bold timepieces, luxury-inspired looks, and new arrivals sorted by brand and style.",
    image: "/assets/watch-hero.jpg",
    view: "watches",
    cta: "Shop Watches",
    secondaryView: "customize",
    secondaryCta: "Customize Jewelry",
  },
  {
    eyebrow: "New arrivals",
    title: "Fresh Watch Stock",
    copy: "See the latest bracelet, leather strap, sport, and Naviforce styles added to Wrist Mode.",
    image: "/assets/products/watches/sept-2026/07-naviforce-sport-watch-collection-04.jpeg",
    view: "watches",
    cta: "View New Watches",
    secondaryView: "contact",
    secondaryCta: "Ask Availability",
  },
  {
    eyebrow: "Women watches",
    title: "Gift Sets and Plain Styles",
    copy: "Explore ladies watches grouped into bracelet sets, full gift boxes, and clean plain watches.",
    image: "/assets/products/women-watches/ladies-luxury-full-gift-set-collection-001.jpeg",
    view: "women",
    cta: "Shop Women Watches",
    secondaryView: "jewelry",
    secondaryCta: "Match Jewelry",
  },
  {
    eyebrow: "Ready jewelry",
    title: "Pendants, Bracelets and Bangles",
    copy: "Choose plain pieces in gold, silver, black, and mixed finishes before deciding whether to customize.",
    image: "/assets/products/custom-jewelry/sept-2026/02-wrist-mode-custom-personalized-bar-necklace-and-pendant-collection-12.jpeg",
    view: "jewelry",
    cta: "Shop Jewelry",
    secondaryView: "customize",
    secondaryCta: "Add Engraving",
  },
  {
    eyebrow: "Custom studio",
    title: "Names, Photos and Messages",
    copy: "Start a custom request for bracelets, bar necklaces, picture tags, couple pendants, and personal wording.",
    image: "/assets/products/custom-jewelry/sept-2026/01-wrist-mode-custom-engraved-bracelet-and-name-plate-sets-15.jpeg",
    view: "customize",
    cta: "Start Custom Order",
    secondaryView: "contact",
    secondaryCta: "Talk to Wrist Mode",
  },
];

const state = {
  view: "home",
  heroSlide: 0,
  products: [],
  brands: [],
  cart: loadCart(),
  filters: {
    q: "",
    brand: "all",
    availability: "all",
    minPrice: "",
    maxPrice: "",
  },
  catalogLimit: 24,
  editingProductId: null,
  jewelryChoice: null,
  admin: {
    isAdmin: false,
    tab: "overview",
    analytics: null,
    orders: [],
    customRequests: [],
    notifications: [],
  },
};

let heroTimer = null;

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => {
    const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
    return map[char];
  });
}

function attr(value = "") {
  return escapeHtml(value);
}

function formatMoney(value) {
  return money.format(Number(value || 0));
}

function displayPrice(product) {
  return Number(product?.price || 0) > 0 ? formatMoney(product.price) : "Contact for price";
}

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleString("en-UG", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

async function request(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Request failed.");
  return data;
}

function toast(message) {
  toastEl.textContent = message;
  toastEl.classList.add("show");
  window.clearTimeout(toastEl.timer);
  toastEl.timer = window.setTimeout(() => toastEl.classList.remove("show"), 3600);
}

function loadCart() {
  try {
    return JSON.parse(localStorage.getItem("wm_cart") || "[]");
  } catch {
    return [];
  }
}

function saveCart() {
  localStorage.setItem("wm_cart", JSON.stringify(state.cart));
  renderCart();
}

function cartItems() {
  return state.cart
    .map((item) => {
      const product = state.products.find((candidate) => candidate.id === item.productId);
      return product ? { ...item, product } : null;
    })
    .filter(Boolean);
}

function imageFor(product) {
  return product?.images?.[0] || "/assets/watch-hero.jpg";
}

function imageListFor(product) {
  return Array.isArray(product?.images) ? product.images.filter(Boolean) : [];
}

function slugify(value = "") {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "item";
}

function firstVariantFor(piece) {
  return piece?.variants?.[0] || {
    id: "classic",
    label: piece?.shortLabel || "Classic",
    mockup: piece?.mockup,
  };
}

function variantForPiece(piece, variantId = "") {
  return piece?.variants?.find((variant) => variant.id === variantId) || firstVariantFor(piece);
}

function mockupForPiece(piece, finish = "Gold", variantId = "") {
  const variant = variantForPiece(piece, variantId);
  const mockups = variant.mockups || piece?.mockups || {};
  return mockups[finish] || mockups.Gold || mockups.Silver || variant.mockup || piece?.mockup || "";
}

function renderDesignVariants(piece, activeVariantId = "") {
  const variants = piece?.variants?.length ? piece.variants : [firstVariantFor(piece)];
  return variants
    .map((variant) => {
      const active = variant.id === variantForPiece(piece, activeVariantId).id;
      const image = mockupForPiece(piece, "Gold", variant.id);
      return `<button class="design-variant-card ${active ? "active" : ""}" type="button" data-design-variant="${attr(variant.id)}" aria-pressed="${active}">
        <img src="${attr(image)}" alt="${attr(variant.label)}" loading="lazy" decoding="async" />
        <span>${escapeHtml(variant.label)}</span>
      </button>`;
    })
    .join("");
}

function updateVariantControls(form, piece) {
  const variantInput = form?.designVariant;
  const current = variantInput?.value || "";
  const variant = variantForPiece(piece, current);
  if (variantInput) variantInput.value = variant.id;

  const block = form?.querySelector("[data-variant-block]");
  const grid = form?.querySelector("[data-design-variants]");
  const variants = piece?.variants?.length ? piece.variants : [firstVariantFor(piece)];
  if (block) block.hidden = variants.length <= 1;
  if (grid && grid.dataset.piece !== piece.id) {
    grid.dataset.piece = piece.id;
    grid.innerHTML = renderDesignVariants(piece, variant.id);
  }
  grid?.querySelectorAll("[data-design-variant]").forEach((button) => {
    const active = button.dataset.designVariant === variant.id;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  return variant;
}

function customizerPieceFromSelection(value = "") {
  const lower = String(value).toLowerCase();
  if (lower.includes("key")) return customizerPieces.find((piece) => piece.id === "keyholder");
  if (lower.includes("bracelet")) return customizerPieces.find((piece) => piece.id === "name-bracelet");
  if (lower.includes("bangle") || lower.includes("cuff")) return customizerPieces.find((piece) => piece.id === "bangle");
  if (lower.includes("envelope")) return customizerPieces.find((piece) => piece.id === "envelope-necklace");
  if (lower.includes("book") || lower.includes("bible")) return customizerPieces.find((piece) => piece.id === "book-pendant");
  if (lower.includes("bar")) return customizerPieces.find((piece) => piece.id === "bar-necklace");
  if (lower.includes("photo") || lower.includes("picture")) return customizerPieces.find((piece) => piece.id === "photo-pendant");
  if (lower.includes("dog") || lower.includes("message")) return customizerPieces.find((piece) => piece.id === "dog-tag");
  if (lower.includes("name") || lower.includes("necklace")) return customizerPieces.find((piece) => piece.id === "name-necklace");
  if (lower.includes("pendant")) return customizerPieces.find((piece) => piece.id === "photo-pendant");
  return customizerPieces[0];
}

function customizerInitialState(selected = {}) {
  const piece = customizerPieceFromSelection(selected.productName || selected.selectedProduct || "");
  const choice = selected.choice === "plain" ? "Keep Plain" : "Customize";
  const variant = firstVariantFor(piece);
  return {
    piece,
    variant,
    choice,
    side: "Front",
    finish: "Gold",
    font: "serif",
    text: choice === "Keep Plain" ? "" : piece.placeholder,
    textSize: 34,
    textX: 50,
    textY: 52,
    rotateY: 0,
  };
}

function renderVariantStrip(product) {
  const images = imageListFor(product);
  if (images.length <= 1) return "";
  const label = product.specs?.colorOptions || `${images.length} options`;
  return `
    <div class="variant-strip" aria-label="${attr(label)}">
      <div>
        ${images
          .slice(0, 4)
          .map((image, index) => `<img src="${attr(image)}" alt="${attr(product.name)} option ${index + 1}" loading="lazy" decoding="async" />`)
          .join("")}
      </div>
      <span>${images.length} photos</span>
    </div>
  `;
}

function stockClass(product) {
  if (product.stockStatus === "Out of Stock") return "out";
  if (product.stockStatus === "Low Stock") return "low";
  return "";
}

async function refreshProducts() {
  state.products = await request("/api/products");
  state.brands = await request("/api/brands");
}

async function checkAdminSession() {
  const session = await request("/api/admin/session");
  state.admin.isAdmin = session.isAdmin;
}

async function loadAdminData() {
  if (!state.admin.isAdmin) return;
  const [analytics, orders, customRequests, notifications] = await Promise.all([
    request("/api/admin/analytics"),
    request("/api/admin/orders"),
    request("/api/admin/custom-requests"),
    request("/api/admin/notifications"),
  ]);
  state.admin.analytics = analytics;
  state.admin.orders = orders;
  state.admin.customRequests = customRequests;
  state.admin.notifications = notifications;
}

async function setView(view) {
  if (view !== state.view && ["watches", "jewelry", "wooden", "women"].includes(view)) state.catalogLimit = 24;
  state.view = view;
  if (view === "admin" && state.admin.isAdmin) await loadAdminData();
  render();
  appEl.focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function render() {
  stopHeroCarousel();
  updateSeo();
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === state.view);
  });

  const renderers = {
    home: renderHome,
    watches: () => renderCatalog("watch"),
    women: renderWomen,
    wooden: () => renderCatalog("wooden"),
    jewelry: renderJewelry,
    customize: renderCustomize,
    about: renderAbout,
    contact: renderContact,
    faq: renderFaq,
    admin: renderAdmin,
  };

  appEl.innerHTML = (renderers[state.view] || renderHome)();
  renderCart();
  if (state.view === "home") startHeroCarousel();
  if (state.view === "customize") updateCustomPreview(appEl.querySelector("#customForm"), { immediate: true });
}

function updateSeo() {
  const [title, description] = viewMeta[state.view] || viewMeta.home;
  document.title = title;
  let meta = document.querySelector('meta[name="description"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "description";
    document.head.appendChild(meta);
  }
  meta.content = description;
}

function normalizedHeroSlide(index) {
  return ((Number(index) % heroSlides.length) + heroSlides.length) % heroSlides.length;
}

function renderHeroCarousel() {
  const activeIndex = normalizedHeroSlide(state.heroSlide);
  return `
    <section class="hero hero-carousel" data-hero-carousel>
      <div class="hero-media" aria-hidden="true">
        ${heroSlides
          .map(
            (slide, index) => `<img class="${index === activeIndex ? "active" : ""}" data-hero-bg="${index}" src="${attr(slide.image)}" alt="" loading="${index === activeIndex ? "eager" : "lazy"}" decoding="async" />`,
          )
          .join("")}
      </div>
      <div class="hero-content hero-content-clean">
        <div class="hero-copy">
          <img class="hero-logo" src="/assets/wrist-mode-mark.png" alt="Wrist Mode logo" />
          <p class="eyebrow">Watches and customized jewelry</p>
          <h1>Wrist Mode</h1>
          <div class="hero-feature-copy">
            <strong>Premium Watches and Personal Jewelry</strong>
            <p class="lead">Shop watches, women gift sets, wooden watches, ready jewelry, and custom engraved pieces made for names, photos, dates, and messages.</p>
          </div>
          <div class="hero-actions">
            <button class="primary-button" data-view="watches">Shop Watches</button>
            <button class="secondary-button" data-view="women">Women Watches</button>
            <button class="secondary-button" data-view="jewelry">Shop Jewelry</button>
            <button class="secondary-button" data-view="customize">Customize Your Own</button>
          </div>
        </div>
      </div>
    </section>
  `;
}

function setHeroSlide(index, options = {}) {
  const nextIndex = normalizedHeroSlide(index);
  state.heroSlide = nextIndex;

  const hero = appEl.querySelector("[data-hero-carousel]");
  if (!hero) return;

  hero.querySelectorAll("[data-hero-bg]").forEach((image) => {
    image.classList.toggle("active", Number(image.dataset.heroBg) === nextIndex);
  });

  if (options.restart) startHeroCarousel();
}

function stopHeroCarousel() {
  window.clearInterval(heroTimer);
  heroTimer = null;
}

function startHeroCarousel() {
  stopHeroCarousel();
  if (!appEl.querySelector("[data-hero-carousel]")) return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) return;
  heroTimer = window.setInterval(() => setHeroSlide(state.heroSlide + 1), 6500);
}

function renderHome() {
  const featured = state.products.filter((product) => product.featured).slice(0, 4);
  return `
    ${renderHeroCarousel()}

    <section class="page-shell">
      <div class="category-grid">
        ${categoryTile("Shop Watches", "Curated timepieces by brand and style.", "/assets/products/watches/sept-2026/07-naviforce-sport-watch-collection-04.jpeg", "watches")}
        ${categoryTile("Women Watches", "Plain styles, bracelet sets, and full gift boxes.", "/assets/products/women-watches/ladies-luxury-full-gift-set-collection-001.jpeg", "women")}
        ${categoryTile("Wooden Watches", "Natural wood-grain watches with bold character.", "/assets/products/wooden-watches/gold-bamboo-wood-watch.jpeg", "wooden")}
        ${categoryTile("Shop Jewelry", "Bar necklaces, pendants, bracelets, and bangles.", "/assets/products/custom-jewelry/sept-2026/02-wrist-mode-custom-personalized-bar-necklace-and-pendant-collection-13.jpeg", "jewelry")}
        ${categoryTile("Customize Your Own", "Photo pendants, keyholders, names, and messages.", "/assets/products/custom-jewelry/sept-2026/03-wrist-mode-custom-couple-broken-heart-pendant-sets-01.jpeg", "customize")}
      </div>
    </section>

    <section class="page-shell">
      <div class="section-head">
        <div>
          <p class="eyebrow">New and featured</p>
          <h2>Style That Holds Attention</h2>
        </div>
        <button class="secondary-button" data-view="watches">View All</button>
      </div>
      ${renderProductGrid(featured.length ? featured : state.products.slice(0, 4))}
    </section>

    <section class="page-shell">
      <div class="trust-grid">
        <article class="testimonial"><p class="eyebrow">Trust</p><h3>Premium Selection</h3><p>Every piece is presented with clear details, price, and stock status.</p></article>
        <article class="testimonial"><p class="eyebrow">Custom</p><h3>Quote Before Payment</h3><p>Custom jewelry requests move from requested to quoted before confirmation.</p></article>
        <article class="testimonial"><p class="eyebrow">Delivery</p><h3>Uganda Ready</h3><p>Checkout includes mobile money options and pay on delivery.</p></article>
        <article class="testimonial"><p class="eyebrow">Care</p><h3>Status Updates</h3><p>Orders and stock alerts are tracked from the admin dashboard.</p></article>
      </div>
    </section>
  `;
}

function categoryTile(title, copy, image, view) {
  return `
    <button class="category-tile" data-view="${view}">
      <img src="${attr(image)}" alt="" loading="eager" decoding="async" />
      <p class="eyebrow">${escapeHtml(title)}</p>
      <h3>${escapeHtml(copy)}</h3>
    </button>
  `;
}

function renderCatalog(category) {
  const catalogMeta = {
    watch: {
      title: "Watches",
      copy: "Browse available watches by brand, price, and stock status.",
    },
    wooden: {
      title: "Wooden Watches",
      copy: "Explore wooden watches in light bamboo, dark wood, sport, dress, and chronograph styles.",
    },
    jewelry: {
      title: "Jewelry",
      copy: "Shop ready-made pieces, photo pendants, custom keyholders, engraved bracelets, and personalized gifts.",
    },
  };
  const { title, copy } = catalogMeta[category] || catalogMeta.watch;
  const categoryBrands = brandsForCategory(category);
  if (state.filters.brand !== "all" && !categoryBrands.includes(state.filters.brand)) {
    state.filters.brand = "all";
  }
  const products = filteredProducts(category);
  const visibleProducts = products.slice(0, state.catalogLimit);

  return `
    <section class="page-shell">
      <div class="section-head">
        <div>
          <p class="eyebrow">Storefront</p>
          <h2>${title}</h2>
          <p>${copy}</p>
        </div>
        ${category === "jewelry" ? '<button class="primary-button" data-view="customize">Customize</button>' : ""}
      </div>
      ${renderFilters(category)}
      ${renderProductGrid(visibleProducts, products.length)}
    </section>
  `;
}

function renderJewelry() {
  const products = state.products.filter((product) => product.category === "jewelry");
  const readyProducts = products.filter((product) => product.specs?.collection === "Ready Jewelry");
  const customExamples = products.filter((product) => product.specs?.collection !== "Ready Jewelry");

  return `
    <section class="page-shell jewelry-page">
      <div class="section-head">
        <div>
          <p class="eyebrow">Shop jewelry</p>
          <h2>Ready Pendants, Bracelets, Necklaces and Bangles</h2>
          <p>Browse clean jewelry pieces that are not yet customized, including bar necklaces, pendant chains, bracelets, bangles, and simple gift-ready accessories.</p>
        </div>
      </div>
      <article class="jewelry-spotlight surface">
        <img src="/assets/products/catalog-fill/bar-necklace-trio.png" alt="Gold, silver, and black bar necklaces" loading="lazy" decoding="async" />
        <div>
          <p class="eyebrow">Featured ready style</p>
          <h3>Gold, Silver and Black Bar Necklaces</h3>
          <p class="muted">Clean blank bar necklaces customers can wear plain or later personalize with a name, date, initials, or short message.</p>
          <div class="jewelry-tags">
            <span>Bar necklaces</span>
            <span>Pendants</span>
            <span>Bracelets</span>
            <span>Bangles</span>
          </div>
        </div>
      </article>
      <section class="jewelry-section">
        <div class="section-head">
          <div>
            <p class="eyebrow">Ready jewelry</p>
            <h3>Plain Pieces Customers Can Choose From</h3>
            <p>These pieces show the styles before names, photos, or messages are added.</p>
          </div>
        </div>
        ${renderProductGrid(readyProducts.length ? readyProducts : products)}
      </section>
      ${
        customExamples.length
          ? `<section class="jewelry-section">
              <div class="section-head">
                <div>
                  <p class="eyebrow">Personalized examples</p>
                  <h3>Custom Work Samples</h3>
                  <p>These show how selected jewelry can look after customization.</p>
                </div>
                <button class="secondary-button" data-view="customize">Start Custom Order</button>
              </div>
              ${renderProductGrid(customExamples.slice(0, 8))}
            </section>`
          : ""
      }
    </section>
  `;
}

function collectionId(value) {
  return `women-${String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}`;
}

function renderWomen() {
  const products = state.products.filter((product) => product.category === "women");
  const sections = [
    {
      collection: "Full Gift Sets",
      title: "Full Gift Sets",
      copy: "Bigger boxes with a women watch plus necklace, earrings, bracelet, ring, or matching accessories.",
      image: "/assets/products/women-watches/ladies-luxury-full-gift-set-collection-001.jpeg",
    },
    {
      collection: "Bracelet Watch Sets",
      title: "Watch and Bracelet Sets",
      copy: "Women watches paired with bracelets, bangles, or charm pieces, grouped by color family.",
      image: "/assets/products/women-watches/rose-gold-bracelet-watch-sets-003.jpeg",
    },
    {
      collection: "Plain Watches",
      title: "Plain Women Watches",
      copy: "Clean ladies watches without jewelry extras, including metal, leather strap, and paired watch options.",
      image: "/assets/products/women-watches/plain-ladies-watch-collection-006.jpeg",
    },
  ];

  const featuredImages = sections
    .filter((section) => products.some((product) => product.specs?.collection === section.collection))
    .map((section) => `<img src="${attr(section.image)}" alt="${attr(section.title)}" loading="lazy" decoding="async" />`)
    .join("");

  return `
    <section class="page-shell women-page">
      <div class="section-head">
        <div>
          <p class="eyebrow">Women watches</p>
          <h2>Gift Sets, Bracelet Sets, Plain Styles</h2>
          <p>Women watches are sorted into clear sections so customers can choose between full gift boxes, watch-and-bracelet sets, and plain watches without scrolling through repeats.</p>
        </div>
        <a class="primary-button" href="https://wa.me/256750668419" target="_blank" rel="noreferrer">Ask on WhatsApp</a>
      </div>
      <div class="women-intro">
        <div class="women-collection-nav">
          ${sections
            .map((section) => {
              const count = products.filter((product) => product.specs?.collection === section.collection).length;
              return `<a href="#${collectionId(section.collection)}"><strong>${section.title}</strong><span>${count} grouped styles</span></a>`;
            })
            .join("")}
        </div>
        <div class="women-hero-strip">${featuredImages}</div>
      </div>
      ${sections
        .map((section) => {
          const sectionProducts = products.filter((product) => product.specs?.collection === section.collection);
          if (!sectionProducts.length) return "";
          return `
            <section class="women-section" id="${collectionId(section.collection)}">
              <div class="section-head">
                <div>
                  <p class="eyebrow">${escapeHtml(section.collection)}</p>
                  <h3>${escapeHtml(section.title)}</h3>
                  <p>${escapeHtml(section.copy)}</p>
                </div>
              </div>
              ${renderWomenLookbookGrid(sectionProducts)}
            </section>
          `;
        })
        .join("")}
    </section>
  `;
}

function renderWomenLookbookGrid(products) {
  if (!products.length) return `<div class="empty">No women watch styles are available in this section.</div>`;
  return `<div class="women-look-grid">${products.map(renderWomenLookCard).join("")}</div>`;
}

function renderWomenLookCard(product) {
  const images = imageListFor(product);
  const preview = images[0] || imageFor(product);
  const shown = images.slice(0, 1);
  const remaining = Math.max(images.length - shown.length, 0);
  return `
    <article class="women-look-card">
      <div class="women-look-main">
        <img data-women-main="${product.id}" src="${attr(preview)}" alt="${attr(product.name)}" loading="lazy" decoding="async" />
        <span>${images.length} photos</span>
      </div>
      <div class="women-look-body">
        <div>
          <p class="product-meta">${escapeHtml(product.specs?.collection || product.brand)}</p>
          <h3>${escapeHtml(product.name)}</h3>
          <p class="muted">${escapeHtml(product.description)}</p>
        </div>
        ${
          images.length > 1
            ? `<div class="women-option-strip" aria-label="${attr(product.name)} visible options">
                ${shown
                  .map(
                    (image, index) => `<button class="${index === 0 ? "active" : ""}" type="button" data-women-preview="${attr(image)}" data-women-target="${product.id}" aria-label="Show ${attr(product.name)} option ${index + 1}" aria-pressed="${index === 0}">
                      <img src="${attr(image)}" alt="" loading="lazy" decoding="async" />
                    </button>`,
                  )
                  .join("")}
                ${
                  remaining
                    ? `<button class="women-more-tile" type="button" data-product="${product.id}" aria-label="View ${remaining} more ${attr(product.name)} photos">
                        <strong>+${remaining}</strong><span>more</span>
                      </button>`
                    : ""
                }
              </div>`
            : ""
        }
        <div class="button-row">
          <button class="primary-button" data-product="${product.id}">View All Photos</button>
          <a class="secondary-button" href="https://wa.me/256750668419" target="_blank" rel="noreferrer">Ask Price</a>
        </div>
      </div>
    </article>
  `;
}

function brandsForCategory(category) {
  return [...new Set(state.products.filter((product) => product.category === category).map((product) => product.brand))].sort();
}

function filteredProducts(category) {
  return state.products.filter((product) => {
    const q = state.filters.q.toLowerCase();
    const matchesCategory = product.category === category;
    const matchesQ = !q || [product.name, product.brand, product.description].join(" ").toLowerCase().includes(q);
    const matchesBrand = state.filters.brand === "all" || product.brand === state.filters.brand;
    const matchesAvailability = state.filters.availability === "all" || product.stockStatus === state.filters.availability;
    const matchesMin = !state.filters.minPrice || product.price >= Number(state.filters.minPrice);
    const matchesMax = !state.filters.maxPrice || product.price <= Number(state.filters.maxPrice);
    return matchesCategory && matchesQ && matchesBrand && matchesAvailability && matchesMin && matchesMax;
  });
}

function renderFilters(category) {
  const brands = brandsForCategory(category);
  return `
    <div class="filters">
      <label class="field"><span>Search</span><input data-filter="q" value="${attr(state.filters.q)}" placeholder="Search products or brands" /></label>
      <label class="field"><span>Brand</span><select data-filter="brand">
        <option value="all">All brands</option>
        ${brands.map((brand) => `<option value="${attr(brand)}" ${state.filters.brand === brand ? "selected" : ""}>${escapeHtml(brand)}</option>`).join("")}
      </select></label>
      <label class="field"><span>Availability</span><select data-filter="availability">
        ${["all", "In Stock", "Low Stock", "Out of Stock"].map((option) => `<option value="${option}" ${state.filters.availability === option ? "selected" : ""}>${option === "all" ? "All stock" : option}</option>`).join("")}
      </select></label>
      <label class="field"><span>Min Price</span><input data-filter="minPrice" type="number" min="0" value="${attr(state.filters.minPrice)}" placeholder="UGX" /></label>
      <label class="field"><span>Max Price</span><input data-filter="maxPrice" type="number" min="0" value="${attr(state.filters.maxPrice)}" placeholder="UGX" /></label>
    </div>
  `;
}

function renderProductGrid(products, totalCount = products.length) {
  if (!products.length) return `<div class="empty">No products match this selection.</div>`;
  return `
    <div class="product-grid">${products.map(renderProductCard).join("")}</div>
    ${
      totalCount > products.length
        ? `<div class="catalog-more"><p class="muted">Showing ${products.length} of ${totalCount}</p><button class="secondary-button" data-load-more>Load More</button></div>`
        : ""
    }
  `;
}

function renderProductCard(product) {
  const out = product.stockStatus === "Out of Stock";
  const quoteOnly = Number(product.price || 0) <= 0;
  const readyJewelry = product.category === "jewelry" && product.specs?.collection === "Ready Jewelry";
  return `
    <article class="product-card">
      <div class="product-media">
        <img src="${attr(imageFor(product))}" alt="${attr(product.name)}" loading="lazy" decoding="async" />
        <span class="stock-badge ${stockClass(product)}">${escapeHtml(product.stockStatus)}</span>
      </div>
      <div class="product-body">
        <div>
          <p class="product-meta">${escapeHtml(product.brand)}</p>
          <h3>${escapeHtml(product.name)}</h3>
        </div>
        <strong class="price">${displayPrice(product)}</strong>
        ${renderVariantStrip(product)}
        <div class="button-row">
          <button class="secondary-button" data-product="${product.id}">${readyJewelry ? "Choose" : "View"}</button>
          ${
            out
              ? `<button class="primary-button" data-open-notify="${product.id}">Notify Me</button>`
              : quoteOnly
                ? `<button class="primary-button" data-view="contact">Enquire</button>`
              : `<button class="primary-button" data-add="${product.id}">Add to Cart</button>`
          }
        </div>
      </div>
    </article>
  `;
}

function renderCustomizerMockup(initial) {
  return `
    <div class="studio-turntable studio-three-shell" data-preview-turntable>
      <div class="studio3d-viewport" data-studio3d aria-label="Interactive 3D custom jewelry preview">
        <div class="studio3d-loading" data-studio3d-loading>Loading 3D Studio</div>
      </div>
      <span class="studio3d-help">Drag to rotate | Scroll to zoom</span>
      <span class="studio-surface-tag">3D Custom Studio</span>
    </div>
    <span class="plain-preview-note">Plain piece selected</span>
  `;
}

function renderCustomize() {
  const selected = state.jewelryChoice || {};
  const initial = customizerInitialState(selected);
  const showcase = [
    ["/assets/products/custom-jewelry/sept-2026/02-wrist-mode-custom-personalized-bar-necklace-and-pendant-collection-13.jpeg", "Bar necklace finishes"],
    ["/assets/products/custom-jewelry/sept-2026/01-wrist-mode-custom-engraved-bracelet-and-name-plate-sets-15.jpeg", "Engraved bracelet sets"],
    ["/assets/products/custom-jewelry/sept-2026/03-wrist-mode-custom-couple-broken-heart-pendant-sets-01.jpeg", "Couple pendant sets"],
    [`${customStudioAsset}dogtag-photo-single.png`, "Picture dog tag"],
    [`${customStudioAsset}name-script-butterfly.png`, "Name necklace"],
    [`${customStudioAsset}cuff-multi.png`, "Cuff bangle"],
  ];
  return `
    <section class="page-shell custom-page">
      <div class="custom-studio-intro">
        <div>
          <p class="eyebrow">Jewelry design studio</p>
          <h2>Build Your Custom Piece</h2>
          <p>Pick the jewelry type, choose the finish, add wording or a photo, then send the design request to Wrist Mode.</p>
        </div>
        <div class="studio-flow">
          <span><strong>01</strong> Pick Piece</span>
          <span><strong>02</strong> Preview</span>
          <span><strong>03</strong> Send Request</span>
        </div>
      </div>

      <div class="customizer-studio">
        <article class="surface live-preview-card">
          <div class="studio-panel-head">
            <div>
              <p class="eyebrow">Live preview</p>
              <h3 data-preview-title>${escapeHtml(initial.choice === "Keep Plain" ? `Plain ${initial.piece.label}` : `Custom ${initial.piece.label}`)}</h3>
            </div>
            <span data-preview-piece-name>${escapeHtml(initial.piece.shortLabel)}</span>
          </div>
          <div
            class="custom-preview-stage"
            data-custom-preview
            data-piece="${attr(initial.piece.id)}"
            data-surface="${attr(initial.piece.surface || "engraved")}"
            data-variant="${attr(initial.variant.id)}"
            data-finish="${attr(slugify(initial.finish))}"
            data-choice="${initial.choice === "Keep Plain" ? "plain" : "customize"}"
            data-side="${attr(slugify(initial.side))}"
            data-font="${attr(initial.font)}"
            style="--engraving-size:${initial.textSize}px;--engraving-x:${initial.textX}%;--engraving-y:${initial.textY}%;--studio-rotate-y:${initial.rotateY}deg"
          >
            ${renderCustomizerMockup(initial)}
          </div>
          <div class="preview-summary">
            <p class="muted" data-preview-copy>${escapeHtml(initial.piece.copy)}</p>
          </div>
        </article>

        <form class="surface custom-designer-form" id="customForm">
          <input type="hidden" name="selectedProduct" value="${attr(selected.productName || initial.piece.label)}" />
          <input type="hidden" name="jewelryType" value="${attr(initial.piece.label)}" required />
          <input type="hidden" name="designPiece" value="${attr(initial.piece.id)}" />
          <input type="hidden" name="designVariant" value="${attr(initial.variant.id)}" />

          <div class="designer-block">
            <div class="designer-block-head">
              <div>
                <p class="eyebrow">Piece</p>
                <h3>Choose jewelry</h3>
              </div>
            </div>
            <div class="design-piece-grid">
              ${customizerPieces
                .map(
                  (piece) => `<button class="design-piece-card ${piece.id === initial.piece.id ? "active" : ""}" type="button" data-design-piece="${attr(piece.id)}" aria-pressed="${piece.id === initial.piece.id}">
                    <img class="piece-thumb" src="${attr(mockupForPiece(piece, initial.finish, firstVariantFor(piece).id))}" alt="${attr(piece.label)}" loading="lazy" decoding="async" />
                    <strong>${escapeHtml(piece.shortLabel)}</strong>
                  </button>`,
                )
                .join("")}
            </div>
          </div>
          <div class="designer-block" data-variant-block ${initial.piece.variants?.length ? "" : "hidden"}>
            <div class="designer-block-head">
              <div>
                <p class="eyebrow">Style</p>
                <h3>Choose shape</h3>
              </div>
            </div>
            <div class="design-variant-grid" data-design-variants data-piece="${attr(initial.piece.id)}">
              ${renderDesignVariants(initial.piece, initial.variant.id)}
            </div>
          </div>

          <div class="designer-block">
            <div class="designer-block-head">
              <div>
                <p class="eyebrow">Design options</p>
                <h3>Finish and engraving</h3>
              </div>
            </div>
            <div class="form-grid studio-options-grid">
            <div class="field"><span>Choice</span><div class="choice-toggle">
              <label><input type="radio" name="choice" value="Keep Plain" data-custom-input ${initial.choice === "Keep Plain" ? "checked" : ""} /><strong>Keep Plain</strong></label>
              <label><input type="radio" name="choice" value="Customize" data-custom-input ${initial.choice !== "Keep Plain" ? "checked" : ""} /><strong>Customize</strong></label>
            </div></div>
            <div class="field"><span>Surface</span><div class="choice-toggle side-toggle">
              <label><input type="radio" name="side" value="Front" data-custom-input checked /><strong>Front</strong></label>
              <label><input type="radio" name="side" value="Back" data-custom-input /><strong>Back</strong></label>
              <label><input type="radio" name="side" value="Side 1" data-custom-input /><strong>Side 1</strong></label>
              <label><input type="radio" name="side" value="Side 2" data-custom-input /><strong>Side 2</strong></label>
            </div></div>
            <div class="field wide"><span>Finish</span><div class="swatches">
              ${finishes.map(([label, color], index) => `<label class="swatch"><input type="radio" name="finish" value="${label}" data-custom-input ${index === 0 ? "checked" : ""} /><i style="background:${color}"></i>${label}</label>`).join("")}
            </div></div>
            <label class="field"><span>Font</span><select name="designFont" data-custom-input>
              ${customizerFonts.map(([value, label]) => `<option value="${attr(value)}">${escapeHtml(label)}</option>`).join("")}
            </select></label>
            <label class="field"><span>Chain Style</span><select name="chainStyle" data-custom-input>
              <option>Fine Chain</option>
              <option>Curb Chain</option>
              <option>Rope Chain</option>
            </select></label>
            <label class="field"><span>Text Size</span><input name="textSize" type="range" min="18" max="64" value="${initial.textSize}" data-custom-input /></label>
            <label class="field"><span>3D Turn</span><input name="rotateY" type="range" min="-36" max="36" value="${initial.rotateY}" data-custom-input /></label>
            <label class="field photo-request-field" data-photo-request ${initial.piece.photo ? "" : "hidden"}><span>Picture For This Piece</span><input name="referenceImage" type="file" accept="image/*" data-photo-upload data-custom-input /><small>For photo pendants, picture dog tags, and keyholders, upload the exact photo the customer wants used.</small></label>
            <label class="field wide"><span>Name, Date, Photo or Message</span><textarea name="engraving" data-custom-input placeholder="Type the name, date, initials, photo idea, or short message.">${escapeHtml(initial.text)}</textarea></label>
            <label class="field"><span>Move Left or Right</span><input name="textX" type="range" min="25" max="75" value="${initial.textX}" data-custom-input /></label>
            <label class="field"><span>Move Up or Down</span><input name="textY" type="range" min="30" max="72" value="${initial.textY}" data-custom-input /></label>
            </div>
          </div>

          <div class="designer-block customer-details-block">
            <div class="designer-block-head">
              <div>
                <p class="eyebrow">Customer details</p>
                <h3>Send request</h3>
              </div>
            </div>
            <div class="form-grid studio-options-grid">
            <label class="field wide"><span>Special Notes</span><textarea name="notes" placeholder="Color preference, occasion, gift packaging, or delivery notes"></textarea></label>
            <label class="field"><span>Name</span><input name="name" required /></label>
            <label class="field"><span>Phone or WhatsApp</span><input name="phone" required /></label>
            <label class="field"><span>Email</span><input name="email" type="email" /></label>
            <label class="field"><span>Preferred Delivery Date</span><input name="deliveryDate" type="date" /></label>
            </div>
          </div>
          <div class="studio-submit-bar">
            <div>
              <p class="eyebrow">Wrist Mode quote</p>
              <strong>Submit design request</strong>
            </div>
            <button class="primary-button">Send to Wrist Mode</button>
          </div>
        </form>
      </div>

      <section class="custom-inspiration">
        <div class="section-head">
          <div>
            <p class="eyebrow">Custom examples</p>
            <h3>Finished Work Ideas</h3>
            <p>These show the kind of personal details customers can request after choosing a plain piece.</p>
          </div>
          <button class="secondary-button" data-view="jewelry">View Plain Jewelry</button>
        </div>
        <div class="custom-gallery">
          ${showcase.map(([image, label]) => `<figure><img src="${image}" alt="Wrist Mode ${label}" loading="lazy" decoding="async" /><figcaption>${label}</figcaption></figure>`).join("")}
        </div>
      </section>
    </section>
  `;
}

function renderAbout() {
  return `
    <section class="page-shell">
      <div class="split">
        <div>
          <p class="eyebrow">About Wrist Mode</p>
          <h2>Time, Style, Mode</h2>
          <p class="lead">Wrist Mode is built for people who want accessories that feel personal. The brand brings together stylish watches, clean jewelry pieces, and custom designs made around names, dates, initials, and meaningful moments.</p>
          <p class="muted">The goal is simple: make every watch, ring, chain, and pendant feel like part of the customer's identity.</p>
          <div class="button-row"><button class="primary-button" data-view="watches">Shop Watches</button><button class="secondary-button" data-view="customize">Start Custom Order</button></div>
        </div>
        <img class="surface" src="/assets/wrist-mode-logo.png" alt="Wrist Mode brand logo" />
      </div>
    </section>
  `;
}

function renderContact() {
  return `
    <section class="page-shell">
      <div class="section-head">
        <div>
          <p class="eyebrow">Contact</p>
          <h2>Talk to Wrist Mode</h2>
          <p>Reach out for orders, custom jewelry quotes, product availability, and delivery questions.</p>
        </div>
      </div>
      <div class="split">
        <div class="surface">
          <div class="mini-grid contact-grid">
            <div><p class="eyebrow">WhatsApp</p><h3>0750 668 419</h3></div>
            <div><p class="eyebrow">Phone</p><h3>0750 668 419<br />0782 102 005</h3></div>
            <div><p class="eyebrow">Email</p><h3>bugembemahad42@gmail.com</h3></div>
          </div>
          <div class="button-row" style="margin-top:1rem">
            <a class="primary-button" href="https://wa.me/256750668419" target="_blank" rel="noreferrer">WhatsApp</a>
            <button class="secondary-button" data-view="customize">Custom Request</button>
          </div>
        </div>
        <form class="surface" id="trackForm">
          <p class="eyebrow">Track</p>
          <h3>Track an Order or Custom Request</h3>
          <p class="muted">After checkout or a custom request, Wrist Mode gives you a tracking code. Enter that exact code here to see the current status.</p>
          <div class="track-help">
            <span>Order code: WM-12345678</span>
            <span>Custom code: WM-CUSTOM-1234567</span>
          </div>
          <label class="field"><span>Receipt or Request Code</span><input name="code" placeholder="Example: WM-12345678" required /></label>
          <div class="button-row" style="margin-top:1rem"><button class="primary-button">Track Order</button></div>
          <div id="trackResults" style="margin-top:1rem"></div>
        </form>
      </div>
    </section>
  `;
}

function renderFaq() {
  const items = [
    ["How does customization work?", "Choose a jewelry piece, select Keep Plain or Customize, add any names, dates, initials, photo idea, or message, then Wrist Mode replies with the next step."],
    ["How long does delivery take?", "Ready products can move quickly after confirmation. Custom pieces depend on design detail and availability."],
    ["Can I pay with mobile money?", "The checkout includes MTN Mobile Money, Airtel Money, card, and pay on delivery options. Live online payment requires provider credentials."],
    ["Can I be notified when stock returns?", "Out-of-stock product pages include a stock alert form for email or WhatsApp updates."],
  ];
  return `
    <section class="page-shell">
      <p class="eyebrow">FAQ</p>
      <h2>Common Questions</h2>
      <div class="orders-list">
        ${items.map(([title, copy]) => `<article class="surface"><h3>${escapeHtml(title)}</h3><p class="muted">${escapeHtml(copy)}</p></article>`).join("")}
      </div>
    </section>
  `;
}

function renderCart() {
  const items = cartItems();
  const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  cartCount.textContent = String(items.reduce((sum, item) => sum + item.quantity, 0));

  if (!items.length) {
    cartContent.innerHTML = `<div class="empty">Your cart is empty.</div>`;
    return;
  }

  cartContent.innerHTML = `
    <div>
      ${items.map(({ product, quantity }) => `
        <div class="cart-item">
          <img src="${attr(imageFor(product))}" alt="${attr(product.name)}" />
          <div>
            <strong>${escapeHtml(product.name)}</strong>
            <p class="muted">${formatMoney(product.price)}</p>
            <div class="qty">
              <button data-qty="${product.id}" data-step="-1">-</button>
              <strong>${quantity}</strong>
              <button data-qty="${product.id}" data-step="1">+</button>
            </div>
          </div>
          <button class="icon-button" data-remove="${product.id}" aria-label="Remove ${attr(product.name)}">x</button>
        </div>
      `).join("")}
    </div>
    <form id="checkoutForm" class="surface" style="margin-top:1rem">
      <p class="eyebrow">Total</p>
      <h3>${formatMoney(total)}</h3>
      <div class="form-grid">
        <label class="field wide"><span>Name</span><input name="name" required /></label>
        <label class="field wide"><span>Phone or WhatsApp</span><input name="phone" required /></label>
        <label class="field wide"><span>Email</span><input name="email" type="email" /></label>
        <label class="field wide"><span>Delivery Address</span><textarea name="address" required></textarea></label>
        <label class="field wide"><span>Payment</span><select name="paymentMethod">
          <option>MTN Mobile Money</option>
          <option>Airtel Money</option>
          <option>Card Payment</option>
          <option>Pay on Delivery</option>
        </select></label>
      </div>
      <div class="button-row" style="margin-top:1rem"><button class="primary-button">Place Order</button></div>
    </form>
  `;
}

function openProductModal(productId) {
  const product = state.products.find((item) => item.id === Number(productId));
  if (!product) return;
  const specs = Object.entries(product.specs || {});
  const out = product.stockStatus === "Out of Stock";
  const quoteOnly = Number(product.price || 0) <= 0;
  const images = imageListFor(product);
  const firstImage = images[0] || imageFor(product);
  const readyJewelry = product.category === "jewelry" && product.specs?.collection === "Ready Jewelry";

  modalRoot.innerHTML = `
    <div class="modal-backdrop" data-modal-close>
      <article class="modal" role="dialog" aria-modal="true" aria-label="${attr(product.name)}">
        <div class="modal-head"><button class="icon-button" data-modal-close>x</button></div>
        <div class="product-detail">
          <div class="detail-media">
            <div class="detail-image"><img data-detail-main src="${attr(firstImage)}" alt="${attr(product.name)}" /></div>
            ${
              images.length > 1
                ? `<div class="detail-option-bar">
                    <span data-detail-count>1 / ${images.length} photos</span>
                    <div class="detail-nav">
                      <button class="icon-button detail-arrow" type="button" data-detail-step="-1" aria-label="Previous photo" title="Previous photo">&lt;</button>
                      <button class="icon-button detail-arrow" type="button" data-detail-step="1" aria-label="Next photo" title="Next photo">&gt;</button>
                    </div>
                  </div>
                  <div class="detail-thumbs" aria-label="${attr(product.name)} photo options">${images
                    .map(
                      (image, index) => `<button class="detail-thumb ${index === 0 ? "active" : ""}" type="button" data-detail-image="${attr(image)}" data-detail-index="${index}" data-detail-alt="${attr(product.name)} option ${index + 1}" aria-label="View ${attr(product.name)} option ${index + 1}" aria-pressed="${index === 0}">
                        <img src="${attr(image)}" alt="${attr(product.name)} option ${index + 1}" loading="lazy" decoding="async" />
                      </button>`
                    )
                    .join("")}</div>`
                : ""
            }
          </div>
          <div>
            <p class="eyebrow">${escapeHtml(product.brand)}</p>
            <h2>${escapeHtml(product.name)}</h2>
            <p class="lead">${escapeHtml(product.description)}</p>
            <strong class="price">${displayPrice(product)}</strong>
            <p><span class="stock-badge ${stockClass(product)}" style="position:static;display:inline-block;margin-top:1rem">${escapeHtml(product.stockStatus)}</span></p>
            <ul class="spec-list">
              ${specs.map(([key, value]) => `<li><span>${escapeHtml(labelize(key))}</span><strong>${escapeHtml(value)}</strong></li>`).join("")}
            </ul>
            ${
              readyJewelry
                ? `<div class="jewelry-choice-panel">
                    <button class="choice-action" type="button" data-jewelry-choice="plain" data-jewelry-id="${product.id}">
                      <strong>Keep Plain</strong>
                      <span>Request this piece as it is.</span>
                    </button>
                    <button class="choice-action" type="button" data-jewelry-choice="customize" data-jewelry-id="${product.id}">
                      <strong>Customize This</strong>
                      <span>Add a name, date, initials, photo, or message.</span>
                    </button>
                  </div>`
                : `<div class="button-row">
                    ${out ? `<button class="primary-button" data-open-notify="${product.id}">Notify Me</button>` : quoteOnly ? `<button class="primary-button" data-view="contact">Enquire</button>` : `<button class="primary-button" data-add="${product.id}">Add to Cart</button>`}
                  </div>`
            }
          </div>
        </div>
      </article>
    </div>
  `;
}

function setDetailImage(control, index) {
  const modal = control.closest(".modal");
  if (!modal) return;
  const options = [...modal.querySelectorAll("[data-detail-image]")];
  if (!options.length) return;
  const nextIndex = ((index % options.length) + options.length) % options.length;
  const selected = options[nextIndex];
  const mainImage = modal.querySelector("[data-detail-main]");
  const count = modal.querySelector("[data-detail-count]");
  if (mainImage) {
    mainImage.src = selected.dataset.detailImage;
    mainImage.alt = selected.dataset.detailAlt || mainImage.alt;
  }
  options.forEach((option, optionIndex) => {
    const active = optionIndex === nextIndex;
    option.classList.toggle("active", active);
    option.setAttribute("aria-pressed", String(active));
  });
  if (count) count.textContent = `${nextIndex + 1} / ${options.length} photos`;
  selected.scrollIntoView({ block: "nearest", inline: "nearest" });
}

function setWomenPreview(control) {
  const targetId = control.dataset.womenTarget;
  const mainImage = document.querySelector(`[data-women-main="${targetId}"]`);
  if (!mainImage) return;
  mainImage.src = control.dataset.womenPreview;
  const strip = control.closest(".women-option-strip");
  strip?.querySelectorAll("button").forEach((button) => {
    const active = button === control;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

const custom3dTimers = new WeakMap();

function syncCustomStudio3D(form, options = {}) {
  if (!form) return;
  const delay = options.immediate ? 0 : options.delay ?? 140;
  const existingTimer = custom3dTimers.get(form);
  if (existingTimer) window.clearTimeout(existingTimer);

  if (!delay) {
    custom3dTimers.delete(form);
    window.WristModeStudio3D?.syncFromForm(form);
    return;
  }

  custom3dTimers.set(
    form,
    window.setTimeout(() => {
      custom3dTimers.delete(form);
      window.WristModeStudio3D?.syncFromForm(form);
    }, delay),
  );
}

function updateCustomPreview(form, options = {}) {
  if (!form) return;
  const studio = form.closest(".customizer-studio");
  const stage = studio?.querySelector("[data-custom-preview]");
  if (!stage) return;

  const piece = customizerPieces.find((item) => item.id === form.designPiece?.value) || customizerPieces[0];
  const variant = updateVariantControls(form, piece);
  const choice = form.querySelector('input[name="choice"]:checked')?.value || "Customize";
  const side = form.querySelector('input[name="side"]:checked')?.value || "Front";
  const finish = form.querySelector('input[name="finish"]:checked')?.value || "Gold";
  const font = form.designFont?.value || "serif";
  const engraving = form.engraving?.value.trim() || piece.placeholder;
  const textSize = Number(form.textSize?.value || 34);
  const textX = Number(form.textX?.value || 50);
  const textY = Number(form.textY?.value || 52);
  const rotateY = Number(form.rotateY?.value || 0);
  const isPlain = choice === "Keep Plain";

  if (form.jewelryType) form.jewelryType.value = piece.label;
  if (form.selectedProduct && !state.jewelryChoice?.productName) form.selectedProduct.value = piece.label;

  stage.dataset.piece = piece.id;
  stage.dataset.surface = piece.surface || "engraved";
  stage.dataset.variant = variant.id;
  stage.dataset.charm = variant.charm || "none";
  stage.dataset.finish = slugify(finish);
  stage.dataset.choice = isPlain ? "plain" : "customize";
  stage.dataset.side = slugify(side);
  stage.dataset.font = font;
  stage.dataset.photoPiece = piece.photo ? "true" : "false";
  stage.style.setProperty("--engraving-size", `${textSize}px`);
  stage.style.setProperty("--engraving-x", `${textX}%`);
  stage.style.setProperty("--engraving-y", `${textY}%`);
  stage.style.setProperty("--studio-rotate-y", `${rotateY}deg`);

  const text = stage.querySelector("[data-preview-text]");
  const nameText = stage.querySelector("[data-name-object-text]");
  const nameObject = stage.querySelector("[data-name-object]");
  const sideLabel = stage.querySelector("[data-preview-side]");
  const photo = stage.querySelector("[data-preview-photo]");
  const pieceName = studio.querySelector("[data-preview-piece-name]");
  const title = studio.querySelector("[data-preview-title]");
  const copy = studio.querySelector("[data-preview-copy]");
  const variantLabel = variant.label ? ` ${variant.label}` : "";
  if (text) text.textContent = isPlain ? "" : engraving;
  if (nameText) nameText.textContent = isPlain ? "" : engraving;
  if (nameObject) nameObject.dataset.nameCharm = variant.charm || "none";
  if (sideLabel) sideLabel.textContent = side;
  if (photo) {
    photo.src = mockupForPiece(piece, finish, variant.id);
    photo.alt = `${piece.label} ${variant.label || ""} mockup`.trim();
  }
  if (pieceName) pieceName.textContent = piece.shortLabel || piece.label;
  if (title) title.textContent = isPlain ? `Plain ${piece.label}` : `Custom ${piece.label}${variantLabel}`;
  if (copy) copy.textContent = piece.copy;

  const photoRequest = form.querySelector("[data-photo-request]");
  if (photoRequest) photoRequest.hidden = !piece.photo;
  syncCustomStudio3D(form, options);
}

function updateUploadedPhotoPreview(input) {
  const form = input.closest("#customForm");
  const stage = form?.closest(".customizer-studio")?.querySelector("[data-custom-preview]");
  const image = stage?.querySelector("[data-uploaded-photo]");
  const file = input.files?.[0];
  if (!stage || !file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const src = String(reader.result || "");
    if (image) image.src = src;
    stage.uploadedPhotoSrc = src;
    stage.dataset.hasUpload = src ? "true" : "false";
    syncCustomStudio3D(form, { immediate: true });
  };
  reader.readAsDataURL(file);
}

function openNotifyModal(productId) {
  const product = state.products.find((item) => item.id === Number(productId));
  if (!product) return;
  modalRoot.innerHTML = `
    <div class="modal-backdrop" data-modal-close>
      <article class="modal" role="dialog" aria-modal="true" aria-label="Stock alert">
        <div class="modal-head"><button class="icon-button" data-modal-close>x</button></div>
        <form class="surface" id="stockAlertForm">
          <input type="hidden" name="productId" value="${product.id}" />
          <p class="eyebrow">Stock alert</p>
          <h2>${escapeHtml(product.name)}</h2>
          <div class="form-grid">
            <label class="field"><span>Name</span><input name="name" required /></label>
            <label class="field"><span>Phone or WhatsApp</span><input name="phone" /></label>
            <label class="field wide"><span>Email</span><input name="email" type="email" /></label>
          </div>
          <div class="button-row" style="margin-top:1rem"><button class="primary-button">Save Alert</button></div>
        </form>
      </article>
    </div>
  `;
}

function labelize(value) {
  return String(value).replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase());
}

function addToCart(productId) {
  const product = state.products.find((item) => item.id === Number(productId));
  if (!product || product.quantity <= 0) return;
  if (Number(product.price || 0) <= 0) {
    toast("Please contact Wrist Mode for this product price.");
    return;
  }
  const existing = state.cart.find((item) => item.productId === product.id);
  if (existing) {
    existing.quantity = Math.min(existing.quantity + 1, product.quantity);
  } else {
    state.cart.push({ productId: product.id, quantity: 1 });
  }
  saveCart();
  toast(`${product.name} added to cart.`);
}

function changeQuantity(productId, step) {
  const product = state.products.find((item) => item.id === Number(productId));
  const item = state.cart.find((candidate) => candidate.productId === Number(productId));
  if (!item || !product) return;
  item.quantity += Number(step);
  if (item.quantity <= 0) {
    state.cart = state.cart.filter((candidate) => candidate.productId !== Number(productId));
  } else {
    item.quantity = Math.min(item.quantity, product.quantity);
  }
  saveCart();
}

function renderAdmin() {
  if (!state.admin.isAdmin) {
    return `
      <section class="page-shell">
        <div class="surface" style="max-width:520px;margin:auto">
          <p class="eyebrow">Admin</p>
          <h2>Wrist Mode Login</h2>
          <form id="adminLoginForm">
            <label class="field"><span>Password</span><input name="password" type="password" required /></label>
            <div class="button-row" style="margin-top:1rem"><button class="primary-button">Login</button></div>
          </form>
        </div>
      </section>
    `;
  }

  return `
    <section class="page-shell">
      <div class="section-head">
        <div>
          <p class="eyebrow">Admin Dashboard</p>
          <h2>Manage Wrist Mode</h2>
        </div>
        <button class="secondary-button" data-logout>Logout</button>
      </div>
      <div class="tabs">
        ${["overview", "products", "orders", "custom", "notifications"].map((tab) => `<button data-admin-tab="${tab}" class="${state.admin.tab === tab ? "active" : ""}">${labelize(tab)}</button>`).join("")}
      </div>
      ${renderAdminTab()}
    </section>
  `;
}

function renderAdminTab() {
  if (state.admin.tab === "products") return renderAdminProducts();
  if (state.admin.tab === "orders") return renderAdminOrders();
  if (state.admin.tab === "custom") return renderAdminCustom();
  if (state.admin.tab === "notifications") return renderAdminNotifications();
  return renderAdminOverview();
}

function renderAdminOverview() {
  const data = state.admin.analytics || {};
  return `
    <div class="analytics-grid">
      ${metric("Products", data.totalProducts)}
      ${metric("Orders", data.totalOrders)}
      ${metric("Revenue", formatMoney(data.revenue))}
      ${metric("Custom Requests", data.customRequests)}
      ${metric("Low Stock", data.lowStock)}
      ${metric("Out of Stock", data.outOfStock)}
    </div>
    <div class="surface" style="margin-top:1rem">
      <p class="eyebrow">Best sellers</p>
      ${
        data.bestSelling?.length
          ? data.bestSelling.map((item) => `<p><strong>${escapeHtml(item.name)}</strong> <span class="muted">${item.quantity} sold</span></p>`).join("")
          : '<p class="muted">No completed product sales yet.</p>'
      }
    </div>
  `;
}

function metric(label, value) {
  return `<article class="metric"><p class="eyebrow">${escapeHtml(label)}</p><strong>${value ?? 0}</strong></article>`;
}

function renderAdminProducts() {
  const editing = state.products.find((product) => product.id === state.editingProductId);
  const specs = editing?.specs || {};
  return `
    <div class="split admin-products-layout">
      <form class="surface" id="productForm">
        <p class="eyebrow">${editing ? "Edit product" : "Add product"}</p>
        <h3>${editing ? escapeHtml(editing.name) : "New Inventory"}</h3>
        <div class="form-grid">
          <label class="field"><span>Category</span><select name="category">
            <option value="watch" ${editing?.category === "watch" ? "selected" : ""}>Watch</option>
            <option value="women" ${editing?.category === "women" ? "selected" : ""}>Women Watch</option>
            <option value="wooden" ${editing?.category === "wooden" ? "selected" : ""}>Wooden Watch</option>
            <option value="jewelry" ${editing?.category === "jewelry" ? "selected" : ""}>Jewelry</option>
          </select></label>
          <label class="field"><span>Brand</span><input name="brand" value="${attr(editing?.brand || "")}" required /></label>
          <label class="field wide"><span>Name</span><input name="name" value="${attr(editing?.name || "")}" required /></label>
          <label class="field"><span>Price</span><input name="price" type="number" min="0" value="${attr(editing?.price || "")}" required /></label>
          <label class="field"><span>Stock Quantity</span><input name="quantity" type="number" min="0" value="${attr(editing?.quantity ?? "")}" required /></label>
          <label class="field"><span>Case Size</span><input name="caseSize" value="${attr(specs.caseSize || "")}" /></label>
          <label class="field"><span>Strap Material</span><input name="strapMaterial" value="${attr(specs.strapMaterial || "")}" /></label>
          <label class="field"><span>Movement Type</span><input name="movementType" value="${attr(specs.movementType || "")}" /></label>
          <label class="field"><span>Material</span><input name="material" value="${attr(specs.material || "")}" /></label>
          <label class="field"><span>Finish</span><input name="finish" value="${attr(specs.finish || "")}" /></label>
          <label class="field"><span>Size</span><input name="size" value="${attr(specs.size || "")}" /></label>
          <label class="field wide"><span>Description</span><textarea name="description">${escapeHtml(editing?.description || "")}</textarea></label>
          <label class="field wide"><span>Images</span><input name="images" type="file" accept="image/*" multiple /></label>
          <label class="swatch wide"><input type="checkbox" name="featured" ${editing?.featured ? "checked" : ""} /><i style="background:var(--gold)"></i> Featured product</label>
        </div>
        <input type="hidden" name="existingImages" value="${attr(JSON.stringify(editing?.images || []))}" />
        <div class="button-row" style="margin-top:1rem">
          <button class="primary-button">${editing ? "Update Product" : "Add Product"}</button>
          ${editing ? '<button type="button" class="secondary-button" data-cancel-edit>Cancel</button>' : ""}
        </div>
      </form>
      <div class="admin-list">
        ${state.products.map((product) => `
          <article class="admin-product">
            <img src="${attr(imageFor(product))}" alt="${attr(product.name)}" loading="lazy" decoding="async" />
            <div>
              <p class="product-meta">${escapeHtml(product.brand)} | ${escapeHtml(product.category)}</p>
              <h3>${escapeHtml(product.name)}</h3>
              <p>${displayPrice(product)} | ${product.quantity} in stock | ${escapeHtml(product.stockStatus)}</p>
            </div>
            <div class="admin-actions">
              <button class="secondary-button" data-edit-product="${product.id}">Edit</button>
              <button class="danger-button" data-delete-product="${product.id}">Delete</button>
            </div>
          </article>
        `).join("")}
      </div>
    </div>
  `;
}

function renderAdminOrders() {
  if (!state.admin.orders.length) return `<div class="empty">No standard orders yet.</div>`;
  return `
    <div class="orders-list">
      ${state.admin.orders.map((order) => `
        <article class="order-card" data-order-card="${order.id}">
          <div class="section-head">
            <div>
              <p class="eyebrow">${escapeHtml(order.receipt)}</p>
              <h3>${escapeHtml(order.customer.name || "Customer")} | ${formatMoney(order.total)}</h3>
              <p>${escapeHtml(order.paymentMethod)} | ${formatDate(order.createdAt)}</p>
            </div>
          </div>
          <div>
            ${order.items.map((item) => `<div class="line-item"><img src="${attr(item.image || "/assets/watch-hero.jpg")}" alt="" /><div><strong>${escapeHtml(item.name)}</strong><p class="muted">${item.quantity} x ${formatMoney(item.price)}</p></div></div>`).join("")}
          </div>
          <div class="status-row">
            <label class="field"><span>Status</span><select data-order-status>${statusOptions(order.status)}</select></label>
            <button class="primary-button" data-update-order="${order.id}">Update</button>
          </div>
        </article>
      `).join("")}
    </div>
  `;
}

function customDetail(label, value, extraClass = "") {
  const clean = String(value || "").trim();
  if (!clean) return "";
  return `
    <div class="custom-detail ${extraClass}">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(clean)}</strong>
    </div>
  `;
}

function renderCustomReference(custom) {
  if (!custom.referenceImage) {
    return `
      <div class="custom-reference empty-reference">
        <span>No photo uploaded</span>
      </div>
    `;
  }

  return `
    <a class="custom-reference" href="${attr(custom.referenceImage)}" target="_blank" rel="noopener">
      <img src="${attr(custom.referenceImage)}" alt="Customer reference upload for ${attr(custom.requestCode)}" loading="lazy" decoding="async" />
      <span>View full image</span>
    </a>
  `;
}

function renderAdminCustom() {
  if (!state.admin.customRequests.length) return `<div class="empty">No custom requests yet.</div>`;
  return `
    <div class="orders-list">
      ${state.admin.customRequests.map((custom) => {
        const details = custom.details || {};
        const customer = custom.customer || {};
        return `
        <article class="order-card custom-order-card" data-custom-card="${custom.id}">
          <div class="custom-request-layout">
            <div class="custom-request-main">
              <p class="eyebrow">${escapeHtml(custom.requestCode)}</p>
              <h3>${escapeHtml(customer.name || "Customer")} | ${escapeHtml(details.jewelryType || "Custom Jewelry")}</h3>
              <div class="custom-detail-grid">
                ${customDetail("Phone", customer.phone)}
                ${customDetail("Email", customer.email)}
                ${customDetail("Date Needed", customer.deliveryDate)}
                ${customDetail("Choice", details.choice || "Customize")}
                ${customDetail("Piece", details.designPiece)}
                ${customDetail("Style", details.designVariant)}
                ${customDetail("Finish", details.finish)}
                ${customDetail("Side", details.side || "Front")}
                ${customDetail("Font", details.designFont)}
                ${customDetail("Chain", details.chainStyle)}
                ${customDetail("Customer Wording", details.engraving, "wide")}
              </div>
              <div class="custom-notes">
                <span>Customer Notes</span>
                <p>${escapeHtml(details.notes || "No notes")}</p>
              </div>
              <p class="muted">Received ${formatDate(custom.createdAt)}</p>
            </div>
            ${renderCustomReference(custom)}
          </div>
          <div class="status-row">
            <label class="field"><span>Status</span><select data-custom-status>${statusOptions(custom.status)}</select></label>
            <label class="field"><span>Quote</span><input data-custom-quote type="number" value="${attr(custom.quoteAmount || "")}" /></label>
            <label class="field"><span>Message To Customer</span><textarea data-custom-message rows="2">${escapeHtml(custom.adminMessage || "")}</textarea></label>
            <button class="primary-button" data-update-custom="${custom.id}">Update</button>
          </div>
        </article>
      `;
      }).join("")}
    </div>
  `;
}

function renderAdminNotifications() {
  if (!state.admin.notifications.length) return `<div class="empty">No notifications yet.</div>`;
  return `
    <div class="orders-list">
      ${state.admin.notifications.map((note) => `
        <article class="surface">
          <p class="eyebrow">${escapeHtml(note.type)} | ${escapeHtml(note.channel)} | ${escapeHtml(note.status)}</p>
          <h3>${escapeHtml(note.recipient)}</h3>
          <p class="muted">${escapeHtml(note.message)}</p>
          <p class="muted">${formatDate(note.created_at)}</p>
        </article>
      `).join("")}
    </div>
  `;
}

function statusOptions(selected) {
  return orderStatuses.map((status) => `<option value="${status}" ${status === selected ? "selected" : ""}>${status}</option>`).join("");
}

function renderTrackResult(item) {
  const isCustom = item.type === "custom";
  const code = item.receipt || item.requestCode;
  const title = isCustom ? "Custom Jewelry Request" : "Shop Order";
  const detail = isCustom
    ? item.details?.jewelryType || "Custom jewelry"
    : `${formatMoney(item.total)}${item.paymentMethod ? ` | ${item.paymentMethod}` : ""}`;
  const message = isCustom && item.adminMessage ? item.adminMessage : isCustom ? "Wrist Mode will update the quote and production status from the admin dashboard." : "This status updates when the order is confirmed, prepared, and delivered.";
  return `
    <article class="track-result surface">
      <div>
        <p class="eyebrow">${escapeHtml(title)}</p>
        <h3>${escapeHtml(code)}</h3>
        <p class="muted">${escapeHtml(detail)}${item.createdAt ? ` | ${formatDate(item.createdAt)}` : ""}</p>
      </div>
      <span class="track-status">${escapeHtml(item.status)}</span>
      <p class="muted">${escapeHtml(message)}</p>
    </article>
  `;
}

async function handleSubmit(event) {
  const form = event.target;
  if (!(form instanceof HTMLFormElement)) return;

  if (form.id === "adminLoginForm") {
    event.preventDefault();
    await request("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: form.password.value }),
    });
    state.admin.isAdmin = true;
    await loadAdminData();
    render();
    toast("Admin login successful.");
  }

  if (form.id === "productForm") {
    event.preventDefault();
    const data = new FormData(form);
    const specs = {
      caseSize: data.get("caseSize"),
      strapMaterial: data.get("strapMaterial"),
      movementType: data.get("movementType"),
      material: data.get("material"),
      finish: data.get("finish"),
      size: data.get("size"),
    };
    data.set("specs", JSON.stringify(specs));
    data.set("featured", form.featured.checked ? "true" : "false");
    const url = state.editingProductId ? `/api/admin/products/${state.editingProductId}` : "/api/admin/products";
    const method = state.editingProductId ? "PUT" : "POST";
    const response = await fetch(url, { method, body: data });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Product save failed.");
    state.editingProductId = null;
    await refreshProducts();
    await loadAdminData();
    render();
    toast("Product saved.");
  }

  if (form.id === "checkoutForm") {
    event.preventDefault();
    const items = cartItems().map(({ product, quantity }) => ({ productId: product.id, quantity }));
    const payload = {
      items,
      paymentMethod: form.paymentMethod.value,
      customer: {
        name: form.name.value,
        phone: form.phone.value,
        email: form.email.value,
        address: form.address.value,
      },
    };
    const result = await request("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    state.cart = [];
    saveCart();
    await refreshProducts();
    render();
    toast(`Order confirmed. Receipt: ${result.receipt}`);
  }

  if (form.id === "customForm") {
    event.preventDefault();
    const response = await fetch("/api/custom-orders", { method: "POST", body: new FormData(form) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Custom request failed.");
    form.reset();
    state.jewelryChoice = null;
    render();
    toast(`Custom request sent. Code: ${result.requestCode}`);
  }

  if (form.id === "stockAlertForm") {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    await request("/api/stock-alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    modalRoot.innerHTML = "";
    toast("Stock alert saved.");
  }

  if (form.id === "trackForm") {
    event.preventDefault();
    const resultsEl = form.querySelector("#trackResults");
    const results = await request(`/api/track?code=${encodeURIComponent(form.code.value.trim())}`);
    resultsEl.innerHTML = results.length
      ? results.map(renderTrackResult).join("")
      : '<p class="muted">No matching order found. Check the code from your receipt, checkout message, or custom request confirmation.</p>';
  }
}

async function handleClick(event) {
  const target = event.target.closest("button, a, [data-modal-close], [data-cart-close]");
  if (!target) return;

  if (target.dataset.lookImage) {
    event.preventDefault();
    setLookBoard(target);
    return;
  }

  if (target.dataset.heroSlide !== undefined) {
    event.preventDefault();
    setHeroSlide(Number(target.dataset.heroSlide), { restart: true });
    return;
  }

  if (target.dataset.heroStep) {
    event.preventDefault();
    setHeroSlide(state.heroSlide + Number(target.dataset.heroStep), { restart: true });
    return;
  }

  if (target.dataset.womenPreview) {
    event.preventDefault();
    setWomenPreview(target);
    return;
  }

  if (target.dataset.designPiece) {
    event.preventDefault();
    const form = target.closest("#customForm");
    const piece = customizerPieces.find((item) => item.id === target.dataset.designPiece) || customizerPieces[0];
    const variant = firstVariantFor(piece);
    if (form?.designPiece) form.designPiece.value = piece.id;
    if (form?.designVariant) form.designVariant.value = variant.id;
    if (form?.jewelryType) form.jewelryType.value = piece.label;
    if (form?.selectedProduct) form.selectedProduct.value = piece.label;
    state.jewelryChoice = null;
    form?.querySelectorAll("[data-design-piece]").forEach((button) => {
      const active = button === target;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    updateCustomPreview(form, { immediate: true });
    return;
  }

  if (target.dataset.designVariant) {
    event.preventDefault();
    const form = target.closest("#customForm");
    if (form?.designVariant) form.designVariant.value = target.dataset.designVariant;
    form?.querySelectorAll("[data-design-variant]").forEach((button) => {
      const active = button === target;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    updateCustomPreview(form, { immediate: true });
    return;
  }

  if (target.dataset.jewelryChoice) {
    event.preventDefault();
    const product = state.products.find((item) => item.id === Number(target.dataset.jewelryId));
    state.jewelryChoice = {
      productId: product?.id || null,
      productName: product?.name || "",
      choice: target.dataset.jewelryChoice,
    };
    modalRoot.innerHTML = "";
    await setView("customize");
    return;
  }

  if (target.matches("[data-view]")) {
    event.preventDefault();
    state.jewelryChoice = null;
    modalRoot.innerHTML = "";
    await setView(target.dataset.view);
  }

  if (target.matches("[data-cart-toggle]")) document.body.classList.add("cart-open");
  if (target.matches("[data-cart-close]")) document.body.classList.remove("cart-open");
  if (target.matches("[data-modal-close]") && event.target === target) modalRoot.innerHTML = "";
  if (target.matches(".modal-head [data-modal-close]")) modalRoot.innerHTML = "";

  if (target.dataset.detailImage) {
    event.preventDefault();
    setDetailImage(target, Number(target.dataset.detailIndex || 0));
    return;
  }
  if (target.dataset.detailStep) {
    event.preventDefault();
    const modal = target.closest(".modal");
    const active = modal?.querySelector("[data-detail-image].active");
    setDetailImage(target, Number(active?.dataset.detailIndex || 0) + Number(target.dataset.detailStep || 0));
    return;
  }

  if (target.dataset.product) openProductModal(target.dataset.product);
  if (target.dataset.openNotify) openNotifyModal(target.dataset.openNotify);
  if (target.matches("[data-load-more]")) {
    state.catalogLimit += 24;
    render();
  }
  if (target.dataset.add) addToCart(target.dataset.add);
  if (target.dataset.remove) {
    state.cart = state.cart.filter((item) => item.productId !== Number(target.dataset.remove));
    saveCart();
  }
  if (target.dataset.qty) changeQuantity(target.dataset.qty, target.dataset.step);

  if (target.dataset.adminTab) {
    state.admin.tab = target.dataset.adminTab;
    await loadAdminData();
    render();
  }

  if (target.dataset.editProduct) {
    state.editingProductId = Number(target.dataset.editProduct);
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (target.matches("[data-cancel-edit]")) {
    state.editingProductId = null;
    render();
  }

  if (target.dataset.deleteProduct) {
    const product = state.products.find((item) => item.id === Number(target.dataset.deleteProduct));
    if (!confirm(`Delete ${product?.name || "this product"}?`)) return;
    await request(`/api/admin/products/${target.dataset.deleteProduct}`, { method: "DELETE" });
    await refreshProducts();
    await loadAdminData();
    render();
    toast("Product deleted.");
  }

  if (target.dataset.updateOrder) {
    const card = target.closest("[data-order-card]");
    const status = card.querySelector("[data-order-status]").value;
    await request(`/api/admin/orders/${target.dataset.updateOrder}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await loadAdminData();
    render();
    toast("Order updated.");
  }

  if (target.dataset.updateCustom) {
    const card = target.closest("[data-custom-card]");
    const payload = {
      status: card.querySelector("[data-custom-status]").value,
      quoteAmount: card.querySelector("[data-custom-quote]").value,
      adminMessage: card.querySelector("[data-custom-message]").value,
    };
    await request(`/api/admin/custom-requests/${target.dataset.updateCustom}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    await loadAdminData();
    render();
    toast("Custom request updated.");
  }

  if (target.matches("[data-logout]")) {
    await request("/api/admin/logout", { method: "POST" });
    state.admin.isAdmin = false;
    state.admin.tab = "overview";
    render();
    toast("Logged out.");
  }
}

function handleInput(event) {
  const customForm = event.target.closest("#customForm");
  if (customForm && event.target.matches("[data-custom-input]")) {
    const immediate = event.target.matches('select, input[type="radio"], input[type="file"]');
    const delay = event.target.matches("textarea, input[type='range']") ? 190 : 110;
    updateCustomPreview(customForm, { immediate, delay });
    if (event.target.matches("[data-photo-upload]")) updateUploadedPhotoPreview(event.target);
    return;
  }

  const field = event.target.closest("[data-filter]");
  if (!field) return;
  const filterName = field.dataset.filter;
  const cursor = typeof field.selectionStart === "number" ? field.selectionStart : null;
  state.filters[filterName] = field.value;
  state.catalogLimit = 24;
  render();
  const nextField = document.querySelector(`[data-filter="${filterName}"]`);
  if (nextField) {
    nextField.focus({ preventScroll: true });
    if (cursor !== null && nextField.type !== "number") {
      try {
        nextField.setSelectionRange(cursor, cursor);
      } catch {
        // Some input types do not support cursor restoration.
      }
    }
  }
}

window.addEventListener("submit", (event) => {
  handleSubmit(event).catch((error) => toast(error.message));
});

window.addEventListener("click", (event) => {
  handleClick(event).catch((error) => toast(error.message));
});

window.addEventListener("input", handleInput);
window.addEventListener("change", handleInput);

(async function init() {
  try {
    await Promise.all([refreshProducts(), checkAdminSession()]);
    if (state.admin.isAdmin) await loadAdminData();
    render();
  } catch (error) {
    appEl.innerHTML = `<section class="page-shell"><div class="empty">${escapeHtml(error.message)}</div></section>`;
  }
})();
