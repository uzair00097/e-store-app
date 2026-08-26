// One-off seed script: creates sample Product documents (with placeholder
// SVG images) for each existing Category.
// Run with: node --env-file=.env.local scripts/seed-products.mjs
import { createClient } from "@sanity/client";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-01-01";
const token = process.env.SANITY_API_TOKEN;

if (!projectId || !token) {
  throw new Error(
    "Missing NEXT_PUBLIC_SANITY_PROJECT_ID or SANITY_API_TOKEN in .env.local",
  );
}

const client = createClient({
  projectId,
  dataset,
  apiVersion,
  token,
  useCdn: false,
});

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const productsByCategory = {
  Electronics: {
    color: "#2563eb",
    items: [
      { name: "Wireless Bluetooth Headphones", price: 59.99, stock: 40, description: "Over-ear headphones with 30-hour battery life and active noise cancellation." },
      { name: "Smart Fitness Watch", price: 89.99, stock: 25, description: "Tracks heart rate, sleep, and workouts with a 7-day battery life." },
      { name: "65W USB-C Fast Charger", price: 24.99, stock: 100, description: "Compact GaN charger that fast-charges phones and laptops alike." },
    ],
  },
  "Clothing & Apparel": {
    color: "#db2777",
    items: [
      { name: "Men's Classic Cotton T-Shirt", price: 19.99, stock: 150, description: "Breathable 100% cotton tee available in everyday colors." },
      { name: "Women's Slim Fit Jeans", price: 39.99, stock: 80, description: "Stretch denim with a flattering slim fit and mid-rise waist." },
      { name: "Unisex Fleece Hoodie", price: 34.99, stock: 60, description: "Soft fleece-lined hoodie for cool-weather layering." },
    ],
  },
  "Home & Kitchen": {
    color: "#059669",
    items: [
      { name: "Stainless Steel Cookware Set", price: 79.99, stock: 30, description: "10-piece cookware set with tempered glass lids." },
      { name: "Non-Stick Frying Pan", price: 22.99, stock: 70, description: "12-inch non-stick pan safe for all stovetops." },
      { name: "Electric Kettle 1.7L", price: 27.99, stock: 50, description: "Fast-boiling kettle with auto shut-off and boil-dry protection." },
    ],
  },
  "Beauty & Personal Care": {
    color: "#d946ef",
    items: [
      { name: "Hydrating Facial Serum", price: 18.99, stock: 90, description: "Lightweight serum with hyaluronic acid for daily hydration." },
      { name: "Natural Bamboo Toothbrush Set", price: 9.99, stock: 200, description: "Pack of 4 biodegradable bamboo toothbrushes." },
      { name: "Argan Oil Hair Mask", price: 14.99, stock: 120, description: "Deep-conditioning hair mask for dry and damaged hair." },
    ],
  },
  "Sports & Outdoors": {
    color: "#ea580c",
    items: [
      { name: "Adjustable Dumbbell Set", price: 129.99, stock: 20, description: "Space-saving dumbbells adjustable from 5 to 25 lbs per hand." },
      { name: "Yoga Mat with Carrying Strap", price: 24.99, stock: 85, description: "Non-slip 6mm yoga mat with a lightweight carry strap." },
      { name: "2-Person Camping Tent", price: 99.99, stock: 15, description: "Weatherproof tent that sets up in under 5 minutes." },
    ],
  },
  "Books & Stationery": {
    color: "#7c3aed",
    items: [
      { name: "Hardcover Ruled Notebook (A5)", price: 8.99, stock: 200, description: "192-page ruled notebook with a durable hardcover." },
      { name: "Gel Pen Set (12-Pack)", price: 6.99, stock: 300, description: "Smooth-writing gel pens in assorted colors." },
      { name: "Leather Journal Diary", price: 15.99, stock: 75, description: "Refillable leather-bound journal with a magnetic clasp." },
    ],
  },
  "Toys & Games": {
    color: "#f59e0b",
    items: [
      { name: "500-Piece Jigsaw Puzzle", price: 12.99, stock: 60, description: "Family-friendly puzzle featuring a scenic landscape." },
      { name: "Building Blocks Set (200 pcs)", price: 29.99, stock: 45, description: "Creative building blocks compatible with major brands." },
      { name: "Classic Wooden Chess Set", price: 19.99, stock: 55, description: "Folding wooden chess board with hand-carved pieces." },
    ],
  },
  Accessories: {
    color: "#0891b2",
    items: [
      { name: "Genuine Leather Wallet", price: 24.99, stock: 100, description: "Slim bifold wallet with RFID-blocking card slots." },
      { name: "Stainless Steel Analog Watch", price: 49.99, stock: 40, description: "Minimalist watch with a stainless steel mesh band." },
      { name: "Canvas Tote Bag", price: 17.99, stock: 90, description: "Durable canvas tote for everyday errands." },
    ],
  },
};

function placeholderSvg(name, color) {
  const escaped = name.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800">
  <rect width="800" height="800" fill="${color}"/>
  <text x="400" y="400" font-family="sans-serif" font-size="36" fill="white"
    text-anchor="middle" dominant-baseline="middle">${escaped}</text>
</svg>`;
}

async function uploadPlaceholderImage(name, color) {
  const svg = placeholderSvg(name, color);
  const buffer = Buffer.from(svg, "utf-8");
  const asset = await client.assets.upload("image", buffer, {
    filename: `${slugify(name)}.svg`,
    contentType: "image/svg+xml",
  });
  return asset._id;
}

const categories = await client.fetch(
  `*[_type == "category"]{ _id, name }`,
);
const categoryByName = Object.fromEntries(categories.map((c) => [c.name, c._id]));

for (const [categoryName, { color, items }] of Object.entries(productsByCategory)) {
  const categoryId = categoryByName[categoryName];
  if (!categoryId) {
    console.log(`skip category (not found): ${categoryName}`);
    continue;
  }

  for (const item of items) {
    const slug = slugify(item.name);
    const existing = await client.fetch(
      `*[_type == "product" && slug.current == $slug][0]._id`,
      { slug },
    );
    if (existing) {
      console.log(`skip (exists): ${item.name}`);
      continue;
    }

    const assetId = await uploadPlaceholderImage(item.name, color);
    const doc = await client.create({
      _type: "product",
      name: item.name,
      slug: { _type: "slug", current: slug },
      description: item.description,
      price: item.price,
      stock: item.stock,
      category: { _type: "reference", _ref: categoryId },
      images: [
        {
          _type: "image",
          _key: crypto.randomUUID(),
          asset: { _type: "reference", _ref: assetId },
        },
      ],
    });
    console.log(`created: ${item.name} [${categoryName}] (${doc._id})`);
  }
}
