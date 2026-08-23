// Sanity's slug `source` option only auto-generates a slug from Studio's
// desk-tool UI, not on API writes -- the admin app must build one itself.
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
}
