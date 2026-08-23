import Link from "next/link";
import type { Metadata } from "next";

import { getCategories } from "@/lib/sanity/categories";
import { getProducts } from "@/lib/sanity/products";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Container } from "@/components/layout/container";
import { ProductGrid } from "@/components/product/product-grid";

export const metadata: Metadata = {
  title: "Shop",
  description: "Browse the full catalog and filter by category or search.",
  // Fixed regardless of ?category/?q so filtered views consolidate ranking
  // signal onto the canonical listing page instead of splitting across
  // every query-string combination.
  alternates: { canonical: "/shop" },
};

export default async function ShopPage(props: PageProps<"/shop">) {
  const searchParams = await props.searchParams;
  const category =
    typeof searchParams.category === "string"
      ? searchParams.category
      : undefined;
  const q = typeof searchParams.q === "string" ? searchParams.q : undefined;

  const [products, categories] = await Promise.all([
    getProducts({ category, q }),
    getCategories(),
  ]);

  const activeCategory = categories.find((c) => c.slug === category);

  return (
    <Container className="flex flex-col gap-8 py-10">
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          {activeCategory ? activeCategory.name : "Shop"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {products.length} {products.length === 1 ? "product" : "products"}
        </p>
      </div>

      <form action="/shop" method="get" className="max-w-xs">
        {category && (
          <input type="hidden" name="category" value={category} />
        )}
        <Input
          type="search"
          name="q"
          placeholder="Search products..."
          defaultValue={q}
        />
      </form>

      <div className="flex flex-wrap gap-2">
        <Badge
          variant={!category ? "default" : "outline"}
          render={<Link href="/shop" />}
        >
          All
        </Badge>
        {categories.map((c) => (
          <Badge
            key={c._id}
            variant={category === c.slug ? "default" : "outline"}
            render={<Link href={`/shop?category=${c.slug}`} />}
          >
            {c.name}
          </Badge>
        ))}
      </div>

      <ProductGrid products={products} />
    </Container>
  );
}
