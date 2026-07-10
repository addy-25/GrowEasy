# GrowEasy — AI-Powered CSV Importer

Upload **any** leads CSV — Facebook exports, Google Ads exports, hand-made spreadsheets, CRM dumps with arbitrary column names — and get back clean, structured records in the GrowEasy CRM format. An LLM handles the fuzzy column mapping; deterministic code enforces every hard rule.

**Live demo:** `<frontend-url>` &nbsp;·&nbsp; **API:** `<backend-url>`

---

## How it works

```
┌──────────┐   1. upload    ┌───────────┐   2. preview (no AI)   ┌─────────┐
│ any CSV  │ ─────────────▶ │  Next.js  │ ─────────────────────▶ │ Confirm │
└──────────┘  drag & drop   │  frontend │    virtualized table   └────┬────┘
                            └───────────┘                             │
                                  ▲                                   ▼ 3. POST /api/import
                                  │                          ┌────────────────┐
                       5. tables + totals                    │ Express backend│
                          + CSV download                     │  parse CSV     │
                                  │                          │  batch → LLM   │
                                  │        4. JSON           │  sanitize      │
                                  └────────────────────────  │  skip-rule     │
                                                             └────────────────┘
```

1. **Upload** — drag & drop or file picker. The file is parsed incrementally in the browser (streaming, row by row) so even huge files preview instantly.
2. **Preview** — raw rows in a virtualized table (sticky header, both-axis scrolling). No AI runs yet.
3. **Confirm** — only now is the file sent to the backend.
4. **AI extraction** — rows go to the LLM in batches through a worker pool with retry + exponential backoff. The model maps arbitrary columns (`"Full Name"`, `"Contact Number"`, `"Organisation"`…) onto the fixed CRM schema.
5. **Results** — imported and skipped records in separate tables, totals as stat cards, and a one-click **Download CSV** of the cleaned data.

## Design decision: AI for judgment, code for rules

The model is only trusted with what code cannot do — recognizing that `"Contact Number"` means `mobile_without_country_code`, or that *"Deal closed successfully"* means `SALE_DONE`. Every hard rule is then **re-enforced deterministically** in [`sanitize.ts`](backend/src/services/sanitize.ts), so a model mistake can never corrupt the output:

| Assignment rule | Where it's enforced |
|---|---|
| `crm_status` ∈ 4 allowed values | prompt **+** code guard (invalid → blanked) |
| `data_source` ∈ 5 allowed values, blank if unsure | prompt **+** code guard |
| `created_at` must survive JS `new Date()` | prompt **+** code validation (invalid → blanked, original kept in `crm_note`) |
| multiple emails/phones → first one, rest into `crm_note` | prompt **+** regex backstop in code |
| records stay single CSV rows (`\n` escaped) | code (`stripNewlines`) |
| skip records with neither email nor mobile | code filter after extraction |

The prompt itself is built from the same TypeScript constants the validators use ([`types.ts`](backend/src/types.ts)), so the model's instructions and the code's guardrails can never drift apart.

## Tech stack

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4
- **Backend:** Node.js, Express 5, TypeScript (strict), Multer, csv-parse
- **AI:** gpt-4o-mini via the OpenAI SDK — works with the official API or any OpenAI-compatible provider (`OPENAI_BASE_URL`)
- **Tests:** Vitest · **Packaging:** Docker (multi-stage) + docker-compose
- Stateless by design — no database required

## API

### `POST /api/import`
Multipart form upload, field name `file`, any valid CSV (column names are not assumed). Files over **2,000 rows** are rejected with `413` to keep demo costs bounded.

```json
{
  "records":       [ { "created_at": "...", "name": "...", "email": "...", "...": "..." } ],
  "skipped":       [ { "...": "records with neither email nor mobile" } ],
  "totalImported": 3,
  "totalSkipped":  1
}
```

### `GET /health`
`{ "status": "ok" }` — used by uptime monitors and deploy platforms.

## Running locally

Prerequisites: Node 20+, an OpenAI (or compatible) API key.

```bash
git clone https://github.com/addy-25/GrowEasy.git
cd GrowEasy

# backend
cd backend
cp .env.example .env        # then put your API key in .env
npm install
npm run dev                 # http://localhost:4000

# frontend (second terminal)
cd ../frontend
cp .env.example .env.local
npm install
npm run dev                 # http://localhost:3000
```

Try it with the included sample files: [`backend/sample-messy.csv`](backend/sample-messy.csv) (odd column names, combined city/state, multiple emails, a row with no contact info) and [`backend/sample-edge-cases.csv`](backend/sample-edge-cases.csv) (impossible dates, multiple phone numbers).

### Docker

```bash
docker compose up --build   # frontend :3000, backend :4000
```

The API key is read from `backend/.env` at runtime — it is never baked into an image.

### Tests

```bash
cd backend && npm test      # 18 unit tests over the sanitizer and CSV parser
```

The sanitizer tests double as a regression suite for the AI guardrails: every hard rule from the assignment has a test pinning its behavior.

## Performance notes

- **Batching:** rows are sent to the model 20 at a time; batches run through a fixed-size worker pool (`EXTRACTOR_CONCURRENCY`, default 1). On providers without per-key concurrency limits, raising it to 5+ parallelizes extraction almost linearly. Failed batches retry up to 3× with jittered exponential backoff.
- **Incremental parsing:** the browser preview streams the CSV row-by-row and stops after 1,000 rows — a 100 MB file costs the same to preview as a 1 KB one.
- **Virtualized preview table:** only the ~45 rows near the viewport exist in the DOM, so 1,000-row previews scroll at 60 fps.
- **Scaling path:** for very large imports the right architecture is two-phase — one LLM call to map *headers* to schema fields (plus one to map distinct status values), then a deterministic transform over all rows in code. That reduces 50,000 rows from ~2,500 model calls to ~2, at the cost of less per-row judgment. The current per-row design was chosen deliberately: it handles inconsistent data *within* a column (mixed date formats, notes containing phone numbers), which header-level mapping cannot.

## Bonus features implemented

- [x] Drag & drop upload
- [x] Loading states / progress indication during AI processing
- [x] Streaming (incremental) CSV parsing
- [x] Retry mechanism for failed AI batches (jittered exponential backoff)
- [x] Virtualized table for large CSVs (hand-rolled windowing)
- [x] Dark mode (persistent light/dark toggle, token-based theming)
- [x] Unit tests (18, Vitest)
- [x] Docker setup (multi-stage builds + compose)
- [x] Deployment (Vercel + Render)
- [x] This README

## Known limitations

- LLM output is probabilistic; guardrails blank anything invalid rather than let it through, and unparseable values are preserved in `crm_note` for human review.
- Hosted on free tiers — the first request after idle can take up to a minute while the backend wakes.
