// One-off script: replaces each existing Product's placeholder SVG image
// with a real, openly-licensed photo found via the Openverse API
// (https://api.openverse.org) -- an aggregator of CC0/CC-BY/CC-BY-SA
// licensed images from Wikimedia Commons, Flickr, etc. This avoids scraping
// Google Images, which has no reliable API and returns images of unknown/
// unclear copyright status.
//
// Run with: node --env-file=.env.local scripts/add-product-photos.mjs
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

// Short, photo-friendly search terms -- product names like "65W USB-C Fast
// Charger" or "500-Piece Jigsaw Puzzle" are too specific for stock-photo
// search, so map each to a simpler query.
const searchQueryByProduct = {
  "Wireless Bluetooth Headphones": "wireless headphones",
  "Smart Fitness Watch": "fitness smartwatch",
  "65W USB-C Fast Charger": "usb-c charger",
  "Men's Classic Cotton T-Shirt": "mens t-shirt",
  "Women's Slim Fit Jeans": "womens jeans",
  "Unisex Fleece Hoodie": "hoodie",
  "Stainless Steel Cookware Set": "stainless steel cookware",
  "Non-Stick Frying Pan": "frying pan",
  "Electric Kettle 1.7L": "electric kettle",
  "Hydrating Facial Serum": "facial serum bottle",
  "Natural Bamboo Toothbrush Set": "bamboo toothbrush",
  "Argan Oil Hair Mask": "hair mask jar",
  "Adjustable Dumbbell Set": "adjustable dumbbells",
  "Yoga Mat with Carrying Strap": "yoga mat",
  "2-Person Camping Tent": "camping tent",
  "Hardcover Ruled Notebook (A5)": "hardcover notebook",
  "Gel Pen Set (12-Pack)": "gel pens",
  "Leather Journal Diary": "leather journal",
  "500-Piece Jigsaw Puzzle": "jigsaw puzzle",
  "Building Blocks Set (200 pcs)": "building blocks toy",
  "Classic Wooden Chess Set": "wooden chess set",
  "Genuine Leather Wallet": "leather wallet",
  "Stainless Steel Analog Watch": "analog wristwatch",
  "Canvas Tote Bag": "canvas tote bag",
};

const PREFERRED_LICENSE_ORDER = ["cc0", "pdm", "by", "by-sa"];

async function searchOpenverse(query) {
  const url = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(
    query,
  )}&license_type=commercial&mature=false&page_size=20`;
  const res = await fetch(url, {
    headers: { "User-Agent": "e-store-app-seed-script/1.0" },
  });
  if (!res.ok) throw new Error(`Openverse search failed (${res.status}): ${query}`);
  const data = await res.json();
  return data.results ?? [];
}

function pickBestResult(results) {
  const usable = results.filter(
    (r) => r.url && r.width >= 500 && r.height >= 500 && !r.mature,
  );
  for (const license of PREFERRED_LICENSE_ORDER) {
    const match = usable.find((r) => r.license === license);
    if (match) return match;
  }
  return usable[0] ?? null;
}

async function downloadImage(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "e-store-app-seed-script/1.0" },
  });
  if (!res.ok) throw new Error(`Image download failed (${res.status}): ${url}`);
  const contentType = res.headers.get("content-type") ?? "image/jpeg";
  const buffer = Buffer.from(await res.arrayBuffer());
  return { buffer, contentType };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const products = await client.fetch(`*[_type == "product"]{ _id, name }`);
const attributions = [];
const skipped = [];

for (const product of products) {
  const query = searchQueryByProduct[product.name] ?? product.name;
  try {
    const results = await searchOpenverse(query);
    const best = pickBestResult(results);
    if (!best) {
      console.log(`no usable result: ${product.name} (query: "${query}")`);
      skipped.push(product.name);
      continue;
    }

    const { buffer, contentType } = await downloadImage(best.url);
    const asset = await client.assets.upload("image", buffer, {
      filename: `${product._id}.${contentType.split("/")[1] ?? "jpg"}`,
      contentType,
    });

    await client
      .patch(product._id)
      .set({
        images: [
          {
            _type: "image",
            _key: crypto.randomUUID(),
            asset: { _type: "reference", _ref: asset._id },
          },
        ],
      })
      .commit();

    console.log(`updated: ${product.name} <- "${best.title}" (${best.license})`);
    attributions.push({
      product: product.name,
      title: best.title,
      creator: best.creator,
      creatorUrl: best.creator_url,
      license: best.license,
      licenseVersion: best.license_version,
      licenseUrl: best.license_url,
      source: best.foreign_landing_url,
    });
  } catch (err) {
    console.log(`error: ${product.name}: ${err.message}`);
    skipped.push(product.name);
  }

  await sleep(300);
}

const lines = [
  "# Product photo attributions",
  "",
  "Seed-data product photos sourced via the [Openverse API](https://api.openverse.org),",
  "which indexes openly-licensed images (CC0, public domain, CC BY, CC BY-SA) from",
  "providers like Wikimedia Commons and Flickr. Kept here to satisfy CC BY / CC BY-SA",
  "attribution requirements for any non-CC0 photo below.",
  "",
];
for (const a of attributions) {
  lines.push(`## ${a.product}`);
  lines.push(
    `"${a.title}" by [${a.creator}](${a.creatorUrl}), licensed under ${a.license.toUpperCase()}${
      a.licenseVersion ? ` ${a.licenseVersion}` : ""
    }${a.licenseUrl ? ` (${a.licenseUrl})` : ""}. Source: ${a.source}`,
  );
  lines.push("");
}
if (skipped.length > 0) {
  lines.push("## Not updated (no usable result found)");
  for (const name of skipped) lines.push(`- ${name}`);
}

const fs = await import("node:fs/promises");
await fs.writeFile("docs/product-image-attributions.md", lines.join("\n") + "\n");
console.log(`\ndone. ${attributions.length} updated, ${skipped.length} skipped.`);
