import { SignUp } from "@clerk/nextjs";
import type { Metadata } from "next";

import { Container } from "@/components/layout/container";

export const metadata: Metadata = {
  title: "Sign Up",
  robots: { index: false, follow: false },
};

export default function SignUpPage() {
  return (
    <Container className="flex flex-1 items-center justify-center py-16">
      <SignUp />
    </Container>
  );
}
