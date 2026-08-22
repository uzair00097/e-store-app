import type { Metadata } from "next";

import { siteConfig } from "@/lib/site-config";
import { Container } from "@/components/layout/container";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <Container className="flex max-w-3xl flex-col gap-4 py-16">
      <h1 className="font-heading text-3xl font-semibold tracking-tight">
        Contact
      </h1>
      <p className="text-sm leading-relaxed text-muted-foreground">
        This is a demo project, so there&apos;s no real support line behind
        it. If you&apos;re reviewing {siteConfig.name} and have questions
        about how it was built, the source is the best place to look.
      </p>
    </Container>
  );
}
