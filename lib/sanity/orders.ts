import { client } from "@/lib/sanity/client";

export interface OrderListItem {
  _id: string;
  status: string;
  total: number;
  createdAt: string;
  items: {
    productName: string;
    quantity: number;
    unitPrice: number;
  }[];
}

export async function getOrdersForUser(userId: string) {
  return client.fetch<OrderListItem[]>(
    `*[_type == "order" && userId == $userId] | order(createdAt desc) {
      _id,
      status,
      total,
      createdAt,
      items[]{ productName, quantity, unitPrice }
    }`,
    { userId },
  );
}
