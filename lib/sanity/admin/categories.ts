import { client } from "@/lib/sanity/client";
import { writeClient } from "@/lib/sanity/write-client";
import { slugify } from "@/lib/slug";
import type { SanityImage } from "@/types/sanity";

export interface AdminCategoryListItem {
  _id: string;
  name: string;
  slug: string;
  description: string | null;
  image: SanityImage | null;
  productCount: number;
}

export interface AdminCategoryDetail {
  _id: string;
  name: string;
  slug: string;
  description: string | null;
  image: SanityImage | null;
}

export async function listCategoriesAdmin() {
  return writeClient.fetch<AdminCategoryListItem[]>(
    `*[_type == "category"] | order(name asc) {
      _id,
      name,
      "slug": slug.current,
      description,
      image,
      "productCount": count(*[_type == "product" && references(^._id)])
    }`,
  );
}

export async function getCategoryForEdit(id: string) {
  return writeClient.fetch<AdminCategoryDetail | null>(
    `*[_type == "category" && _id == $id][0]{
      _id, name, "slug": slug.current, description, image
    }`,
    { id },
  );
}

async function uniqueCategorySlug(name: string) {
  const base = slugify(name) || "category";
  const existing = await client.fetch<string[]>(
    `*[_type == "category" && slug.current match $pattern].slug.current`,
    { pattern: `${base}*` },
  );
  if (!existing.includes(base)) return base;

  let suffix = 2;
  while (existing.includes(`${base}-${suffix}`)) suffix++;
  return `${base}-${suffix}`;
}

async function uploadCategoryImage(file: File) {
  const asset = await writeClient.assets.upload("image", file, {
    filename: file.name,
  });
  return {
    _type: "image" as const,
    asset: { _type: "reference" as const, _ref: asset._id },
  };
}

export interface CategoryInput {
  name: string;
  description: string;
}

export async function createCategory(
  input: CategoryInput,
  imageFile: File | null,
) {
  const [image, slug] = await Promise.all([
    imageFile && imageFile.size > 0
      ? uploadCategoryImage(imageFile)
      : Promise.resolve(undefined),
    uniqueCategorySlug(input.name),
  ]);

  return writeClient.create({
    _type: "category",
    name: input.name,
    slug: { _type: "slug", current: slug },
    description: input.description || undefined,
    image,
  });
}

export async function updateCategory(
  id: string,
  input: CategoryInput,
  imageFile: File | null,
  removeImage: boolean,
) {
  const patch = writeClient.patch(id).set({ name: input.name });

  if (input.description) {
    patch.set({ description: input.description });
  } else {
    patch.unset(["description"]);
  }

  if (imageFile && imageFile.size > 0) {
    const image = await uploadCategoryImage(imageFile);
    patch.set({ image });
  } else if (removeImage) {
    patch.unset(["image"]);
  }

  return patch.commit();
}

export async function deleteCategory(id: string) {
  const productCount = await client.fetch<number>(
    `count(*[_type == "product" && references($id)])`,
    { id },
  );
  if (productCount > 0) {
    throw new Error(
      `Can't delete: ${productCount} product${productCount === 1 ? "" : "s"} still use this category.`,
    );
  }

  await writeClient.delete(id);
}
