import { createClient } from "next-sanity";

import { apiVersion, dataset, projectId } from "@/lib/sanity/env";

// Read-only client for storefront queries. Order writes (Phase 7's webhook)
// and any other mutation need a separate client authenticated with
// SANITY_API_TOKEN -- never reuse this one for writes.
export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: process.env.NODE_ENV === "production",
});
