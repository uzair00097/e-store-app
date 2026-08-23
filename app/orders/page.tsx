import { auth } from "@clerk/nextjs/server";
import { PackageOpen } from "lucide-react";
import type { Metadata } from "next";

import { formatPrice } from "@/lib/format";
import { ORDER_STATUS_VARIANT } from "@/lib/order-status";
import { getOrdersForUser } from "@/lib/sanity/orders";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/layout/container";
import { EmptyState } from "@/components/empty-state";

export const metadata: Metadata = { title: "Order History" };

export default async function OrdersPage() {
  const { userId } = await auth.protect();
  const orders = await getOrdersForUser(userId);

  return (
    <Container className="flex flex-col gap-6 py-10">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">
        Order history
      </h1>

      {orders.length === 0 ? (
        <EmptyState
          icon={PackageOpen}
          title="No orders yet"
          description="Orders you place will show up here."
        />
      ) : (
        <ul className="flex flex-col gap-4">
          {orders.map((order) => (
            <li
              key={order._id}
              className="rounded-xl border border-border p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    {new Date(order.createdAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Order #{order._id.slice(-8)}
                  </span>
                </div>
                <Badge variant={ORDER_STATUS_VARIANT[order.status] ?? "outline"}>
                  {order.status}
                </Badge>
              </div>
              <ul className="mt-4 flex flex-col gap-1">
                {order.items.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between text-sm text-muted-foreground"
                  >
                    <span>
                      {item.productName} × {item.quantity}
                    </span>
                    <span>{formatPrice(item.unitPrice * item.quantity)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-sm font-semibold">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
