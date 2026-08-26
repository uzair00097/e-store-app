// Follow-up to add-category-photos.mjs: fills in the 3 categories that had
// no usable result on the first pass, and replaces 2 more whose matched
// photo turned out irrelevant after visual review (a fashion-event portrait
// series for "Accessories", a 3D-rendered virtual room for "Clothing &
// Apparel"). Openverse rate-limits quick bursts of requests (Cloudflare
// challenge), so this paces one search at a time with a delay.
// Run with: node --env-file=.env.local scripts/fix-category-photos.mjs
import { createClient } from "@sanity/client";

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-01-01",
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

// Manually reviewed replacements/fills.
const fixes = {
  Electronics: {
    query: "electronics devices flat lay",
    matchUrl: "https://live.staticflickr.com/65535/49106607223_56577b904c_b.jpg",
  },
  "Beauty & Personal Care": {
    query: "cosmetics makeup flat lay",
    matchUrl: "https://live.staticflickr.com/65535/49774909951_221fd2cdc9_b.jpg",
  },
  "Sports & Outdoors": {
    query: "hiking backpack camping gear",
    matchUrl: "https://live.staticflickr.com/2393/2411209978_d5e8c5f187_b.jpg",
  },
  Accessories: {
    query: "handbag sunglasses watch flat lay",
    matchUrl:
      "https://images.rawpixel.com/editor_1024/cHJpdmF0ZS9sci9pbWFnZXMvd2Vic2l0ZS8yMDIyLTA4L25zMzQwMy1pbWFnZS5qcGc.jpg",
  },
  "Clothing & Apparel": {
    query: "clothing rack boutique store",
    matchUrl: "https://live.staticflickr.com/65535/49174901528_6c8cfa013f_b.jpg",
  },
};

async function findResult(query, matchUrl) {
  const url = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(
    query,
  )}&license_type=commercial&mature=false&page_size=10`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 e-store-app-seed-script/1.0" },
  });
  if (!res.ok) throw new Error(`Openverse search failed (${res.status})`);
  const data = await res.json();
  return (data.results ?? []).find((r) => r.url === matchUrl) ?? null;
}

async function downloadImage(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 e-store-app-seed-script/1.0" },
  });
  if (!res.ok) throw new Error(`Image download failed (${res.status}): ${url}`);
  const contentType = res.headers.get("content-type") ?? "image/jpeg";
  const buffer = Buffer.from(await res.arrayBuffer());
  return { buffer, contentType };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const categories = await client.fetch(
  `*[_type == "category" && name in $names]{ _id, name }`,
  { names: Object.keys(fixes) },
);
const categoryByName = Object.fromEntries(categories.map((c) => [c.name, c]));

const attributions = [];

for (const [name, { query, matchUrl }] of Object.entries(fixes)) {
  const category = categoryByName[name];
  if (!category) {
    console.log(`category not found: ${name}`);
    continue;
  }

  const best = await findResult(query, matchUrl);
  if (!best) {
    console.log(`result no longer available: ${name}`);
    await sleep(8000);
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

  console.log(`updated: ${name} <- "${best.title}" (${best.license})`);
  attributions.push({
    category: name,
    title: best.title,
    creator: best.creator,
    creatorUrl: best.creator_url,
    license: best.license,
    licenseVersion: best.license_version,
    licenseUrl: best.license_url,
    source: best.foreign_landing_url,
  });

  await sleep(8000);
}

const fs = await import("node:fs/promises");
const existing = await fs
  .readFile("docs/product-image-attributions.md", "utf-8")
  .catch(() => "");
const lines = ["", "## Category photo fix-up pass", ""];
for (const a of attributions) {
  lines.push(`### ${a.category}`);
  lines.push(
    `"${a.title}"${a.creator ? ` by [${a.creator}](${a.creatorUrl})` : ""}, licensed under ${a.license.toUpperCase()}${
      a.licenseVersion ? ` ${a.licenseVersion}` : ""
    }${a.licenseUrl ? ` (${a.licenseUrl})` : ""}. Source: ${a.source}`,
  );
  lines.push("");
}
await fs.writeFile("docs/product-image-attributions.md", existing + lines.join("\n") + "\n");
console.log(`\ndone. ${attributions.length} updated.`);
