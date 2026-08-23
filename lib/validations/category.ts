import { z } from "zod";

export const categoryFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  description: z.string().trim().max(500).optional().default(""),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;
