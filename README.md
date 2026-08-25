# Scanimal

Multi-user dynamic QR codes and short links. One-click deploy to Cloudflare. **Your codes keep working forever, because you own the infrastructure.**

Users sign in with passkeys (magic-link fallback), create a short code, point it at any URL, download a styled QR code, and change the destination later without reprinting anything. Every scan is tracked.

Runs entirely on Cloudflare primitives: Workers, D1, KV, Analytics Engine, R2, and Email Sending.

## Requirements

- A Cloudflare account.
- **Workers Paid ($5/mo) is required for Cloudflare Email Sending** (magic links + emailed invites), and your sending domain must be on Cloudflare DNS. Don't want that? Two supported alternatives:
  - `EMAIL_PROVIDER=resend` with a [Resend](https://resend.com) API key — no Workers Paid needed.
  - `EMAIL_PROVIDER=none` — email-less deployment. Sign in with passkeys only; invites are share-a-link, which works without email anyway.

## Deploy

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Scanimal/scanimal)

Cloudflare forks the repo into your account, provisions the D1 database, KV
namespace and R2 bucket declared in `wrangler.jsonc`, and deploys. The bindings
here intentionally carry no resource IDs so each deploy gets its own.

Two steps are **not** automatic:

1. **Apply the database schema.** The button does not run D1 migrations, and
   `/setup` will error until the tables exist:

   ```sh
   pnpm wrangler d1 migrations apply scanimal-db --remote
   ```

2. **Set the secrets** listed under [Configuration](#configuration-secrets--vars) —
   at minimum `BETTER_AUTH_SECRET` and `ORIGIN`.

Then open your Workers URL and you'll land on `/setup` to create the owner account.

### Deploy from the CLI instead

```sh
pnpm install
pnpm wrangler login
pnpm run deploy          # or: pnpm build && pnpm wrangler deploy
```

Wrangler provisions any missing D1/KV/R2 resources on first deploy and keeps them
linked afterwards, so no IDs need to be committed. `./scripts/bootstrap.sh` does
the same thing explicitly and also writes a `.env.local` for the drizzle-kit
migration commands — use it if you want the IDs materialised locally.

> **The passkey domain trap:** passkeys are bound to a domain (the WebAuthn RP-ID). `/setup` asks for your _final_ domain up front — if you plan to attach `go.yourbrand.com` later, enter it then, or accept that changing domains later invalidates registered passkeys. Magic-link sign-in always remains available as the recovery path.

## Configuration (secrets / vars)

| Variable                                             | Required         | Purpose                                                                                    |
| ---------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------ |
| `BETTER_AUTH_SECRET`                                 | yes              | Session signing secret (bootstrap generates one). `wrangler secret put BETTER_AUTH_SECRET` |
| `ORIGIN`                                             | yes              | Deployed origin, e.g. `https://go.example.com`                                             |
| `EMAIL_FROM`                                         | for email        | Sender address for magic links + invites                                                   |
| `EMAIL_PROVIDER`                                     | no               | `cloudflare` (default), `resend`, or `none`                                                |
| `RESEND_API_KEY`                                     | with resend      | Resend API key                                                                             |
| `CF_ANALYTICS_TOKEN`                                 | for analytics UI | API token with _Account Analytics_ read — powers the scan dashboard                        |
| `CLOUDFLARE_ACCOUNT_ID`                              | for analytics UI | Your account id                                                                            |
| `GOOGLE_CLIENT_ID/SECRET`, `GITHUB_CLIENT_ID/SECRET` | no               | Optional social login, off by default                                                      |

## Architecture

```
GET /:slug  ──▶  redirect handler (src/hooks.server.ts)
                 KV lookup → 302 + Analytics Engine write. Never touches D1.

/app/*      ──▶  SvelteKit app: Better Auth sessions, D1 via Drizzle.
                 On code create/update/delete: D1 first, then KV sync.
```

- **Ports & adapters** (`src/lib/server/ports`, `src/lib/server/adapters`): application code depends on narrow interfaces; `src/lib/server/context.ts` is the only file that knows Cloudflare exists. This keeps a future Docker deployment additive rather than a rewrite — see `docs/spec/qr-platform-handoff-spec.md`.
- **Honest caveats:** Analytics Engine has no self-hosted equivalent; `request.cf` geolocation is Cloudflare-only (isolated behind a `GeoResolver` port); KV's global replication is part of the product's latency story.

## Develop

```sh
pnpm install
pnpm wrangler d1 migrations apply scanimal-db --local   # once: seed the local dev database
pnpm dev          # vite dev (local D1/KV/R2 emulation in .wrangler/state)
pnpm test         # vitest
pnpm check        # svelte-check + wrangler types --check
pnpm lint         # oxlint (oxc) — includes .svelte files
pnpm fmt          # oxfmt (oxc formatter); fmt:check in CI
pnpm build        # production build
pnpm preview      # wrangler dev against the built worker
```

Linting and formatting are oxc-based (oxlint + oxfmt) — no ESLint or Prettier. Config lives in `.oxlintrc.json`, `.oxfmtrc.json`, and `.editorconfig` (indentation source of truth).

Schema changes: edit `src/lib/server/db/app.schema.ts`, then `pnpm db:generate` and re-apply migrations (`pnpm wrangler d1 migrations apply scanimal-db --local`). Better Auth tables are generated with `pnpm auth:schema` — don't edit `auth.schema.ts` by hand.
