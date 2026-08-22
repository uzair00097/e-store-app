# e-store-app

A full-stack e-commerce portfolio project. Built via spec-driven
development — the full spec lives at [`docs/e-store.md`](docs/e-store.md)
and is the source of truth for scope and architecture decisions.

**Status**: Phase 1 (Project Setup) in progress.

## Tech Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui ·
Sanity CMS · Clerk (auth) · Stripe · Zustand · Zod · Resend ·
Anthropic API (Claude Haiku 4.5, AI chatbot) · Upstash Redis
(rate limiting) · Sentry · Vercel

## Setup

### Prerequisites

- Node.js 20 or 22 (LTS)
- npm

### Install

```bash
npm install
```

### Environment variables

Copy `.env.example` to `.env.local` and fill in real values. You'll need
accounts with:

- **Clerk** — authentication
- **Sanity** — CMS (products, categories, orders)
- **Stripe** — payments
- **Anthropic** — AI chatbot (Claude Haiku 4.5)
- **Upstash** — Redis, for rate limiting `/api/chat`
- **Sentry** — error monitoring (free tier)
- **Resend** — transactional email (order confirmation)

```bash
cp .env.example .env.local
```

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command             | Description                          |
| -------------------- | ------------------------------------ |
| `npm run dev`         | Start dev server                     |
| `npm run build`       | Production build                     |
| `npm run start`       | Start production server              |
| `npm run lint`        | ESLint                               |
| `npm run typecheck`   | TypeScript, no emit                  |
| `npm test`            | Vitest unit/integration tests        |
| `npm run test:watch`  | Vitest in watch mode                 |
| `npm run e2e`         | Playwright E2E tests                 |

## Testing

- **Unit/Integration**: Vitest — utility functions, cart logic,
  price/tax calculations, chatbot tool functions in isolation.
- **E2E**: Playwright — checkout flow and auth flow (added in their
  respective phases).
- **Chatbot**: manual adversarial eval set, documented here once the
  AI Chatbot Assistant phase lands (see `docs/e-store.md` § AI Chatbot
  Assistant § Testing the Chatbot).

CI (`.github/workflows/ci.yml`) runs lint, typecheck, and unit tests on
every PR as required checks, plus a separate Playwright job.

## Project structure

```text
app/            Next.js App Router routes
components/     Shared UI components (shadcn/ui primitives in components/ui)
lib/            Utilities, shared logic
hooks/          Custom React hooks
store/          Zustand stores
types/          Shared TypeScript types
sanity/         Sanity schema and client
docs/           Project spec
e2e/            Playwright tests
```
