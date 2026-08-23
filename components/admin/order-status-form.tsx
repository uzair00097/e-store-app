"use client";

import { useActionState } from "react";

import type { OrderStatusState } from "@/app/admin/orders/actions";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface OrderStatusFormProps {
  action: (
    prevState: OrderStatusState,
    formData: FormData,
  ) => Promise<OrderStatusState>;
  statuses: readonly string[];
  currentStatus: string;
}

export function OrderStatusForm({
  action,
  statuses,
  currentStatus,
}: OrderStatusFormProps) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="flex items-center gap-2">
      <Select name="status" defaultValue={currentStatus}>
        <SelectTrigger id="status" className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {statuses.map((status) => (
            <SelectItem key={status} value={status}>
              {status}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button type="submit" disabled={pending} size="sm">
        {pending ? "Updating…" : "Update status"}
      </Button>
      {state.message && (
        <p className="text-sm text-destructive">{state.message}</p>
      )}
    </form>
  );
}
