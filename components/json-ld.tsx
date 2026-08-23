export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // Data is server-controlled (site config + Sanity content, which only
      // admins can write) -- escaping `<` guards against breaking out of the
      // script tag if a value ever contains "</script>".
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
