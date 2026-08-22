# E-Commerce Portfolio Project Specification (Spec-Driven Development)


## Vision

Build a production-quality e-commerce application that showcases
full-stack engineering skills using modern technologies and best
practices. The project is intended for a professional portfolio.

**Guiding principle for v1**: a fully finished, polished 80% of scope
beats an ambitious, half-working 100%. Depth and completeness on core
flows (browse → cart → checkout → order history) matter more to a
reviewer than feature breadth.

## Objectives

- Production-ready architecture
- Excellent SEO (target Lighthouse SEO: 100)
- Responsive across mobile, tablet, desktop
- Strong accessibility (WCAG 2.1 AA)
- Clean, scalable codebase
- Secure authentication and authorization
- CMS-driven content
- Stripe payment integration

## Tech Stack

- Next.js 16 (App Router) — updated from the original 15 lock on
  2026-08-22 once 16 was stable; see note under Authentication/RBAC
  re: `middleware.ts` → `proxy.ts` rename in v16, relevant for Phase 3.
- TypeScript
- Tailwind CSS v4
- shadcn/ui
- Sanity CMS
- **Auth provider: Clerk** (locked — see Authentication section for
  rationale)
- Stripe
- Zustand
- Zod
- Framer Motion (use sparingly — see Performance Requirements)
- Resend
- Vercel
- Anthropic API (Claude Haiku 4.5) — powers the AI Chatbot Assistant,
  via tool use and streaming
- Upstash Redis (`@upstash/ratelimit`) — rate limiting for `/api/chat`
- Sentry (free tier) — error monitoring/observability

------------------------------------------------------------------------

# Functional Requirements

## v1 Scope (build this first, finish it fully)

### Public
- Home
- Shop
- Categories
- Product Details
- Search
- About
- Contact
- Privacy & Terms

### Customer
- Register / Login
- Manage Profile
- Cart
- Checkout
- Order History
- AI Chatbot Assistant (see dedicated section below)

### Admin
- Dashboard
- Product CRUD
- Category CRUD
- Order Management

## v2 / Future Enhancements (deferred from original v1 list)

Moved here because they add CMS schema and UI surface area without
demonstrating meaningfully new engineering skills beyond what's already
covered by Product CRUD and the checkout flow — better to ship a
complete v1 first and add these if time allows.

- Wishlist
- Reviews (needs a moderation story before going live — Sanity has no
  native spam/abuse protection for user-generated content)
- Coupon Management (use Stripe's built-in promotion codes instead of
  custom logic — far less work for the same outcome)
- Blog + Blog Management
- Homepage Content Management (start with a few hardcoded/Sanity
  singleton sections instead of a fully dynamic page builder)
- FAQ page
- AI search
- Product recommendations
- Multi-language
- Multi-currency
- Inventory alerts
- Email notifications beyond auth (order confirmation is v1; marketing
  emails are v2)
- Analytics dashboard
- Persistent chat history (see AI Chatbot Assistant — deferred, see
  rationale below)

------------------------------------------------------------------------

# Authentication

## Provider Decision: Clerk (locked)

Chosen over Auth.js/NextAuth for this project. Rationale: Auth.js's
"more control" advantage (custom session/JWT handling) is invisible
to a portfolio reviewer — they will never inspect your token refresh
logic. What they *will* see is whether OAuth works flawlessly on the
first demo attempt. Clerk's hosted UI and faster setup free up time
to spend on the chatbot's tool-use quality, which is visible and
differentiating. This decision is locked before Phase 1 so
`middleware.ts` and folder structure can be designed around it from
the start, rather than left ambiguous into Phase 3.

## Supported Methods
- Email & Password
- Google
- GitHub

## Features
- Email verification
- Password reset
- Session management

------------------------------------------------------------------------

# Authorization (RBAC)

Roles:
- Guest
- Customer
- Admin

Protected Routes:
- `/profile`
- `/orders`
- `/checkout`
- `/admin/**`

(`/wishlist` removed from v1 protected routes since Wishlist is
deferred to v2.)

------------------------------------------------------------------------

# Data Model Notes

- **Products, Categories**: Sanity documents.
- **Orders**: Sanity documents, linked to the authenticated user's ID
  and the Stripe payment/session ID. Source of truth for payment status
  is Stripe (via webhook), mirrored into Sanity for display.
- **Coupons (v2)**: Stripe promotion codes, not a custom Sanity schema.
- **Reviews (v2)**: Sanity documents with a `status` field
  (pending/approved/rejected) for manual moderation before public
  display.

## Stripe Webhook Idempotency

Stripe retries webhook deliveries on timeout or non-2xx response,
so `checkout.session.completed` may be received more than once for
the same order. The webhook handler must:
- Verify the Stripe signature before processing (standard practice).
- Check whether an order document for the given Stripe session ID
  already exists in Sanity before writing — no-op safely on a
  duplicate delivery instead of creating a second order or
  re-triggering fulfillment/confirmation emails.

This matters concretely for a demo: a reviewer refreshing mid-checkout
or a flaky network retry should never result in a duplicate order.

------------------------------------------------------------------------

# AI Chatbot Assistant

## Availability
Available to all visitors — bottom-right floating widget, present on
every page.
- **Guests**: generic Q&A, catalog search, current discounts.
- **Signed-in customers**: everything guests get, plus personalized
  recommendations based on their search history, plus order status
  lookup.

## Model Choice

**Claude Haiku 4.5** is the default model for this feature. Catalog
Q&A and order-status lookups are high-volume, low-complexity,
tool-calling tasks — not deep reasoning — so Haiku is the right
cost/latency tradeoff. Escalate to Sonnet only if evaluation testing
(see Testing section below) surfaces quality issues Haiku can't
handle. Document this choice in the README as a deliberate
engineering decision, ideally with a short before/after comparison
from testing both models.

## Behavior

- **Proactive**: surfaces unprompted nudges (e.g. "Still looking for
  running shoes? Here's 20% off ones you viewed").
  - **Trigger logic (locked)**: time-on-page + idle detection — e.g.,
    45 seconds on a product page with no scroll or click activity.
    Chosen over exit-intent (unreliable on mobile, no mouse/viewport
    boundary to detect) and over cart-abandonment-only triggers
    (depends on cart persistence timing not yet specced). Cart
    abandonment can be a secondary trigger once cart persistence
    behavior is defined, but is not required for v1.
  - **Cooldown**: max one nudge per session, regardless of trigger
    type.
- **Reactive**: answers free-form questions about products, order
  status (customers only), shipping/returns policy, and current
  promotions.

## Architecture

### UI
Floating widget component (Zustand for open/close + message state),
built with shadcn/ui primitives.
- Show a lightweight status indicator during the gap between "model
  decided to call a tool" and "first token of the follow-up response
  streams in" (e.g. "Searching products…"). Without this, tool-use
  turns include a silent pause that reads as broken.
- Optionally surface *what* was searched (e.g. a small "🔍 searched:
  running shoes" chip) for transparency and to make the live-data
  grounding visible to a reviewer during a demo — this is a good,
  low-effort trust-building detail.

### Backend
Next.js Route Handler (`/api/chat`) calling the Anthropic API via the
official SDK's streaming helper (`client.messages.stream()`), not a
hand-rolled SSE parser.

**Streaming + tool-use loop**: tool use interrupts a naive
token-by-token stream — when Claude decides to call a tool, the
response stops with a `tool_use` stop reason instead of completing.
The route handler needs an explicit loop:

1. Stream the response.
2. If the stop reason is `tool_use`, pause streaming to the client,
   execute the requested tool(s) server-side.
3. Append the `tool_result` to the message history and re-stream.
4. Repeat until a normal `end_turn` stop reason is reached.

Cap this loop at **4 iterations** — if the model hasn't reached a
final answer after 4 tool calls, terminate the loop and return a
graceful fallback message rather than looping indefinitely (cost and
latency guardrail, not just a UX nicety).

### Rate Limiting

`/api/chat` is reachable by unauthenticated guests and calls a paid
LLM API — it needs concrete guardrails, implemented before this ships
to any public URL, not as a post-launch hardening pass:

- **Mechanism**: Upstash Redis + `@upstash/ratelimit` on Vercel edge
  middleware. Per-IP limit for guests, per-user limit for signed-in
  customers (signed-in gets a higher cap since they're identified).
- **`max_tokens` cap** on every response — e.g. 500–800. Chatbot
  answers should be concise, not essays; this also bounds
  per-request cost directly.
- **Tool-result size limits** — truncate product descriptions and cap
  result counts (e.g. `search_products` returns at most 5 items)
  before they re-enter the model's context, regardless of what the
  model requested. Don't trust a model-supplied limit parameter —
  enforce the cap server-side.
- **Conversation-length cap** — after N turns (e.g. 20), end the
  session or summarize/reset context. Each turn re-sends full
  history, so cost grows roughly quadratically with an unbounded
  conversation.

### Grounding via Tool Use (not prompt-stuffing)

The model calls tools to fetch live data instead of relying on static
or injected context. Tool availability is **conditionally built per
request based on session state** — an unauthenticated request's
`tools` array simply does not include `get_user_search_history` or
`get_order_status` at all. This is a stronger boundary than "the tool
checks the session internally and refuses," because the model
literally cannot reference a tool that isn't offered to it, rather
than being trusted to decline calling one it technically has access
to.

**Tool signatures:**

- **`search_products(query: string, category?: string)`**
  → GROQ query against Sanity, **parameterized** (using GROQ's
  `params` object, never string-concatenating user/model input
  directly into the query string — this is the GROQ-injection
  guardrail). Returns id, name, price, stock count, image URL.
  Server enforces a hard cap of 5 results regardless of any
  model-requested limit.

- **`get_active_discounts(productId?: string)`**
  → Current discount/coupon documents, optionally filtered to one
  product so the model isn't always pulling the full discounts table.

- **`get_user_search_history()`** — **zero parameters.**
  Pulls `userId` from the server-side session inside the route
  handler. Absent entirely from the tool list for guest requests.

- **`get_order_status()`** — **zero parameters.**
  Same pattern: pulls `userId` from the server-side session, never
  accepts an order ID or user ID as a model-supplied argument. This
  is the most security-sensitive tool in the system — the constraint
  that it takes zero identity arguments must be enforced in code, not
  just in the system prompt, so a cleverly-phrased request (or a
  stray ID surfaced from another tool's result) can never be used to
  look up someone else's order. Absent entirely from the tool list
  for guest requests, rather than returning "no results" — don't give
  the model the option to even attempt the call.

**Tool failure handling**: if a tool call fails (Sanity timeout,
query error), return a `tool_result` that explicitly states the
failure (e.g. `{ "error": "search unavailable" }`). The system prompt
instructs the model to tell the user honestly that it couldn't
retrieve the information, rather than filling the gap with a
plausible-sounding guess.

## Data Model

- **`searchLog`** (new Sanity document type): `userId` (nullable for
  guests), `query`, `productId` (if a result was clicked),
  `timestamp`. Guest search history is kept client-side
  (localStorage) instead of in Sanity, and passed to `/api/chat` as
  request context. No PII beyond search terms is stored client-side,
  and it should be trivially clearable from the widget (a "clear my
  history" affordance is enough — this doesn't need to be
  over-engineered for a portfolio project, just shown to have been
  considered).
- **Personalization** = querying `searchLog` for a signed-in user's
  most frequent terms/products, joined against current stock and
  active discounts.
- **Chat history persistence (locked: ephemeral for v1)** — chat
  state lives in Zustand and clears on tab close; it is not persisted
  to Sanity or any database. Persisting it would require a new schema
  and a new protected data-access pattern without demonstrating any
  new skill beyond what Order History already covers. Revisit as a
  v2 item if there's time.

## Guardrails

- Chatbot must not fabricate prices, stock levels, or discount codes —
  every factual claim about the catalog comes from a tool call result
  in that turn, never from the model's general knowledge. The system
  prompt states this explicitly: never state a price, stock count, or
  discount without a tool result backing it in the current turn; if a
  tool returns empty or errors, say so rather than guessing.
- Order/account data access is strictly scoped to the authenticated
  session via the zero-argument tool pattern above — the chatbot must
  never be *able* to answer questions about another customer's orders
  or personal data, not merely instructed not to.
- **Prompt-injection via product data**: product names/descriptions
  originate from Sanity (admin-only CRUD in v1, so the practical risk
  is low), but since tool results are fed back into the model's
  context, the system prompt should state that tool results are data,
  not instructions, and the model must never follow directives
  embedded inside product descriptions or other tool output. Worth
  speccing now even at low real risk — it demonstrates awareness of a
  live area of LLM-application security that's frequently overlooked.
- Proactive nudges respect a cooldown (max one nudge per session).
- `/api/chat` is rate-limited, token-capped, and result-capped (see
  Architecture) — an open, unmetered endpoint calling a paid LLM API
  is a cost/abuse risk, not just a performance concern.

## Testing the Chatbot

Standard Playwright/Vitest coverage doesn't naturally catch
hallucination or cross-user data leakage, so this feature needs its
own testing approach in addition to the general Testing section:

- **Unit tests** for tool functions in isolation (e.g., given a mock
  GROQ result, does `search_products` shape and truncate it
  correctly) — deterministic, no live API calls needed.
- **Manual eval set** — a written list of 10–15 scripted prompts run
  by hand before demo day, not part of CI:
  - Factual grounding: "what's the price of X" — verify the answer
    matches a real tool result, not a guess.
  - Cross-user isolation: as user A, attempt to ask about user B's
    order via various phrasings — verify it never succeeds and never
    even attempts the tool call for a guest.
  - Injection resistance: a product description containing an
    embedded instruction — verify the model doesn't follow it.
  - Empty/error states: ask about a nonexistent product or force a
    tool error — verify an honest "couldn't find that" response.
  - Document results in the README (e.g. "manually verified against
    N adversarial prompts covering cross-user order access, price
    hallucination, and prompt injection via product content") — this
    is disproportionately high-signal for a reviewer skimming the
    repo.

## Open Questions (resolved)

- ~~Nudge trigger logic~~ → **Locked**: time-on-page + idle detection.
- ~~Chat history persistence~~ → **Locked**: ephemeral for v1,
  deferred to v2.

------------------------------------------------------------------------

# SEO Requirements

- Dynamic Metadata
- Open Graph
- Twitter Cards
- Canonical URLs
- Sitemap.xml
- robots.txt
- JSON-LD (Product, Organization, Breadcrumb)
- Semantic HTML
- Optimized images
- Clean URLs

(FAQ JSON-LD removed from v1 since the FAQ page moved to v2.)

------------------------------------------------------------------------

# Performance Requirements

Target Lighthouse (goals, not guarantees — see note below):
- Performance: 95+
- Accessibility: 100
- Best Practices: 100
- SEO: 100

**Note**: Perfect scores across all four categories simultaneously is
an aggressive target. Framer Motion and third-party embeds (auth
widget, Stripe.js, chatbot widget) carry a JS cost that can work
against Performance — treat these numbers as a bar to optimize toward
during Phase 11 (SEO & Performance), not a blocking requirement for
every PR along the way.

Use:
- Server Components
- Lazy Loading
- Dynamic Imports
- Image Optimization
- Font Optimization

------------------------------------------------------------------------

# Non-Functional Requirements

- Mobile-first design
- WCAG 2.1 AA accessibility
- Type-safe code
- Reusable components
- Error boundaries
- Loading and empty states
- Secure environment variables

------------------------------------------------------------------------

# Observability

- **Sentry (free tier)** for error monitoring in production. Error
  boundaries without any way to see what actually broke in production
  are only half a solution — this closes that gap with minimal setup
  cost.
- Scope: capture unhandled exceptions on both client and server
  (including `/api/chat` and the Stripe webhook handler, where a
  silent failure is costliest).

------------------------------------------------------------------------

# Environment & Secrets

- All required environment variables (Stripe keys, Sanity project
  ID/token, Anthropic API key, Clerk keys, Upstash Redis credentials,
  Sentry DSN, Resend API key) are documented in a committed
  `.env.example` file with placeholder values.
- Real values are never committed — `.env.local` is gitignored.
- README includes a short "Setup" section listing which service
  accounts are needed (Stripe, Sanity, Anthropic, Clerk, Upstash,
  Sentry, Resend) so a reviewer or future collaborator can stand the
  project up from scratch.

------------------------------------------------------------------------

# Testing

- **Unit/Integration**: Vitest, focused on utility functions, cart
  logic, price/tax calculations, and chatbot tool functions in
  isolation — not broad coverage for its own sake.
- **E2E**: Playwright, covering the two flows that matter most to a
  reviewer: full checkout (browse → cart → pay → order confirmation)
  and auth (register → login → access protected route → logout).
- **Chatbot**: manual eval set, see AI Chatbot Assistant § Testing
  the Chatbot above — not automated in CI, but documented in the
  README.

------------------------------------------------------------------------

# CI

- GitHub Actions workflow running on every PR: lint, typecheck, and
  Vitest unit tests as required checks before merge.
- Playwright E2E can run in the same workflow or as a separate,
  slower job — either is fine for v1, but it should run somewhere in
  CI, not only locally. This is disproportionately high-signal for a
  reviewer: it's the difference between "wrote tests" and "tests
  actually gate merges."
- Add this as part of Phase 1 (Project Setup) so it exists from the
  first PR onward, not bolted on during Phase 12.

------------------------------------------------------------------------

# Folder Structure

``` text
app/
  api/
    chat/
    webhooks/
      stripe/
components/
lib/
hooks/
store/
types/
sanity/
proxy.ts
.env.example
.github/
  workflows/
```

**Next.js 16 note**: the `middleware.ts` filename/export is deprecated in
favor of `proxy.ts` exporting `proxy()`. The `edge` runtime is not
supported under the `proxy` convention (nodejs only) — confirm Clerk's
`clerkMiddleware()` guidance is compatible with `nodejs` runtime before
Phase 3; fall back to the legacy `middleware.ts` convention only if
Clerk still requires the edge runtime at that point.

------------------------------------------------------------------------

# Development Phases

1.  Project Setup (includes CI workflow, `.env.example`)
2.  Design System
3.  Authentication & RBAC (Clerk — decision already locked, no delay)
4.  Sanity CMS
5.  Storefront
6.  Cart
7.  Stripe Checkout (includes webhook idempotency handling)
8.  Customer Dashboard
9.  AI Chatbot Assistant
10. Admin Dashboard (Product/Category/Order only)
11. SEO & Performance
12. Testing
13. Deployment

**Rationale for chatbot placement**: the chatbot is not on the
critical path from browse → cart → checkout → order history. Building
it after the core commerce flow is functional keeps the guiding
principle ("a fully finished 80% beats a half-working 100%") from
being undercut by time sunk into an open-ended feature before the
flows reviewers care most about are done. With trigger logic and
persistence now locked in this version, Phase 9 has no remaining open
design questions blocking implementation.

------------------------------------------------------------------------

# Git Convention

- Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, etc.)
- One feature/phase per branch, squash-merged into `main`
- No direct commits to `main`
- CI checks (lint, typecheck, unit tests) must pass before merge

------------------------------------------------------------------------

# Acceptance Criteria

- Fully responsive
- Authentication working (Clerk)
- Authorization enforced
- Stripe payments functional, webhook idempotent against retries
- Sanity content editable
- AI chatbot answers grounded in real catalog/discount data (no
  hallucinated prices or stock), verified against the manual
  adversarial eval set
- Chatbot cannot access another user's order/account data under any
  tested phrasing
- Lighthouse goals achieved (or documented gap with rationale)
- Clean Git history (Conventional Commits, squash-merged PRs, CI
  passing on all merges)
- Error monitoring in place (Sentry)
- Deployed on Vercel
- Professional README with screenshots, setup instructions, and
  chatbot eval documentation

------------------------------------------------------------------------

# Future Enhancements

See the v2 list under Functional Requirements above.