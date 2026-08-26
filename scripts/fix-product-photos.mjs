// Follow-up to add-product-photos.mjs: replaces a handful of mismatched or
// missing photos (picked after visually reviewing the first pass) with
// better Openverse matches.
// Run with: node --env-file=.env.local scripts/fix-product-photos.mjs
import { createClient } from "@sanity/client";

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-01-01",
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

// Manually reviewed replacements: { productName: searchUrlToLocate }
const fixes = {
  "Non-Stick Frying Pan": {
    query: "cooking pan skillet",
    matchUrl: "https://live.staticflickr.com/4842/47347731882_3ebbf82a62_b.jpg",
  },
  "Stainless Steel Cookware Set": {
    query: "pot and pan set kitchen",
    matchUrl: "https://live.staticflickr.com/2077/2272836837_b01a66295b.jpg",
  },
  "Building Blocks Set (200 pcs)": {
    query: "colorful building blocks toy",
    matchUrl: "https://live.staticflickr.com/33/49012397_1fbe7855e3_b.jpg",
  },
  "Hydrating Facial Serum": {
    query: "skincare serum dropper bottle",
    matchUrl:
      "https://images.rawpixel.com/editor_1024/cHJpdmF0ZS9sci9pbWFnZXMvd2Vic2l0ZS8yMDIzLTA0L2JzMjMzLWltYWdlLmpwZw.jpg",
  },
  "Argan Oil Hair Mask": {
    query: "skincare jar cream",
    matchUrl: "https://live.staticflickr.com/65535/53145443465_d2980b11d7_b.jpg",
  },
  "Women's Slim Fit Jeans": {
    query: "blue denim jeans pants",
    matchUrl: "https://live.staticflickr.com/5123/5333455565_b73baaf9af_b.jpg",
  },
  "Yoga Mat with Carrying Strap": {
    query: "rolled yoga mat",
    matchUrl:
      "https://images.rawpixel.com/editor_1024/cHJpdmF0ZS9sci9pbWFnZXMvd2Vic2l0ZS8yMDIzLTA0L2JzNjAxLWltYWdlLmpwZw.jpg",
  },
};

async function findResult(query, matchUrl) {
  const url = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(
    query,
  )}&license_type=commercial&mature=false&page_size=20`;
  const res = await fetch(url, { headers: { "User-Agent": "e-store-app-seed-script/1.0" } });
  const data = await res.json();
  return (data.results ?? []).find((r) => r.url === matchUrl) ?? null;
}

async function downloadImage(url) {
  const res = await fetch(url, { headers: { "User-Agent": "e-store-app-seed-script/1.0" } });
  if (!res.ok) throw new Error(`Image download failed (${res.status}): ${url}`);
  const contentType = res.headers.get("content-type") ?? "image/jpeg";
  const buffer = Buffer.from(await res.arrayBuffer());
  return { buffer, contentType };
}

const products = await client.fetch(
  `*[_type == "product" && name in $names]{ _id, name }`,
  { names: Object.keys(fixes) },
);
const productByName = Object.fromEntries(products.map((p) => [p.name, p]));

const attributions = [];

for (const [name, { query, matchUrl }] of Object.entries(fixes)) {
  const product = productByName[name];
  if (!product) {
    console.log(`product not found: ${name}`);
    continue;
  }
  const best = await findResult(query, matchUrl);
  if (!best) {
    console.log(`result no longer available: ${name}`);
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

  console.log(`updated: ${name} <- "${best.title}" (${best.license})`);
  attributions.push({
    product: name,
    title: best.title,
    creator: best.creator,
    creatorUrl: best.creator_url,
    license: best.license,
    licenseVersion: best.license_version,
    licenseUrl: best.license_url,
    source: best.foreign_landing_url,
  });

  await new Promise((r) => setTimeout(r, 300));
}

const fs = await import("node:fs/promises");
const existing = await fs
  .readFile("docs/product-image-attributions.md", "utf-8")
  .catch(() => "");

const lines = ["", "## Fix-up pass (replaced mismatched photos)", ""];
for (const a of attributions) {
  lines.push(`### ${a.product}`);
  lines.push(
    `"${a.title}" by [${a.creator}](${a.creatorUrl}), licensed under ${a.license.toUpperCase()}${
      a.licenseVersion ? ` ${a.licenseVersion}` : ""
    }${a.licenseUrl ? ` (${a.licenseUrl})` : ""}. Source: ${a.source}`,
  );
  lines.push("");
}

await fs.writeFile(
  "docs/product-image-attributions.md",
  existing + lines.join("\n") + "\n",
);
console.log(`\ndone. ${attributions.length} fixed.`);
