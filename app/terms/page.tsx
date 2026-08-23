import type { Metadata } from "next";

import { siteConfig } from "@/lib/site-config";
import { Container } from "@/components/layout/container";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: `${siteConfig.name}'s terms of service.`,
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <Container className="flex max-w-3xl flex-col gap-4 py-16">
      <h1 className="font-heading text-3xl font-semibold tracking-tight">
        Terms of Service
      </h1>
      <p className="text-sm leading-relaxed text-muted-foreground">
        {siteConfig.name} is a demo storefront built for portfolio purposes.
        Any purchase flows use Stripe&apos;s test mode -- no real payment is
        processed, and no goods are actually shipped. This page exists to
        demonstrate a complete site structure, not as a real legal agreement.
      </p>
    </Container>
  );
}
