import { test, expect } from "@playwright/test";

// Seeds a real Sanity product/category so the storefront has something to
// add to cart -- this is the same document shape the Studio schemas define,
// created directly via the Content API rather than clicking through the
// Studio UI, and cleaned up in afterAll regardless of pass/fail.
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION;
const token = process.env.SANITY_API_TOKEN;

const categoryId = "test-category-e2e-cart";
const productId = "test-product-e2e-cart";
const productSlug = "test-product-e2e-cart";

async function mutate(mutations: unknown[]) {
  const res = await fetch(
    `https://${projectId}.api.sanity.io/v${apiVersion}/data/mutate/${dataset}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ mutations }),
    },
  );
  if (!res.ok) {
    throw new Error(`Sanity mutation failed: ${res.status} ${await res.text()}`);
  }
}

test.describe("Cart", () => {
  test.beforeAll(async () => {
    await mutate([
      {
        createOrReplace: {
          _id: categoryId,
          _type: "category",
          name: "E2E Cart Test Category",
          slug: { _type: "slug", current: categoryId },
        },
      },
      {
        createOrReplace: {
          _id: productId,
          _type: "product",
          name: "E2E Cart Test Product",
          slug: { _type: "slug", current: productSlug },
          description: "Seeded by e2e/cart.spec.ts -- safe to delete.",
          price: 19.99,
          stock: 3,
          category: { _type: "reference", _ref: categoryId },
        },
      },
    ]);
  });

  test.afterAll(async () => {
    await mutate([
      { delete: { id: productId } },
      { delete: { id: categoryId } },
    ]);
  });

  test("add to cart, adjust quantity, remove", async ({ page }) => {
    await page.goto(`/shop/${productSlug}`);
    await expect(
      page.getByRole("heading", { name: "E2E Cart Test Product" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Add to cart" }).click();
    await expect(page.getByRole("button", { name: "Added to cart" })).toBeVisible();

    // Cart badge in the header should now show 1.
    await expect(page.getByRole("button", { name: /^Cart/ })).toContainText("1");

    await page.getByRole("button", { name: /^Cart/ }).click();
    await expect(page).toHaveURL("/cart");
    await expect(page.getByText("E2E Cart Test Product")).toBeVisible();
    // $19.99 legitimately appears in three places at quantity 1 (unit
    // price, line total, and cart subtotal) -- just confirm at least one.
    await expect(page.getByText("$19.99").first()).toBeVisible();

    // Increase quantity to 2, subtotal should update.
    await page.getByRole("button", { name: "Increase quantity" }).click();
    await expect(page.getByText("$39.98").first()).toBeVisible();

    // Remove the item -- cart should return to its empty state.
    await page.getByRole("button", { name: "Remove item" }).click();
    await expect(
      page.getByRole("heading", { name: "Your cart is empty" }),
    ).toBeVisible();
  });
});
