import type { Metadata } from "next";

import { getCategories } from "@/lib/sanity/categories";
import { ProductForm } from "@/components/admin/product-form";

import { createProductAction } from "../actions";

export const metadata: Metadata = { title: "Admin · New Product" };

export default async function NewProductPage() {
  const categories = await getCategories();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">
        New product
      </h1>
      <ProductForm
        action={createProductAction}
        categories={categories}
        submitLabel="Create product"
      />
    </div>
  );
}
