# Handoff Spec — Cloudflare-Native Dynamic QR & Link Platform

**Status:** Pre-implementation. No code written yet.
**Author of spec:** Handoff from planning conversation.
**Intended reader:** An engineering agent picking this up cold.

---

## 1. What we're building

A self-hostable, multi-user dynamic QR code and short-link platform that runs **entirely on Cloudflare primitives** and deploys with a single click.

Users log in, create a short code, point it at any URL, download a styled QR code, and later change the destination without reprinting anything. Every scan is tracked.

### Why this exists

The gap is real and verified:

- **[Sink](https://github.com/ccbikai/Sink)** (~5k stars) is the leading Cloudflare-native link shortener with QR support, but auth is a **single shared site token**. There is no concept of user accounts. The maintainer explicitly states Sink targets individuals and small teams, and directs business/multi-user needs to his paid product S.EE.
- **[Dub](https://github.com/dubinc/dub)** is open source with QR codes, workspaces and multi-user, but self-hosting requires MySQL/PlanetScale + a serverless driver proxy + Upstash Redis + QStash + Tinybird. It will never be a one-click deploy.
- Commercial incumbents (Uniqode, QR Tiger, Flowcode, Bitly) charge $15–$250/mo with per-code caps, and **your printed codes stop redirecting when you cancel**.

Nobody occupies the intersection of _multi-user_ + _trivially self-hostable_ + _codes you own forever_. That intersection is the entire product thesis.

### The one-line pitch

> Multi-user dynamic QR codes and short links. One-click deploy to Cloudflare. Your codes keep working forever, because you own the infrastructure.

---

## 2. Scope

### v1 — build this

- Passkey-first auth with magic-link fallback (see §7)
- Single organisation per deployment; multiple users within it
- Create / list / edit / delete codes
- Edit destination URL without changing the slug
- Client-side QR rendering with colour, logo, and shape options; PNG + SVG export
- Per-code scan analytics: total, over time, country, device, referrer
- One-click deploy to Cloudflare

- Optional social auth (Google/GitHub), off by default
- One-click deploy to Cloudflare

### v2 — explicitly deferred, but don't design yourself out of it

- **Docker / self-hosted deployment.** Not built in v1, but the port/adapter layer in §4a exists so this is an additive change rather than a rewrite.
- Multi-tenant orgs with custom domains via Cloudflare for SaaS
- Bulk CSV import/export
- REST API + API keys
- Smart routing (device/country/time-based destinations)
- Link expiry, link-level access passwords, UTM builder

### Non-goals

- Shipping a Docker build in v1. Design for it; don't implement it. Two backends before a single user is how projects like this die.
- Server-side QR image generation. Client-side only.
- Payments or billing.

---

## 3. Stack

| Concern        | Choice                                              | Notes                                                                                                                      |
| -------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Framework      | **SvelteKit**                                       | Required. Use `@sveltejs/adapter-cloudflare`.                                                                              |
| Runtime        | Cloudflare Workers                                  | Single Worker serving both the SvelteKit app and the redirect handler.                                                     |
| Database       | **D1**                                              | Single database, row-level scoping.                                                                                        |
| Hot cache      | **KV**                                              | `slug → destination` for the redirect path.                                                                                |
| Scan events    | **Workers Analytics Engine**                        | Do NOT write scans to D1. See §6.                                                                                          |
| Auth           | **Better Auth**                                     | Required. Passkey plugin primary, magic link fallback. See §7.                                                             |
| ORM            | Drizzle                                             | Better Auth has first-class Drizzle support; also gives typed migrations. Also the main reason D1→Postgres is cheap later. |
| Email          | **Cloudflare Email Sending** (`send_email` binding) | Beta. Requires Workers Paid + domain on Cloudflare DNS. Only used for magic links and invites. See §7.                     |
| Logo uploads   | **R2**                                              | v1 can defer this and accept a logo URL instead.                                                                           |
| Bot protection | **Turnstile**                                       | On signup and magic-link request.                                                                                          |
| QR rendering   | `qr-code-styling` (client-side)                     | Gives branded/logo/gradient output. Runs in the browser, zero server cost.                                                 |
| Styling        | Tailwind + shadcn-svelte                            | Optional but recommended for speed.                                                                                        |

### Bindings (`wrangler.jsonc`)

```jsonc
{
  "name": "qr-platform",
  "compatibility_date": "2026-08-01",
  "compatibility_flags": ["nodejs_compat"],
  "main": ".svelte-kit/cloudflare/_worker.js",
  "assets": { "directory": ".svelte-kit/cloudflare", "binding": "ASSETS" },
  "d1_databases": [
    { "binding": "DB", "database_name": "qr-platform", "database_id": "<generated>" }
  ],
  "kv_namespaces": [{ "binding": "LINKS", "id": "<generated>" }],
  "analytics_engine_datasets": [{ "binding": "SCANS", "dataset": "qr_scans" }],
  "send_email": [{ "name": "EMAIL" }],
  "r2_buckets": [{ "binding": "ASSETS_BUCKET", "bucket_name": "qr-platform-assets" }]
}
```

---

## 4. Architecture

```
                    ┌──────────────────────────────┐
   GET /:slug  ───▶ │  Redirect handler (hooks)    │
                    │  KV lookup → 302             │
                    │  ctx.waitUntil(AE write)     │
                    └──────────────────────────────┘

                    ┌──────────────────────────────┐
   /app/*      ───▶ │  SvelteKit app               │
                    │  Better Auth session guard   │
                    │  D1 reads/writes via Drizzle │
                    └──────────────────────────────┘
```

**Critical invariant:** the redirect path must never touch D1. KV read + Analytics Engine write only. D1 is the source of truth and the write path; KV is the read path. On any code create/update/delete, write D1 first, then update KV.

---

## 4a. Ports and adapters

**Goal:** ship Cloudflare-only in v1, but keep a Docker deployment as an additive change rather than a rewrite.

**Method:** define narrow interfaces (ports) for every platform capability. Application code depends only on the ports. Cloudflare adapters are the only implementation in v1.

### Rules

1. No route, service, or component imports `event.platform.env` directly. Everything goes through a resolved context object.
2. Ports are defined by what the _application_ needs, not by what Cloudflare offers. If a port method mirrors a Cloudflare API signature exactly, it is probably too thin.
3. One composition root: `src/lib/server/context.ts` builds the adapter set from the environment. It is the only file that knows Cloudflare exists.
4. Do not build a second adapter in v1. The discipline is in the boundary, not in having two implementations.

### The ports

```ts
// src/lib/server/ports/index.ts

/** Hot lookup for the redirect path. CF: KV. Docker: Redis, or Postgres + in-process LRU. */
export interface LinkStore {
  get(key: string): Promise<LinkRecord | null>;
  put(key: string, value: LinkRecord): Promise<void>;
  delete(key: string): Promise<void>;
}

/** High-volume append-only scan events. CF: Analytics Engine. See warning below. */
export interface EventSink {
  record(event: ScanEvent): void; // fire-and-forget
}

/** Analytics reads. Deliberately separate from EventSink — different backends, different shapes. */
export interface EventQuery {
  scansOverTime(codeId: string, range: DateRange): Promise<TimeSeries>;
  breakdown(
    codeId: string,
    dimension: 'country' | 'device' | 'referrer',
    range: DateRange
  ): Promise<Breakdown>;
}

/** Transactional email. CF: send_email binding. Docker: SMTP or Resend. */
export interface Mailer {
  send(msg: { to: string; subject: string; html: string; text: string }): Promise<void>;
}

/** Logo and asset uploads. CF: R2. Docker: S3-compatible or local volume. */
export interface BlobStore {
  put(key: string, body: ReadableStream | ArrayBuffer, contentType: string): Promise<void>;
  url(key: string): string;
}

/** Deferred work. CF: ctx.waitUntil. Docker: setImmediate / a queue. */
export interface Deferred {
  run(promise: Promise<unknown>): void;
}
```

`Database` is deliberately **not** a port. Drizzle already is the abstraction, and a hand-rolled repository layer on top of it buys nothing. Keep queries in Drizzle, avoid SQLite-only SQL (see below), and the D1→Postgres move is a dialect swap plus a migration rewrite.

### Layout

```
src/lib/server/
  ports/            interfaces only, zero imports
  adapters/
    cloudflare/     kv-link-store.ts, ae-event-sink.ts, ae-event-query.ts,
                    cf-mailer.ts, r2-blob-store.ts, waituntil-deferred.ts
  context.ts        composition root — the only file importing adapters
  db/               drizzle schema + queries
```

### Where the abstraction genuinely does not hold

Be honest in the README about these rather than promising parity:

- **Analytics Engine has no self-hosted equivalent.** This is the real cost of portability. A Docker build needs ClickHouse (heavy, undermines the simplicity pitch), or Postgres with scheduled rollups (loses per-scan granularity), or a degraded analytics mode. Decide which when you build it; do not pretend `EventQuery` makes this free.
- **`request.cf` geolocation is Cloudflare-only.** Country and city come free at the edge. A Docker build needs MaxMind GeoLite2 or accepts no geo data. Put `country`/`city` resolution behind a small `GeoResolver` port so this is one file.
- **Redirect latency characteristics differ.** KV is globally replicated; Redis in one region is not. Same interface, materially different product.
- **Passkey RP-ID is domain-bound**, so it behaves the same in both — but see §7 for why that matters at deploy time.

### SQL portability

To keep the Postgres path cheap:

- Store timestamps as integer epoch millis, not SQLite `datetime()`.
- No `AUTOINCREMENT`. Generate IDs in application code (nanoid/uuid).
- No `INSERT OR REPLACE`, no `ROWID` access.
- Keep migrations in Drizzle Kit rather than hand-written SQL where practical.

---

## 5. Data model

Single D1 database, row-level scoping via `organization_id`. Even though v1 is single-org, **put `organization_id` on every table now** — retrofitting it later is painful, and D1 databases cannot be sharded or split after creation.

Better Auth generates its own tables (`user`, `session`, `account`, `verification`, and with the organization plugin, `organization`, `member`, `invitation`). Let it own those. Define only the app tables yourself.

```sql
-- migrations/0002_app_tables.sql

CREATE TABLE codes (
  id                TEXT PRIMARY KEY,
  organization_id   TEXT NOT NULL,
  user_id           TEXT NOT NULL,
  slug              TEXT NOT NULL,
  destination       TEXT NOT NULL,
  title             TEXT,
  style_json        TEXT,              -- qr-code-styling options blob
  active            INTEGER NOT NULL DEFAULT 1,
  created_at        INTEGER NOT NULL,
  updated_at        INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX idx_codes_slug ON codes(slug);
CREATE INDEX idx_codes_org  ON codes(organization_id);
CREATE INDEX idx_codes_user ON codes(user_id);

-- Audit trail for destination changes. Agents will ask "what did this point
-- to in March?" and you want an answer.
CREATE TABLE code_revisions (
  id            TEXT PRIMARY KEY,
  code_id       TEXT NOT NULL,
  destination   TEXT NOT NULL,
  changed_by    TEXT NOT NULL,
  changed_at    INTEGER NOT NULL,
  FOREIGN KEY (code_id) REFERENCES codes(id) ON DELETE CASCADE
);
```

Note: D1 does not enable foreign keys by default — issue `PRAGMA foreign_keys = ON;` or rely on application-level integrity.

### Slug uniqueness

Globally unique in v1 (single org). When v2 adds multi-tenancy, this becomes unique per hostname, and the KV key becomes `hostname:slug`. **Write the KV key helper as a function now** so that change is one edit.

---

## 6. Redirect path

Implement in `src/hooks.server.ts`, before SvelteKit routing, so it short-circuits without loading the app.

```ts
// Pseudocode — adapt to SvelteKit's handle() signature.
export const handle: Handle = async ({ event, resolve }) => {
  const { pathname } = event.url;
  const slug = pathname.slice(1);

  if (isReservedPath(pathname)) return resolve(event);

  const { LINKS, SCANS } = event.platform.env;
  const record = await LINKS.get(kvKey(event.url.hostname, slug), 'json');
  if (!record) return resolve(event); // fall through to 404 page

  event.platform.context.waitUntil(
    Promise.resolve(
      SCANS.writeDataPoint({
        indexes: [record.organizationId],
        blobs: [
          record.codeId,
          event.request.cf?.country ?? '',
          event.request.headers.get('user-agent') ?? '',
          event.request.headers.get('referer') ?? '',
          event.request.cf?.city ?? ''
        ],
        doubles: [1]
      })
    )
  );

  return new Response(null, {
    status: 302,
    headers: { Location: record.destination, 'Cache-Control': 'no-store' }
  });
};
```

**Reserved paths** that must never be treated as slugs: `/app`, `/api`, `/auth`, `/_app`, `/favicon.ico`, `/robots.txt`. Validate on slug creation too.

**`indexes` takes the org id** so per-tenant queries stay cheap when v2 lands. See §10 for a limit that needs verifying.

Query Analytics Engine for the dashboard via the SQL API over HTTP — it is not exposed as a Worker binding for reads. This needs a Cloudflare API token with Account Analytics read permission, stored as a secret.

---

## 7. Auth

**No passwords.** Passkeys primary, magic link fallback, social optional and off by default.

### Why

- **Passkeys remove the CPU-time risk entirely.** No scrypt/argon2 hashing means no chance of blowing the Workers CPU budget on login. WebAuthn verification is signature checking, which is cheap.
- **They shrink the email surface.** No verification email, no password reset. Email is needed only for magic links and invites.
- **Social auth is deliberately not primary** because it pushes setup cost onto the deployer: register an OAuth app, get client ID/secret, configure redirect URIs, possibly go through provider verification. That is four screens of work in a project selling a five-minute deploy. Support it as opt-in env vars, document it, leave it off.

### The passkey RP-ID trap — read this

Passkeys are bound to a Relying Party ID, which is the domain. If someone deploys to `foo.workers.dev`, registers a passkey, then later attaches `go.theirbrand.com`, **their existing passkeys stop working.** For a project whose pitch is "deploy in one click, add your domain later," this is a live footgun.

Mitigations, in order of preference:

1. Prompt for the final domain during `/setup` and set RP-ID from it. Warn clearly that changing it later invalidates passkeys.
2. Always keep magic link enabled as a recovery path, so a domain change is recoverable rather than a lockout.
3. Detect at login that `location.hostname` no longer matches the stored RP-ID and show a specific, non-generic error explaining what happened.

Do not ship passkeys without at least (2).

### Config

```ts
// src/lib/server/auth.ts — sketch
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { organization, magicLink, passkey } from 'better-auth/plugins';
import type { AppContext } from './context';

export const createAuth = (ctx: AppContext) =>
  betterAuth({
    database: drizzleAdapter(ctx.db, { provider: 'sqlite' }),
    emailAndPassword: { enabled: false },
    plugins: [
      passkey({
        rpID: ctx.config.rpId, // set at /setup, stored in config
        rpName: ctx.config.appName,
        origin: ctx.config.origin
      }),
      magicLink({
        sendMagicLink: async ({ email, url }) => {
          await ctx.mailer.send({
            // port, not the CF binding
            to: email,
            subject: 'Your sign-in link',
            html: magicLinkTemplate(url),
            text: `Sign in: ${url}`
          });
        }
      }),
      organization()
    ],
    socialProviders: ctx.config.socialProviders // {} unless env vars present
  });
```

Better Auth must be instantiated **per request**, not at module scope, because `env` is only available on the request in Workers. Note it receives `ctx`, not `env` — auth code should not import Cloudflare bindings directly either.

### Invites

Prefer **link-based invites**: the owner generates a URL and shares it however they like. This means team management works with no email configured at all, which keeps single-user and email-less deployments viable. Emailed invites become a convenience, not a dependency.

### Bootstrap / first run

The deploy button cannot seed an admin account. Implement a first-run flow:

1. On any request, if `user` table is empty, redirect to `/setup`.
2. `/setup` captures the intended domain (for passkey RP-ID), creates the first user as `owner`, registers their passkey, and creates the default organization.
3. Once a user exists, `/setup` returns 404 permanently.

Guard this carefully — an unprotected setup route on a live deployment is a full account takeover.

---

## 8. Routes

| Route                       | Method   | Purpose                                               |
| --------------------------- | -------- | ----------------------------------------------------- |
| `/:slug`                    | GET      | Redirect. Handled in hooks, never reaches the router. |
| `/setup`                    | GET/POST | First-run admin creation. 404 once a user exists.     |
| `/auth/*`                   | —        | Better Auth handler mount.                            |
| `/app`                      | GET      | Dashboard — list of the current user's codes.         |
| `/app/new`                  | GET/POST | Create a code.                                        |
| `/app/codes/[id]`           | GET/POST | Edit destination, title, styling.                     |
| `/app/codes/[id]/analytics` | GET      | Scan analytics for one code.                          |
| `/app/team`                 | GET      | Members + invites. Owner/admin only.                  |
| `/app/settings`             | GET/POST | Profile, manage passkeys (add/revoke devices).        |

Use SvelteKit form actions rather than a separate JSON API for v1. A REST API is v2 and should be additive.

### Authorisation rules

- Members see and edit **only their own codes**.
- Admins and owners see all codes in the org.
- Every D1 query must filter on `organization_id`. Put this in a single query helper module and never query `codes` directly from a route.

---

## 9. Deploy experience

This is the differentiator. Treat it as a feature, not a chore.

- `wrangler.jsonc` declares every binding so the Deploy button provisions D1, KV, Analytics Engine, and R2 automatically.
- Migrations run on first request if the schema is absent, or via a documented `wrangler d1 migrations apply`. Verify which the deploy button actually supports before promising the former in the README.
- README must state plainly: **Workers Paid ($5/mo) is required** because Email Sending to arbitrary recipients is not available on the free plan. Do not bury this.
- Offer an `EMAIL_PROVIDER=resend` fallback env var so people who don't want Workers Paid, or whose domain isn't on Cloudflare DNS, can still deploy. Keep this behind a thin interface — it's the one place a non-Cloudflare dependency is justified.
- Single-user deployments should be able to skip email entirely (no verification, no invites). Make that a config flag.

---

## 10. Verify before relying on these

These are stated from memory in the planning conversation and were **not** confirmed against current docs. Check each before building on it.

1. **Better Auth passkey plugin on Workers.** This is the highest-risk item. WebAuthn libraries sometimes reach for Node crypto APIs that are unpolyfilled or need `nodejs_compat`. Verify registration and authentication both work on a deployed Worker — not just in `wrangler dev` — before committing to passkey-first. If it fails, fall back to magic-link-only for v1 rather than reintroducing passwords, since password hashing carries its own Workers CPU-budget risk.
   1b. **Magic link + `send_email` end to end.** Since this is now the recovery path for the RP-ID trap, it is load-bearing. Test it before passkeys.
2. **Analytics Engine limits.** Believed to be ~20 blobs, ~20 doubles, and **one** index per data point. If only one index is allowed, `organization_id` is the right thing to spend it on, and `code_id` goes in blobs. Confirm.
3. **Email Sending beta constraints.** One third-party comparison claims a 50-recipient cap and flags API instability, but that source sells a competing product. Verify recipient caps and current beta status in Cloudflare's docs directly.
4. **`adapter-cloudflare` + custom hooks routing.** Confirm the redirect short-circuit in `hooks.server.ts` behaves as expected and that static asset serving doesn't intercept single-segment paths.
5. **Deploy button + D1 migrations.** Confirm what the button can and cannot seed. The first-run migration path may be mandatory.

---

## 11. Build order

Do these in sequence. Do not reorder — auth first is deliberate, because it's the part that kills projects like this and it should be attacked while momentum is high.

1. SvelteKit + `adapter-cloudflare` skeleton deploying to Workers. Confirm bindings reachable via `event.platform.env`.
   1b. Ports + Cloudflare adapters + `context.ts` composition root (§4a). Do this _before_ any feature code, or the boundary will never get retrofitted.
2. Drizzle + D1 migrations. Better Auth end to end: **magic link first** (signup → email via the `Mailer` port → session), **then** passkey registration and login on a deployed Worker. **This is the milestone that de-risks the project.**
3. `/setup` first-run flow, including RP-ID capture.
4. D1 app tables + org-scoped query helper module.
5. Create/list/edit/delete codes. D1 write + KV sync.
6. Redirect handler in hooks with KV + Analytics Engine.
7. Client-side QR rendering and export.
8. Analytics dashboard via the AE SQL API.
9. Team management and invites.
10. Deploy button, README, screenshots.

---

## 12. Design principles

- **Cloudflare-only in v1, Cloudflare-first forever.** The one-click deploy is the differentiator and must never be compromised to accommodate a hypothetical Docker user. The ports layer exists so portability is _possible later_, not so it can be traded against the primary experience now. If a port would force a worse Cloudflare implementation, keep the good Cloudflare implementation and widen the port later.
- **Never build the second adapter speculatively.** Ports without a Docker implementation are cheap. Two live implementations before a single real user is a maintenance tax paid for nothing.
- **The redirect path is sacred.** KV read, AE write, 302. Nothing else. Every millisecond here is paid by every scan of every printed code.
- **Codes must outlive the deployment.** Never build anything that makes a printed QR code stop working. That failure mode is exactly what the commercial products do and exactly what this exists to avoid.
- **The README is the product.** Someone who has never used Cloudflare should be able to deploy this in under five minutes. If the setup instructions have more than three steps, something in the architecture is wrong.
