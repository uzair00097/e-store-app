// Sanity project connection details. Left un-thrown (unlike a strict assert)
// so `next build`/`tsc` stay green before real credentials are filled into
// .env.local -- the Studio itself will surface a clear config error if you
// visit /studio without them.
export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "";
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";
export const apiVersion =
  process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-01-01";
