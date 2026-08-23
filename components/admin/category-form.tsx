"use client";

import Image from "next/image";
import { useActionState } from "react";

import { urlForImage } from "@/lib/sanity/image";
import type { AdminCategoryDetail } from "@/lib/sanity/admin/categories";
import type { CategoryFormState } from "@/app/admin/categories/actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface CategoryFormProps {
  action: (
    prevState: CategoryFormState,
    formData: FormData,
  ) => Promise<CategoryFormState>;
  category?: AdminCategoryDetail;
  submitLabel: string;
}

export function CategoryForm({
  action,
  category,
  submitLabel,
}: CategoryFormProps) {
  const [state, formAction, pending] = useActionState(action, {});
  const errors = state.errors ?? {};

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-5">
      {state.message && (
        <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {state.message}
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          defaultValue={category?.name}
          aria-invalid={!!errors.name}
          required
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={category?.description ?? ""}
          aria-invalid={!!errors.description}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description[0]}</p>
        )}
      </div>

      {category?.image && (
        <div className="flex flex-col gap-2">
          <Label>Current image</Label>
          <div className="flex items-center gap-3">
            <div className="relative size-16 overflow-hidden rounded-md bg-muted">
              <Image
                src={urlForImage(category.image).width(128).height(128).url()}
                alt=""
                fill
                className="object-cover"
              />
            </div>
            <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Checkbox name="removeImage" />
              Remove image
            </label>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="image">
          {category?.image ? "Replace image" : "Image"}
        </Label>
        <Input id="image" name="image" type="file" accept="image/*" />
      </div>

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
