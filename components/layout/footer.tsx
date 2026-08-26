import Link from "next/link";

import { footerNav, siteConfig } from "@/lib/site-config";
import { Separator } from "@/components/ui/separator";
import { Container } from "@/components/layout/container";
import { LogoMark } from "@/components/layout/logo";

export function Footer() {
  return (
    <footer className="border-t border-border">
      <Container className="flex flex-col gap-6 py-10">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <span className="flex items-center gap-2 font-heading text-base font-medium">
            <LogoMark className="size-7" />
            {siteConfig.name}
          </span>
          <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-6 gap-y-2">
            {footerNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.title}
              </Link>
            ))}
          </nav>
        </div>
        <Separator />
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} {siteConfig.name}. All rights
          reserved.
        </p>
      </Container>
    </footer>
  );
}
