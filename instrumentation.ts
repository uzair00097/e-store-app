import * as Sentry from "@sentry/nextjs";

// Sentry's Next.js SDK reads its server/edge config from this file's
// register() rather than separate sentry.server.config.ts /
// sentry.edge.config.ts files (deprecated). See instrumentation-client.ts
// for the browser-side init.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" || process.env.NEXT_RUNTIME === "edge") {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      tracesSampleRate: 1,
      enabled: process.env.NODE_ENV === "production",
    });
  }
}

export const onRequestError = Sentry.captureRequestError;
