import Link from "next/link";
import type { Metadata } from "next";
import { PackageOpen } from "lucide-react";

import { formatPrice } from "@/lib/format";
import { ORDER_STATUS_VARIANT } from "@/lib/order-status";
import { getDashboardStats } from "@/lib/sanity/admin/dashboard";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";

export const metadata: Metadata = { title: "Admin Dashboard" };

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  const statCards = [
    { label: "Products", value: stats.productCount, href: "/admin/products" },
    { label: "Categories", value: stats.categoryCount, href: "/admin/categories" },
    { label: "Orders", value: stats.orderCount, href: "/admin/orders" },
    { label: "Revenue (paid)", value: formatPrice(stats.revenue), href: "/admin/orders" },
  ];

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">
        Admin dashboard
      </h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Link key={stat.label} href={stat.href} className="block">
            <Card size="sm" className="transition-colors hover:bg-muted">
              <CardHeader>
                <CardTitle className="text-muted-foreground">
                  {stat.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold tracking-tight">
                {stat.value}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="font-heading text-lg font-semibold tracking-tight">
          Recent orders
        </h2>

        {stats.recentOrders.length === 0 ? (
          <EmptyState
            icon={PackageOpen}
            title="No orders yet"
            description="Orders will show up here once customers check out."
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <tbody>
                {stats.recentOrders.map((order) => (
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
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {order.customerEmail ?? "—"}
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
    </div>
  );
}
