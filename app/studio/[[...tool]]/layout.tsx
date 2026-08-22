import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { NextStudioLayout } from "next-sanity/studio";

import { getCurrentUserRole } from "@/lib/rbac";

export { metadata, viewport } from "next-sanity/studio";

export default async function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Sanity Studio has its own project-member login, but gating the route the
  // same way as /admin keeps casual visitors from finding the CMS at all --
  // consistent with content originating from Sanity being admin-only CRUD.
  await auth.protect();

  const role = await getCurrentUserRole();
  if (role !== "admin") {
    redirect("/");
  }

  return <NextStudioLayout>{children}</NextStudioLayout>;
}
