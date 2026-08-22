import { client } from "@/lib/sanity/client";
import type { CategoryDetail, CategorySummary } from "@/types/category";

export async function getCategories() {
  return client.fetch<CategorySummary[]>(
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

export async function getCategoryBySlug(slug: string) {
  return client.fetch<CategoryDetail | null>(
    `*[_type == "category" && slug.current == $slug][0]{
      _id,
      name,
      "slug": slug.current,
      description,
      image
    }`,
    { slug },
  );
}
