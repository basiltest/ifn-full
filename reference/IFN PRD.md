---
title: IFN PRD (copy)
tags: [ifn, prd, product]
source: ~/lumenor/ifn/PRD.md
status: Approved
owner: IFN Team
updated: 2026-06-09
---

> [!info] Verbatim copy of the decision-locked PRD from the repo. Source of truth stays `~/lumenor/ifn/PRD.md`.

# IFN — ICFAI Founders Network · PRD v3 (Frontend MVP)

> Tech incubator network for ICFAI University students to share startup ideas and
> connect with funding, alumni, and mentors. **Frontend only — no backend (backend planned).**
> Every decision below was made by the product owner; this doc is the build contract.

---

## Changelog

**v3 (2026-06-04)** — second stakeholder review:
- **Team Board = Talent Acquisition** — one section, not two.
- **Super Admin can also act as Mentor** — appears in the mentor-assignment dropdown like any mentor, keeps superadmin privileges. Can self-assign ideas.
- **+ Problem Hub** — new page, same as Feed but **problem statements only**. Standalone board (no auto-convert to an idea). Comments enabled.
- **+ Admin Panel** — admin sees **all** pipeline ideas, assigns/reassigns mentors, **moves any gate**, **rejects** submissions, and **locks/unlocks** the pipeline.
- **Reject flow** — admin dismissing a submission picks **Reject (final)** or **Refine & Retry**; student sees the chosen outcome. Refine keeps the **same IFN-n**.
- **Pipeline lock** — when locked, the section stays visible but **Submit is disabled** with a "submissions closed" banner.
- **Basic-details form** mandatory fields: who-you-are + contact, domain + sector, market value/size, feasibility self-assessment.
- **Eye button everywhere** + **hover tooltip** — every section shows a descriptor on hover and via an eye/`?` icon.
- Code keeps the role id `admin`; UI displays **"Super Admin"**.

**v2 (2026-06-04)** — first stakeholder review: comments+threads, 3 roles, registration flow, Directory replaces Profile in nav, pipeline rework (doc/PDF, IFN-n, new G1–G6), anonymous posting, Idea Autopsy Report, calendar-event-as-request, AI matcher dropped.

---

## 0. Decision Log (locked)

| Area | Decision |
|------|----------|
| Framework | Vite + React (JS), React Router |
| Styling | Tailwind CSS v3 + custom theme tokens |
| Persistence | `localStorage` — seeded mock data on first load, all changes persist; Reset Data re-seeds. **Backend planned** — will swap the data layer later. |
| Font | **Inter** (Google Fonts) |
| Theme | Light only. Page `#F2F4F6`, cards `#FFFFFF`, border `#E1E8ED`, text `#0F1419`, accent `#1D9BF0` |
| Calendar | `react-big-calendar` (month/week/day) |
| Auth | Email only, must end `@ifheindia.org`, no password. **Registration + verify required before login** (§2). |
| Roles | **Student / Mentor / Super Admin** — one role per account. Alumni → Mentor. **Super Admin also has Mentor powers** + appears in mentor dropdown. Code id stays `admin`; display "Super Admin". |
| Comments | **Enabled** — threads on Feed & Problem Hub posts; Main Thread = original idea, replies form the thread. |
| Search | Live in-place filter; `#` shows supertag suggestions; active filter chip |
| Team apply | Popup w/ optional message → **fake confirmation toast** (no real mail) |
| Profile / Settings | **Top-right** (avatar · settings gear). Not in left nav. |
| Requests / mail | No backend. "Send mail" / "raise request" = entry in admin queue **+ fake toast**. No real email leaves the app. |
| Eye buttons | **Every section** has an eye/`?` icon **and** a hover tooltip with a short descriptor (≤100 words where noted). |
| Anonymous posts | Card shows "Anonymous Founder"; identity **still visible to Super Admin** for moderation. |
| Idea file upload | doc/PDF as base64 in `localStorage` **for now**; backend planned. |

---

## 1. Roles & Permissions

Three roles. **Super Admin** = entrepreneurship-club / Alumni / IIEC staff. Alumni who want to participate register as **Mentor**. **Super Admin inherits all Mentor powers** and shows up in the mentor-assignment dropdown.

| Capability | Student | Mentor | Super Admin |
|---|---|---|---|
| Register, login | ✓ | ✓ | ✓ |
| Create post / draft, vote, share, comment (Feed + Problem Hub) | ✓ | ✓ | ✓ |
| Post anonymously | ✓ | ✓ | ✓ |
| Submit idea to pipeline (doc/PDF) | ✓ | ✓ | ✓ |
| Request a new tag (→ Tag Requests) | ✓ | ✓ | ✓ |
| Add `#IdeaAutopsy`, `#IdeaValidation` to own post | ✓ | ✓ | ✓ |
| Request `#Success` badge | ✓ | ✓ | ✓ |
| Create Idea Autopsy Report | ✓ | ✓ | ✓ |
| Post / apply on Team Board (Talent Acquisition) | ✓ | ✓ | ✓ |
| **Mentor Review** (assigned ideas, evaluate, advance G3→G6) | | ✓ | ✓ |
| **Admin Panel** — see all ideas | | | ✓ |
| Assign / reassign mentor (pipeline G2) | | | ✓ |
| Move any idea between gates (override) | | | ✓ |
| Reject submission (final) / send to Refine & Retry | | | ✓ |
| Lock / unlock the Idea Pipeline | | | ✓ |
| Approve/reject `#Success` & new-tag requests | | | ✓ |
| Approve/reject calendar-event requests | | | ✓ |
| Pin / unpin posts | | | ✓ |
| Add event to **all students'** calendars | | | ✓ |
| Remove an event from **own** calendar | ✓ | ✓ | ✓ |

---

## 2. Registration & Auth

Registration form is conceptually hosted on the **IIEC website**; for this MVP we **mock it in-app**.

### 2.1 Flow
1. Landing → **Register** (or **Login** if already verified).
2. **Register form:** Full name · Email (`@ifheindia.org`, else inline error) · **Region** · **role choice** (Student / Mentor / Super Admin; Alumni pick Mentor) · **interested in incubation?** (yes/no) · **Sector + Domain** · LinkedIn (optional) · Phone (optional).
3. Submit → **Pending Verification** (simulated). Auto-verify for valid `@ifheindia.org` domain (demo). Verified flag in localStorage.
4. **Only a verified email can log in.** Login = enter verified email → Feed. Session persists in localStorage.

One role per account.

---

## 3. Tags & Supertags
- **Normal `#tags`** — free text, discovery/trending.
- **Create a tag** → **Tag Requests** queue → **Super Admin approves** before usable/trending.
- **Hardcoded badges:**
  - `#IdeaAutopsy` — self-applied. Excluded from pipeline. Opens Idea Autopsy Report (§4.x).
  - `#IdeaValidation` — self-applied.
  - `#Success` — **requested** → Pending → admin approves/rejects.

---

## 4. Pages

### 4.1 Login — IFN box logo, email field (verified `@ifheindia.org`), link to Register.
### 4.2 Register — see §2.

### 4.3 Feed
- **Header:** left = IFN logo; **top-right = Profile avatar · Settings gear**.
- **Left nav (§5.0):** Feed · Problem Hub · Idea Pipeline · Team Board · Calendar · Directory · Mentor Review (mentor/admin) · Admin Panel (admin) · Tag Requests (admin) · + Create Post.
- **Center:** idea post cards. Pinned (admin) on top.
  - Card: author + role badge (or **"Anonymous Founder"**) + timestamp, Title, Startup name, Problem/Solution, supertags + badges, upvote/downvote + score, share, **comment count → expand thread**.
  - **Comments/Threads:** Main Thread = original idea; replies = thread. Author edits show **original vs edited**.
  - Author menu: add `#IdeaAutopsy` / `#IdeaValidation`, request `#Success`, add hashtag / edit description.
  - Admin menu: Pin/Unpin.
- **Sort:** Time / Upvotes. **Search:** live by title + supertag, `#` suggestions, removable chip.
- **Right sidebar:** Trending Topics · Upcoming Events.
- **Get an opinion (workflow B):** (a) post on Feed → upvotes + comments; (b) Directory → filter domain → contact mentor 1:1.

### 4.4 Problem Hub (NEW)
- Same card UI as Feed but **problem statements only** (no solution field).
- Post a problem → others **upvote + comment**. Standalone discussion board — **does not auto-convert** to an idea/pipeline submission.
- Search, sort, supertags, anonymous option all as Feed.

### 4.5 Create Post (modal)
- **Post-as dropdown first:** "Post as \<you>" / "Post anonymously".
- **Target:** Feed (idea) or Problem Hub (problem). Problem Hub posts omit Solution.
- Fields: Startup Name, Title, Problem Statement, Solution (Feed only), `#supertags` (max 10, no dup; new tag → Tag Requests).
- Optional: self-apply Autopsy/Validation, request Success.
- Buttons: Submit · Save as Draft · Cancel. Submit gated on required fields; >5000 char warning.

### 4.6 Idea Pipeline
- **Pipeline lock:** admin can lock. When **locked** → section still visible, existing ideas/gates viewable, **Submit disabled + "Submissions closed" banner**.
- **Submit (when open):**
  1. **Basic details (all mandatory):** who-you-are + contact · domain + sector · market value/size · feasibility self-assessment (technical/financial/market).
  2. **Attachment: doc or PDF only** (`.pdf`/`.doc`/`.docx`), base64 in localStorage.
  3. Submit → idea gets **IFN-n**, enters **G1**.
- **IFN numbering:** sequential IFN-1, IFN-2, … One number per idea — **refine & retry keeps the same IFN-n** (no new number).
- **Gates:**
  | Gate | Label | Driver |
  |---|---|---|
  | G1 | Idea Submitted | student |
  | G2 | Mentor Assigned | **admin** (Admin Panel) |
  | G3 | Mentor Picked Up | mentor accepts |
  | G4 | Review Completed | mentor (rubric + feasibility confirm + beta-ready talk) |
  | G5 | Beta Prototyping | student/mentor (working prototype, product/platform) |
  | G6 | Incubation | mentor contacts student; mass production + launch |
  - Mentor advances **G3→G6** via Mentor Review. **Admin can override ANY gate anytime** via Admin Panel. Both true.
- **Reject / refine:** admin dismiss → picks **Reject (final)** or **Refine & Retry**. Student sees the outcome; Refine & Retry → edit + resubmit (same IFN-n).
- **Progress display (§5.3):** top = 6 connected circles G1–G6; below = selected gate's **sub-goal checklist**. Click circle → detail + sub-goals.
- **Idea detail:** gate bar → post + description → **Actionable Steps** (mentor/admin edit; student read-only).

### 4.7 Mentor Review (mentor / admin)
- Queue of ideas assigned to this mentor (at G3).
- Per idea: read details + attachment → **Evaluation rubric**: clarity, feasibility, market potential, innovation, technical, scalability, problem–solution fit + free-text **feedback**.
- Mentor **confirms/overrides the student's feasibility self-assessment** here.
- Actions: **Approve → advance gate** (G3→…→G6) or **Request Revision** (feedback to author).

### 4.8 Admin Panel (NEW — admin)
- **Table of ALL pipeline ideas** (every IFN, current gate, mentor, status).
- Actions per idea: **assign/reassign mentor** (G2), **move gate ←→** (override), **Reject (final) / Refine & Retry**, view attachment + details.
- **Lock / unlock the Idea Pipeline** (global toggle).
- Admin appears in the mentor dropdown and may **self-assign** ideas (then acts via Mentor Review).

### 4.9 Tag Requests (admin)
- Queue: pending **new-tag** proposals + `#Success` requests. Approve (apply) / Reject (clear, notify inline).

### 4.10 Team Board (= Talent Acquisition)
- One section. Role-need / talent posts (co-founder, technical support, etc.): Title, Description, **Looking for**, **Skills required**.
- Any user posts a need. **Apply** → popup + optional message → toast "Application sent ✓". No mail.
- **Startup asks** flag: looking for support → funding / talent / general support info.
- Eye button (≤100 words) explaining what startups look for.

### 4.11 Calendar
- `react-big-calendar`, month default; events color-coded (Workshop/Mentorship/Deadline/Hackathon/Other).
- **Founders can't create directly.** Eye button → "Want to create an event? Click here" → **request to admin queue** + fake toast.
- Admin: create event; "Add to all students" toggle. Any user: remove from **own** calendar. Click event → details.

### 4.12 Directory (Network)
- All members: avatar, name, role badge, **LinkedIn + phone**, sector, domain, region.
- Filter/sort: role · region · sector · domain.
- Find a match → contact directly. **No booking, no AI matcher.**

### 4.13 Idea Autopsy Report
- `#IdeaAutopsy` → structured report. **Mandatory:** Sector, Domain, Key Lessons, Key Reasons it failed.
- **Key metrics** shown as **bullet points**. Sector + Domain = student filters. Excluded from pipeline.

### 4.14 Profile (top-right)
- Avatar, name, role badge, Connect LinkedIn, counts (Posts/Drafts/Upvotes).
- **Basic Info** only — Full name, Email (locked), Phone, Region, Sector, Domain, About me. Edit → Save/Cancel + toast.

### 4.15 Settings (top-right)
- Account info · Notifications (UI-only toggles) · Danger zone (Reset demo data · Logout).

---

## 5. Cross-cutting

### 5.0 Left nav (final)
Feed · Problem Hub · Idea Pipeline · Team Board · Calendar · Directory · Mentor Review *(mentor/admin)* · Admin Panel *(admin)* · Tag Requests *(admin)* · **+ Create Post**.
(Profile + Settings live top-right, not here.)

### 5.1 Eye buttons + tooltips
**Every section** carries an eye/`?` icon and a **hover tooltip** with a short descriptor of what the section is. Static copy.

### 5.2 Requests-to-Admin pattern
No backend/mail. Any "raise request / send mail" (calendar event, etc.) → item in admin queue + fake "Request sent ✓" toast.

### 5.3 Pipeline progress display (per sketch)
- **Top:** 6 connected circles (G1…G6), current gate highlighted.
- **Below:** selected gate's **sub-goal checklist** ("text → sub goals").
- Click a circle/gate → expand its sub-goals + idea detail.

---

## 6. Defaults (builder-chosen; flag to change)
- Routing via `react-router-dom`; protected routes redirect to Login when unverified.
- Seed: ~12 feed posts (pinned + badges + threads + 1–2 anon), ~6 problem-hub posts, ~6 calendar events, ~5 team-board posts, ~3 autopsy reports, IFN-1..IFN-5 across gates (incl. 1 rejected + 1 refine&retry), 2 pending `#Success`, 2 pending new-tag requests, 2 mentor-review items, ~15 directory members across regions/sectors. Pipeline starts **unlocked**.
- Trending = top approved supertags by count. Avatars = initials/DiceBear placeholder.

---
## 7. Open questions
**All resolved.** PRD is build-ready.

---

# Product Review — 2026-06-09 (PM · Startup Advisor · UX · Incubator Program Design)

> Appendix only — does **not** edit the locked spec above. Source of truth stays the repo PRD.
> Lens: product success, adoption, mentorship quality, founder outcomes — not features or code.

## Core thesis (read this first)

**The product is over-scoped and front-loads friction, while under-investing in what keeps a campus
community alive.** Two existential risks dominate everything below:

1. **Cold-start (item 13).** The product assumes students arrive with startup ideas. Most don't. Nine
   surfaces launching half-empty on one campus reads as "dead app" → bounce → no critical mass.
2. **The core value (mentorship pipeline) is throttled by its own design** — heavy entry friction
   (item 3), an admin bottleneck (item 9), and invisible async state (item 5, no notifications).

**What is the actual product?** The **Idea Pipeline + Mentorship** (idea → mentor → G1–G6 →
incubation). That is the one thing a college incubator uniquely does; everything else (Feed,
Directory, Team Board) is commodity social-network plumbing that exists to *feed* the pipeline.
Protect the core; trim or defer the rest.

**Recommended v1 scope:** unified Feed (Problem as a post-type) · lightweight Pipeline entry +
Mentorship with an async channel · Directory (privacy-fixed) · minimal notifications · basic
report/remove moderation. **Defer:** standalone Problem Hub, Idea Autopsy, full Calendar, tag
governance machinery, reputation. This is fewer surfaces, launched alive — not feature-complete and
dead.

## Verdict summary

| # | Area | Verdict | When | One-line |
|---|------|---------|------|----------|
| 1 | Product focus / scope | **Simplify** | now (scope call) | Ship the pipeline core + feed/directory; defer 4 surfaces |
| 2 | Feed vs Problem Hub | **Merge** | now | Two boards split a small community → both look dead; make "Problem" a post-type filter |
| 3 | Pipeline weight | **Add light entry** | now | Heavy basic-details + PDF at submit kills top-of-funnel; gate *progression*, not *entry* |
| 4 | Mentorship vs evaluation | **Add async channel** | soon (high) | Rubric+approve = grading, not mentoring; needs back-and-forth |
| 5 | Notifications | **Implement (in-app)** | now | Async multi-actor workflow is invisible without it → pipeline stalls |
| 6 | Team Board lifecycle | **Add statuses** | later | Apply→void is a lead list, not a workflow; add sent/accepted/rejected + withdraw |
| 7 | Success badge governance | **Define criteria** | later (define now) | Undefined "success" = gameable/arbitrary → badge loses signal |
| 8 | Directory privacy | **Implement** | now | Phone visible to all by default = safety/trust red flag; hide + per-field control |
| 9 | Admin dependency | **De-bottleneck** | now | Single inactive admin freezes the whole pipeline; multi-admin + mentor pull-queue |
| 10 | Calendar | **Demote** | later | Read-only notice board; keep the sidebar list for v1, build RSVP/reminders later |
| 11 | Engagement mechanics | **Selective** | mixed | @mentions + bookmarks now; follow/activity later; **reject** reputation for MVP |
| 12 | Moderation & safety | **Basic report/remove** | now (if anon ships) | Anonymous posting + zero moderation = abuse + institutional risk |
| 13 | Adoption / cold-start | **Top priority** | now | Design the lurk→vote→post→pipeline ladder; never show an empty app |

## Detail (problem → risk → impact → complexity → recommendation)

**1 — Scope.** *Problem:* 9 features at launch. *Risk:* not build effort — **empty surfaces**; a
campus has dozens of active users, not thousands, so spreading them thin makes everything look
abandoned. *Impact:* high — concentration vs death-spiral. *Complexity:* low (a scoping decision, not
code). *Recommend:* **now — simplify.** Core v1 = Feed + Pipeline/Mentorship + Directory. Defer
Problem Hub, Autopsy, full Calendar, tag governance.

**2 — Feed/Problem split.** *Problem:* two near-identical boards by content type; the idea/problem
line is subtle, users will mispost. *Risk:* activity diluted across two boards → **both sparse** →
classic community cold-start failure. *Impact:* high. *Complexity:* low (a filter chip, not a page).
*Recommend:* **now — merge.** One feed, "Problem" as a post type + filter. Reject the standalone Hub
for v1.

**3 — Pipeline weight.** *Problem:* entry demands mandatory who+contact, domain+sector, market size,
feasibility self-assessment, **and** a PDF — before any mentor is involved. *Risk:* students rarely
have a deck/market-sizing on day one → they never start; the **core feature's funnel dies at the
top.** *Impact:* high (this is the product). *Complexity:* medium. *Recommend:* **now — add a
lightweight entry** (title + one-liner + problem → G1). Push the heavy basic-details/PDF/feasibility
to G2–G3 when a mentor is engaged and the effort is earned. Keep the gate machine; move the friction
to *progression*, not *entry*. Low completion to G6 is fine (incubation is selective) — but don't
gate the front door.

**4 — Mentorship vs evaluation.** *Problem:* mentor flow = review → rubric → approve/revise. That's a
**judge, not a mentor.** *Risk:* the platform produces graded homework, not relationships; mentors
find form-filling dull and disengage — gutting the one differentiator. *Impact:* high on the core
value prop. *Complexity:* medium. *Recommend:* **soon (high priority)** — add a lightweight, private,
**async mentor↔founder thread** per idea (author/mentor/admin), usable anytime, not just at gates.
Reframe the rubric as *one input*, not the whole interaction. (Pairs with notifications #5 and the
ADR-008 dossier-notes hook.)

**5 — Notifications.** *Problem:* fake toasts only; no cross-user signal. *Risk:* **fatal for an async
workflow** — a mentor never learns they were assigned, a student never learns they were reviewed →
ideas stall silently → the pipeline appears broken. *Impact:* high (core workflow won't function).
*Complexity:* low–medium. *Recommend:* **now — minimal in-app notifications** (assigned, reviewed,
approved/rejected, application received, tag/event approved) + unread badge; email for the top 2–3
events later. Toasts stay for instant feedback; they cannot carry async events.

**6 — Team Board.** *Problem:* apply → toast, no status, no management, no withdraw. *Risk:* applicants
ghosted, posters can't act → frustration, feature feels broken. *Impact:* medium. *Complexity:* low.
*Recommend:* **later** — add application status (sent→accepted/rejected) visible to the applicant,
poster accept/decline, applicant withdraw. Don't over-build (no scheduling/chat).

**7 — Success badge.** *Problem:* "Success" undefined; request→approve on admin whim. *Risk:* badge
gets farmed for vanity or applied arbitrarily → loses all signal, and success stories are an
incubator's best marketing. *Impact:* medium (trust/brand). *Complexity:* low. *Recommend:* **define
criteria now (cheap), enforce later** — tiered, evidence-backed (revenue / paying users / funding /
incorporation / accelerator) with a required evidence field + admin rubric. Define before granting
many, or you set bad precedent.

**8 — Privacy.** *Problem:* phone + LinkedIn shown to all members by default. *Risk:* harassment,
spam, real safety concern on a university platform → people won't complete profiles or will leave;
institutional liability. *Impact:* high (trust + safety). *Complexity:* low. *Recommend:* **now** —
phone **hidden by default**, per-field visibility toggles, consider a contact/connect request instead
of exposing raw numbers. Non-deferrable.

**9 — Admin dependency.** *Problem:* admin is the sole actor for mentor-assign (G1→G2), tags, events,
locks. *Risk:* a busy/absent admin (guaranteed during exams/holidays for staff-run tools) **freezes
the entire pipeline** — nothing advances past G1. *Impact:* high (throttles the core). *Complexity:*
low–medium. *Recommend:* **now** — support **multiple admins**, and switch G1→G2 to a **mentor
pull-queue** (mentors self-pick from unassigned ideas) so the core path doesn't wait on one person.
Auto/mentor-approve low-risk tags later.

**10 — Calendar.** *Problem:* read-only, admin-gated, no RSVP/reminders. *Risk:* low — just an empty
surface to maintain. *Impact:* low. *Complexity:* low (to demote). *Recommend:* **later** — for v1
keep the "Upcoming Events" sidebar list (already specced); build the full calendar + RSVP + reminders
(reminders depend on #5) post-MVP. Attendance tracking: likely **reject** (low value).

**11 — Engagement.** *Problem:* only votes + comments; few return loops. *Risk:* passive users have no
reason to come back. *Impact:* medium. *Complexity:* mixed. *Recommend:* **@mentions + bookmarks
now** (cheap, real retention; mentions feed notifications), **follow users/startups + activity feed
later** (need scale), **reject reputation + contributor badges for MVP** (gamification is premature
and invites vanity-farming like the Success badge).

**12 — Moderation & safety.** *Problem:* no report/remove/enforcement — **while anonymous posting is
enabled.** *Risk:* anon + no moderation = harassment/spam with no response but manual DB surgery;
hostile environment + university liability. *Impact:* high (safety). *Complexity:* low–medium.
*Recommend:* **now if anon ships in v1** — a Report button → admin queue → hide/remove (admin already
sees anon identity); user suspension + auto-spam later. If moderation can't ship, **delay anonymous
posting** until it can.

**13 — Adoption / cold-start.** *Problem:* the product's main CTA is "create an idea"; most students
won't, and arrive to a possibly-empty app. *Risk:* **existential** — no activation → no content → no
community → death. *Impact:* highest, tied with #1. *Complexity:* medium (design + onboarding).
*Recommend:* **now — design the engagement ladder**: lurk → upvote/comment → post a problem → post an
idea → enter pipeline. First-run onboarding sells *passive* value (browse ideas, find people, see
events) before asking to post; guarantee the feed is never empty (rich seed + staff/mentor seeding);
let alumni/mentors be initial draws. #2 (merged feed), #3 (light pipeline entry), and #5
(notifications) all serve this.

## Net product recommendation
Build **fewer surfaces, launched alive, around the mentorship pipeline.** Sequence:
1. **v1 now:** unified Feed (Problem as type) · lightweight Pipeline entry · Mentorship + async
   channel · Directory with privacy controls · minimal notifications · report/remove moderation ·
   adoption onboarding + multi-admin/mentor pull-queue.
2. **Fast-follow:** Team Board statuses · @mentions + bookmarks · Success criteria enforcement ·
   email notifications.
3. **Later:** full Calendar + RSVP/reminders · Idea Autopsy · follow/activity feed · tag governance.
4. **Reject for MVP:** reputation system · contributor badges · attendance tracking · standalone
   Problem Hub.
