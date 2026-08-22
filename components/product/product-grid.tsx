import { PackageSearch } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { ProductCard } from "@/components/product/product-card";
import type { ProductListItem } from "@/types/product";

export function ProductGrid({ products }: { products: ProductListItem[] }) {
  if (products.length === 0) {
    return (
      <EmptyState
        icon={PackageSearch}
        title="No products found"
        description="Try a different search term or category."
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product._id} product={product} />
      ))}
    </div>
  );
}
