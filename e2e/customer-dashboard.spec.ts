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

const categoryId = "test-category-e2e-dashboard";
const productId = "test-product-e2e-dashboard";
const orderId = "test-order-e2e-dashboard";
const testEmail = `e2e-dashboard-${Date.now()}@example.com`;

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

test.describe.configure({ mode: "serial" });

test.describe("Customer dashboard", () => {
  test.beforeAll(async () => {
    const user = await clerkClient.users.createUser({
      emailAddress: [testEmail],
      password: "Test-Password-123!",
    });
    userId = user.id;

    await sanityMutate([
      // Sanity enforces reference integrity -- the order's item.product
      // reference needs a real document to point at, even though this
      // test only exercises order display, not the product itself.
      {
        createOrReplace: {
          _id: categoryId,
          _type: "category",
          name: "E2E Dashboard Test Category",
          slug: { _type: "slug", current: categoryId },
        },
      },
      {
        createOrReplace: {
          _id: productId,
          _type: "product",
          name: "E2E Dashboard Test Product",
          slug: { _type: "slug", current: productId },
          price: 15,
          stock: 5,
          category: { _type: "reference", _ref: categoryId },
        },
      },
      {
        createOrReplace: {
          _id: orderId,
          _type: "order",
          stripeSessionId: "cs_test_e2e_dashboard_fake",
          userId,
          status: "paid",
          items: [
            {
              _type: "orderItem",
              _key: "item1",
              productName: "E2E Dashboard Test Product",
              quantity: 2,
              unitPrice: 15,
              product: { _type: "reference", _ref: productId },
            },
          ],
          subtotal: 30,
          total: 30,
          currency: "usd",
          createdAt: new Date().toISOString(),
        },
      },
    ]);
  });

  test.afterAll(async () => {
    if (userId) await clerkClient.users.deleteUser(userId);
    await sanityMutate([
      { delete: { id: orderId } },
      { delete: { id: productId } },
      { delete: { id: categoryId } },
    ]);
  });

  test("order history shows the signed-in user's orders", async ({
    page,
  }) => {
    await page.goto("/");
    await clerk.signIn({ page, emailAddress: testEmail });

    await page.goto("/orders");
    await expect(
      page.getByRole("heading", { name: "Order history" }),
    ).toBeVisible();
    await expect(page.getByText("E2E Dashboard Test Product")).toBeVisible();
    await expect(page.getByText("$30.00").first()).toBeVisible();
    await expect(page.getByText("paid")).toBeVisible();
  });

  test("profile page renders Clerk's account management UI", async ({
    page,
  }) => {
    await page.goto("/");
    await clerk.signIn({ page, emailAddress: testEmail });

    await page.goto("/profile");
    await expect(
      page.getByRole("heading", { name: "Your profile" }),
    ).toBeVisible();
    // Clerk's <UserProfile /> renders its own "Profile details" section.
    await expect(page.getByText("Profile details")).toBeVisible();
  });
});
