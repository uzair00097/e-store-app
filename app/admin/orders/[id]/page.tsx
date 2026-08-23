import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { formatPrice } from "@/lib/format";
import { ORDER_STATUS_VARIANT, ORDER_STATUSES } from "@/lib/order-status";
import { getOrderForAdmin } from "@/lib/sanity/admin/orders";
import { Badge } from "@/components/ui/badge";
import { OrderStatusForm } from "@/components/admin/order-status-form";

import { updateOrderStatusAction } from "../actions";

export const metadata: Metadata = { title: "Admin · Order" };

export default async function AdminOrderDetailPage(
  props: PageProps<"/admin/orders/[id]">,
) {
  const { id } = await props.params;
  const order = await getOrderForAdmin(id);

  if (!order) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Order #{order._id.slice(-8)}
          </h1>
          <p className="text-sm text-muted-foreground">
            {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>
        <Badge
          data-testid="order-status"
          variant={ORDER_STATUS_VARIANT[order.status] ?? "outline"}
        >
          {order.status}
        </Badge>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-1 rounded-xl border border-border p-4 text-sm">
          <span className="text-xs text-muted-foreground">Customer</span>
          <span>{order.customerEmail ?? "Unknown"}</span>
          <span className="text-xs text-muted-foreground">
            User ID: {order.userId}
          </span>
        </div>
        <div className="flex flex-col gap-1 rounded-xl border border-border p-4 text-sm">
          <span className="text-xs text-muted-foreground">Stripe</span>
          <span className="break-all">Session: {order.stripeSessionId}</span>
          {order.stripePaymentIntentId && (
            <span className="break-all">
              Payment intent: {order.stripePaymentIntentId}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Update status</span>
        <OrderStatusForm
          action={updateOrderStatusAction.bind(null, id)}
          statuses={ORDER_STATUSES}
          currentStatus={order.status}
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50 text-left text-xs text-muted-foreground">
            <tr>
              <th className="p-3 font-medium">Item</th>
              <th className="p-3 font-medium">Qty</th>
              <th className="p-3 font-medium text-right">Unit price</th>
              <th className="p-3 font-medium text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, i) => (
              <tr key={i} className="border-b border-border last:border-0">
                <td className="p-3">{item.productName}</td>
                <td className="p-3">{item.quantity}</td>
                <td className="p-3 text-right">{formatPrice(item.unitPrice)}</td>
                <td className="p-3 text-right">
                  {formatPrice(item.unitPrice * item.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-border">
              <td colSpan={3} className="p-3 text-right text-muted-foreground">
                Subtotal
              </td>
              <td className="p-3 text-right">{formatPrice(order.subtotal)}</td>
            </tr>
            <tr>
              <td colSpan={3} className="p-3 text-right font-semibold">
                Total
              </td>
              <td className="p-3 text-right font-semibold">
                {formatPrice(order.total)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
