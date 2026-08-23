import { writeClient } from "@/lib/sanity/write-client";
import type { OrderStatus } from "@/lib/sanity/admin/orders";

export interface DashboardStats {
  productCount: number;
  categoryCount: number;
  orderCount: number;
  revenue: number;
  recentOrders: {
    _id: string;
    status: OrderStatus;
    total: number;
    customerEmail: string | null;
    createdAt: string;
  }[];
}

export async function getDashboardStats() {
  return writeClient.fetch<DashboardStats>(`{
    "productCount": count(*[_type == "product"]),
    "categoryCount": count(*[_type == "category"]),
    "orderCount": count(*[_type == "order"]),
    "revenue": coalesce(math::sum(*[_type == "order" && status in ["paid", "fulfilled"]].total), 0),
    "recentOrders": *[_type == "order"] | order(createdAt desc) [0...5] {
      _id, status, total, customerEmail, createdAt
    }
  }`);
}
