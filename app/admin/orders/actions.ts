"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { ORDER_STATUSES } from "@/lib/order-status";
import { requireAdmin } from "@/lib/rbac";
import { updateOrderStatus } from "@/lib/sanity/admin/orders";

const statusSchema = z.enum(ORDER_STATUSES);

export interface OrderStatusState {
  message?: string;
}

export async function updateOrderStatusAction(
  id: string,
  _prevState: OrderStatusState,
  formData: FormData,
): Promise<OrderStatusState> {
  await requireAdmin();

  const parsed = statusSchema.safeParse(formData.get("status"));
  if (!parsed.success) {
    return { message: "Invalid order status." };
  }

  try {
    await updateOrderStatus(id, parsed.data);
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : "Something went wrong.",
    };
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/orders");
  return {};
}
