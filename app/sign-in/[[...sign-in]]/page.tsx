import { SignIn } from "@clerk/nextjs";

import { Container } from "@/components/layout/container";

export default function SignInPage() {
  return (
    <Container className="flex flex-1 items-center justify-center py-16">
      <SignIn />
    </Container>
  );
}
