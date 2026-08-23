import { describe, expect, it } from "vitest";

import { productFormSchema } from "./product";

describe("productFormSchema", () => {
  const valid = {
    name: "Widget",
    description: "A fine widget",
    price: 19.99,
    stock: 5,
    category: "cat-1",
  };

  it("accepts a fully valid product", () => {
    expect(productFormSchema.safeParse(valid).success).toBe(true);
  });

  it("defaults description to an empty string when omitted", () => {
    const { name, price, stock, category } = valid;
    const result = productFormSchema.parse({ name, price, stock, category });
    expect(result.description).toBe("");
  });

  it("rejects a blank name", () => {
    const result = productFormSchema.safeParse({ ...valid, name: "  " });
    expect(result.success).toBe(false);
  });

  it("rejects a zero or negative price", () => {
    expect(productFormSchema.safeParse({ ...valid, price: 0 }).success).toBe(
      false,
    );
    expect(productFormSchema.safeParse({ ...valid, price: -5 }).success).toBe(
      false,
    );
  });

  it("coerces a numeric string price", () => {
    const result = productFormSchema.parse({ ...valid, price: "19.99" });
    expect(result.price).toBe(19.99);
  });

  it("rejects negative stock", () => {
    expect(productFormSchema.safeParse({ ...valid, stock: -1 }).success).toBe(
      false,
    );
  });

  it("rejects non-integer stock", () => {
    expect(productFormSchema.safeParse({ ...valid, stock: 1.5 }).success).toBe(
      false,
    );
  });

  it("accepts zero stock (out of stock is valid)", () => {
    expect(productFormSchema.safeParse({ ...valid, stock: 0 }).success).toBe(
      true,
    );
  });

  it("rejects a missing category", () => {
    expect(
      productFormSchema.safeParse({ ...valid, category: "" }).success,
    ).toBe(false);
  });
});
