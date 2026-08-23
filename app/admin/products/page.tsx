import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { PackageOpen, Pencil, Plus } from "lucide-react";

import { formatPrice } from "@/lib/format";
import { listProductsAdmin } from "@/lib/sanity/admin/products";
import { urlForImage } from "@/lib/sanity/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";

import { deleteProductAction } from "./actions";

export const metadata: Metadata = { title: "Admin · Products" };

export default async function AdminProductsPage() {
  const products = await listProductsAdmin();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Products
        </h1>
        <Button render={<Link href="/admin/products/new" />}>
          <Plus className="size-4" aria-hidden="true" />
          New product
        </Button>
      </div>

      {products.length === 0 ? (
        <EmptyState
          icon={PackageOpen}
          title="No products yet"
          description="Create your first product to populate the storefront."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50 text-left text-xs text-muted-foreground">
              <tr>
                <th className="p-3 font-medium">Product</th>
                <th className="p-3 font-medium">Category</th>
                <th className="p-3 font-medium">Price</th>
                <th className="p-3 font-medium">Stock</th>
                <th className="p-3 font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr
                  key={product._id}
                  className="border-b border-border last:border-0"
                >
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="relative size-10 shrink-0 overflow-hidden rounded-md bg-muted">
                        {product.image && (
                          <Image
                            src={urlForImage(product.image)
                              .width(80)
                              .height(80)
                              .url()}
                            alt=""
                            fill
                            className="object-cover"
                          />
                        )}
                      </div>
                      <span className="font-medium">{product.name}</span>
                    </div>
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {product.category?.name ?? "—"}
                  </td>
                  <td className="p-3">{formatPrice(product.price)}</td>
                  <td className="p-3">
                    <Badge variant={product.stock === 0 ? "destructive" : "outline"}>
                      {product.stock} in stock
                    </Badge>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        render={<Link href={`/admin/products/${product._id}/edit`} />}
                      >
                        <Pencil className="size-4" aria-hidden="true" />
                        <span className="sr-only">Edit {product.name}</span>
                      </Button>
                      <ConfirmDeleteButton
                        action={deleteProductAction}
                        id={product._id}
                        itemLabel={product.name}
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
