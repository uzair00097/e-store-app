// Single source of truth for order statuses -- sanity/schemaTypes/order.ts
// imports this rather than the other way around, since the full `sanity`
// package can't be imported into a Server Component/Action bundle (its
// deps assume a browser runtime and break Turbopack's RSC build).
export const ORDER_STATUSES = [
  "pending",
  "paid",
  "fulfilled",
  "cancelled",
  "refunded",
] as const;

export const ORDER_STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  paid: "default",
  fulfilled: "default",
  pending: "outline",
  cancelled: "destructive",
  refunded: "secondary",
};
