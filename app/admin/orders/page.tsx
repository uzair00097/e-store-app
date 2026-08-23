import Link from "next/link";
import type { Metadata } from "next";
import { PackageOpen } from "lucide-react";

import { formatPrice } from "@/lib/format";
import { ORDER_STATUS_VARIANT, ORDER_STATUSES } from "@/lib/order-status";
import { listOrdersAdmin } from "@/lib/sanity/admin/orders";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";

export const metadata: Metadata = { title: "Admin · Orders" };

export default async function AdminOrdersPage(
  props: PageProps<"/admin/orders">,
) {
  const searchParams = await props.searchParams;
  const status =
    typeof searchParams.status === "string" ? searchParams.status : undefined;

  const orders = await listOrdersAdmin({ status });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">
        Orders
      </h1>

      <div className="flex flex-wrap gap-2">
        <Badge variant={!status ? "default" : "outline"} render={<Link href="/admin/orders" />}>
          All
        </Badge>
        {ORDER_STATUSES.map((s) => (
          <Badge
            key={s}
            variant={status === s ? "default" : "outline"}
            render={<Link href={`/admin/orders?status=${s}`} />}
          >
            {s}
          </Badge>
        ))}
      </div>

      {orders.length === 0 ? (
        <EmptyState
          icon={PackageOpen}
          title="No orders"
          description="No orders match this filter yet."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50 text-left text-xs text-muted-foreground">
              <tr>
                <th className="p-3 font-medium">Order</th>
                <th className="p-3 font-medium">Customer</th>
                <th className="p-3 font-medium">Date</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order._id}
                  className="border-b border-border last:border-0"
                >
                  <td className="p-3">
                    <Link
                      href={`/admin/orders/${order._id}`}
                      className="font-medium hover:underline"
                    >
                      #{order._id.slice(-8)}
                    </Link>
                    <span className="block text-xs text-muted-foreground">
                      {order.itemCount} item{order.itemCount === 1 ? "" : "s"}
                    </span>
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {order.customerEmail ?? "—"}
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="p-3">
                    <Badge variant={ORDER_STATUS_VARIANT[order.status] ?? "outline"}>
                      {order.status}
                    </Badge>
                  </td>
                  <td className="p-3 text-right font-medium">
                    {formatPrice(order.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
