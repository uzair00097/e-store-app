import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { writeClient } from "@/lib/sanity/write-client";
import { stripe } from "@/lib/stripe/client";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = (await headers()).get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json(
      { error: "Missing signature or webhook secret" },
      { status: 400 },
    );
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Delayed-notification payment methods (e.g. bank debits) fire
  // `checkout.session.completed` before the payment actually clears --
  // `payment_status` is still "unpaid" at that point, with confirmation
  // arriving later via `checkout.session.async_payment_succeeded`. Handle
  // both event types and gate fulfillment on payment_status so a card
  // payment (synchronous) and an async payment method both fulfill
  // exactly once, at the point they're actually paid.
  if (
    event.type !== "checkout.session.completed" &&
    event.type !== "checkout.session.async_payment_succeeded"
  ) {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object;
  if (session.payment_status === "unpaid") {
    return NextResponse.json({ received: true });
  }

  // Idempotency: Stripe retries this event on timeout/non-2xx, so a
  // duplicate delivery must no-op instead of creating a second order.
  const existingOrderId = await writeClient.fetch<string | null>(
    `*[_type == "order" && stripeSessionId == $sessionId][0]._id`,
    { sessionId: session.id },
  );
  if (existingOrderId) {
    return NextResponse.json({ received: true });
  }

  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
    expand: ["data.price.product"],
  });

  const orderItems = lineItems.data.map((lineItem) => {
    const product = lineItem.price?.product;
    const productId =
      product && typeof product !== "string" && !product.deleted
        ? product.metadata.productId
        : undefined;

    if (!productId) {
      throw new Error(
        `Line item ${lineItem.id} is missing a productId in its product metadata`,
      );
    }

    return {
      _type: "orderItem" as const,
      _key: lineItem.id,
      product: { _type: "reference" as const, _ref: productId },
      productName: lineItem.description ?? "Unknown product",
      quantity: lineItem.quantity ?? 1,
      unitPrice: (lineItem.price?.unit_amount ?? 0) / 100,
    };
  });

  await writeClient.create({
    _type: "order",
    stripeSessionId: session.id,
    stripePaymentIntentId:
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id,
    userId: session.metadata?.userId ?? "",
    customerEmail:
      session.customer_details?.email ?? session.customer_email ?? undefined,
    status: "paid",
    items: orderItems,
    subtotal: (session.amount_subtotal ?? 0) / 100,
    total: (session.amount_total ?? 0) / 100,
    currency: session.currency ?? "usd",
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ received: true });
}
