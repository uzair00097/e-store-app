export const siteConfig = {
  name: "SnapCart",
  description:
    "A full-stack e-commerce storefront — browse, cart, and checkout with a curated catalog.",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
} as const;

export const mainNav = [
  { title: "Shop", href: "/shop" },
  { title: "Categories", href: "/categories" },
  { title: "About", href: "/about" },
  { title: "Contact", href: "/contact" },
] as const;

export const footerNav = [
  { title: "About", href: "/about" },
  { title: "Contact", href: "/contact" },
  { title: "Privacy Policy", href: "/privacy" },
  { title: "Terms of Service", href: "/terms" },
] as const;
