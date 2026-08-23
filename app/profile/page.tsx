import { auth } from "@clerk/nextjs/server";
import { UserProfile } from "@clerk/nextjs";
import type { Metadata } from "next";

import { Container } from "@/components/layout/container";

export const metadata: Metadata = {
  title: "Your Profile",
  robots: { index: false, follow: false },
};

export default async function ProfilePage() {
  await auth.protect();

  return (
    <Container className="flex flex-1 flex-col items-center gap-6 py-10">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">
        Your profile
      </h1>
      <UserProfile routing="hash" />
    </Container>
  );
}
