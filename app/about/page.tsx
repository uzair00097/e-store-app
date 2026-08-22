import type { Metadata } from "next";

import { siteConfig } from "@/lib/site-config";
import { Container } from "@/components/layout/container";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <Container className="flex max-w-3xl flex-col gap-4 py-16">
      <h1 className="font-heading text-3xl font-semibold tracking-tight">
        About {siteConfig.name}
      </h1>
      <p className="text-sm leading-relaxed text-muted-foreground">
        {siteConfig.name} is a demo storefront built to showcase a
        production-shaped e-commerce stack -- content managed in Sanity,
        authentication and roles via Clerk, and payments through Stripe. It
        isn&apos;t a real business; every product, price, and order you see
        here exists to demonstrate how the pieces fit together end to end.
      </p>
    </Container>
  );
}
