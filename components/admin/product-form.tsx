"use client";

import Image from "next/image";
import { useActionState, useState } from "react";

import { urlForImage } from "@/lib/sanity/image";
import type { AdminProductDetail } from "@/lib/sanity/admin/products";
import type { ProductFormState } from "@/app/admin/products/actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface ProductFormProps {
  action: (
    prevState: ProductFormState,
    formData: FormData,
  ) => Promise<ProductFormState>;
  categories: { _id: string; name: string }[];
  product?: AdminProductDetail;
  submitLabel: string;
}

export function ProductForm({
  action,
  categories,
  product,
  submitLabel,
}: ProductFormProps) {
  const [state, formAction, pending] = useActionState(action, {});
  const [removedKeys, setRemovedKeys] = useState<string[]>([]);

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
          defaultValue={product?.name}
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
          rows={4}
          defaultValue={product?.description ?? ""}
          aria-invalid={!!errors.description}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description[0]}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="price">Price (USD)</Label>
          <Input
            id="price"
            name="price"
            type="number"
            step="0.01"
            min="0"
            defaultValue={product?.price}
            aria-invalid={!!errors.price}
            required
          />
          {errors.price && (
            <p className="text-sm text-destructive">{errors.price[0]}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="stock">Stock</Label>
          <Input
            id="stock"
            name="stock"
            type="number"
            step="1"
            min="0"
            defaultValue={product?.stock}
            aria-invalid={!!errors.stock}
            required
          />
          {errors.stock && (
            <p className="text-sm text-destructive">{errors.stock[0]}</p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="category">Category</Label>
        <Select name="category" defaultValue={product?.category?._id}>
          <SelectTrigger id="category" className="w-full">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category._id} value={category._id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.category && (
          <p className="text-sm text-destructive">{errors.category[0]}</p>
        )}
      </div>

      {product && product.images.length > 0 && (
        <div className="flex flex-col gap-2">
          <Label>Current images</Label>
          <div className="flex flex-wrap gap-3">
            {product.images.map((image) => {
              const removed = removedKeys.includes(image._key);
              return (
                <label
                  key={image._key}
                  className="flex flex-col items-center gap-1 text-xs text-muted-foreground"
                >
                  <div
                    className="relative size-16 overflow-hidden rounded-md bg-muted"
                    style={removed ? { opacity: 0.4 } : undefined}
                  >
                    <Image
                      src={urlForImage(image).width(128).height(128).url()}
                      alt=""
                      fill
                      className="object-cover"
                    />
                  </div>
                  <span className="flex items-center gap-1">
                    <Checkbox
                      name="keepImages"
                      value={image._key}
                      defaultChecked
                      onCheckedChange={(checked) =>
                        setRemovedKeys((prev) =>
                          checked
                            ? prev.filter((key) => key !== image._key)
                            : [...prev, image._key],
                        )
                      }
                    />
                    Keep
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={product ? "newImages" : "images"}>
          {product ? "Add images" : "Images"}
        </Label>
        <Input
          id={product ? "newImages" : "images"}
          name={product ? "newImages" : "images"}
          type="file"
          accept="image/*"
          multiple
          aria-invalid={!!errors.images}
        />
        {errors.images && (
          <p className="text-sm text-destructive">{errors.images[0]}</p>
        )}
      </div>

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
