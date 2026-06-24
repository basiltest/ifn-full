---
title: IFN Backend — Authorization Matrix
tags: [ifn, backend, authorization, security]
status: Draft
owner: IFN Team
updated: 2026-06-09
---

# IFN Backend — Authorization Matrix

The single source of truth for **who can do what**. Consolidates the rules scattered across
[[IFN PRD]] §1, [[IFN Backend — Decisions (ADR)]] (ADR-004), and the service guards. Doubles as the
checklist for the role-guard integration tests (ADR-015).

See [[IFN Backend Index]] · [[IFN — v1 Scope]] · [[IFN Backend — Security & Threats]].

## Roles

- **Student** — default account. Authors content, submits ideas, applies to team posts.
- **Mentor** — Student powers **plus** review of *assigned* ideas. (Alumni register as Mentor.)
- **Super Admin** (`role = admin`) — **inherits all Mentor powers** + platform administration. Appears
  in the mentor dropdown and may self-assign/pick up ideas.

**Inheritance:** the guard treats `admin ≥ mentor ≥ student`. A check for "mentor" passes for admin.

**Scoping qualifiers (beyond role):**
- **Owner** — only the resource's author (e.g. edit/delete own post, submit own idea's deliverables).
- **Assigned mentor** — only the mentor assigned to *that* idea (or admin) may review/advance it.
- **Dossier scope** — full idea dossier is visible to **author + assigned mentor + admin** only.

## Matrix

Legend: ✓ allowed · ✗ denied · **O** owner-only · **A** assigned-mentor-only (admin always allowed).

| Action | Student | Mentor | Super Admin |
|--------|:------:|:------:|:-----------:|
| Register / login / logout | ✓ | ✓ | ✓ |
| View Feed / Directory / Team Board | ✓ | ✓ | ✓ |
| Create post (idea / problem) + draft | ✓ | ✓ | ✓ |
| Post anonymously | ✓ | ✓ | ✓ |
| Edit / delete **own** post | O | O | ✓ (any, moderation) |
| Vote / comment | ✓ | ✓ | ✓ |
| Add `#IdeaAutopsy` / `#IdeaValidation` to own post | O | O | ✓ |
| Request `#Success` badge | O | O | ✓ |
| Request a new tag | ✓ | ✓ | ✓ |
| Submit idea to pipeline (light entry → G1) | ✓ | ✓ | ✓ |
| Submit a gate's deliverables | O | O | ✓ |
| View **own** idea dossier | O | — | ✓ |
| View an idea's full dossier | ✗ | A | ✓ |
| Pick up an available idea (G1→G2 pull-queue) | ✗ | ✓ | ✓ |
| Review a stage (rubric + feasibility + decision) | ✗ | A | ✓ |
| Advance gate via approval (G3→G6) | ✗ | A | ✓ |
| Add a per-stage extra-ask | ✗ | A | ✓ |
| Mentor↔founder async note (per idea) | O | A | ✓ |
| Assign / reassign mentor | ✗ | ✗ | ✓ |
| Override any gate (with reason) | ✗ | ✗ | ✓ |
| Reject (final) / Refine & Retry | ✗ | ✗ | ✓ |
| Lock / unlock the pipeline | ✗ | ✗ | ✓ |
| Approve / reject tag & `#Success` requests | ✗ | ✗ | ✓ |
| Apply to a team post | ✓ | ✓ | ✓ |
| List applicants on a team post | O (poster) | O (poster) | ✓ |
| Accept / reject an application *(fast-follow)* | O (poster) | O (poster) | ✓ |
| Withdraw **own** application *(fast-follow)* | O | O | ✓ |
| Create event directly | ✗ | ✗ | ✓ |
| Request an event | ✓ | ✓ | ✓ |
| Approve / reject event requests | ✗ | ✗ | ✓ |
| Add an event to **all** students' calendars | ✗ | ✗ | ✓ |
| Remove an event from **own** calendar | ✓ | ✓ | ✓ |
| Pin / unpin posts | ✗ | ✗ | ✓ |
| Change a user's role | ✗ | ✗ | ✓ |
| Report a post / comment *(moderation)* | ✓ | ✓ | ✓ |
| Hide / remove reported content | ✗ | ✗ | ✓ |
| See identity behind an anonymous post | ✗ | ✗ | ✓ |
| Read own notifications | ✓ | ✓ | ✓ |

## Rules that aren't a single cell

- **Anonymous masking** is applied in the serializer, not the client: `author_id` is always stored;
  responses strip identity for anonymous posts **unless** the viewer is admin.
- **Assigned-mentor enforcement:** review/advance/extra-ask/pickup-detail checks compare the idea's
  `mentor_id` to the caller; admin bypasses.
- **Dossier fetch** returns 403 unless caller is author, assigned mentor, or admin.
- **Owner actions** (edit/delete post, submit deliverables, withdraw application) compare the caller to
  the resource author; admin may override for moderation only.
- **Reason required:** admin gate override demands a non-empty `reason` (audited in `gate_transitions`).

## Open items (depend on [[IFN — v1 Scope]] sign-off)
- Team application accept/reject/withdraw — marked *fast-follow*.
- Mentor pull-queue replaces admin-only assign as the primary G1→G2 path.
- Report/remove rows ship with anonymous posting.
