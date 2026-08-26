import Image from "next/image";
import Link from "next/link";

import { urlForImage } from "@/lib/sanity/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import type { CategorySummary } from "@/types/category";

export function CategoryCard({ category }: { category: CategorySummary }) {
  const imageUrl = category.image
    ? urlForImage(category.image).width(480).height(320).fit("crop").url()
    : null;

  return (
    <Link href={`/shop?category=${category.slug}`} className="block">
      <Card className="gap-0 overflow-hidden py-0 transition-shadow hover:shadow-md">
        <div className="relative aspect-[3/2] bg-coral-100">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={category.name}
              fill
              sizes="(min-width: 1024px) 33vw, 50vw"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm font-medium text-foreground/70">
              {category.name}
            </div>
          )}
        </div>
        <CardContent className="flex flex-col gap-1 p-4">
          <CardTitle>{category.name}</CardTitle>
          <CardDescription>
            {category.productCount}{" "}
            {category.productCount === 1 ? "product" : "products"}
          </CardDescription>
        </CardContent>
      </Card>
    </Link>
  );
}
