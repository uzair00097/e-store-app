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

const categoryId = "test-category-e2e-checkout";
const productId = "test-product-e2e-checkout";
const productSlug = "test-product-e2e-checkout";
const testEmail = `e2e-checkout-${Date.now()}@example.com`;

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
  const url = new URL(`https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}`);
  url.searchParams.set("query", query);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(`$${key}`, JSON.stringify(value));
  }
  const res = await fetch(url);
  const body = await res.json();
  return body.result as T;
}

test.describe.configure({ mode: "serial" });

test.describe("Checkout", () => {
  test.beforeAll(async () => {
    const user = await clerkClient.users.createUser({
      emailAddress: [testEmail],
      password: "Test-Password-123!",
    });
    userId = user.id;

    await sanityMutate([
      {
        createOrReplace: {
          _id: categoryId,
          _type: "category",
          name: "E2E Checkout Test Category",
          slug: { _type: "slug", current: categoryId },
        },
      },
      {
        createOrReplace: {
          _id: productId,
          _type: "product",
          name: "E2E Checkout Test Product",
          slug: { _type: "slug", current: productSlug },
          description: "Seeded by e2e/checkout.spec.ts -- safe to delete.",
          price: 9.99,
          stock: 5,
          category: { _type: "reference", _ref: categoryId },
        },
      },
    ]);
  });

  test.afterAll(async () => {
    if (userId) await clerkClient.users.deleteUser(userId);

    const orders = await sanityQuery<{ _id: string }[]>(
      `*[_type == "order" && references($productId)]{ _id }`,
      { productId },
    );
    await sanityMutate([
      ...orders.map((o) => ({ delete: { id: o._id } })),
      { delete: { id: productId } },
      { delete: { id: categoryId } },
    ]);
  });

  test("guest is redirected to sign-in from checkout", async ({ page }) => {
    await page.goto("/checkout");
    await expect(page).toHaveURL(/\/sign-in/);
  });

  // This drives a real (test-mode) payment through Stripe's hosted Checkout
  // page, verifying the redirect out, the card form, and the redirect back
  // to our success page. It does NOT verify order creation -- that needs
  // Stripe to actually deliver the checkout.session.completed webhook,
  // which requires either `stripe listen` running locally or a
  // dashboard-registered endpoint with a public URL, neither of which
  // exists in this environment. Webhook handler logic (signature
  // verification, fulfillment, idempotency against retries) is verified
  // separately with a self-signed synthetic event against a real session.
  test("signed-in customer completes a real Stripe test payment", async ({
    page,
  }) => {
    await page.goto("/");
    await clerk.signIn({ page, emailAddress: testEmail });

    await page.goto(`/shop/${productSlug}`);
    await page.getByRole("button", { name: "Add to cart" }).click();
    await expect(
      page.getByRole("button", { name: "Added to cart" }),
    ).toBeVisible();

    await page.goto("/checkout");
    await expect(page.getByText("E2E Checkout Test Product")).toBeVisible();

    await page.getByRole("button", { name: "Pay with Stripe" }).click();

    // Real redirect to Stripe's hosted Checkout page.
    await page.waitForURL(/checkout\.stripe\.com/, { timeout: 15000 });

    await page.getByRole("textbox", { name: "Card number" }).fill("4242424242424242");
    await page.getByRole("textbox", { name: "Expiration" }).fill("12/34");
    await page.getByRole("textbox", { name: "CVC" }).fill("123");
    const nameField = page.getByLabel("Cardholder name");
    if (await nameField.isVisible().catch(() => false)) {
      await nameField.fill("E2E Test");
    }

    await page.getByTestId("hosted-payment-submit-button").click();

    // Back on our own success page after a real (test-mode) payment.
    await page.waitForURL(/\/checkout\/success/, { timeout: 20000 });
    await expect(
      page.getByRole("heading", { name: "Thanks for your order!" }),
    ).toBeVisible();

    // Cart should be cleared post-purchase.
    await page.goto("/cart");
    await expect(
      page.getByRole("heading", { name: "Your cart is empty" }),
    ).toBeVisible();
  });
});
