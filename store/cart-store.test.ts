import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { useCartCount, useCartStore, useCartTotal } from "./cart-store";

const productA = {
  productId: "prod-a",
  slug: "widget",
  name: "Widget",
  price: 9.99,
  image: null,
  stock: 3,
};

const productB = {
  productId: "prod-b",
  slug: "gadget",
  name: "Gadget",
  price: 19.99,
  image: null,
  stock: 1,
};

beforeEach(() => {
  useCartStore.getState().clear();
  window.localStorage.clear();
});

describe("cart store", () => {
  it("adds a new item defaulting to quantity 1", () => {
    useCartStore.getState().addItem(productA);
    expect(useCartStore.getState().items).toEqual([
      { ...productA, quantity: 1 },
    ]);
  });

  it("merges a repeat add into the existing line by summing quantity", () => {
    useCartStore.getState().addItem(productA, 1);
    useCartStore.getState().addItem(productA, 1);
    expect(useCartStore.getState().items).toEqual([
      { ...productA, quantity: 2 },
    ]);
  });

  it("clamps quantity on add to the item's stock", () => {
    useCartStore.getState().addItem(productA, 10);
    expect(useCartStore.getState().items[0].quantity).toBe(productA.stock);
  });

  it("clamps a merged add at the stock ceiling rather than overflowing", () => {
    useCartStore.getState().addItem(productA, 2);
    useCartStore.getState().addItem(productA, 5);
    expect(useCartStore.getState().items[0].quantity).toBe(productA.stock);
  });

  it("removes an item by productId", () => {
    useCartStore.getState().addItem(productA);
    useCartStore.getState().addItem(productB);
    useCartStore.getState().removeItem(productA.productId);
    expect(useCartStore.getState().items).toEqual([
      { ...productB, quantity: 1 },
    ]);
  });

  it("setQuantity clamps between 1 and the item's stock", () => {
    useCartStore.getState().addItem(productA);

    useCartStore.getState().setQuantity(productA.productId, 999);
    expect(useCartStore.getState().items[0].quantity).toBe(productA.stock);

    useCartStore.getState().setQuantity(productA.productId, 0);
    expect(useCartStore.getState().items[0].quantity).toBe(1);

    useCartStore.getState().setQuantity(productA.productId, -5);
    expect(useCartStore.getState().items[0].quantity).toBe(1);
  });

  it("setQuantity on an unknown productId is a no-op", () => {
    useCartStore.getState().addItem(productA);
    useCartStore.getState().setQuantity("does-not-exist", 2);
    expect(useCartStore.getState().items).toEqual([
      { ...productA, quantity: 1 },
    ]);
  });

  it("clear empties the cart", () => {
    useCartStore.getState().addItem(productA);
    useCartStore.getState().addItem(productB);
    useCartStore.getState().clear();
    expect(useCartStore.getState().items).toEqual([]);
  });

  it("useCartCount sums quantities across all line items", () => {
    useCartStore.getState().addItem(productA, 2);
    useCartStore.getState().addItem(productB, 1);

    const { result } = renderHook(() => useCartCount());
    expect(result.current).toBe(3);
  });

  it("useCartTotal sums price * quantity across all line items", () => {
    useCartStore.getState().addItem(productA, 2);
    useCartStore.getState().addItem(productB, 1);

    const { result } = renderHook(() => useCartTotal());
    expect(result.current).toBeCloseTo(2 * 9.99 + 19.99);
  });
});
