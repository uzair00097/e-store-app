import type { SanityImage } from "@/types/sanity";

export interface ProductCategoryRef {
  name: string;
  slug: string;
}

export interface ProductListItem {
  _id: string;
  name: string;
  slug: string;
  price: number;
  stock: number;
  image: SanityImage | null;
  category: ProductCategoryRef | null;
}

export interface ProductDetail {
  _id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  stock: number;
  images: SanityImage[];
  category: ProductCategoryRef | null;
}
