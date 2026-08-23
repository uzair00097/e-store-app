import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";

import { getCurrentUserRole } from "@/lib/rbac";
import { Container } from "@/components/layout/container";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

// Every /admin/** page inherits this -- none of them set their own
// `robots`, so this is the single place that keeps the whole CRUD
// surface out of search results.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

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

  return (
    <Container className="flex flex-1 flex-col gap-6 py-8 md:flex-row md:gap-8">
      <aside className="shrink-0 md:w-48">
        <AdminSidebar />
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </Container>
  );
}
