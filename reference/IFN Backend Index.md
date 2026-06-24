---
title: IFN Backend Index
tags: [ifn, backend, index]
status: Approved
owner: IFN Team
updated: 2026-06-09
---

# IFN Backend — Documentation Index

Architecture + design docs for the planned **PERN** backend (PostgreSQL · Express · React · Node, modular monolith, Docker) of the **ICFAI Founders Network**. Current app is a frontend-only MVP (`~/lumenor/ifn`, Vite + React, localStorage); these notes specify the backend that replaces the mock data layer.

## Notes

- [[IFN Backend — Architecture]] — system overview, component (C4) + deployment PlantUML, modules, request lifecycle
- [[IFN Backend — Data Model]] — Postgres schema, ER diagram, table-by-table columns
- [[IFN Backend — Sequence Flows]] — PlantUML sequence diagrams for auth, posts, pipeline gates, approvals, calendar, apply
- [[IFN Backend — Decisions (ADR)]] — locked architecture decisions with context + consequences
- [[IFN — Workflows]] — every user workflow (W1–W39) + PlantUML, mapped to the Playwright E2E suite
- [[IFN PRD]] — verbatim copy of the decision-locked product spec
- [[IFN — v1 Scope]] — locked v1 product cuts (what ships / deferred / rejected)
- [[IFN Backend — Authorization Matrix]] — who can do what (Action × Role)
- [[IFN Backend — Runbook]] — deploy, rollback, migrate, secret rotation, incident response
- [[IFN Backend — Backup & Restore]] — backup schedule + tested restore
- [[IFN Backend — Security & Threats]] — consolidated security posture + residual risks
- [[IFN Backend - Self-Host Migration Runbook]] : migrate the LIVE Supabase backend onto a college-owned VM (self-host the same stack)

## Quick reference — locked decisions

| Area | Decision |
|---|---|
| Auth | Passwordless magic-link (console/Ethereal dev → SMTP prod); no passwords |
| Session | Opaque DB session cookie (`sessions`), httpOnly+Secure+SameSite; not JWT |
| Posts | Hybrid: `posts` + `ideas_pipeline` + child tables + JSONB forms |
| Pipeline | Strict gate state machine + `gate_transitions` audit; admin override w/ reason; refine keeps IFN-n |
| Attachments | Local volume + DB metadata behind `Storage` iface; 10MB, mime-sniffed |
| Real-time | None (plain REST); per-idea private conversation removed |
| Frontend | Hard cut: `store.jsx` → `src/lib/api.js`, drop localStorage |
| Seed | Env-split: dev = full demo port; prod = admin + tags |
| Calendar | Computed visibility + `event_hidden` + `event_requests` |
| Apply | Real `team_applications` |
| API | `/api/v1`, zod, `{error:{code,message,details}}`, helmet/cors/pino |
| Docker | 3 services: db · api · web(nginx) |

> Source of truth for features: `~/lumenor/ifn/PRD.md`. Source code: `~/lumenor/ifn`.

---

# Documentation Structure Review — 2026-06-09

Meta-review of the doc set against four lenses, then a verdict on 10 proposed additions. Bias:
**practical engineering value, not document count.** The aim is a set sufficient for a real
production backend — not an enterprise paperwork pile.

## Is the current set sufficient?

| Lens | Verdict | Gap |
|------|---------|-----|
| MVP development | **Strong** | Design/HOW is well covered (Architecture, Data Model, Flows, ADRs, Workflows, PRD) |
| Team onboarding | **Good** | Index + ADRs orient a new dev fast; an authz matrix would close the biggest ambiguity |
| Production deployment | **Weak** | Docker/seed covered (ADR-016) but no runbook, no backup/restore procedure |
| Long-term maintenance | **Adequate** | ADRs capture *why*; missing operational + security consolidation |

**Diagnosis (item 10):** the set is **HOW-heavy / ops-light** — correct for the design phase, but
three operational gaps now matter: **authorization clarity, backup/restore, and a deploy runbook.**
Everything else is either already captured in ADRs or is genuine post-MVP work. Add the few
high-leverage docs; defer the formal-paperwork ones.

## Verdict summary

| # | Proposed doc/standard | Verdict | When | Why |
|---|-----------------------|---------|------|-----|
| 3 | **Authorization matrix** | **Implement** | **now** | Highest value/cost; one table prevents real authz bugs + drives role-guard tests |
| 8 | **Backup & restore** | **Implement** | **now** | Only state is two volumes; loss = total data loss (we just `down -v`'d). Cheap to fix |
| 9 | **Operational runbook** | **Implement** | **now** | Deploy/rollback/migrate/secret-rotation written down; bus-factor insurance |
| 5 | Security & threat notes | **Implement (light)** | now | Consolidate existing decisions; security is the riskiest area (ADR-015) |
| 1 | Doc metadata standard | **Accept (minimal)** | now | `status` + `owner` + `updated` in frontmatter; **skip** semver on prose |
| 2 | API contract (OpenAPI) | **Implement** | later | **Generate from zod**, don't hand-write; endpoint table suffices for now |
| 7 | Observability doc | **Light now / full later** | later | pino + `/healthz` exist; document conventions now, dashboards/alerts later |
| 4 | NFR document | **Defer** | later | Capture the few real constraints inline; formal SLAs are guesswork pre-usage |
| 6 | Notification strategy doc | **Reject (separate)** | — | Already in ADR-009(amended)/020/024 + ADR-008 hook; add an index pointer only |
| — | Disaster recovery (formal) | **Reject for MVP** | later | The backup doc (#8) covers the real need; RTO/RPO/DR-plan is post-MVP |

## Detail (problem → risk → cost → recommendation)

**1 — Metadata standard.** *Problem:* no status/owner/updated; can't tell current vs stale.
*Risk:* readers trust stale docs; "Draft vs Approved" ambiguous. *Cost:* trivial frontmatter; but a
rotting `Last Updated` is worse than none (false confidence). *Recommend:* **now, minimal** — add
`status: Draft|Approved|Deprecated`, `owner`, `updated` to each doc's frontmatter. **Reject** formal
`Version: 1.0` semver on prose (churns meaninglessly); `[[wikilinks]]` already cover "related."

**2 — API contract.** *Problem:* endpoints are listed (Architecture module table, ADRs) but no
request/response/error schemas; response shapes (serializer output) are undocumented. *Risk:*
frontend-backend drift — lower than a public API (one team, zod defines requests), but response
guessing is real. *Cost:* hand-written OpenAPI is **high-maintenance and rots**. *Recommend:*
**later, and generate** it from the zod schemas (`zod-to-openapi`) so the spec can't drift from the
code. For now the endpoint table + zod are the contract; optionally add response-shape notes.

**3 — Authorization matrix.** *Problem:* role rules (student/mentor/admin; admin⊇mentor, ADR-004)
are scattered across ADRs, flows, and service guards. *Risk:* **high at implementation** — ambiguity
breeds inconsistent guards and authz bugs (can a mentor approve tags? can a student open a dossier
they don't own?). *Cost:* **low** — one `Action × Role` table. *Recommend:* **now.** Best ratio in
this list; doubles as the checklist for the ADR-015 role-guard tests.

**4 — NFR document.** *Problem:* no perf/availability/scale targets. *Risk:* can't judge done vs
over-built — but formal SLAs are aspirational without real traffic. *Cost:* moderate, much of it
guesswork now. *Recommend:* **defer** the formal doc; capture the *real* constraints where they live
(retention → ADR-025, security → #5, backup → #8) plus a one-line scale assumption (hundreds of users,
single instance, best-effort availability). Revisit when usage exists to set numbers.

**5 — Security & threat model.** *Problem:* auth is documented, but the overall posture
(enumeration, rate-limit, session, upload, abuse, audit, authz boundaries) is implicit — the
enumeration leak we found is the live proof. *Risk:* security gaps slip through silently. *Cost:*
**low** as a *consolidation* — most content already exists (ADR-002/003/007/019/027, audit via
`gate_transitions`, the authz matrix #3). *Recommend:* **now, light** — one "Security & Threats"
page referencing those decisions + naming residual risks. **Not** a formal STRIDE document.

**6 — Notification strategy doc.** *Problem:* future-comms uncertainty. *Reality:* already decided —
ADR-009 (amended), ADR-020 (in-app, polling), ADR-024 (async email/queue), ADR-008 hook (mentor
comms). *Cost:* a separate doc duplicates the ADRs. *Recommend:* **reject the separate doc**; add a
one-line "Notifications & Comms → see ADR-020/024/008" pointer to this index.

**7 — Observability.** *Problem:* pino logging + `/healthz` exist (Architecture, Dockerfile) but no
standard. *Risk:* in prod, no monitoring/alerting = users report your outages; no error tracking =
invisible bugs. *Cost:* the *doc* is cheap; the *implementation* (Sentry, metrics, alerts) is the
real cost. *Recommend:* **light now** — document the existing structured-log + healthcheck
conventions; **full later** (dashboards/alerts/error-tracking) once there's a prod deployment + users.

**8 — Backup & restore.** *Problem:* all state lives in two Docker volumes (`pgdata`, `uploads`);
there is no backup. *Risk:* **highest concrete risk** — volume loss/corruption = total data loss; we
just demonstrated `down -v` erases everything. *Cost:* **low** — a `pg_dump` cron, an uploads
snapshot/rsync, a written restore procedure, and a "test the restore" note. *Recommend:* **now** (doc
+ the actual backup job). Doesn't need RTO/RPO formality — it needs to *exist*. Pairs with ADR-025.

**9 — Operational runbook.** *Problem:* deploy/rollback/migrate/secret-rotation steps are scattered
/ tribal. *Risk:* medium-high under pressure (bad deploy, outage), worsened by solo bus-factor.
*Cost:* **low** — a single page; ~80% already exists (the prod-deploy notes: `.env`, `docker compose
up`, auto-migrate, rollback = redeploy prior image or `migrate:rollback`, restore from #8). *Recommend:*
**now, concise.** Direct production-safety value.

**10 — HOW vs ops balance.** Covered above: the imbalance is real but phase-appropriate. Close it with
**#3 + #8 + #9 + light #5/#1 now**; defer #2/#4/#7 and reject #6-as-separate. Net effect: ~4 small new
docs, not 8.

## Recommended additions (create as separate notes when ready)
1. **`IFN Backend — Authorization Matrix`** — Action × {Student, Mentor, Admin}. *(now)*
2. **`IFN Backend — Runbook`** — deploy, rollback, migrate, secret rotation, restore, emergency admin. *(now)*
3. **`IFN Backend — Backup & Restore`** — schedule, what's backed up, restore steps, restore test. *(now)*
4. **`IFN Backend — Security & Threats`** — consolidated posture + residual risks (mostly ADR references). *(now, light)*
5. Add `status` / `owner` / `updated` frontmatter to every doc. *(now, minimal)*
6. Later: generated OpenAPI; observability runbook; NFR targets once usage exists.

Want me to create docs 1–4 (authz matrix, runbook, backup, security) as new `.md` notes in this folder?

> Stale pointer note: this index says "Source code: `~/lumenor/ifn`" — the code now lives in
> `~/lumenor/oldcode_ifn`; this folder is the docs-only repo. Update when the layout settles.
