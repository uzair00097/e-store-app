import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { formatPrice } from "@/lib/format";
import { breadcrumbJsonLd, productJsonLd } from "@/lib/json-ld";
import { siteConfig } from "@/lib/site-config";
import { getProductBySlug } from "@/lib/sanity/products";
import { urlForImage } from "@/lib/sanity/image";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/layout/container";
import { JsonLd } from "@/components/json-ld";

export async function generateMetadata(
  props: PageProps<"/shop/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };

  const description =
    product.description ?? `${product.name} -- available now at ${siteConfig.name}.`;
  const imageUrl = product.images?.[0]
    ? urlForImage(product.images[0]).width(1200).height(630).fit("crop").url()
    : undefined;

  return {
    title: product.name,
    description,
    alternates: { canonical: `/shop/${product.slug}` },
    openGraph: {
      title: product.name,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
    twitter: {
      title: product.name,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}

export default async function ProductPage(props: PageProps<"/shop/[slug]">) {
  const { slug } = await props.params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const breadcrumbItems = [
    { name: "Home", url: siteConfig.url },
    { name: "Shop", url: `${siteConfig.url}/shop` },
    ...(product.category
      ? [
          {
            name: product.category.name,
            url: `${siteConfig.url}/shop?category=${product.category.slug}`,
          },
        ]
      : []),
    { name: product.name, url: `${siteConfig.url}/shop/${product.slug}` },
  ];

  const outOfStock = product.stock <= 0;
  const [primaryImage, ...restImages] = product.images ?? [];
  const primaryImageUrl = primaryImage
    ? urlForImage(primaryImage).width(800).height(800).fit("crop").url()
    : null;

  return (
    <Container className="flex flex-col gap-10 py-10 lg:flex-row lg:gap-12">
      <JsonLd
        data={productJsonLd({
          name: product.name,
          description: product.description,
          price: product.price,
          stock: product.stock,
          slug: product.slug,
          imageUrl: primaryImageUrl,
        })}
      />
      <JsonLd data={breadcrumbJsonLd(breadcrumbItems)} />
      <div className="flex flex-1 flex-col gap-3">
        <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
          {primaryImageUrl ? (
            <Image
              src={primaryImageUrl}
              alt={product.name}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
              priority
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No image
            </div>
          )}
        </div>
        {restImages.length > 0 && (
          <div className="grid grid-cols-4 gap-3">
            {restImages.map((image, i) => (
              <div
                key={i}
                className="relative aspect-square overflow-hidden rounded-lg bg-muted"
              >
                <Image
                  src={urlForImage(image).width(200).height(200).fit("crop").url()}
                  alt={`${product.name} ${i + 2}`}
                  fill
                  sizes="200px"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-4">
        {product.category && (
          <Link
            href={`/shop?category=${product.category.slug}`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            {product.category.name}
          </Link>
        )}
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          {product.name}
        </h1>
        <span className="font-heading text-2xl font-semibold">
          {formatPrice(product.price)}
        </span>

        {outOfStock ? (
          <Badge variant="destructive" className="w-fit">
            Out of stock
          </Badge>
        ) : (
          <Badge variant="secondary" className="w-fit">
            {product.stock} in stock
          </Badge>
        )}

        {product.description && (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {product.description}
          </p>
        )}

        <div className="mt-4">
          <AddToCartButton product={product} />
        </div>
      </div>
    </Container>
  );
}
