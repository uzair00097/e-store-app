import { ORDER_STATUSES } from "@/lib/order-status";
import { writeClient } from "@/lib/sanity/write-client";

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export interface AdminOrderListItem {
  _id: string;
  status: OrderStatus;
  total: number;
  customerEmail: string | null;
  createdAt: string;
  itemCount: number;
}

export interface AdminOrderDetail {
  _id: string;
  status: OrderStatus;
  stripeSessionId: string;
  stripePaymentIntentId: string | null;
  userId: string;
  customerEmail: string | null;
  subtotal: number;
  total: number;
  currency: string;
  createdAt: string;
  items: {
    productName: string;
    quantity: number;
    unitPrice: number;
  }[];
}

export async function listOrdersAdmin(filters: { status?: string } = {}) {
  return writeClient.fetch<AdminOrderListItem[]>(
    `*[_type == "order" && (!defined($status) || status == $status)]
      | order(createdAt desc) {
      _id,
      status,
      total,
      customerEmail,
      createdAt,
      "itemCount": count(items)
    }`,
    { status: filters.status ?? null },
  );
}

export async function getOrderForAdmin(id: string) {
  return writeClient.fetch<AdminOrderDetail | null>(
    `*[_type == "order" && _id == $id][0]{
      _id,
      status,
      stripeSessionId,
      stripePaymentIntentId,
      userId,
      customerEmail,
      subtotal,
      total,
      currency,
      createdAt,
      items[]{ productName, quantity, unitPrice }
    }`,
    { id },
  );
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  await writeClient.patch(id).set({ status }).commit();
}
