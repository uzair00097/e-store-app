"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";

import { useCartCount } from "@/store/cart-store";
import { Button } from "@/components/ui/button";

function noopSubscribe() {
  return () => {};
}

// Zustand's persist middleware reads localStorage after hydration, so the
// server render and the client's first paint both show 0 items. Gating the
// badge on this avoids showing a stale "0" flash before the real count
// loads -- useSyncExternalStore's server/client snapshot split is the
// canonical way to read "has hydration finished" without an effect-driven
// setState (which cascading-render lint rules flag).
function useHydrated() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

export function CartIndicator() {
  const hydrated = useHydrated();
  const count = useCartCount();

  return (
    <Button
      variant="ghost"
      size="icon"
      render={<Link href="/cart" />}
      nativeButton={false}
      className="relative"
    >
      <ShoppingBag className="size-5" aria-hidden="true" />
      <span className="sr-only">Cart</span>
      {hydrated && count > 0 && (
        <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Button>
  );
}
