"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";

import { formatPrice } from "@/lib/format";
import { createCheckoutSession } from "@/app/checkout/actions";
import { useCartStore, useCartTotal } from "@/store/cart-store";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";

export function CheckoutSummary() {
  const items = useCartStore((state) => state.items);
  const total = useCartTotal();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <EmptyState
        icon={ShoppingBag}
        title="Your cart is empty"
        description="Add something to your cart before checking out."
        action={
          <Button render={<Link href="/shop" />} nativeButton={false}>
            Browse products
          </Button>
        }
      />
    );
  }

  function handleCheckout() {
    setError(null);
    startTransition(async () => {
      try {
        const { url } = await createCheckoutSession(
          items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        );
        // External redirect (checkout.stripe.com) -- next/navigation's
        // redirect() is for internal routes, so a plain location change
        // is the correct tool here rather than a router push.
        window.location.href = url;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return (
    <div className="flex max-w-lg flex-col gap-6">
      <ul className="flex flex-col divide-y divide-border">
        {items.map((item) => (
          <li
            key={item.productId}
            className="flex items-center justify-between py-3 text-sm"
          >
            <span>
              {item.name} × {item.quantity}
            </span>
            <span className="font-medium">
              {formatPrice(item.price * item.quantity)}
            </span>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between border-t border-border pt-4 text-base font-semibold">
        <span>Total</span>
        <span>{formatPrice(total)}</span>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button size="lg" onClick={handleCheckout} disabled={isPending}>
        {isPending ? "Redirecting to Stripe..." : "Pay with Stripe"}
      </Button>
    </div>
  );
}
