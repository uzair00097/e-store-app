import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { getCategoryForEdit } from "@/lib/sanity/admin/categories";
import { CategoryForm } from "@/components/admin/category-form";

import { updateCategoryAction } from "../../actions";

export const metadata: Metadata = { title: "Admin · Edit Category" };

export default async function EditCategoryPage(
  props: PageProps<"/admin/categories/[id]/edit">,
) {
  const { id } = await props.params;
  const category = await getCategoryForEdit(id);

  if (!category) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">
        Edit category
      </h1>
      <CategoryForm
        action={updateCategoryAction.bind(null, id)}
        category={category}
        submitLabel="Save changes"
      />
    </div>
  );
}
