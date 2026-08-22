import { LayoutGrid } from "lucide-react";
import type { Metadata } from "next";

import { getCategories } from "@/lib/sanity/categories";
import { CategoryCard } from "@/components/category/category-card";
import { Container } from "@/components/layout/container";
import { EmptyState } from "@/components/empty-state";

export const metadata: Metadata = { title: "Categories" };

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <Container className="flex flex-col gap-8 py-10">
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Categories
        </h1>
        <p className="text-sm text-muted-foreground">
          Browse products by category.
        </p>
      </div>

      {categories.length === 0 ? (
        <EmptyState
          icon={LayoutGrid}
          title="No categories yet"
          description="Categories will appear here once they're added in the Studio."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <CategoryCard key={category._id} category={category} />
          ))}
        </div>
      )}
    </Container>
  );
}
