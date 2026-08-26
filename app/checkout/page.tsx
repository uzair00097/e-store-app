import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";

import { CheckoutSummary } from "@/components/checkout/checkout-summary";
import { Container } from "@/components/layout/container";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  await auth.protect();

  return (
    <Container className="flex flex-1 flex-col gap-6 py-10">
      <h1 className="font-heading text-2xl font-medium tracking-tight">
        Checkout
      </h1>
      <CheckoutSummary />
    </Container>
  );
}
