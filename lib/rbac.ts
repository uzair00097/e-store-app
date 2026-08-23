import { auth, clerkClient } from "@clerk/nextjs/server";

export type UserRole = "customer" | "admin";

/**
 * Custom flat role stored in Clerk user.publicMetadata.role -- not Clerk
 * Organization roles/permissions, since this app has no org/team concept.
 * Returns null for signed-out visitors.
 */
export async function getCurrentUserRole(): Promise<UserRole | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const role = user.publicMetadata.role;

  return role === "admin" ? "admin" : "customer";
}

/**
 * Server Action / Route Handler guard -- render-time gating (e.g. the
 * admin layout's redirect) is not a security boundary on its own, since
 * actions are reachable directly by anyone who can send the same POST.
 * Every admin mutation must call this itself.
 */
export async function requireAdmin(): Promise<string> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const role = await getCurrentUserRole();
  if (role !== "admin") {
    throw new Error("Forbidden");
  }

  return userId;
}
