import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { getCategories } from "@/lib/sanity/categories";
import { getFeaturedProducts } from "@/lib/sanity/products";
import { Button } from "@/components/ui/button";
import { CategoryCard } from "@/components/category/category-card";
import { Container } from "@/components/layout/container";
import { ProductGrid } from "@/components/product/product-grid";

export default async function Home() {
  const [products, categories] = await Promise.all([
    getFeaturedProducts(),
    getCategories(),
  ]);

  return (
    <>
      <section className="border-b border-border bg-muted/30">
        <Container className="flex flex-col items-start gap-4 py-20">
          <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
            Curated goods,
            <br />
            thoughtfully sourced.
          </h1>
          <p className="max-w-md text-base text-muted-foreground">
            Browse a hand-picked catalog and check out in seconds.
          </p>
          <Button
            size="lg"
            render={<Link href="/shop" />}
            nativeButton={false}
          >
            Shop now
            <ArrowRight className="size-4" aria-hidden="true" />
          </Button>
        </Container>
      </section>

      {categories.length > 0 && (
        <section>
          <Container className="flex flex-col gap-6 py-14">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-xl font-semibold tracking-tight">
                Shop by category
              </h2>
              <Link
                href="/categories"
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                View all
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {categories.slice(0, 4).map((category) => (
                <CategoryCard key={category._id} category={category} />
              ))}
            </div>
          </Container>
        </section>
      )}

      <section className="border-t border-border">
        <Container className="flex flex-col gap-6 py-14">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-xl font-semibold tracking-tight">
              New arrivals
            </h2>
            <Link
              href="/shop"
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              View all
            </Link>
          </div>
          <ProductGrid products={products} />
        </Container>
      </section>
    </>
  );
}
