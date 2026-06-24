---
title: IFN — v1 Scope
tags: [ifn, product, scope, mvp]
status: Draft
owner: IFN Team
updated: 2026-06-09
---

# IFN — v1 Scope

Locks the product cuts that came out of the [[IFN PRD]] Product Review (2026-06-09). The PRD remains
the feature contract; **this doc decides what ships in v1, what is deferred, and what is rejected** so
the rest of the documentation (authorization, runbook, ADRs) describes a fixed target rather than a
moving one.

See [[IFN Backend Index]] · [[IFN PRD]] · [[IFN Backend — Decisions (ADR)]] · [[IFN Backend — Authorization Matrix]].

## Thesis

Ship **fewer surfaces, launched alive, around the mentorship pipeline.** The pipeline (idea → mentor →
G1–G6 → incubation) is the actual product; Feed, Directory, and Team Board exist to feed it. The two
risks that kill a campus community product — **cold-start** (empty surfaces) and a **throttled core**
(friction, admin bottleneck, invisible async state) — drive every decision below.

## v1 — in scope

| Area | v1 decision |
|------|-------------|
| **Unified Feed** | One board. "Problem" is a **post type** with a filter chip — **not** a separate page. Ideas, problems, wins in one stream. |
| **Pipeline (light entry)** | Enter with title + one-liner + problem → **G1**. Heavy basic-details (market size, feasibility self-assessment) + PDF move to **G2–G3**, once a mentor is engaged. Gate *progression*, not *entry*. |
| **Mentorship + async channel** | Keep the gate machine + rubric, **plus** a lightweight private mentor↔founder thread per idea (author/mentor/admin), usable any time — not only at gates. |
| **Mentor pull-queue** | G1→G2 is no longer admin-push-only. Mentors **self-pick** from an "available ideas" queue. Admin assign/override stays as a fallback. |
| **Multiple admins** | More than one Super Admin so the core path never freezes on one absent person. |
| **Directory (privacy-fixed)** | Phone **hidden by default**; per-field visibility toggles; LinkedIn opt-in. |
| **Notifications (in-app)** | Minimal in-app center + unread badge for: mentor assigned, review submitted / revision requested, idea approved / rejected, team application received, tag / event approved. Wires the existing `user_settings` toggles. |
| **Moderation (basic)** | Report → admin queue → hide/remove. **Ships with anonymous posting** (see below). |
| **Onboarding / adoption** | First-run sells *passive* value (browse, find people, see events); engagement ladder lurk → vote → comment → post → pipeline. Feed never empty (rich seed + staff/mentor seeding). |
| **Auth / sessions** | As locked (passwordless magic-link, DB session cookie) **plus** uniform anti-enumeration responses + auth rate limiting (see [[IFN Backend — Security & Threats]]). |

## Deferred — later phase

- **Standalone Problem Hub** — folded into the unified Feed for v1; revisit only if volume demands a split.
- **Idea Autopsy Report** — post-MVP.
- **Full Calendar** (react-big-calendar page) — v1 keeps only the "Upcoming Events" sidebar list; RSVP + reminders later (reminders depend on notifications).
- **Tag governance machinery** — keep tag *requests*, but defer heavy approval workflow; consider mentor/auto-approval for low-risk tags later.
- **Team Board lifecycle** — v1 = post + apply + poster sees applicants; statuses (sent/accepted/rejected) + withdraw are fast-follow.
- **Success badge enforcement** — define criteria now (evidence-backed: revenue / users / funding / incorporation / accelerator); enforce later.
- **Engagement extras** — @mentions + bookmarks are fast-follow; follow users/startups + activity feed later.
- **Email notifications + background queue** — later (in-app first).

## Rejected — not for MVP

- **Reputation system + contributor badges** — premature gamification; invites vanity-farming.
- **Attendance tracking** on events — low value for a campus tool.
- **Real-time / sockets** — REST + polling only (stands by ADR-009 as amended by ADR-020).

## Conditional rule — anonymous posting

Anonymous posting (PRD-locked) **only ships alongside report→remove moderation.** If moderation slips,
**anonymous posting waits** — anon + no moderation is an unacceptable abuse/safety posture on a
university platform.

## Net effect

Roughly **5 live surfaces** at launch (Feed, Pipeline/Mentorship, Directory, Team Board, Notifications)
instead of 9 — concentrated activity, a low-friction core, and the safety/visibility a real ecosystem
needs. Everything deferred can be added once there is activity to justify it.

## Acceptance

This doc is **Draft** until the product owner signs off the cuts. On sign-off it becomes the input to a
**PRD v4** (or a PRD v3 → v4 amendment) and to [[IFN Backend — Authorization Matrix]].
