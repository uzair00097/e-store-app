import { defineCliConfig } from "sanity/cli";

// Only used by the standalone `sanity` CLI (e.g. `npx sanity deploy`), which
// has its own env loading and does not go through Next.js's tsconfig path
// aliases or its .env.local handling -- read process.env directly here
// rather than importing lib/sanity/env.
export default defineCliConfig({
  api: {
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  },
});
