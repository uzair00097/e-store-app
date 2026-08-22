import Link from "next/link";
import { Menu, Store } from "lucide-react";
import { Show, UserButton } from "@clerk/nextjs";

import { mainNav, siteConfig } from "@/lib/site-config";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Container } from "@/components/layout/container";

function AuthActions() {
  return (
    <>
      <Show when="signed-in">
        <UserButton />
      </Show>
      <Show when="signed-out">
        <Button variant="ghost" size="sm" render={<Link href="/sign-in" />} nativeButton={false}>
          Sign in
        </Button>
        <Button size="sm" render={<Link href="/sign-up" />} nativeButton={false}>
          Sign up
        </Button>
      </Show>
    </>
  );
}

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-heading text-lg font-semibold"
        >
          <Store className="size-5" aria-hidden="true" />
          {siteConfig.name}
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          <nav aria-label="Main navigation" className="flex items-center gap-6">
            {mainNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.title}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <AuthActions />
          </div>
        </div>

        <Sheet>
          <SheetTrigger
            render={
              <Button variant="ghost" size="icon" className="md:hidden" />
            }
          >
            <Menu className="size-5" aria-hidden="true" />
            <span className="sr-only">Open menu</span>
          </SheetTrigger>
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle>{siteConfig.name}</SheetTitle>
            </SheetHeader>
            <nav aria-label="Main navigation" className="flex flex-col gap-1 px-4">
              {mainNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-md px-2 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  {item.title}
                </Link>
              ))}
            </nav>
            <Separator />
            <div className="flex items-center gap-2 px-4">
              <AuthActions />
            </div>
          </SheetContent>
        </Sheet>
      </Container>
    </header>
  );
}
