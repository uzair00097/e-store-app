"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/rbac";
import {
  createProduct,
  deleteProduct,
  updateProduct,
} from "@/lib/sanity/admin/products";
import { productFormSchema } from "@/lib/validations/product";

export interface ProductFormState {
  errors?: Record<string, string[]>;
  message?: string;
}

function parseProductForm(formData: FormData) {
  return productFormSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    price: formData.get("price"),
    stock: formData.get("stock"),
    category: formData.get("category"),
  });
}

function extractImageFiles(formData: FormData, field: string) {
  return formData
    .getAll(field)
    .filter((value): value is File => value instanceof File && value.size > 0);
}

export async function createProductAction(
  _prevState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  await requireAdmin();

  const parsed = parseProductForm(formData);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const imageFiles = extractImageFiles(formData, "images");
  if (imageFiles.length === 0) {
    return {
      errors: { images: ["At least one product image is required."] },
    };
  }

  try {
    await createProduct(parsed.data, imageFiles);
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : "Something went wrong.",
    };
  }

  revalidatePath("/admin/products");
  revalidatePath("/shop");
  redirect("/admin/products");
}

export async function updateProductAction(
  id: string,
  _prevState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  await requireAdmin();

  const parsed = parseProductForm(formData);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const newImageFiles = extractImageFiles(formData, "newImages");
  const keepImageKeys = formData.getAll("keepImages").map(String);

  try {
    await updateProduct(id, parsed.data, newImageFiles, keepImageKeys);
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : "Something went wrong.",
    };
  }

  revalidatePath("/admin/products");
  revalidatePath("/shop");
  redirect("/admin/products");
}

export interface DeleteState {
  message?: string;
}

export async function deleteProductAction(id: string): Promise<DeleteState> {
  await requireAdmin();

  try {
    await deleteProduct(id);
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : "Something went wrong.",
    };
  }

  revalidatePath("/admin/products");
  revalidatePath("/shop");
  return {};
}
