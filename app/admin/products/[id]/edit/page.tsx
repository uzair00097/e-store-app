import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { getCategories } from "@/lib/sanity/categories";
import { getProductForEdit } from "@/lib/sanity/admin/products";
import { ProductForm } from "@/components/admin/product-form";

import { updateProductAction } from "../../actions";

export const metadata: Metadata = { title: "Admin · Edit Product" };

export default async function EditProductPage(
  props: PageProps<"/admin/products/[id]/edit">,
) {
  const { id } = await props.params;
  const [product, categories] = await Promise.all([
    getProductForEdit(id),
    getCategories(),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">
        Edit product
      </h1>
      <ProductForm
        action={updateProductAction.bind(null, id)}
        categories={categories}
        product={product}
        submitLabel="Save changes"
      />
    </div>
  );
}
