import { defineField, defineType } from "sanity";

export default defineType({
  name: "searchLog",
  title: "Search Log",
  type: "document",
  fields: [
    defineField({
      name: "userId",
      title: "Clerk User ID",
      description:
        "Empty for guest searches -- guest history stays client-side (localStorage) and is never written here.",
      type: "string",
    }),
    defineField({
      name: "query",
      title: "Query",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "productId",
      title: "Clicked Product",
      description: "Set only if the user clicked a result from this search.",
      type: "reference",
      to: [{ type: "product" }],
    }),
    defineField({
      name: "timestamp",
      title: "Timestamp",
      type: "datetime",
      initialValue: () => new Date().toISOString(),
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: { title: "query", subtitle: "timestamp" },
  },
});
