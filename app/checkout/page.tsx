import { auth } from "@clerk/nextjs/server";

import { Container } from "@/components/layout/container";

export default async function CheckoutPage() {
  await auth.protect();

  return (
    <Container className="flex flex-1 flex-col items-center justify-center gap-2 py-24 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Checkout</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Checkout is built in a later phase. This placeholder confirms the
        route is protected -- only signed-in users can reach it.
      </p>
    </Container>
  );
}
