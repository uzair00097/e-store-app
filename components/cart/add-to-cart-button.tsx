"use client";

import { useState } from "react";

import { useCartStore } from "@/store/cart-store";
import { Button } from "@/components/ui/button";
import type { ProductDetail } from "@/types/product";

export function AddToCartButton({ product }: { product: ProductDetail }) {
  const addItem = useCartStore((state) => state.addItem);
  const [added, setAdded] = useState(false);
  const outOfStock = product.stock <= 0;

  function handleClick() {
    addItem({
      productId: product._id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      image: product.images?.[0] ?? null,
      stock: product.stock,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        size="lg"
        disabled={outOfStock}
        onClick={handleClick}
        className="w-fit"
      >
        {outOfStock ? "Out of stock" : added ? "Added to cart" : "Add to cart"}
      </Button>
      <p className="text-xs text-muted-foreground">
        Checkout ships in a later phase -- your cart is saved until then.
      </p>
    </div>
  );
}
