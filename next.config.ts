import type { NextConfig } from "next";
import path from "node:path";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  turbopack: {
    root: path.join(__dirname),
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
        pathname: "/images/**",
      },
    ],
  },
};

// withSentryConfig always injects a Turbopack rule that runs a legacy
// webpack-style loader against instrumentation-client.ts/instrumentation.ts
// to stamp in version metadata, regardless of whether Sentry itself is
// enabled. Under Turbopack that loader executes via a spawned Node
// subprocess, which some Windows setups fail to launch at all (exit code
// 0xc0000142), crashing `next dev` outright. Sentry is already gated to
// production-only via `enabled: NODE_ENV === "production"` in both
// instrumentation files, so this build-time wrapping buys dev nothing --
// only apply it for real builds.
export default process.env.NODE_ENV === "production"
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      // Only needed when actually uploading source maps (production builds
      // with SENTRY_AUTH_TOKEN set) -- keep local/CI builds without it quiet
      // instead of warning on every run.
      silent: !process.env.SENTRY_AUTH_TOKEN,
      widenClientFileUpload: true,
    })
  : nextConfig;
