import { clerkMiddleware } from "@clerk/nextjs/server";

// Next.js 16 renamed the middleware convention to `proxy.ts` / `export proxy`.
// clerkMiddleware() still returns a plain NextMiddleware-shaped function, so
// this is a drop-in rename -- no Clerk-specific change required.
//
// Per Clerk's current guidance, this middleware does NOT gate protected
// routes (createRouteMatcher-based path matching is deprecated -- path
// matching can diverge from how Next.js actually resolves a request).
// Each protected page/layout calls auth.protect() itself instead; see
// app/profile, app/orders, app/checkout, app/admin.
export const proxy = clerkMiddleware();

export const config = {
  matcher: [
    "/((?!_next|.*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
