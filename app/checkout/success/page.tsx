import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

import { formatPrice } from "@/lib/format";
import { stripe } from "@/lib/stripe/client";
import { ClearCartOnMount } from "@/components/cart/clear-cart-on-mount";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";

export default async function CheckoutSuccessPage(
  props: PageProps<"/checkout/success">,
) {
  const searchParams = await props.searchParams;
  const sessionId =
    typeof searchParams.session_id === "string"
      ? searchParams.session_id
      : undefined;
  if (!sessionId) notFound();

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.payment_status !== "paid") notFound();

  return (
    <Container className="flex flex-col items-center gap-4 py-24 text-center">
      <ClearCartOnMount />
      <CheckCircle2 className="size-10 text-primary" aria-hidden="true" />
      <h1 className="font-heading text-2xl font-semibold tracking-tight">
        Thanks for your order!
      </h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Your payment of {formatPrice((session.amount_total ?? 0) / 100)} was
        successful. A confirmation has been recorded against your account.
      </p>
      <Button render={<Link href="/shop" />} nativeButton={false}>
        Continue shopping
      </Button>
    </Container>
  );
}
