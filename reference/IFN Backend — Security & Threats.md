---
title: IFN Backend — Security & Threats
tags: [ifn, backend, security, threat-model]
status: Draft
owner: IFN Team
updated: 2026-06-09
---

# IFN Backend — Security & Threats

Consolidated security posture for IFN. Mostly references decisions made elsewhere; its job is to make
the assumptions **explicit** and name the residual risks. Light by design — not a formal STRIDE
exercise. Security is the riskiest area (ADR-015), so it gets one page.

See [[IFN Backend Index]] · [[IFN Backend — Decisions (ADR)]] · [[IFN Backend — Authorization Matrix]].

## Trust model
- Users are `@ifheindia.org` accounts (domain-restricted registration) — a **semi-trusted** campus
  population, not the public internet. Lower external-attacker risk; **higher insider/abuse risk**
  (harassment, spam, vanity claims), amplified by anonymous posting.
- Roles: Student / Mentor / Super Admin (admin ⊇ mentor). See [[IFN Backend — Authorization Matrix]].

## Controls (decision → where)
| Concern | Control | Source |
|---------|---------|--------|
| Authentication | Passwordless magic-link; one-time hashed, expiring tokens; verify-before-login | ADR-002 |
| Sessions | Opaque DB-backed cookie, httpOnly + Secure + SameSite; delete = instant revoke | ADR-003 |
| Account enumeration | Uniform generic `202` on login/register; never reveal existence/verification | ADR-027 |
| Brute force / email bombing | Rate limits on login/register/verify + per-email cooldown | ADR-019 |
| Authorization | Server-owned roles; guard `admin ≥ mentor ≥ student`; owner + assigned-mentor + dossier scoping | ADR-004, Authz Matrix |
| Anonymous abuse | Identity stored + visible to admin; masking in the serializer; **report→remove moderation ships with anon** | PRD, [[IFN — v1 Scope]] |
| File upload | 10 MB cap, extension allow-list (.pdf/.doc/.docx) + magic-byte mime sniff (don't trust client mime); bytes off-web behind a Storage iface | ADR-007 |
| File integrity (later) | Optional SHA-256 on attachments (dedup + integrity) | ADR design review #6 |
| Concurrency integrity | Gate mutations under `SELECT … FOR UPDATE` + transition re-validation | ADR-026 |
| Input validation | zod on every request; one error envelope | ADR-014 |
| Transport / headers | helmet + cors (allow web origin only); TLS at the proxy | ADR-014, Runbook |
| Audit | Append-only `gate_transitions` (who/role/reason/when); review history in `idea_reviews` | ADR-006, ADR-017 |
| Secrets | `.env` only; rotation procedure; never committed | Runbook |
| Data durability | Backups + tested restore | [[IFN Backend — Backup & Restore]] |

## Authorization boundaries (the ones most likely to leak)
- **Dossier:** author + assigned mentor + admin only → 403 otherwise.
- **Assigned-mentor:** review / advance / extra-ask only by the idea's mentor (admin bypass).
- **Owner:** edit/delete post, submit deliverables, withdraw application = author only; admin override
  for moderation only.
- **Admin-only:** assign/override/lock/approve/pin/role-change.
- **Anonymous masking** is server-side; never trust the client to hide identity.

## Residual risks (accepted or deferred)
- **Timing side-channel on auth** — the account-exists path does more work than not-exists; rate
  limiting (ADR-019) blunts practical enumeration. Keep the paths cost-close. *Accepted for MVP.*
- **In-memory rate limiter** — per-instance only; multi-instance needs a shared store (Redis, ADR-023).
  *Acceptable while single-instance.*
- **Magic-link in logs** — the dev console transport prints tokens; **must be SMTP in prod** so tokens
  never hit logs. *Operational control, see Runbook.*
- **Insider abuse / harassment** — mitigated by report→remove + admin visibility of anon identity;
  user suspension + spam automation are *later*.
- **Synchronous email send** — a slow/failing SMTP blocks the triggering request; *acceptable at MVP
  volume*, queue later (ADR-024).
- **No WAF / DDoS protection** — out of scope for a campus MVP behind a proxy; revisit if exposed.

## Pre-production checklist
- [ ] `MAIL_TRANSPORT=smtp` (no tokens in logs); SMTP creds set + tested.
- [ ] TLS terminating in front; `WEB_ORIGIN` / `APP_URL` set to the https domain (Secure cookies).
- [ ] Rate limits (ADR-019) active on auth endpoints.
- [ ] Uniform auth responses (ADR-027) verified — login of a non-existent email returns the same `202`.
- [ ] Report→remove moderation present **if** anonymous posting is enabled.
- [ ] Backups scheduled + a restore tested ([[IFN Backend — Backup & Restore]]).
- [ ] Initial admin exists (bootstrap seed) and can receive a magic link.
- [ ] Secrets only in `.env`; not in git; rotation procedure known.
