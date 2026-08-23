"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/rbac";
import {
  createCategory,
  deleteCategory,
  updateCategory,
} from "@/lib/sanity/admin/categories";
import { categoryFormSchema } from "@/lib/validations/category";

export interface CategoryFormState {
  errors?: Record<string, string[]>;
  message?: string;
}

function parseCategoryForm(formData: FormData) {
  return categoryFormSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
  });
}

function extractImageFile(formData: FormData, field: string) {
  const value = formData.get(field);
  return value instanceof File && value.size > 0 ? value : null;
}

export async function createCategoryAction(
  _prevState: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  await requireAdmin();

  const parsed = parseCategoryForm(formData);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  try {
    await createCategory(parsed.data, extractImageFile(formData, "image"));
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : "Something went wrong.",
    };
  }

  revalidatePath("/admin/categories");
  revalidatePath("/categories");
  revalidatePath("/shop");
  redirect("/admin/categories");
}

export async function updateCategoryAction(
  id: string,
  _prevState: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  await requireAdmin();

  const parsed = parseCategoryForm(formData);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const removeImage = formData.get("removeImage") === "on";

  try {
    await updateCategory(
      id,
      parsed.data,
      extractImageFile(formData, "image"),
      removeImage,
    );
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : "Something went wrong.",
    };
  }

  revalidatePath("/admin/categories");
  revalidatePath("/categories");
  revalidatePath("/shop");
  redirect("/admin/categories");
}

export interface DeleteState {
  message?: string;
}

export async function deleteCategoryAction(id: string): Promise<DeleteState> {
  await requireAdmin();

  try {
    await deleteCategory(id);
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : "Something went wrong.",
    };
  }

  revalidatePath("/admin/categories");
  revalidatePath("/categories");
  revalidatePath("/shop");
  return {};
}
