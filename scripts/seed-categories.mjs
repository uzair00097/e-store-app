// One-off seed script: creates the initial Category documents in Sanity.
// Run with: node --env-file=.env.local scripts/seed-categories.mjs
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

const categories = [
  { name: "Electronics", description: "Phones, laptops, audio, and gadgets." },
  { name: "Clothing & Apparel", description: "Everyday and seasonal wear for all ages." },
  { name: "Home & Kitchen", description: "Furniture, decor, cookware, and appliances." },
  { name: "Beauty & Personal Care", description: "Skincare, haircare, and grooming essentials." },
  { name: "Sports & Outdoors", description: "Fitness gear, camping, and outdoor equipment." },
  { name: "Books & Stationery", description: "Books, notebooks, and office supplies." },
  { name: "Toys & Games", description: "Toys, puzzles, and games for all ages." },
  { name: "Accessories", description: "Bags, jewelry, watches, and everyday carry." },
];

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

for (const category of categories) {
  const slug = slugify(category.name);
  const existing = await client.fetch(
    `*[_type == "category" && slug.current == $slug][0]._id`,
    { slug },
  );
  if (existing) {
    console.log(`skip (exists): ${category.name}`);
    continue;
  }
  const doc = await client.create({
    _type: "category",
    name: category.name,
    slug: { _type: "slug", current: slug },
    description: category.description,
  });
  console.log(`created: ${category.name} (${doc._id})`);
}
