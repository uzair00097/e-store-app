import { z } from "zod";

export const productFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  description: z.string().trim().max(2000).optional().default(""),
  price: z.coerce.number().positive("Price must be greater than 0"),
  stock: z.coerce.number().int().min(0, "Stock can't be negative"),
  category: z.string().min(1, "Category is required"),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;
