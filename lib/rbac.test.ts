import { beforeEach, describe, expect, it, vi } from "vitest";

const mockAuth = vi.fn();
const mockGetUser = vi.fn();

vi.mock("@clerk/nextjs/server", () => ({
  auth: () => mockAuth(),
  clerkClient: () => Promise.resolve({ users: { getUser: mockGetUser } }),
}));

import { getCurrentUserRole, requireAdmin } from "./rbac";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getCurrentUserRole", () => {
  it("returns null for a signed-out visitor", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    expect(await getCurrentUserRole()).toBeNull();
    expect(mockGetUser).not.toHaveBeenCalled();
  });

  it("returns 'admin' when publicMetadata.role is admin", async () => {
    mockAuth.mockResolvedValue({ userId: "user_1" });
    mockGetUser.mockResolvedValue({ publicMetadata: { role: "admin" } });
    expect(await getCurrentUserRole()).toBe("admin");
  });

  it("defaults an unrecognized or missing role to 'customer'", async () => {
    mockAuth.mockResolvedValue({ userId: "user_1" });
    mockGetUser.mockResolvedValue({ publicMetadata: {} });
    expect(await getCurrentUserRole()).toBe("customer");

    mockGetUser.mockResolvedValue({ publicMetadata: { role: "superuser" } });
    expect(await getCurrentUserRole()).toBe("customer");
  });
});

describe("requireAdmin", () => {
  it("throws Unauthorized when signed out", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    await expect(requireAdmin()).rejects.toThrow("Unauthorized");
  });

  it("throws Forbidden for a signed-in non-admin", async () => {
    mockAuth.mockResolvedValue({ userId: "user_1" });
    mockGetUser.mockResolvedValue({ publicMetadata: { role: "customer" } });
    await expect(requireAdmin()).rejects.toThrow("Forbidden");
  });

  it("resolves with the userId for an admin", async () => {
    mockAuth.mockResolvedValue({ userId: "user_1" });
    mockGetUser.mockResolvedValue({ publicMetadata: { role: "admin" } });
    await expect(requireAdmin()).resolves.toBe("user_1");
  });
});
