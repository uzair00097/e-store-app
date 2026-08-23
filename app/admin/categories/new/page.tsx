import type { Metadata } from "next";

import { CategoryForm } from "@/components/admin/category-form";

import { createCategoryAction } from "../actions";

export const metadata: Metadata = { title: "Admin · New Category" };

export default function NewCategoryPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">
        New category
      </h1>
      <CategoryForm action={createCategoryAction} submitLabel="Create category" />
    </div>
  );
}
