import type { Metadata } from "next";

// app/cart/page.tsx is a Client Component (Zustand cart state), and
// metadata exports only work in Server Components -- a layout is the
// smallest way to attach metadata to a client page.
export const metadata: Metadata = {
  title: "Cart",
  robots: { index: false, follow: false },
};

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
