// One-off script: adds a real, openly-licensed photo (via the Openverse API,
// see add-product-photos.mjs for why) to each existing Category that doesn't
// have one yet.
// Run with: node --env-file=.env.local scripts/add-category-photos.mjs
import { createClient } from "@sanity/client";

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-01-01",
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

const searchQueryByCategory = {
  Electronics: "consumer electronics gadgets flat lay",
  "Clothing & Apparel": "clothing rack fashion store",
  "Home & Kitchen": "kitchen cookware home decor",
  "Beauty & Personal Care": "beauty skincare cosmetics flat lay",
  "Sports & Outdoors": "sports outdoor gear equipment",
  "Books & Stationery": "books stationery desk",
  "Toys & Games": "colorful toys games",
  Accessories: "fashion accessories bag watch jewelry",
};

const PREFERRED_LICENSE_ORDER = ["cc0", "pdm", "by", "by-sa"];

async function searchOpenverse(query) {
  const url = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(
    query,
  )}&license_type=commercial&mature=false&page_size=20&aspect_ratio=wide,square`;
  const res = await fetch(url, {
    headers: { "User-Agent": "e-store-app-seed-script/1.0" },
  });
  if (!res.ok) throw new Error(`Openverse search failed (${res.status}): ${query}`);
  const data = await res.json();
  return data.results ?? [];
}

function pickBestResult(results) {
  const usable = results.filter(
    (r) => r.url && r.width >= 600 && r.height >= 400 && !r.mature,
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

const categories = await client.fetch(`*[_type == "category"]{ _id, name }`);
const attributions = [];
const skipped = [];

for (const category of categories) {
  const query = searchQueryByCategory[category.name] ?? category.name;
  try {
    const results = await searchOpenverse(query);
    const best = pickBestResult(results);
    if (!best) {
      console.log(`no usable result: ${category.name} (query: "${query}")`);
      skipped.push(category.name);
      continue;
    }

    const { buffer, contentType } = await downloadImage(best.url);
    const asset = await client.assets.upload("image", buffer, {
      filename: `${category._id}.${contentType.split("/")[1] ?? "jpg"}`,
      contentType,
    });

    await client
      .patch(category._id)
      .set({ image: { _type: "image", asset: { _type: "reference", _ref: asset._id } } })
      .commit();

    console.log(`updated: ${category.name} <- "${best.title}" (${best.license}) | ${best.url}`);
    attributions.push({
      category: category.name,
      title: best.title,
      creator: best.creator,
      creatorUrl: best.creator_url,
      license: best.license,
      licenseVersion: best.license_version,
      licenseUrl: best.license_url,
      source: best.foreign_landing_url,
    });
  } catch (err) {
    console.log(`error: ${category.name}: ${err.message}`);
    skipped.push(category.name);
  }

  await sleep(300);
}

const lines = ["", "## Category photos", ""];
for (const a of attributions) {
  lines.push(`### ${a.category}`);
  lines.push(
    `"${a.title}"${a.creator ? ` by [${a.creator}](${a.creatorUrl})` : ""}, licensed under ${a.license.toUpperCase()}${
      a.licenseVersion ? ` ${a.licenseVersion}` : ""
    }${a.licenseUrl ? ` (${a.licenseUrl})` : ""}. Source: ${a.source}`,
  );
  lines.push("");
}
if (skipped.length > 0) {
  lines.push("## Categories not updated (no usable result found)");
  for (const name of skipped) lines.push(`- ${name}`);
}

const fs = await import("node:fs/promises");
const existing = await fs
  .readFile("docs/product-image-attributions.md", "utf-8")
  .catch(() => "# Product photo attributions\n");
await fs.writeFile("docs/product-image-attributions.md", existing + lines.join("\n") + "\n");
console.log(`\ndone. ${attributions.length} updated, ${skipped.length} skipped.`);
