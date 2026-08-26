"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";

import { formatPrice } from "@/lib/format";
import { urlForImage } from "@/lib/sanity/image";
import { useCartStore, useCartTotal } from "@/store/cart-store";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { EmptyState } from "@/components/empty-state";

export default function CartPage() {
  const items = useCartStore((state) => state.items);
  const setQuantity = useCartStore((state) => state.setQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const total = useCartTotal();

  if (items.length === 0) {
    return (
      <Container className="py-16">
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          description="Browse the shop and add something you like."
          action={
            <Button render={<Link href="/shop" />} nativeButton={false}>
              Browse products
            </Button>
          }
        />
      </Container>
    );
  }

  return (
    <Container className="flex flex-col gap-8 py-10 lg:flex-row lg:items-start">
      <div className="flex flex-1 flex-col gap-4">
        <h1 className="font-heading text-2xl font-medium tracking-tight">
          Cart
        </h1>
        <ul className="flex flex-col divide-y divide-border">
          {items.map((item) => {
            const imageUrl = item.image
              ? urlForImage(item.image)
                  .width(160)
                  .height(160)
                  .fit("crop")
                  .url()
              : null;

            return (
              <li key={item.productId} className="flex gap-4 py-4">
                <Link
                  href={`/shop/${item.slug}`}
                  className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-coral-100"
                >
                  {imageUrl && (
                    <Image
                      src={imageUrl}
                      alt={item.name}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  )}
                </Link>
                <div className="flex flex-1 flex-col gap-1">
                  <Link
                    href={`/shop/${item.slug}`}
                    className="text-sm font-medium hover:underline"
                  >
                    {item.name}
                  </Link>
                  <span className="text-sm font-medium text-coral-600">
                    {formatPrice(item.price)}
                  </span>
                  <div className="mt-1 flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={() =>
                        setQuantity(item.productId, item.quantity - 1)
                      }
                      aria-label="Decrease quantity"
                    >
                      <Minus className="size-3.5" aria-hidden="true" />
                    </Button>
                    <span className="w-6 text-center text-sm">
                      {item.quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={() =>
                        setQuantity(item.productId, item.quantity + 1)
                      }
                      disabled={item.quantity >= item.stock}
                      aria-label="Increase quantity"
                    >
                      <Plus className="size-3.5" aria-hidden="true" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removeItem(item.productId)}
                      aria-label="Remove item"
                      className="ml-2 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
                <span className="font-heading text-sm font-medium text-coral-600">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="flex w-full flex-col gap-4 rounded-xl border border-border bg-card p-6 lg:w-80">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-medium text-coral-600">{formatPrice(total)}</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Shipping and taxes calculated at checkout.
        </p>
        <Button
          size="lg"
          render={<Link href="/checkout" />}
          nativeButton={false}
        >
          Proceed to checkout
        </Button>
      </div>
    </Container>
  );
}
