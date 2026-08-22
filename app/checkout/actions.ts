"use server";

import { auth, currentUser } from "@clerk/nextjs/server";

import { siteConfig } from "@/lib/site-config";
import { client } from "@/lib/sanity/client";
import { stripe } from "@/lib/stripe/client";

interface CheckoutItemInput {
  productId: string;
  quantity: number;
}

interface CheckoutProduct {
  _id: string;
  name: string;
  price: number;
  stock: number;
}

export async function createCheckoutSession(
  items: CheckoutItemInput[],
): Promise<{ url: string }> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("You must be signed in to check out.");
  }
  if (items.length === 0) {
    throw new Error("Your cart is empty.");
  }

  const user = await currentUser();

  // Re-fetch price/stock server-side -- never trust client-supplied
  // values, which would let a tampered request set its own price.
  const productIds = items.map((item) => item.productId);
  const products = await client.fetch<CheckoutProduct[]>(
    `*[_type == "product" && _id in $ids]{ _id, name, price, stock }`,
    { ids: productIds },
  );

  const lineItems = items.map((item) => {
    const product = products.find((p) => p._id === item.productId);
    if (!product) {
      throw new Error("One of the items in your cart is no longer available.");
    }
    if (item.quantity > product.stock) {
      throw new Error(`Only ${product.stock} of "${product.name}" left in stock.`);
    }
    return {
      price_data: {
        currency: "usd",
        product_data: {
          name: product.name,
          // Carried through to the webhook via listLineItems' product
          // expansion, so the order document can reference the real
          // Sanity product without trusting anything client-supplied.
          metadata: { productId: product._id },
        },
        unit_amount: Math.round(product.price * 100),
      },
      quantity: item.quantity,
    };
  });

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: lineItems,
    success_url: `${siteConfig.url}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteConfig.url}/checkout`,
    customer_email: user?.primaryEmailAddress?.emailAddress,
    metadata: { userId },
    // Fixed label (not regenerated per session) so the Dashboard can
    // attribute sessions from this integration point specifically.
    integration_identifier: "e-store-app-checkout-kqdzsloc",
  });

  if (!session.url) {
    throw new Error("Stripe did not return a checkout URL.");
  }

  return { url: session.url };
}
