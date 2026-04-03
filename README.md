# GTM Planner — AI-Powered Go-To-Market Strategy Tool

Enter a website URL. AI researches the company, asks up to 5 clarifying questions, then executes a complete 9-step GTM strategy validated against real sales databases.

## What it does

| Step | Output |
|---|---|
| Research | Company profile extracted from your website |
| Target Markets | Up to 5 best markets ranked by urgency, importance, macro trends |
| Industry Priority | Per-market: pain points, what you offer, how you work together |
| ICP | Firmographics + buyer personas per industry (Apollo-ready filters) |
| Segmentation | Size / geo / industry segments with tier priorities |
| Market Sizing | Real TAM/SAM/SOM from Apollo.io or Clay (not AI estimates) |
| Competitive Analysis | Per-segment competitor matrix: domain, location, value prop, where you win |
| Positioning | Geoffrey Moore statement + per-segment differentiation |
| Manifesto | Tagline, elevator pitch, messaging pillars |

## Tech stack

- **Next.js 16** (App Router) + TypeScript
- **Inngest** — durable workflow orchestration (each step resumable on failure)
- **Vercel AI SDK** — multi-provider LLM support with streaming
- **Firecrawl** — URL scraping with JS rendering
- **Apollo.io + Clay** — real market sizing validation
- **Prisma + PostgreSQL** — project persistence
- **NextAuth.js** — email magic link + Google OAuth
- **shadcn/ui + Tailwind CSS** — UI components

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

| Variable | Where to get it |
|---|---|
| `DATABASE_URL` | [Neon](https://neon.tech) free tier — create project, copy connection string |
| `NEXTAUTH_SECRET` | Run: `openssl rand -base64 32` |
| `ENCRYPTION_SECRET` | Any 32-character random string |
| `FIRECRAWL_API_KEY` | [firecrawl.dev](https://firecrawl.dev) — free tier (500 scrapes/month) |
| `NEXTAUTH_URL` | `http://localhost:3000` for local dev |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Optional — [Google Console](https://console.cloud.google.com) OAuth 2.0 |

### 3. Create database tables

```bash
npx prisma migrate dev --name init
```

### 4. Run the app

You need two terminals:

```bash
# Terminal 1 — Next.js app
npm run dev

# Terminal 2 — Inngest dev server (required for workflow execution)
npx inngest-cli@latest dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Configure your API keys in the app

1. Sign in → **Settings**
2. Choose your LLM provider (OpenAI / Anthropic / Google Gemini) and paste your API key
3. Optionally add Apollo.io API key for real market sizing numbers

### 6. Create your first project

Click **New Project** → paste any website URL → the AI does the rest.

---

## LLM tiered routing

When you pick a provider, the system automatically routes tasks by complexity:

| Complexity | Tasks | OpenAI | Anthropic | Google |
|---|---|---|---|---|
| Complex | Strategy, competitive analysis, ICP, manifesto | gpt-4o | claude-opus-4-6 | gemini-2.0-pro |
| Medium | Segmentation, clarifying questions | gpt-4o-mini | claude-sonnet-4-6 | gemini-2.0-flash |
| Simple | Formatting, summaries | gpt-4o-mini | claude-haiku-4-5 | gemini-2.0-flash |

No configuration needed — it's automatic.

---

## Error handling

Every failure shows a typed error code and a plain-English reason:

- `SCRAPING_ERROR` — URL unreachable or blocked
- `LLM_INVALID_KEY` — bad API key in Settings
- `LLM_RATE_LIMIT` — provider rate limit hit (includes retry-after)
- `APOLLO_AUTH_ERROR` — bad Apollo API key
- `APOLLO_RATE_LIMIT` — Apollo rate limit
- `CLAY_TIMEOUT` — Clay search timed out
- `STEP_DEPENDENCY_ERROR` — a required prior step hasn't completed

---

## Market sizing without Apollo

Steps still complete successfully. TAM/SAM/SOM will show 0 until you add an Apollo.io or Clay API key in Settings. Everything else in the strategy is fully functional without database keys.

---

## Workflow resilience

Workflows are durable via Inngest. If a step fails mid-run, it resumes from that step on the next trigger — it does not restart the entire 9-step workflow from scratch.
