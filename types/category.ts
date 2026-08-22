import type { SanityImage } from "@/types/sanity";

export interface CategorySummary {
  _id: string;
  name: string;
  slug: string;
  description: string | null;
  image: SanityImage | null;
  productCount: number;
}

export interface CategoryDetail {
  _id: string;
  name: string;
  slug: string;
  description: string | null;
  image: SanityImage | null;
}
