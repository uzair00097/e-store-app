import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/site-config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/admin/",
        "/studio",
        "/studio/",
        "/cart",
        "/checkout",
        "/checkout/",
        "/profile",
        "/orders",
        "/sign-in",
        "/sign-in/",
        "/sign-up",
        "/sign-up/",
        "/api/",
      ],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
