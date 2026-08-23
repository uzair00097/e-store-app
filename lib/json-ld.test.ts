import { describe, expect, it } from "vitest";

import { breadcrumbJsonLd, organizationJsonLd, productJsonLd } from "./json-ld";
import { siteConfig } from "./site-config";

describe("organizationJsonLd", () => {
  it("builds a schema.org Organization node from site config", () => {
    expect(organizationJsonLd()).toEqual({
      "@context": "https://schema.org",
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
      description: siteConfig.description,
    });
  });
});

describe("productJsonLd", () => {
  const product = {
    name: "Widget",
    description: "A fine widget",
    price: 19.99,
    stock: 5,
    slug: "widget",
    imageUrl: "https://cdn.example.com/widget.jpg",
  };

  it("marks in-stock products as InStock", () => {
    const node = productJsonLd(product);
    expect(node.offers.availability).toBe("https://schema.org/InStock");
    expect(node.offers.price).toBe(19.99);
    expect(node.offers.url).toBe(`${siteConfig.url}/shop/widget`);
  });

  it("marks zero-stock products as OutOfStock", () => {
    const node = productJsonLd({ ...product, stock: 0 });
    expect(node.offers.availability).toBe("https://schema.org/OutOfStock");
  });

  it("omits description and image when null", () => {
    const node = productJsonLd({
      ...product,
      description: null,
      imageUrl: null,
    });
    expect(node.description).toBeUndefined();
    expect(node.image).toBeUndefined();
  });
});

describe("breadcrumbJsonLd", () => {
  it("builds an ordered ItemList starting at position 1", () => {
    const node = breadcrumbJsonLd([
      { name: "Home", url: "/" },
      { name: "Shop", url: "/shop" },
      { name: "Widget", url: "/shop/widget" },
    ]);

    expect(node.itemListElement).toEqual([
      { "@type": "ListItem", position: 1, name: "Home", item: "/" },
      { "@type": "ListItem", position: 2, name: "Shop", item: "/shop" },
      {
        "@type": "ListItem",
        position: 3,
        name: "Widget",
        item: "/shop/widget",
      },
    ]);
  });

  it("returns an empty list for no breadcrumbs", () => {
    expect(breadcrumbJsonLd([]).itemListElement).toEqual([]);
  });
});
