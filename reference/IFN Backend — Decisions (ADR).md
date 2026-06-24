---
title: IFN Backend — Decisions (ADR)
tags: [ifn, backend, adr, decisions]
status: Approved
owner: IFN Team
updated: 2026-06-09
---

# IFN Backend — Decisions (ADR)

Architecture decisions for the IFN PERN backend, captured during a grill-me session
(2026-06-06). Each: **Context → Decision → Consequences**. The product contract is
`~/lumenor/ifn/PRD.md` ([[IFN PRD]]).

See [[IFN Backend Index]] · [[IFN Backend — Architecture]] · [[IFN Backend — Data Model]] · [[IFN Backend — Sequence Flows]].

---

## ADR-001 — Stack: PERN modular monolith
**Context.** Frontend is Vite + React. We need a backend to replace the localStorage mock.
**Decision.** PostgreSQL + Express + React + Node, one deployable Express process split by domain
module. No microservices, no Next.js.
**Consequences.** Simple ops, shared transaction scope, fast iteration. Scaling is vertical first;
modules are seams for later extraction if ever needed.

## ADR-002 — Auth: passwordless magic-link
**Context.** PRD locks "email only, no password," `@ifheindia.org`, verify-before-login. The demo
auto-verifies and trusts any typed email — insecure for real use.
**Decision.** Passwordless magic-link: register → one-time hashed token "emailed" → verify → session.
Login mails a fresh link. Mailer is pluggable (console/Ethereal in dev, SMTP in prod).
**Consequences.** Real verification without passwords (PRD-faithful). Requires an outbound mail path
in prod. `magic_tokens` table with single-use + expiry.

## ADR-003 — Session: opaque DB-backed cookie (not JWT)
**Context.** One monolith + Postgres; need revocable sessions.
**Decision.** `sessions` table + opaque id in an httpOnly+Secure+SameSite cookie. Middleware looks up
the row per request.
**Consequences.** Instant revocation (logout/ban = DELETE), no refresh-rotation, no JWT secret. One
indexed SELECT per request — fine at this scale. JWT's stateless benefit is unused here.

## ADR-004 — Roles server-owned; admin inherits mentor
**Context.** Demo flips role client-side. PRD: student/mentor/admin, admin = Super Admin with mentor
powers, appears in the mentor dropdown, can self-assign.
**Decision.** Role stored on `users`, enforced by a guard. Client role-switch removed; only admin
changes roles via `PATCH /users/:id/role`. The guard treats admin as ≥ mentor.
**Consequences.** No privilege escalation from the client. Mentor-scoped checks (assigned mentor) are
explicit in the pipeline module.

## ADR-005 — Post schema: hybrid
**Context.** Frontend crams ideas/problems/announcements/drafts/autopsies + pipeline fields into one
array.
**Decision.** `posts`(common + `kind`) + 1:1 `ideas_pipeline` + child tables (comments, post_votes,
sub_threads, gate_transitions, attachments, post_tags; plus the dossier tables in ADR-017) + JSONB
for fixed forms (`basic_details`, `feasibility`, `mentor_criteria`, `autopsy`, `original`).
**Consequences.** Avoids a 30-column sparse table and avoids over-normalizing fixed forms. JSONB
fields are read whole, never queried piecewise. See [[IFN Backend — Data Model]].

## ADR-006 — Pipeline: strict gate state machine + audit
**Context.** PRD requires both "mentor advances G3→G6" and "admin overrides any gate anytime," plus a
server-enforced lock and IFN-n reuse on refine&retry.
**Decision.** One transition table defines legal moves per role; assigned-mentor checks; admin
override allowed with a required `reason`. Every change appends a `gate_transitions` row. Submit
returns 403 when `pipeline_settings.locked`. Refine keeps the same `ifn`.
**Consequences.** Illegal jumps blocked; full auditability; deterministic IFN numbering.

## ADR-007 — Attachments: local volume behind a Storage interface
**Context.** Demo stores doc/PDF as base64 in localStorage.
**Decision.** `multer` → Docker named volume; metadata in `attachments`; a `Storage` interface
abstracts read/write so S3 swaps in later. 10MB cap, extension allow-list (.pdf/.doc/.docx) +
magic-byte mime sniff (don't trust client mime).
**Consequences.** No extra infra for dev; clean migration path to object storage; safer uploads.

## ADR-008 — Remove the per-idea private conversation
**Context.** Demo has a private student↔mentor↔admin DM (`conversation`/`addMessage`) — the main
real-time driver.
**Decision.** Drop it. Keep public `comments`, `sub_threads` (progress updates), and
`mentor_feedback`.
**Consequences.** No `idea_conversation` table, no socket layer needed. Async mentor↔student happens
via sub-threads + feedback.

## ADR-009 — No real-time; plain REST
**Context.** PRD notification toggles are UI-only; no delivery specified.
**Decision.** REST only. Optional ~15s poll on the open idea-detail view. A `notifications` table can
be added later if real delivery is needed.
**Consequences.** Much less infra; no socket auth/scaling. Slightly stale views between polls.

## ADR-010 — Frontend: hard cut to the API
**Context.** `store.jsx` reads/writes localStorage.
**Decision.** `store.jsx` actions call `src/lib/api.js`; localStorage persistence removed (session
cookie only). `seed.js` becomes the DB seed + test fixtures, not a runtime fallback.
**Consequences.** Single source of truth; one data path to maintain. The app needs the API running.

## ADR-011 — Seed: env-split by NODE_ENV
**Context.** Demo data is single-user; PRD §6 pins demo counts.
**Decision.** Dev/staging seed = faithful port of `seed.js` (every member → a real passwordless
account; demo `'me'` → `basilambrosestevenson.bca24@ifheindia.org`). Prod seed = bootstrap only (one
admin + approved-tag baseline). Selected by `NODE_ENV`. Seed runs once on an empty DB; migrations run
every deploy.
**Consequences.** Realistic data to build against; clean prod start; no manual cleanup. Nothing is
"deleted" in prod — demo data is simply never inserted there.

## ADR-012 — Calendar: computed visibility + join tables
**Context.** Demo uses `audience` + a single global `removedEventIds`; PRD adds founder event
requests and per-user removal.
**Decision.** One `events` row per event; visibility derived at query time (`audience='all'` →
students; `'self'` → creator). `event_hidden(user,event)` for per-user removal. `event_requests`
admin queue → approve creates the event.
**Consequences.** No per-user event duplication; edits never fan out; removals are the only per-user
rows.

## ADR-013 — Talent Acquisition: real applications
**Context.** Demo "Apply" is a fake toast that stores nothing.
**Decision.** `team_applications(team_post_id, applicant_id, message, status, created_at)`; posters
can list applicants.
**Consequences.** Turns a stub into a working feature; one small table.

## ADR-014 — API conventions
**Context.** Need a consistent, evolvable HTTP surface.
**Decision.** REST under `/api/v1`; zod validates every request; one error envelope
`{error:{code,message,details}}`; helmet + cors (allow the web origin) + pino logging.
**Consequences.** Predictable client integration; versioned evolution; consistent error handling.

## ADR-015 — Testing: integration suite
**Context.** The risky logic is auth, the gate machine, masking, and approvals.
**Decision.** supertest integration tests on a disposable test DB covering: magic-link auth, full
G1→G6 progression + admin override, anonymous masking (admin sees identity), tag approval, and role
guards.
**Consequences.** Confidence in the dangerous paths; CI needs a throwaway Postgres.

## ADR-016 — Docker: 3 services
**Context.** Need a reproducible run.
**Decision.** `db` (postgres:16 + volume + healthcheck), `api` (node:20; entrypoint waits for db,
migrates, seeds, starts), `web` (nginx serving built React, proxying `/api`). `docker-compose.dev.yml`
override for hot-reload.
**Consequences.** `docker compose up` = seeded healthy stack; clear separation of web/api/db tiers.

## ADR-017 — Idea Dossier: full submission + per-stage deliverables
**Context.** Today Mentor Review shows only title/problem/solution + one attachment, and the Admin
Panel shows a line-clamped title. Rich fields the student already provides (`basicDetails`,
`targetUsers`, `solutionHypothesis`, `marketSize`, `team`, `testsDone`) never reach the reviewer, and
there are no per-stage deliverables. A mentor cannot mentor from a one-line description.
**Decision.** Every idea is an accumulating **dossier**, fetched via `GET /api/v1/ideas/:id/dossier`,
visible **only to the author, the assigned mentor, and admin**. Each gate has a deliverable template
(hybrid: fixed fields + files + optional mentor/admin extra asks — see ADR-001 grill / Q1). The
student submits each stage's deliverables (`idea_submissions` + `attachments` tagged by gate/slot);
the assigned mentor reviews each stage (`idea_reviews` — 7-criteria rubric + feasibility
confirm/override + feedback + approve|revision); approval advances the gate. `idea_extra_asks`
generalizes the old `actionable_steps`. The public Feed still shows only the post overview.
**Consequences.** Reviewers see the complete case file and full G1→G6 history, not a blurb. New tables
`idea_submissions`, `idea_reviews` (review history, not in-place overwrite), `idea_extra_asks`;
`attachments` gains `submission_id`/`gate`/`slot_key`. New endpoints
`GET /ideas/:id/dossier`, `POST /ideas/:id/stages/:gate/submit`,
`POST /ideas/:id/stages/:gate/review`, `POST /ideas/:id/extra-asks`. Frontend: `MentorReview` and
`AdminPanel` render a new `IdeaDossier` component instead of a description. Supersedes the thin review
described in PRD §4.7 / §4.8.

---

# Design Review — 2026-06-09

A second-pass review of 16 proposed changes + 7 candidate ADRs against the architecture, data
model, and ADR-001…017. Principle applied: **product value over architectural purity; no MVP
complexity that isn't earned.** Each item gets a verdict (now / later / never) with the trade-off.
Accepted-now decisions are written up as ADR-018…ADR-025 below the table.

## Verdict summary

| # | Proposal | Verdict | When | One-line rationale |
|---|----------|---------|------|--------------------|
| 1 | IFN counter → PG sequence | **Keep current** | never (until contention) | `UPDATE … SET ifn_counter = ifn_counter+1 RETURNING` is already atomic (row lock); a sequence trades the no-gap property the product expects |
| 2 | In-app notification system | **Accept** | now (in-app) / later (email) | Real product value; toggles already exist in `user_settings` → ADR-020 |
| 3 | ORM strategy ADR | **Accept** | now (docs only) | Stack already uses **knex**; just undocumented → ADR-018 |
| 4 | Rate limiting | **Accept** | now (auth) / later (rest) | Magic-link + register are an email-flood/abuse vector → ADR-019 |
| 5 | Session metadata (ip, last_seen, revoked) | **Partial** | later | `last_seen_at` + `ip_address` cheap & useful; `revoked_at` redundant (delete-on-logout per ADR-003) |
| 6 | Attachment SHA-256 | **Optional** | later | Cheap (bytes already read for mime sniff); dedup value is marginal for a small doc store |
| 7 | `UNIQUE(team_post_id, applicant_id)` | **Accept** | now | App-level check is check-then-insert (race); DB constraint is trivial & correct → ADR-021 |
| 8 | JSONB review | **Mostly keep** | later (conditional) | Access pattern is read-whole (ADR-005 holds); `mentor_criteria` likely dead (superseded by `idea_reviews`); `idea_reviews.criteria` is the one future-normalization candidate |
| 9 | Split idea fields off `posts` | **Keep hybrid** | later (conditional) | ADR-005 already de-sparsed; ideas are the dominant kind so the extra join would cost more than the ~5 sparse cols save |
| 10 | `badges text[]` → `post_badges` | **Keep array** | later (conditional) | Set is tiny + fixed + metadata-free; `#Success` lifecycle already lives in `success_request` |
| 11 | ENUM strategy | **Accept (CHECK)** | later | Add CHECK constraints, not ENUM types or lookup tables → ADR-022 |
| 12 | Re-evaluate ADR-008 (no DM) | **Keep, with hook** | later (conditional) | Dossier review loop is the async channel; add threaded dossier notes only if mentors need clarifying Q&A |
| 13 | Re-evaluate ADR-009 (no notifs) | **Amend** | now | Superseded by ADR-020 (minimal in-app notifications) |
| 14 | Dossier complexity (ADR-017) | **Keep design** | phase the build | Complexity *is* the mentoring product; per-gate templates keep early stages light — phase implementation (G1–G3 first), don't fork a lighter model |
| 15 | Redis readiness | **Document** | never (until scale) | Forward-looking path only; DB sessions fine now → ADR-023 |
| 16 | Background jobs / queue | **Document** | later (until volume) | Synchronous email is fine at MVP volume → ADR-024 |
| — | File + audit retention | **Accept** | now (docs) | Define delete/cascade + retention policy → ADR-025 |

Detail on the rejected/deferred items (1, 5, 6, 8, 9, 10, 12, 14) lives in the table rationale; the
accepted decisions follow.

## ADR-018 — Persistence layer: knex (query builder + migrations)
**Context.** The architecture never named an ORM; the code in fact uses **knex** (`knexfile.js`,
numbered migrations + seeds under `src/db/`). Prisma/Drizzle were implicitly on the table.
**Decision.** Keep **knex** as the persistence layer. No heavy ORM. **Migration ownership:** numbered,
forward-only files in `src/db/migrations` (`NN_name.js`), each with `up`/`down`; migrations run on
every deploy via the api entrypoint (ADR-016). **Rollback:** `knex migrate:rollback` for the last
batch in dev; in prod, forward-fix migrations are preferred over destructive rollbacks. **Seed:**
idempotent, guarded on an empty `users` table; env-split per ADR-011 (amended — see note).
**Consequences.** No ORM rewrite; SQL stays explicit and reviewable; the team owns schema evolution
end-to-end. Trade-off: more hand-written SQL than Prisma; acceptable given the schema is already
authored. Cost: documentation only — **zero code change.**
> Note: ADR-011's runtime default has since shifted toward bootstrap-only seeding in all envs; the
> dev_full demo dataset remains available for tests and an on-demand admin reseed. Treat ADR-011 as
> "seed is idempotent + guarded," with env selection a deployment choice.

## ADR-019 — Rate limiting on abuse-prone endpoints
**Context.** Magic-link login and registration both trigger outbound email for any submitted address.
Unthrottled, they enable email flooding of a victim, SMTP-quota exhaustion, and token-guessing volume.
Tag requests and team applications are lower-severity spam vectors.
**Decision.** Add `express-rate-limit` (in-memory store for now) on `POST /auth/login`,
`POST /auth/register` (strict: a few requests per IP+email per window), and a looser limit on
`POST /tag-requests` and `POST /team-posts/:id/apply`.
**Consequences.** Closes the email-flood vector cheaply (one middleware). Trade-off: an in-memory
limiter is per-instance — when the api scales horizontally it must move to a shared store (Redis, see
ADR-023). **Implement now for the auth pair; the rest is a fast-follow.**

## ADR-020 — Minimal in-app notifications (amends ADR-009)
**Context.** ADR-009 deferred notifications when nothing consumed them. The dossier workflow
(ADR-017) created real "you have an update" moments — mentor review submitted, idea approved/rejected,
tag approved/rejected, team application received, event approved — and `user_settings` already carries
the (UI-only) `email_events` / `email_gate` / `inapp_votes` / `inapp_mentions` toggles. Without
delivery, users must hunt for state changes.
**Decision.** Add a `notifications` table: `id, user_id (FK), type, title, body, link, read_at (null),
created_at`. Writes happen inline in the relevant service on the listed events. Delivery is **in-app,
polling-based** (reuse the ~15s poll from ADR-009; a `GET /notifications` + unread count). **Email is
deferred** — when added, it reuses the existing SMTP path (ADR-002) and respects the `user_settings`
toggles; high-volume fan-out should go through the queue (ADR-024).
**Consequences.** Genuine product value for a low table + a handful of inline writes. Trade-off:
polling is slightly stale and adds light read load (mitigate with the cache path in ADR-023 later).
Wire the toggles that already exist to real behavior. **Implement in-app now; email later.**

## ADR-021 — Team application uniqueness (amends ADR-013)
**Context.** `team_applications` enforces "one application per user per post" in application code
(check-then-insert), which races under concurrent requests.
**Decision.** Add `UNIQUE(team_post_id, applicant_id)` to `team_applications`; keep the app-level
check for a friendly error, but let the constraint be the source of truth (catch the unique-violation
→ 409).
**Consequences.** Eliminates the duplicate-application race at the DB level; trivial migration.
**Implement now.**

## ADR-022 — Value integrity via CHECK constraints (not ENUM types or lookup tables)
**Context.** `role, status, decision, success_request, pipeline_state, gate_status` are free text.
zod already validates them at the API boundary (ADR-014), so the only ways a bad value lands are
seeds, manual SQL, or a bug — i.e. paths that bypass zod.
**Decision.** Add `CHECK (col IN (…))` constraints for these fixed sets. **Reject** PG `ENUM` types
(adding/removing values is migration-awkward) and **reject** lookup tables (overkill for fixed,
metadata-free sets; reserve that pattern for user-managed vocabularies like `tags`). zod stays the
friendly first line; CHECK is the DB backstop.
**Consequences.** DB-enforced validity that's still easy to evolve (drop+recreate the CHECK).
Low risk, low value-add today (zod guards the live write path) → **implement later as hardening.**

## ADR-023 — Redis readiness (forward-looking; no implementation now)
**Context.** Sessions are DB-backed (ADR-003); there is no cache or queue. All are fine at current
scale.
**Decision.** Document, don't build, the Redis migration path. Introduce Redis when a concrete trigger
fires: (a) the api runs **multiple instances** → move the rate-limit store (ADR-019) and optionally
sessions to Redis, or keep DB sessions + sticky routing; (b) read load on feed/tags/directory grows →
cache-aside with short TTLs; (c) a job queue is needed (ADR-024). Sessions can stay in Postgres even
then — Redis is not a prerequisite for v1.
**Consequences.** No new infra now; a clear, costed path later. Trade-off: none until a trigger fires.
**Never until scale; documented now.**

## ADR-024 — Background jobs / queue (forward-looking)
**Context.** Outbound email (magic-link, future notifications) runs inside the request. At MVP volume
a synchronous SMTP send (~1s) is acceptable.
**Decision.** Keep email synchronous for now. Introduce a worker + queue (BullMQ on the Redis from
ADR-023) when a trigger fires: email volume/latency hurts the request path, retries/backoff are
needed, or notification fan-out (ADR-020 email) becomes bulky. The worker would be a separate process
sharing the codebase.
**Consequences.** Avoids standing up Redis + a worker tier prematurely. Trade-off: a slow/again-failing
SMTP currently blocks the triggering request — tolerable at low volume, and the cue to adopt the queue.
**Later, when volume justifies it.**

## ADR-025 — File & audit retention
**Context.** Attachments (file volume + `attachments` rows) and the append-only `gate_transitions`
audit both grow unbounded, with no stated lifecycle.
**Decision.** **Attachments:** cascade-delete `attachments` rows when their parent post is deleted;
the physical bytes on the volume are cleaned by a periodic sweep (or, later, the ADR-024 worker) that
removes files with no referencing row — no synchronous unlink in the request. **Audit
(`gate_transitions`) + reviews:** retain indefinitely for MVP (low volume, high value for disputes);
revisit archival only if the tables grow large. **Magic tokens / expired sessions:** a periodic
cleanup deletes consumed/expired rows.
**Consequences.** Defined ownership for cleanup; no orphaned files or unbounded token tables. Trade-off:
the volume sweep is eventually-consistent (brief orphan window) — acceptable. **Document now; the
sweep job lands with ADR-024.**

## ADR-026 — Gate-mutation concurrency (pessimistic lock)
**Context.** `ideas_pipeline.gate` is mutated by mentor approval (`gate+1`), admin override
(`gate=X`), pickup, and resubmit. Concurrent writers (e.g. mentor approves while admin overrides)
race → lost update + a nonsensical `gate_transitions` trail. Promoted from the Sequence Flow Review
(item 4).
**Decision.** Every gate mutation runs in one transaction: `SELECT … FOR UPDATE` on the idea's
`ideas_pipeline` row → **re-validate the transition is still legal from the locked current gate** →
`UPDATE` → `INSERT gate_transitions` → `COMMIT`. Pessimistic locking fits (short transactions, low
contention). Optimistic versioning (a `gate_version` column with `WHERE gate_version = ?`) is the
fallback only if client-visible conflict messages are later wanted.
**Consequences.** The gate state machine becomes genuinely atomic; double-advance and lost overrides
are impossible. Also underpins idempotency for gate/review actions (a retried request sees the
already-advanced state and no-ops). Trade-off: a brief row lock during the (sub-millisecond) txn.

## ADR-027 — Uniform authentication responses (anti-enumeration)
**Context.** Login returned `202` for verified accounts and `401 "register first"` otherwise, and
register reveals existing emails — leaking which `@ifheindia.org` people have accounts (confirmed live
in the E2E run). Promoted from the Sequence Flow Review (item 1).
**Decision.** Login and register **always** return the same generic `202` ("If the account exists, a
login link has been sent."); the mail send happens only inside an `opt` when the account actually
exists. Never reveal account existence or verification state in the response or status code. Pair with
ADR-019 rate limiting and keep the found/not-found code paths close in cost to blunt timing
side-channels.
**Consequences.** No account enumeration via the auth endpoints. Trade-off: a user who typos their
email gets a reassuring message but no email — acceptable, and mitigated by clear copy + the verify
flow's own errors. Supersedes the login alt-branch drawn in [[IFN Backend — Sequence Flows]] flow 2.

## ADR-028 — Submission versioning (draft mutable, submitted immutable)
**Context.** The pipeline flow said "INSERT/UPDATE idea_submissions" — ambiguous; an in-place update
of a *submitted* payload would erase what the mentor reviewed, contradicting ADR-017's "submissions
accumulate" promise. Promoted from the Sequence Flow Review (item 9).
**Decision.** One **mutable draft** row per `(post_id, gate)` that updates in place while
`status = draft`; on **submit** it is **frozen immutable** (`status = submitted`); a revision after
`revision_requested` **INSERTs a new version** row rather than mutating the prior one (order by
`created_at` / an explicit `version`). `idea_reviews` already keeps review history per ADR-017.
**Consequences.** The dossier preserves a true, auditable history — feedback always maps to the exact
submission it referenced. Trade-off: multiple rows per gate over an idea's life (small, bounded). Also
gives resubmit a clean idempotency story (a duplicate submit is guarded by the `submitted` status).

## Net implementation order
1. **Now (cheap, high value):** ADR-021 (unique constraint), ADR-018 (document knex), ADR-019 (auth
   rate limit), ADR-020 (in-app notifications), ADR-025 (retention policy doc).
2. **Fast-follow:** ADR-022 (CHECK constraints), rate limits on tag/team endpoints, session
   `last_seen_at`/`ip_address`, attachment SHA-256.
3. **Phase, don't defer:** ADR-017 dossier build (G1–G3 first).
4. **Document only, build on trigger:** ADR-023 (Redis), ADR-024 (queue), email notifications,
   dossier notes (ADR-008 hook), idea-fields extraction (#9), `post_badges` (#10).
5. **Rejected:** IFN sequence (#1 — current allocation already atomic; sequence breaks no-gap),
   `revoked_at` (#5 — redundant with delete-on-logout), ENUM types / lookup tables for fixed sets
   (#11 — CHECK is the right weight).

---

Related: [[IFN Backend — Architecture]] · [[IFN Backend — Data Model]] · [[IFN Backend — Sequence Flows]] · [[IFN PRD]]
