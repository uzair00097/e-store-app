import { createClient } from "next-sanity";

import { apiVersion, dataset, projectId } from "@/lib/sanity/env";

// Authenticated with SANITY_API_TOKEN for order writes -- the webhook
// handler is the only thing that should import this. Never use it for
// storefront reads; lib/sanity/client.ts is the read-only client for that.
export const writeClient = createClient({
  projectId,
  dataset,
  apiVersion,
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});
