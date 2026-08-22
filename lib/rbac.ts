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
