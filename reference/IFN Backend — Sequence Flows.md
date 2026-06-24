---
title: IFN Backend — Sequence Flows
tags: [ifn, backend, sequence, flows]
status: Approved
owner: IFN Team
updated: 2026-06-09
---

# IFN Backend — Sequence Flows

PlantUML sequence diagrams for the critical IFN backend flows. Participants: **SPA** (React),
**API** (the relevant Express module), **PG** (Postgres), **Mail** (mailer), **FS** (file storage).

See [[IFN Backend Index]] · [[IFN Backend — Architecture]] · [[IFN Backend — Data Model]].

## 1. Register → verify → session (magic-link)

```plantuml
@startuml
autonumber
actor User
participant SPA
participant "API: auth" as API
database PG
participant Mail

User -> SPA : fill register form\n(name,email,role,region,sector,domain,…)
SPA -> API : POST /api/v1/auth/register
API -> API : validate email ends @ifheindia.org (zod)
API -> PG : INSERT users(verified=false) (or find existing)
API -> PG : INSERT magic_tokens(purpose=verify, token_hash, expires)
API -> Mail : send magic link (?token=…)
note right of Mail : dev = console/Ethereal\nprod = SMTP
API --> SPA : 202 "check your email"
User -> Mail : open link
User -> SPA : GET /verify?token route
SPA -> API : GET /api/v1/auth/verify?token=…
API -> PG : SELECT magic_tokens (unconsumed, unexpired)
alt valid
  API -> PG : UPDATE users SET verified=true
  API -> PG : UPDATE magic_tokens SET consumed_at=now()
  API -> PG : INSERT sessions(user_id,…)
  API --> SPA : 200 + Set-Cookie sid (httpOnly,Secure,SameSite)
else invalid/expired
  API --> SPA : 400 {error}
end
@enduml
```

## 2. Passwordless login

```plantuml
@startuml
autonumber
actor User
participant SPA
participant "API: auth" as API
database PG
participant Mail

User -> SPA : enter email
SPA -> API : POST /api/v1/auth/login {email}
API -> API : rate-limit per-IP + per-email cooldown (ADR-019)
API -> PG : SELECT users WHERE email=? AND verified
opt found AND verified
  API -> PG : INSERT magic_tokens(purpose=login)
  API -> Mail : send login link
end
note over API : identical response whether or not the account exists\n(no account enumeration — proposed ADR-027)
API --> SPA : 202 "If the account exists, a login link has been sent."
User -> SPA : open link -> GET /api/v1/auth/verify?token
API -> PG : consume token + INSERT sessions
API --> SPA : 200 + Set-Cookie sid
@enduml
```

## 3. Create post (+ anonymous masking) and comment

```plantuml
@startuml
autonumber
participant SPA
participant "API: posts" as API
participant "Serializer" as S
database PG

SPA -> API : POST /api/v1/posts {kind,title,problem,solution?,tags,anonymous,…}
API -> API : session + zod + role guard
API -> PG : INSERT posts(author_id=req.user, anonymous,…)
API -> PG : upsert tags + INSERT post_tags\n(new tag -> tag_requests pending)
note over API,PG : idea (not autopsy) also creates ideas_pipeline at G1\n(see flow 4); problem never enters pipeline
API -> S : serialize post
S -> S : if anonymous AND viewer != admin -> hide author
API --> SPA : 201 post

== later: comment ==
SPA -> API : POST /api/v1/posts/:id/comments {body}
API -> PG : INSERT comments
API --> SPA : 201 comment (author masked per rule)
@enduml
```

## 4. Pipeline — submit → assign → pickup → **per-stage deliverables** → review → advance → override

Each gate has a deliverable template; the student submits that stage's deliverables (`idea_submissions`
+ files), the assigned mentor reviews them (`idea_reviews`), and approval advances the gate. Admin can
override any gate. See the dossier fetch in flow 8 and [[IFN Backend — Data Model]].

```plantuml
@startuml
autonumber
actor Student
actor Mentor
actor "Super Admin" as Admin
participant "API: pipeline" as API
database PG
participant FS

== submit ==
Student -> API : POST /api/v1/ideas (basic details + doc/pdf)
API -> PG : SELECT pipeline_settings
alt locked
  API --> Student : 403 submissions closed
else open
  API -> FS : store file to TEMP path (10MB, mime sniff)
  API -> PG : BEGIN ; ifn = ifn_counter+1 (atomic UPDATE…RETURNING)\nINSERT posts + ideas_pipeline(gate=1)
  API -> PG : INSERT attachments ; INSERT gate_transitions(->1, by=student) ; COMMIT
  API -> FS : on commit -> finalize temp→final; on failure -> unlink temp\n(orphan sweep is the backstop — ADR-025)
  API --> Student : 201 idea IFN-n @ G1
end

== assign mentor (G1->G2) ==
Admin -> API : POST /api/v1/ideas/:id/assign {mentor_id}
API -> API : guard role=admin
API -> PG : UPDATE ideas_pipeline SET mentor_id, gate=2
API -> PG : INSERT gate_transitions(1->2, role=admin)

== mentor pickup (G2->G3) ==
Mentor -> API : POST /api/v1/ideas/:id/pickup
API -> API : guard = assigned mentor (or admin)
API -> PG : UPDATE gate=3 ; INSERT gate_transitions(2->3)

== student submits stage deliverables ==
Student -> API : POST /api/v1/ideas/:id/stages/:gate/submit\n(template fields + files)
API -> API : guard = author ; validate vs stage template + extra_asks
API -> FS : store stage files
API -> PG : upsert the gate's DRAFT row in place; on submit FREEZE it immutable;\na revision after revision_requested INSERTs a NEW version row (proposed ADR-028)\n+ attachments(submission_id, gate, slot_key)

== mentor reviews the stage (G3->..->G6) ==
note over API,PG : every gate mutation (review-approve, override, pickup, resubmit) runs in ONE txn:\nSELECT ideas_pipeline FOR UPDATE → re-validate transition from the locked gate → UPDATE → INSERT gate_transitions\n(serializes mentor-approve vs admin-override — proposed ADR-026)
Mentor -> API : POST /api/v1/ideas/:id/stages/:gate/review\n(criteria + feasibility + feedback + decision)
API -> API : assigned-mentor check
API -> PG : INSERT idea_reviews(gate, criteria, decision)
alt decision = approved
  API -> PG : UPDATE idea_submissions.status=approved
  API -> PG : UPDATE ideas_pipeline gate=gate+1 ; INSERT gate_transitions
else decision = revision
  API -> PG : UPDATE idea_submissions.status=revision_requested
  note right of API : student re-submits same gate's deliverables
end

== mentor/admin add a custom deliverable ask ==
Mentor -> API : POST /api/v1/ideas/:id/extra-asks {gate,label}
API -> PG : INSERT idea_extra_asks(status=open)

== admin override (any->any) ==
Admin -> API : POST /api/v1/ideas/:id/gate {gate, reason}
API -> API : guard role=admin ; reason required
API -> PG : UPDATE gate ; INSERT gate_transitions(role=admin, reason)

== reject / refine&retry ==
Admin -> API : POST /api/v1/ideas/:id/refine
API -> PG : UPDATE pipeline_state=refine (KEEP ifn)
Student -> API : POST /api/v1/ideas/:id/resubmit
API -> PG : UPDATE pipeline_state=active, gate=1 (SAME ifn)
API -> PG : INSERT gate_transitions
@enduml
```

## 5. New-tag / #Success request → admin approval

```plantuml
@startuml
autonumber
actor User
actor "Super Admin" as Admin
participant "API: tags" as API
database PG

User -> API : POST /api/v1/tag-requests {tag}  // or POST /posts/:id/success-request
API -> PG : INSERT tag_requests(status=pending)\n(or posts.success_request=pending)
API --> User : 201 pending (fake toast on FE)

Admin -> API : POST /api/v1/tag-requests/:id/approve
API -> PG : UPDATE tags SET approved=true (usable/trending)
API -> PG : UPDATE tag_requests SET status=approved
note right of API : #Success approve ->\nposts.success_request=approved\n+ add 'Success' badge
API --> Admin : 200
@enduml
```

## 6. Calendar event request → approve → add to all students

```plantuml
@startuml
autonumber
actor Founder
actor "Super Admin" as Admin
participant "API: calendar" as API
database PG

Founder -> API : POST /api/v1/event-requests {title,desired_date,note}
API -> PG : INSERT event_requests(status=pending)
API --> Founder : 201 (fake toast)

alt approve
  Admin -> API : POST /api/v1/event-requests/:id/approve {audience}
  API -> PG : INSERT events(audience='all'|'self', creator=admin)
  API -> PG : UPDATE event_requests SET status=approved, resolved_event_id
  API --> Admin : 201 event
else reject (status already in schema; add a reason)
  Admin -> API : POST /api/v1/event-requests/:id/reject {reason}
  API -> PG : UPDATE event_requests SET status=rejected, note=reason
  API --> Admin : 200
end
note over API,PG : audience='all' -> visible to every student at query time\nno per-user copies; removals via event_hidden
@enduml
```

## 7. Talent Acquisition — apply

```plantuml
@startuml
autonumber
actor Applicant
participant "API: teamboard" as API
database PG

Applicant -> API : POST /api/v1/team-posts/:id/apply {message}
API -> API : session + zod
API -> PG : INSERT team_applications(team_post_id, applicant_id, message, status=sent)
API --> Applicant : 201 "Application sent ✓"
note right of PG : poster can GET /team-posts/:id/applications
@enduml
```

## 8. Idea dossier fetch (mentor / admin see the *full* case file)

```plantuml
@startuml
autonumber
actor "Mentor / Admin" as Viewer
participant SPA
participant "API: pipeline" as API
participant "Authz" as AZ
database PG
participant FS

Viewer -> SPA : open Mentor Review / Admin Panel -> an idea
SPA -> API : GET /api/v1/ideas/:id/dossier
API -> AZ : viewer == author OR assigned mentor OR admin ?
alt allowed
  API -> PG : SELECT post overview + basic_details + feasibility
  API -> PG : SELECT idea_submissions[] (all gates) + payloads
  API -> PG : SELECT attachments[] (by gate/slot) -> signed paths
  API -> PG : SELECT idea_reviews[] (history)
  API -> PG : SELECT idea_extra_asks[]
  API -> PG : SELECT gate_transitions[] (timeline)
  API --> SPA : 200 dossier { overview, basicDetails, feasibility,\n submissions[], attachments[], reviews[], extraAsks[], timeline[] }
  SPA -> FS : download a file (author/mentor/admin only)
else not allowed
  API --> SPA : 403
end
@enduml
```

> Replaces the old behaviour where Mentor Review / Admin Panel showed only a title + description.
> The dossier is the complete record; the public Feed still shows only the post overview.

# Sequence Flow Review — 2026-06-09

Review of 12 proposed flow fixes. Accepted-now items are already applied to the diagrams above;
the rest are deferred/rejected with reasons. Items 2/7/10/12 were decided in the ADR Design Review
and are cross-referenced, not re-litigated. Three new ADRs are *proposed* here (026 concurrency,
027 auth-response, 028 submission versioning) — see "Proposed ADRs" at the end.

## Verdict summary

| # | Fix | Verdict | When | Note |
|---|-----|---------|------|------|
| 1 | Prevent account enumeration | **Accept** | now | Flow 2 revised: identical 202 for all logins → proposed ADR-027 |
| 2 | Rate-limit auth flows | **Accept** | now | = ADR-019; extended to `/verify` + per-email cooldown (flow 2 note) |
| 3 | Mentor must accept assignment | **Already present** | later (decline path) | "Pickup" *is* acceptance; add a decline/reassign action later |
| 4 | Concurrency on gate writes | **Accept** | now | Flow 4 note: `SELECT … FOR UPDATE` + re-validate → proposed ADR-026 |
| 5 | Idempotency rules | **Tiered** | now (via #4/#10) / later (keys) | State-transition dupes solved by #4+#10; Idempotency-Key for creates later |
| 6 | File upload failure strategy | **Accept** | now | Flow 4 revised: temp→commit→finalize, unlink on fail; sweep backstop (ADR-025) |
| 7 | Notification generation | **Accept** | now (in-app) | = ADR-020; flows are the inline write points |
| 8 | Dossier query explosion | **Mostly reject** | later (conditional) | Volumes are small; ensure batched (no N+1) now, summary endpoint only if it hurts |
| 9 | Submission versioning | **Accept** | now | Flow 4 revised: draft mutable, submitted immutable, revision = new version → ADR-028 |
| 10 | Duplicate team applications | **Accept** | now | = ADR-021 (`UNIQUE` + 409); flow 7 |
| 11 | Event request extra states | **Partial** | now (reject) / reject (rest) | `rejected` already in schema (flow 6 now shows it + reason); skip revision/clarification states |
| 12 | Mentor communication channel | **Keep removed** | later (conditional) | = ADR-008 hook; dossier review loop is the async channel; add dossier notes only if asked |

## Detail (problem → risk → cost → recommendation)

**1 — Account enumeration.** *Problem:* flow 2 returned 202 for verified accounts, 401 ("register
first") otherwise — and register reveals existing emails. *Risk:* anyone can probe which
`@ifheindia.org` people have accounts → targeted phishing/spam; confirmed live (the E2E run got
`POST /auth/login for mehta@ → 401`). *Cost:* low — return one generic 202 always; do the
mail-send inside an `opt` only when the account exists; mirror on register (generic message, or mail
an existing user a login link instead of "already registered"). Watch the timing side-channel (the
found-path does more work) — keep it roughly constant or let rate-limiting blunt it. *Recommend:*
**now.** Applied to flow 2.

**3 — Mentor acceptance.** *Problem:* proposal wants Assign → Pending → Accept → progress. *Reality:*
the flow already has Assign (G1→G2) **then** Pickup (G2→G3) — "pickup" **is** the mentor's
acceptance; G2 is the pending-acceptance state. *Risk if unchanged:* the only real gap is no
**decline/reassign** — an unavailable mentor leaves the idea stuck at G2 until an admin notices.
*Cost:* low (one decline endpoint → back to unassigned/G1 + a transition; admin "pending-pickup per
mentor" view for load balancing). *Recommend:* **keep the two-step; add decline + load view later**
if mentors report stuck assignments. Don't add a redundant "pending" state.

**4 — Concurrency on gate writes.** *Problem:* mentor-approve (`gate+1`) and admin-override
(`gate=X`) both mutate `ideas_pipeline.gate` with no coordination. *Risk:* lost update + a nonsensical
`gate_transitions` trail when they land together; rare but corrupts the state machine the whole
pipeline depends on. *Cost:* low–moderate — wrap every gate mutation in a txn that does
`SELECT … FOR UPDATE` on the pipeline row, re-validates the transition is still legal from the
*locked* current gate, then writes. Pessimistic locking fits (short txns, low contention).
*Recommend:* **now** (proposed ADR-026). Annotated on flow 4. This also makes gate steps atomic,
which feeds item 5.

**5 — Idempotency.** *Problem:* double-click/retry → duplicate reviews, double gate advance,
duplicate ideas/applications. *Risk:* over-advanced gates (one stage → +2), confusing duplicate
history, duplicate rows. *Cost:* mostly free if #4 + #10 land — the row-lock + transition re-check
makes a second gate/review request see the already-advanced state and no-op/409; the team-apply
`UNIQUE` (ADR-021) rejects dupes. The one gap is **create** endpoints (`POST /ideas`,
`/stages/:gate/submit`) where a double-click makes two rows — handle with a client-supplied
**Idempotency-Key** (short-lived server store) *later*, plus the cheap frontend submit-disable now.
*Recommend:* **now via #4/#10; Idempotency-Key later; reject** a full idempotency framework for MVP.

**6 — File upload failure.** *Problem:* file written then DB row inserted (or vice-versa) — not
atomic. *Risk:* orphaned files (disk waste, minor) or rows pointing at missing files (broken
download, worse); the original flow even inserted `attachments` *before* the parent post. *Cost:*
moderate-low — write to a temp path, do the DB txn (post → attachments) , finalize the file on
commit, `unlink` on failure; the ADR-025 sweep reconciles stragglers. Never insert a row before the
bytes are durable. *Recommend:* **now.** Flow 4 reordered + annotated.

**8 — Dossier query explosion.** *Problem:* the dossier loads submissions + attachments + reviews +
extra-asks + transitions for all gates. *Risk:* large/slow fetch — but realistically an idea has ≤6
gates with a handful of rows each (dozens, not thousands), and "full case file" is the *point* of
ADR-017. The "explosion" is overstated for incubator scale. *Cost:* pagination/lazy-load/summary
endpoints = moderate + frontend rework. *Recommend:* **now** = verify each child is one batched
`WHERE post_id=?` query (no per-gate N+1) and attachments return metadata + signed URL only (bytes
lazy — already so). **Later/conditional** = a `GET /ideas/:id/dossier/summary` (counts + latest per
gate) for list views and lazy section loading, *only if* a real dossier proves slow. **Reject**
paginating the dossier for MVP — premature.

**9 — Submission versioning.** *Problem:* flow said "INSERT/UPDATE idea_submissions" — ambiguous; an
in-place update of a *submitted* payload would erase what the mentor reviewed, contradicting ADR-017's
"submissions accumulate" promise. *Risk:* lost audit — feedback that references an overwritten
submission becomes meaningless. *Cost:* low — rule: one mutable **draft** row per (post, gate); on
**submit** freeze it immutable; a revision after `revision_requested` INSERTs a **new version** row
(order by `created_at`/a `version`). *Recommend:* **now** (proposed ADR-028). Flow 4 clarified.

**11 — Event request lifecycle.** *Problem:* flow showed only request → approve. *Reality:*
`event_requests.status` already allows `rejected`; the path was just undrawn. *Risk if unchanged:*
admin can't say "no" with a reason; richer states (revision/clarification) would need a back-and-forth
channel. *Cost:* reject path = trivial (now drawn, + a `note` reason). Revision/clarification states =
moderate (new statuses + a requester channel + UI) for a low-frequency, low-stakes action. *Recommend:*
**now** for reject + reason; **reject** the extra states for MVP — reject-with-reason + resubmit is
enough. Revisit only if admins hit friction.

## Proposed ADRs (for the Decisions doc)
- **ADR-026 — Gate-mutation concurrency:** all `ideas_pipeline` gate changes run in a txn with
  `SELECT … FOR UPDATE` + transition re-validation (pessimistic; optimistic `gate_version` later if
  client-visible conflicts are wanted).
- **ADR-027 — Uniform auth responses:** login/register always return the same generic 202; never
  reveal account existence/verification state; pair with ADR-019 rate limits + timing care.
- **ADR-028 — Submission versioning:** draft = mutable single row per (post, gate); submitted =
  immutable; post-revision resubmit = new version row (auditable history).

Want these three folded into `IFN Backend — Decisions (ADR).md` as full ADR-026/027/028?

---

Related: [[IFN Backend — Architecture]] · [[IFN Backend — Data Model]] · [[IFN Backend — Decisions (ADR)]]
