import { client } from "@/lib/sanity/client";
import type { ProductDetail, ProductListItem } from "@/types/product";

const productListProjection = `{
  _id,
  name,
  "slug": slug.current,
  price,
  stock,
  "image": images[0],
  "category": category->{ name, "slug": slug.current }
}`;

// $category/$q are always passed (null when unused) rather than building the
// query string conditionally -- keeps every input parameterized, never
// string-concatenated, per the same GROQ-injection guardrail the chatbot's
// search_products tool will need in Phase 9.
export async function getProducts(
  filters: { category?: string; q?: string } = {},
) {
  return client.fetch<ProductListItem[]>(
    `*[_type == "product"
        && (!defined($category) || category->slug.current == $category)
        && (!defined($q) || name match $q + "*")
      ] | order(name asc) ${productListProjection}`,
    { category: filters.category ?? null, q: filters.q ?? null },
  );
}

export async function getFeaturedProducts() {
  return client.fetch<ProductListItem[]>(
    `*[_type == "product"] | order(_createdAt desc) [0...8] ${productListProjection}`,
  );
}

export async function getProductBySlug(slug: string) {
  return client.fetch<ProductDetail | null>(
    `*[_type == "product" && slug.current == $slug][0]{
      _id,
      name,
      "slug": slug.current,
      description,
      price,
      stock,
      images,
      "category": category->{ name, "slug": slug.current }
    }`,
    { slug },
  );
}
