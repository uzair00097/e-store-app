import { randomUUID } from "crypto";

import { client } from "@/lib/sanity/client";
import { writeClient } from "@/lib/sanity/write-client";
import { slugify } from "@/lib/slug";
import type { SanityImage } from "@/types/sanity";

export interface AdminProductListItem {
  _id: string;
  name: string;
  slug: string;
  price: number;
  stock: number;
  image: SanityImage | null;
  category: { _id: string; name: string } | null;
}

export interface AdminProductImage extends SanityImage {
  _key: string;
}

export interface AdminProductDetail {
  _id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  stock: number;
  images: AdminProductImage[];
  category: { _id: string; name: string } | null;
}

const adminProductListProjection = `{
  _id,
  name,
  "slug": slug.current,
  price,
  stock,
  "image": images[0],
  "category": category->{ _id, name }
}`;

// writeClient (useCdn: false) rather than the storefront read client, so
// the admin list/detail views never show CDN-stale data right after a
// mutation.
export async function listProductsAdmin() {
  return writeClient.fetch<AdminProductListItem[]>(
    `*[_type == "product"] | order(_createdAt desc) ${adminProductListProjection}`,
  );
}

export async function getProductForEdit(id: string) {
  return writeClient.fetch<AdminProductDetail | null>(
    `*[_type == "product" && _id == $id][0]{
      _id,
      name,
      "slug": slug.current,
      description,
      price,
      stock,
      images,
      "category": category->{ _id, name }
    }`,
    { id },
  );
}

async function uniqueProductSlug(name: string) {
  const base = slugify(name) || "product";
  const existing = await client.fetch<string[]>(
    `*[_type == "product" && slug.current match $pattern].slug.current`,
    { pattern: `${base}*` },
  );
  if (!existing.includes(base)) return base;

  let suffix = 2;
  while (existing.includes(`${base}-${suffix}`)) suffix++;
  return `${base}-${suffix}`;
}

async function uploadProductImages(
  files: File[],
): Promise<AdminProductImage[]> {
  const assets = await Promise.all(
    files.map((file) =>
      writeClient.assets.upload("image", file, { filename: file.name }),
    ),
  );
  return assets.map((asset) => ({
    _key: randomUUID(),
    _type: "image" as const,
    asset: { _type: "reference" as const, _ref: asset._id },
  }));
}

export interface ProductInput {
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
}

export async function createProduct(input: ProductInput, imageFiles: File[]) {
  if (imageFiles.length === 0) {
    throw new Error("At least one product image is required.");
  }

  const [images, slug] = await Promise.all([
    uploadProductImages(imageFiles),
    uniqueProductSlug(input.name),
  ]);

  return writeClient.create({
    _type: "product",
    name: input.name,
    slug: { _type: "slug", current: slug },
    description: input.description || undefined,
    price: input.price,
    stock: input.stock,
    category: { _type: "reference", _ref: input.category },
    images,
  });
}

export async function updateProduct(
  id: string,
  input: ProductInput,
  newImageFiles: File[],
  keepImageKeys: string[],
) {
  const existing = await writeClient.fetch<{
    images: { _key: string }[];
  } | null>(`*[_id == $id][0]{ images }`, { id });

  const kept = (existing?.images ?? []).filter((image) =>
    keepImageKeys.includes(image._key),
  );
  const newImages = await uploadProductImages(newImageFiles);
  const images = [...kept, ...newImages];

  if (images.length === 0) {
    throw new Error("A product needs at least one image.");
  }

  const patch = writeClient.patch(id).set({
    name: input.name,
    price: input.price,
    stock: input.stock,
    category: { _type: "reference", _ref: input.category },
    images,
  });

  if (input.description) {
    patch.set({ description: input.description });
  } else {
    patch.unset(["description"]);
  }

  return patch.commit();
}

export async function deleteProduct(id: string) {
  const orderCount = await client.fetch<number>(
    `count(*[_type == "order" && references($id)])`,
    { id },
  );
  if (orderCount > 0) {
    throw new Error(
      "Can't delete: this product appears in existing orders.",
    );
  }

  await writeClient.delete(id);
}
