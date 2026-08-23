import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Pencil, Plus, Tags } from "lucide-react";

import { listCategoriesAdmin } from "@/lib/sanity/admin/categories";
import { urlForImage } from "@/lib/sanity/image";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";

import { deleteCategoryAction } from "./actions";

export const metadata: Metadata = { title: "Admin · Categories" };

export default async function AdminCategoriesPage() {
  const categories = await listCategoriesAdmin();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Categories
        </h1>
        <Button render={<Link href="/admin/categories/new" />}>
          <Plus className="size-4" aria-hidden="true" />
          New category
        </Button>
      </div>

      {categories.length === 0 ? (
        <EmptyState
          icon={Tags}
          title="No categories yet"
          description="Create a category before adding products."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50 text-left text-xs text-muted-foreground">
              <tr>
                <th className="p-3 font-medium">Category</th>
                <th className="p-3 font-medium">Products</th>
                <th className="p-3 font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr
                  key={category._id}
                  className="border-b border-border last:border-0"
                >
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="relative size-10 shrink-0 overflow-hidden rounded-md bg-muted">
                        {category.image && (
                          <Image
                            src={urlForImage(category.image)
                              .width(80)
                              .height(80)
                              .url()}
                            alt=""
                            fill
                            className="object-cover"
                          />
                        )}
                      </div>
                      <span className="font-medium">{category.name}</span>
                    </div>
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {category.productCount}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        render={
                          <Link href={`/admin/categories/${category._id}/edit`} />
                        }
                      >
                        <Pencil className="size-4" aria-hidden="true" />
                        <span className="sr-only">Edit {category.name}</span>
                      </Button>
                      <ConfirmDeleteButton
                        action={deleteCategoryAction}
                        id={category._id}
                        itemLabel={category.name}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
