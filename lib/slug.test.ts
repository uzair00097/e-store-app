import { describe, expect, it } from "vitest";

import { slugify } from "./slug";

describe("slugify", () => {
  it("lowercases and hyphenates spaces", () => {
    expect(slugify("Blue Running Shoes")).toBe("blue-running-shoes");
  });

  it("collapses non-alphanumeric runs into a single hyphen", () => {
    expect(slugify("Men's & Women's -- Jackets!!")).toBe(
      "men-s-women-s-jackets",
    );
  });

  it("trims leading and trailing hyphens", () => {
    expect(slugify("  --Sale Items--  ")).toBe("sale-items");
  });

  it("truncates to 96 characters", () => {
    const input = "a".repeat(200);
    expect(slugify(input)).toHaveLength(96);
  });

  it("returns an empty string for input with no slug-able characters", () => {
    expect(slugify("!!!")).toBe("");
  });
});
