---
title: IFN — Workflows
tags: [ifn, workflows, e2e, testing]
status: Approved
owner: IFN Team
updated: 2026-06-09
---

# IFN — Workflows

Every user-facing workflow in the IFN app, by role, with PlantUML. Each has a stable **W-id** that
the Playwright E2E suite maps to (`e2e/*.spec.js`). Roles: **Student**, **Mentor**, **Super Admin**
(admin inherits mentor powers). Auth is passwordless magic-link; the SPA uses HashRouter
(`/#/route`). See [[IFN Backend Index]] · [[IFN Backend — Sequence Flows]].

## Workflow catalog

| W | Workflow | Role | Entry | Expected outcome |
|---|---|---|---|---|
| W1 | Register new account | guest | `/#/register` | account pending → magic link → verified |
| W2 | Passwordless login | guest | `/#/login` | magic link → `/#/verify?token` → feed |
| W3 | Verify magic link | guest | `/#/verify?token` | `ifn_sid` cookie set → redirect `/` |
| W4 | Logout | any | header | session cleared → `/#/login` |
| W5 | View feed (sort/search/trending) | any | `/` | posts list, pinned first, `#tag` filter |
| W6 | Create idea post | any | Create Post | post created → enters pipeline G1 |
| W7 | Create problem post | any | Create Post → Problem Hub | problem in `/#/problems`, no pipeline |
| W8 | Save + publish draft | any | Create Post → draft | draft private → publish → feed |
| W9 | Anonymous post (masking) | any | Create Post → anon | author hidden to non-admin, shown to admin |
| W10 | Vote up/down | any | post card | score changes, one vote/user |
| W11 | Comment + sub-thread | any | post detail | comment + progress update appear |
| W12 | Edit post (original vs edited) | author | post menu | "edited" + original snapshot kept |
| W13 | Add tag / self-badge | author | post menu | new tag → tag request; IdeaAutopsy/Validation applied |
| W14 | Request #Success | author | post menu | success_request = pending |
| W15 | Idea Autopsy report | author | post menu | autopsy saved, excluded from pipeline |
| W16 | Submit idea to pipeline | student+ | Idea Pipeline → Submit | IFN-n issued, G1, dossier created |
| W17 | Submit stage deliverables | author | dossier → stage | idea_submission saved + files |
| W18 | View own pipeline + dossier | author | Idea Pipeline | gates G1–G6 + full dossier |
| W19 | Submit blocked when locked | student | Idea Pipeline (locked) | 403 / "submissions closed" banner |
| W20 | Mentor: view assigned dossier | mentor | Mentor Review | full case file, not a blurb |
| W21 | Mentor pickup (G2→G3) | mentor | Mentor Review | gate → G3 |
| W22 | Mentor stage review | mentor | Mentor Review | rubric+feasibility+feedback; approve advances / revision back |
| W23 | Mentor add extra-ask | mentor | dossier | extra_ask appears in student checklist |
| W24 | Admin: view all dossiers | admin | Admin Panel | every IFN + full dossier |
| W25 | Assign / reassign mentor (G2) | admin | Admin Panel | mentor set, gate → G2 |
| W26 | Override gate (audited) | admin | Admin Panel | any→any gate, reason logged |
| W27 | Reject / Refine & Retry | admin | Admin Panel | rejected, or refine → resubmit keeps IFN-n |
| W28 | Lock / unlock pipeline | admin | Admin Panel | submit gating toggles |
| W29 | Tag Requests approve/reject | admin | Tag Requests | new tag usable / #Success badge added |
| W30 | Pin / unpin post | admin | post menu | pinned to top of feed |
| W31 | Change member role | admin | (API/UI) | user role updated server-side |
| W32 | Directory browse/filter | any | Directory | filter role/region/sector/domain, contact |
| W33 | Post talent need | any | Talent Acquisition | team_post created |
| W34 | Apply to team post | any | Talent Acquisition | application stored, poster sees applicants |
| W35 | Calendar view + remove own | any | Calendar | events visible; remove from own calendar |
| W36 | Request event (founder→admin) | student/mentor | Calendar | event_request queued |
| W37 | Admin create event (+ all students) | admin | Calendar | event created, audience all |
| W38 | Edit profile | any | Profile | profile fields updated |
| W39 | Settings (notif/theme/logout) | any | Settings | toggles persist; logout |

## Master journey — login → role landing

```plantuml
@startuml
autonumber
actor User
participant SPA
participant "API /api/v1" as API
database PG
participant Mail
User -> SPA : open http://localhost
SPA -> API : GET /auth/me (cookie?)
alt no session
  API --> SPA : 401 -> redirect /#/login
  User -> SPA : enter @ifheindia.org email
  SPA -> API : POST /auth/login
  API -> PG : magic_tokens(login)
  API -> Mail : link http://localhost/#/verify?token=...
  User -> SPA : open link (/#/verify?token)
  SPA -> API : GET /auth/verify?token
  API -> PG : consume token + INSERT sessions
  API --> SPA : 200 + Set-Cookie ifn_sid
end
SPA -> API : GET /auth/me
API --> SPA : {user, role}
note over SPA : role gates nav -> student / mentor / admin landing
@enduml
```

## Auth workflows (W1–W4)

```plantuml
@startuml
start
:guest hits app;
if (has valid session?) then (yes)
  :load feed;
  stop
else (no)
  if (new user?) then (W1 register)
    :fill register form (name,email,role,region,sector,domain);
    :POST /auth/register -> pending;
    :open verify link -> verified;
  else (W2 login)
    :enter email -> POST /auth/login;
  endif
  :W3 open magic link /#/verify?token;
  :GET /auth/verify -> ifn_sid cookie;
  :redirect to /;
endif
:use app;
:W4 logout -> POST /auth/logout -> /#/login;
stop
@enduml
```

## Posts / Feed workflows (W5–W15)

```plantuml
@startuml
|Any user|
start
:W5 view feed (sort time/votes, search #tag, trending);
split
  :W6 create IDEA post;
  :enters pipeline at G1;
split again
  :W7 create PROBLEM post;
  :Problem Hub (no pipeline);
split again
  :W8 save draft -> W8 publish;
split again
  :W9 anonymous post;
  note right: author masked to non-admin
end split
:W10 vote up/down (one per user);
:W11 comment + sub-thread;
|Author|
:W12 edit (keep original snapshot);
:W13 add tag (new -> request) / self-badge;
:W14 request #Success (-> pending);
:W15 idea autopsy report (excluded from pipeline);
stop
@enduml
```

## Idea pipeline + dossier (W16–W28) — the core flow

```plantuml
@startuml
autonumber
actor Student
actor Mentor
actor Admin
participant API
database PG
== W16 submit ==
Student -> API : POST /ideas (basic details + feasibility + pitch file)
API -> PG : pipeline locked? (W19 -> 403)
API -> PG : allocate IFN-n, posts+ideas_pipeline G1, idea_submissions(G1)
== W25 assign ==
Admin -> API : POST /ideas/:id/assign {mentorId}  (G1->G2)
== W21 pickup ==
Mentor -> API : POST /ideas/:id/pickup  (G2->G3)
== W17 stage deliverables ==
Student -> API : POST /ideas/:id/stages/:gate/submit (fields+files)
== W20 dossier ==
Mentor -> API : GET /ideas/:id/dossier  (full case file; author/mentor/admin only)
== W22 review ==
Mentor -> API : POST /ideas/:id/stages/:gate/review {criteria,feasibility,feedback,decision}
alt approved
  API -> PG : advance gate + gate_transitions
else revision
  API -> PG : submission revision_requested
end
== W23 extra-ask ==
Mentor -> API : POST /ideas/:id/extra-asks
== W26 override / W27 reject/refine ==
Admin -> API : POST /ideas/:id/gate {gate,reason} | /reject | /refine
Student -> API : POST /ideas/:id/resubmit (refine -> G1, SAME IFN-n)
== W28 lock ==
Admin -> API : POST /pipeline/lock {locked}
@enduml
```

## Admin workflows (W24–W31, W37)

```plantuml
@startuml
|Super Admin|
start
:W24 Admin Panel — all ideas + dossier;
split
  :W25 assign/reassign mentor (G2);
split again
  :W26 override gate (reason, audited);
split again
  :W27 reject / refine&retry;
split again
  :W28 lock/unlock pipeline;
end split
:W29 Tag Requests — approve/reject new tag + #Success;
:W30 pin/unpin posts;
:W31 change member role;
:W37 Calendar — create event + add to all students; approve event requests;
stop
@enduml
```

## Directory · Talent Acquisition · Calendar · Profile (W32–W39)

```plantuml
@startuml
|Any user|
start
split
  :W32 Directory — filter role/region/sector/domain -> contact;
split again
  :W33 post talent need;
  :W34 apply (message) -> application stored;
  note right: poster sees applicants
split again
  :W35 Calendar — view; remove event from own calendar;
  :W36 request event -> admin queue;
split again
  :W38 edit profile;
  :W39 settings — notif toggles, theme, logout;
end split
stop
@enduml
```

## Role × workflow access (quick matrix)

| Area | Student | Mentor | Super Admin |
|---|---|---|---|
| Auth, Feed, Posts, Vote, Comment, Directory, Team, Calendar view, Profile | ✓ | ✓ | ✓ |
| Submit idea + own dossier + stage deliverables | ✓ | ✓ | ✓ |
| Mentor Review (assigned dossiers, pickup, stage review, extra-ask) | | ✓ | ✓ |
| Admin Panel (all dossiers, assign, override, reject/refine, lock) | | | ✓ |
| Tag Requests, pin, role change, create event/add-to-all | | | ✓ |

Related: [[IFN Backend — Sequence Flows]] · [[IFN Backend — Architecture]] · [[IFN Backend — Data Model]]
