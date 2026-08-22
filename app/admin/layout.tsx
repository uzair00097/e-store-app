import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import { getCurrentUserRole } from "@/lib/rbac";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Resource-based auth check (Clerk's current guidance, replacing
  // centralized middleware route matching): redirects to sign-in if
  // signed out.
  await auth.protect();

  // Authorization: signed in but wrong role -> redirect home.
  // (notFound() was tried here first, but Next.js has a known issue
  // where notFound() thrown from a layout.tsx renders the right UI but
  // doesn't propagate the 404 HTTP status -- verified with a real signed-in
  // non-admin request. redirect() from a layout does return the correct
  // status, confirmed by the same test.)
  const role = await getCurrentUserRole();
  if (role !== "admin") {
    redirect("/");
  }

  return <>{children}</>;
}
