"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface DeleteState {
  message?: string;
}

interface ConfirmDeleteButtonProps {
  action: (id: string) => Promise<DeleteState>;
  id: string;
  itemLabel: string;
}

export function ConfirmDeleteButton({
  action,
  id,
  itemLabel,
}: ConfirmDeleteButtonProps) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await action(id);
      if (result.message) {
        setMessage(result.message);
      } else {
        setMessage(undefined);
        setOpen(false);
      }
    });
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return;
        setOpen(next);
        if (next) setMessage(undefined);
      }}
    >
      <AlertDialogTrigger render={<Button variant="ghost" size="icon" />}>
        <Trash2 className="size-4" aria-hidden="true" />
        <span className="sr-only">Delete {itemLabel}</span>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {itemLabel}?</AlertDialogTitle>
          <AlertDialogDescription>
            This action can&apos;t be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {message && <p className="text-sm text-destructive">{message}</p>}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={pending}
            onClick={(event) => {
              event.preventDefault();
              handleDelete();
            }}
          >
            {pending ? "Deleting…" : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
