import { describe, expect, it } from "vitest";

import { categoryFormSchema } from "./category";

describe("categoryFormSchema", () => {
  it("accepts a valid category", () => {
    expect(
      categoryFormSchema.safeParse({ name: "Shoes", description: "Footwear" })
        .success,
    ).toBe(true);
  });

  it("defaults description to an empty string when omitted", () => {
    const result = categoryFormSchema.parse({ name: "Shoes" });
    expect(result.description).toBe("");
  });

  it("rejects a blank name", () => {
    expect(categoryFormSchema.safeParse({ name: "   " }).success).toBe(false);
  });

  it("rejects a name over 100 characters", () => {
    expect(
      categoryFormSchema.safeParse({ name: "a".repeat(101) }).success,
    ).toBe(false);
  });

  it("rejects a description over 500 characters", () => {
    expect(
      categoryFormSchema.safeParse({
        name: "Shoes",
        description: "a".repeat(501),
      }).success,
    ).toBe(false);
  });
});
