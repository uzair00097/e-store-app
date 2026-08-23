import path from "node:path";

import { test, expect } from "@playwright/test";
import { clerk } from "@clerk/testing/playwright";
import { createClerkClient } from "@clerk/backend";

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION;
const token = process.env.SANITY_API_TOKEN;

const seedCategoryId = "test-category-e2e-admin";
const seedProductId = "test-product-e2e-admin";
const seedOrderId = "test-order-e2e-admin";
const testEmail = `e2e-admin-${Date.now()}@example.com`;
const testImagePath = path.join(__dirname, "fixtures", "test-image.png");

let userId: string;

async function sanityMutate(mutations: unknown[]) {
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

async function sanityQuery<T>(query: string, params: Record<string, unknown> = {}) {
  const url = new URL(
    `https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}`,
  );
  url.searchParams.set("query", query);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(`$${key}`, JSON.stringify(value));
  }
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error(`Sanity query failed: ${res.status} ${await res.text()}`);
  }
  const body = (await res.json()) as { result: T };
  return body.result;
}

test.describe.configure({ mode: "serial" });

test.describe("Admin dashboard", () => {
  test.beforeAll(async () => {
    const user = await clerkClient.users.createUser({
      emailAddress: [testEmail],
      password: "Test-Password-123!",
      publicMetadata: { role: "admin" },
    });
    userId = user.id;

    await sanityMutate([
      {
        createOrReplace: {
          _id: seedCategoryId,
          _type: "category",
          name: "E2E Admin Test Category",
          slug: { _type: "slug", current: seedCategoryId },
        },
      },
      {
        createOrReplace: {
          _id: seedProductId,
          _type: "product",
          name: "E2E Admin Seed Product",
          slug: { _type: "slug", current: seedProductId },
          price: 25,
          stock: 10,
          category: { _type: "reference", _ref: seedCategoryId },
          images: [],
        },
      },
      {
        createOrReplace: {
          _id: seedOrderId,
          _type: "order",
          stripeSessionId: "cs_test_e2e_admin_fake",
          userId,
          customerEmail: testEmail,
          status: "pending",
          items: [
            {
              _type: "orderItem",
              _key: "item1",
              productName: "E2E Admin Seed Product",
              quantity: 1,
              unitPrice: 25,
              product: { _type: "reference", _ref: seedProductId },
            },
          ],
          subtotal: 25,
          total: 25,
          currency: "usd",
          createdAt: new Date().toISOString(),
        },
      },
    ]);
  });

  test.afterAll(async () => {
    if (userId) await clerkClient.users.deleteUser(userId);

    // Safety net for anything a failed assertion left behind mid-test,
    // in addition to the seeded docs and whatever the UI itself deleted.
    const leftoverProductIds = await sanityQuery<string[]>(
      `*[_type == "product" && name match "E2E Admin*"]._id`,
    );
    const leftoverCategoryIds = await sanityQuery<string[]>(
      `*[_type == "category" && name match "E2E Admin*"]._id`,
    );

    await sanityMutate([
      ...leftoverProductIds.map((id) => ({ delete: { id } })),
      { delete: { id: seedOrderId } },
      ...leftoverCategoryIds.map((id) => ({ delete: { id } })),
    ]);
  });

  test("dashboard shows stats and the seeded order", async ({ page }) => {
    await page.goto("/");
    await clerk.signIn({ page, emailAddress: testEmail });

    await page.goto("/admin");
    await expect(
      page.getByRole("heading", { name: "Admin dashboard" }),
    ).toBeVisible();
    await expect(
      page.locator('[data-slot="card-title"]', { hasText: "Products" }),
    ).toBeVisible();
    await expect(
      page.locator('[data-slot="card-title"]', { hasText: "Categories" }),
    ).toBeVisible();
    await expect(
      page.locator('[data-slot="card-title"]', { hasText: "Orders" }),
    ).toBeVisible();
    await expect(page.getByText(`#${seedOrderId.slice(-8)}`)).toBeVisible();
  });

  test("categories: create, edit, delete", async ({ page }) => {
    test.setTimeout(60_000);
    const name = `E2E Admin Category ${Date.now()}`;
    const updatedName = `${name} Updated`;

    await page.goto("/");
    await clerk.signIn({ page, emailAddress: testEmail });

    await page.goto("/admin/categories/new");
    await page.getByLabel("Name").fill(name);
    await page.setInputFiles("#image", testImagePath);
    await page.getByRole("button", { name: "Create category" }).click();

    // Image upload + Sanity write; give the redirect more than the default.
    await expect(
      page.getByRole("heading", { name: "Categories" }),
    ).toBeVisible({ timeout: 20_000 });
    const row = page.locator("tr", { hasText: name });
    await expect(row).toBeVisible();

    await row.getByRole("link", { name: `Edit ${name}` }).click();
    await expect(
      page.getByRole("heading", { name: "Edit category" }),
    ).toBeVisible({ timeout: 15_000 });
    await page.getByLabel("Name").fill(updatedName);
    await page.getByRole("button", { name: "Save changes" }).click();

    await expect(
      page.getByRole("heading", { name: "Categories" }),
    ).toBeVisible({ timeout: 20_000 });
    const updatedRow = page.locator("tr", { hasText: updatedName });
    await expect(updatedRow).toBeVisible();

    await updatedRow
      .getByRole("button", { name: `Delete ${updatedName}` })
      .click();
    await page.getByRole("button", { name: "Delete", exact: true }).click();
    await expect(page.locator("tr", { hasText: updatedName })).toHaveCount(0, {
      timeout: 10_000,
    });
  });

  test("products: create, edit, delete", async ({ page }) => {
    test.setTimeout(60_000);
    const name = `E2E Admin Product ${Date.now()}`;

    await page.goto("/");
    await clerk.signIn({ page, emailAddress: testEmail });

    await page.goto("/admin/products/new");
    await page.getByLabel("Name").fill(name);
    await page.getByLabel("Price (USD)").fill("42");
    await page.getByLabel("Stock").fill("7");
    await page.locator("#category").click();
    await page.getByRole("option", { name: "E2E Admin Test Category" }).click();
    await page.setInputFiles("#images", testImagePath);
    await page.getByRole("button", { name: "Create product" }).click();

    // Image upload + Sanity write; give the redirect more than the default.
    await expect(
      page.getByRole("heading", { name: "Products" }),
    ).toBeVisible({ timeout: 20_000 });
    const row = page.locator("tr", { hasText: name });
    await expect(row).toBeVisible();
    await expect(row.getByText("7 in stock")).toBeVisible();

    await row.getByRole("link", { name: `Edit ${name}` }).click();
    await expect(
      page.getByRole("heading", { name: "Edit product" }),
    ).toBeVisible({ timeout: 15_000 });
    await page.getByLabel("Stock").fill("3");
    await page.getByRole("button", { name: "Save changes" }).click();

    await expect(
      page.getByRole("heading", { name: "Products" }),
    ).toBeVisible({ timeout: 20_000 });
    const updatedRow = page.locator("tr", { hasText: name });
    await expect(updatedRow.getByText("3 in stock")).toBeVisible();

    await updatedRow.getByRole("button", { name: `Delete ${name}` }).click();
    await page.getByRole("button", { name: "Delete", exact: true }).click();
    await expect(page.locator("tr", { hasText: name })).toHaveCount(0, {
      timeout: 10_000,
    });
  });

  test("orders: filter by status and update status", async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto("/");
    await clerk.signIn({ page, emailAddress: testEmail });

    await page.goto("/admin/orders?status=pending");
    await expect(page.getByText(`#${seedOrderId.slice(-8)}`)).toBeVisible();

    await page.getByRole("link", { name: `#${seedOrderId.slice(-8)}` }).click();
    await expect(
      page.getByRole("heading", { name: `Order #${seedOrderId.slice(-8)}` }),
    ).toBeVisible({ timeout: 15_000 });

    await page.locator("#status").click();
    await page.getByRole("option", { name: "fulfilled" }).click();
    await page.getByRole("button", { name: "Update status" }).click();

    // Reload to check the persisted server state rather than the select's
    // client-side display value, which updates immediately on click.
    await expect(page.getByTestId("order-status")).toHaveText("fulfilled", {
      timeout: 10_000,
    });
    await page.reload();
    await expect(page.getByTestId("order-status")).toHaveText("fulfilled");

    await page.goto("/admin/orders?status=pending");
    await expect(page.getByText(`#${seedOrderId.slice(-8)}`)).toHaveCount(0);

    // Order status changes revalidate the customer-facing order history too.
    await page.goto("/orders");
    await expect(page.getByText(`Order #${seedOrderId.slice(-8)}`)).toBeVisible();
    await expect(page.getByText("fulfilled")).toBeVisible();
  });
});
