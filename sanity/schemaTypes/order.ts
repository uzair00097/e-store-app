import { defineArrayMember, defineField, defineType } from "sanity";

import { ORDER_STATUSES } from "@/lib/order-status";

// Mirrors Stripe's payment lifecycle -- Stripe stays the source of truth,
// this field is for display/admin filtering only. Never write order state
// changes here without a corresponding Stripe event driving them.

export default defineType({
  name: "order",
  title: "Order",
  type: "document",
  fields: [
    defineField({
      name: "stripeSessionId",
      title: "Stripe Checkout Session ID",
      description:
        "Webhook idempotency key -- one order per session ID. Check for an existing document with this value before creating a new one.",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "stripePaymentIntentId",
      title: "Stripe Payment Intent ID",
      type: "string",
    }),
    defineField({
      name: "userId",
      title: "Clerk User ID",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "customerEmail",
      title: "Customer Email",
      type: "string",
    }),
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      options: {
        list: ORDER_STATUSES.map((value) => ({ title: value, value })),
      },
      initialValue: "pending",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "items",
      title: "Items",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          name: "orderItem",
          fields: [
            defineField({
              name: "product",
              title: "Product",
              type: "reference",
              to: [{ type: "product" }],
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: "productName",
              title: "Product Name",
              description:
                "Snapshot at purchase time, in case the product is later renamed or deleted.",
              type: "string",
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: "quantity",
              title: "Quantity",
              type: "number",
              validation: (Rule) => Rule.required().integer().positive(),
            }),
            defineField({
              name: "unitPrice",
              title: "Unit Price",
              description: "Snapshot at purchase time.",
              type: "number",
              validation: (Rule) => Rule.required().positive(),
            }),
          ],
          preview: {
            select: {
              title: "productName",
              subtitle: "quantity",
            },
          },
        }),
      ],
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: "subtotal",
      title: "Subtotal",
      type: "number",
      validation: (Rule) => Rule.required().positive(),
    }),
    defineField({
      name: "total",
      title: "Total",
      type: "number",
      validation: (Rule) => Rule.required().positive(),
    }),
    defineField({
      name: "currency",
      title: "Currency",
      type: "string",
      initialValue: "usd",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "createdAt",
      title: "Created At",
      type: "datetime",
      initialValue: () => new Date().toISOString(),
      validation: (Rule) => Rule.required(),
    }),
  ],
  orderings: [
    {
      title: "Created At, New First",
      name: "createdAtDesc",
      by: [{ field: "createdAt", direction: "desc" }],
    },
  ],
  preview: {
    select: {
      title: "stripeSessionId",
      subtitle: "status",
    },
  },
});
