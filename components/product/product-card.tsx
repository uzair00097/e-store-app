import Image from "next/image";
import Link from "next/link";

import { formatPrice } from "@/lib/format";
import { urlForImage } from "@/lib/sanity/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import type { ProductListItem } from "@/types/product";

export function ProductCard({ product }: { product: ProductListItem }) {
  const imageUrl = product.image
    ? urlForImage(product.image).width(480).height(480).fit("crop").url()
    : null;
  const outOfStock = product.stock <= 0;

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <Link href={`/shop/${product.slug}`} className="block">
        <div className="relative aspect-square bg-coral-100">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={product.name}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
              className="object-cover transition-transform hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-foreground/60">
              No image
            </div>
          )}
          {outOfStock && (
            <Badge variant="destructive" className="absolute top-2 left-2">
              Out of stock
            </Badge>
          )}
        </div>
      </Link>
      <CardContent className="flex flex-col gap-1 p-4">
        {product.category && (
          <span className="text-xs text-muted-foreground">
            {product.category.name}
          </span>
        )}
        <Link href={`/shop/${product.slug}`}>
          <CardTitle className="line-clamp-1">{product.name}</CardTitle>
        </Link>
        <span className="font-heading text-base font-medium text-coral-600">
          {formatPrice(product.price)}
        </span>
      </CardContent>
    </Card>
  );
}
