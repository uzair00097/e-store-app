import { test, expect } from "@playwright/test";
import { clerk } from "@clerk/testing/playwright";
import { createClerkClient } from "@clerk/backend";

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

const testEmail = `e2e-test-${Date.now()}@example.com`;
let userId: string;

test.describe.configure({ mode: "serial" });

test.describe("Authentication & RBAC", () => {
  test.beforeAll(async () => {
    const user = await clerkClient.users.createUser({
      emailAddress: [testEmail],
      password: "Test-Password-123!",
    });
    userId = user.id;
  });

  test.afterAll(async () => {
    if (userId) await clerkClient.users.deleteUser(userId);
  });

  test("guest is redirected to sign-in from a protected route", async ({
    page,
  }) => {
    await page.goto("/profile");
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test("guest is redirected to sign-in from admin", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test("signed-in customer can reach protected routes but not admin", async ({
    page,
  }) => {
    await page.goto("/");
    await clerk.signIn({ page, emailAddress: testEmail });

    await page.goto("/profile");
    await expect(
      page.getByRole("heading", { name: "Your profile" })
    ).toBeVisible();

    await page.goto("/admin");
    await expect(page).toHaveURL("/");
  });

  test("granting the admin role unlocks /admin", async ({ page }) => {
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: { role: "admin" },
    });

    await page.goto("/");
    await clerk.signIn({ page, emailAddress: testEmail });
    await page.goto("/admin");
    await expect(
      page.getByRole("heading", { name: "Admin dashboard" })
    ).toBeVisible();
  });

  test("signing out re-locks protected routes", async ({ page }) => {
    await page.goto("/");
    await clerk.signIn({ page, emailAddress: testEmail });
    await clerk.signOut({ page });

    await page.goto("/profile");
    await expect(page).toHaveURL(/\/sign-in/);
  });
});
