import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/site-config";
import { client } from "@/lib/sanity/client";

const STATIC_ROUTES = [
  { path: "/", priority: 1, changeFrequency: "weekly" as const },
  { path: "/shop", priority: 0.9, changeFrequency: "daily" as const },
  { path: "/categories", priority: 0.7, changeFrequency: "weekly" as const },
  { path: "/about", priority: 0.3, changeFrequency: "yearly" as const },
  { path: "/contact", priority: 0.3, changeFrequency: "yearly" as const },
  { path: "/privacy", priority: 0.1, changeFrequency: "yearly" as const },
  { path: "/terms", priority: 0.1, changeFrequency: "yearly" as const },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories] = await Promise.all([
    client.fetch<{ slug: string; _updatedAt: string }[]>(
      `*[_type == "product"]{ "slug": slug.current, _updatedAt }`,
    ),
    client.fetch<{ slug: string; _updatedAt: string }[]>(
      `*[_type == "category"]{ "slug": slug.current, _updatedAt }`,
    ),
  ]);

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${siteConfig.url}${route.path}`,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const productEntries: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${siteConfig.url}/shop/${product.slug}`,
    lastModified: product._updatedAt,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const categoryEntries: MetadataRoute.Sitemap = categories.map(
    (category) => ({
      url: `${siteConfig.url}/shop?category=${category.slug}`,
      lastModified: category._updatedAt,
      changeFrequency: "weekly",
      priority: 0.5,
    }),
  );

  return [...staticEntries, ...productEntries, ...categoryEntries];
}
