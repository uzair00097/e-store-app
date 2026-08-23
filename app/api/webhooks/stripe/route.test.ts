import { beforeEach, describe, expect, it, vi } from "vitest";

const mockHeadersGet = vi.fn();
vi.mock("next/headers", () => ({
  headers: () => Promise.resolve({ get: mockHeadersGet }),
}));

const mockConstructEvent = vi.fn();
const mockListLineItems = vi.fn();
vi.mock("@/lib/stripe/client", () => ({
  stripe: {
    webhooks: {
      constructEvent: (...args: unknown[]) => mockConstructEvent(...args),
    },
    checkout: {
      sessions: {
        listLineItems: (...args: unknown[]) => mockListLineItems(...args),
      },
    },
  },
}));

const mockFetch = vi.fn();
const mockCreate = vi.fn();
vi.mock("@/lib/sanity/write-client", () => ({
  writeClient: {
    fetch: (...args: unknown[]) => mockFetch(...args),
    create: (...args: unknown[]) => mockCreate(...args),
  },
}));

import { POST } from "./route";

function makeRequest(body = "{}") {
  return { text: () => Promise.resolve(body) } as unknown as Request;
}

describe("Stripe webhook handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
  });

  it("rejects when the stripe-signature header is missing", async () => {
    mockHeadersGet.mockReturnValue(null);
    const res = await POST(makeRequest());
    expect(res.status).toBe(400);
    expect(mockConstructEvent).not.toHaveBeenCalled();
  });

  it("rejects when STRIPE_WEBHOOK_SECRET is not configured", async () => {
    mockHeadersGet.mockReturnValue("sig");
    delete process.env.STRIPE_WEBHOOK_SECRET;
    const res = await POST(makeRequest());
    expect(res.status).toBe(400);
  });

  it("rejects a request with an invalid signature", async () => {
    mockHeadersGet.mockReturnValue("bad-sig");
    mockConstructEvent.mockImplementation(() => {
      throw new Error("signature mismatch");
    });

    const res = await POST(makeRequest());

    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Invalid signature");
  });

  it("acknowledges but ignores unrelated event types", async () => {
    mockHeadersGet.mockReturnValue("sig");
    mockConstructEvent.mockReturnValue({
      type: "customer.created",
      data: { object: {} },
    });

    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    expect(mockFetch).not.toHaveBeenCalled();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("does not fulfill a session whose payment is still unpaid (async payment pending)", async () => {
    mockHeadersGet.mockReturnValue("sig");
    mockConstructEvent.mockReturnValue({
      type: "checkout.session.completed",
      data: { object: { id: "cs_1", payment_status: "unpaid" } },
    });

    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    expect(mockFetch).not.toHaveBeenCalled();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("is idempotent: a retried delivery for an already-fulfilled session does not create a duplicate order", async () => {
    mockHeadersGet.mockReturnValue("sig");
    mockConstructEvent.mockReturnValue({
      type: "checkout.session.completed",
      data: { object: { id: "cs_1", payment_status: "paid" } },
    });
    mockFetch.mockResolvedValue("order_existing_id");

    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("creates an order from line items on first delivery of a paid session", async () => {
    mockHeadersGet.mockReturnValue("sig");
    mockConstructEvent.mockReturnValue({
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_1",
          payment_status: "paid",
          payment_intent: "pi_1",
          metadata: { userId: "user_1" },
          customer_details: { email: "a@b.com" },
          amount_subtotal: 1999,
          amount_total: 1999,
          currency: "usd",
        },
      },
    });
    mockFetch.mockResolvedValue(null);
    mockListLineItems.mockResolvedValue({
      data: [
        {
          id: "li_1",
          description: "Widget",
          quantity: 2,
          price: {
            unit_amount: 999,
            product: { deleted: false, metadata: { productId: "prod_1" } },
          },
        },
      ],
    });

    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    expect(mockCreate).toHaveBeenCalledTimes(1);

    const orderDoc = mockCreate.mock.calls[0][0];
    expect(orderDoc).toMatchObject({
      _type: "order",
      stripeSessionId: "cs_1",
      stripePaymentIntentId: "pi_1",
      userId: "user_1",
      customerEmail: "a@b.com",
      status: "paid",
      subtotal: 19.99,
      total: 19.99,
      currency: "usd",
    });
    expect(orderDoc.items).toEqual([
      {
        _type: "orderItem",
        _key: "li_1",
        product: { _type: "reference", _ref: "prod_1" },
        productName: "Widget",
        quantity: 2,
        unitPrice: 9.99,
      },
    ]);
  });

  it("fulfills an async payment method's delayed success event the same as a completed session", async () => {
    mockHeadersGet.mockReturnValue("sig");
    mockConstructEvent.mockReturnValue({
      type: "checkout.session.async_payment_succeeded",
      data: {
        object: {
          id: "cs_2",
          payment_status: "paid",
          amount_subtotal: 500,
          amount_total: 500,
          currency: "usd",
        },
      },
    });
    mockFetch.mockResolvedValue(null);
    mockListLineItems.mockResolvedValue({ data: [] });

    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  it("throws when a line item's product is missing productId metadata", async () => {
    mockHeadersGet.mockReturnValue("sig");
    mockConstructEvent.mockReturnValue({
      type: "checkout.session.completed",
      data: { object: { id: "cs_1", payment_status: "paid" } },
    });
    mockFetch.mockResolvedValue(null);
    mockListLineItems.mockResolvedValue({
      data: [
        { id: "li_1", price: { product: { deleted: false, metadata: {} } } },
      ],
    });

    await expect(POST(makeRequest())).rejects.toThrow(/missing a productId/);
    expect(mockCreate).not.toHaveBeenCalled();
  });
});
