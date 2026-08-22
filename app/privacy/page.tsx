import type { Metadata } from "next";

import { siteConfig } from "@/lib/site-config";
import { Container } from "@/components/layout/container";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <Container className="flex max-w-3xl flex-col gap-4 py-16">
      <h1 className="font-heading text-3xl font-semibold tracking-tight">
        Privacy Policy
      </h1>
      <p className="text-sm leading-relaxed text-muted-foreground">
        {siteConfig.name} is a demo storefront, not a live business -- this
        page exists to demonstrate a complete site structure, not as a real
        legal policy. No data collected here is sold or shared, and account
        data is limited to what&apos;s needed to demonstrate authentication,
        checkout, and order history.
      </p>
    </Container>
  );
}
