"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Tags,
} from "lucide-react";

import { cn } from "@/lib/utils";

const adminNav = [
  { title: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { title: "Products", href: "/admin/products", icon: Package },
  { title: "Categories", href: "/admin/categories", icon: Tags },
  { title: "Orders", href: "/admin/orders", icon: ShoppingCart },
] as const;

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin navigation" className="flex flex-col gap-1">
      {adminNav.map((item) => {
        const active =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <item.icon className="size-4" aria-hidden="true" />
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
}
