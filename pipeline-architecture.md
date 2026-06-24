# Idea Pipeline — Architecture

Design for the last unbuilt surface. Sources: PRD v3 §4.6–4.8 (locked contract), `IFN — v1 Scope`
(2026-06-09 amendments, Draft), `IFN Backend — Data Model` (reference), `db/README.md` conventions
(RLS default-deny + security-definer RPCs + column revokes). Acceptance metrics for this design
live in §11 and are checked by the `/goal` skill.

## 0. Decisions adopted (flag any to reverse)

| # | Decision | Why |
|---|----------|-----|
| D1 | **Structured entry, no length minimums** (owner decisions 2026-06-10, second revision): G1 is a structured application — concrete questions, real-example placeholders, 500-char caps on the long answers, required fields enforced server-side. The structure removes the ambiguity (a mentor never needs a follow-up question to understand the problem); length minimums were tried and rejected by the owner. Sector is declared on the application and drives queue/board filters. Logistics (contact, feasibility, files) still arrive at G3 once a mentor is engaged. | Clarity over volume: caps force tight writing; the uniform Q&A format makes 60-second reads and apples-to-apples comparison possible. |
| D2 | **Pipeline entry = standalone application** (product owner decision, 2026-06-10, reversing the earlier promote-a-post design). The Pipeline page has its own application form (title + one-liner + problem, optional pitch/startup); nothing is read from or written to the feed. `pipeline_ideas` is its own root table, fully decoupled from `posts`. | Keeps the feed casual and the pipeline deliberate; an application is a commitment, not a repost. |
| D3 | **Mentor pull-queue first**, admin assign as fallback/override. | De-bottlenecks the single admin (v1 Scope item 9). |
| D4 | **Applications are always identified** (no anonymous option in the pipeline; feed anonymity is unaffected since the pipeline is decoupled). | Mentorship requires identity; PRD basic-details mandates "who you are + contact" anyway. |
| D5 | **Files in Supabase Storage** (private bucket), not base64/DB. | PRD's base64-in-localStorage was the mock-era hack; Storage is purpose-built, keeps Postgres lean. |
| D6 | **Minimal `notifications` table ships with the pipeline** (ADR-020 brought forward). | An async multi-actor state machine is invisible without it — pipeline stalls (PRD review item 5). |
| D7 | Calendar: mentor-session events stay **deferred** (`events` is broadcast-to-all; a 1:1 row would leak; meetings live in the thread, `kind='meeting'`). **Action-item deadlines DO reach the calendar** — as a derived personal layer: `my_action_deadlines()` (definer, scoped to `auth.uid()`) is merged client-side into the month grid; nothing is ever written to the shared `events` table, so a deadline can only ever appear on the intended user's calendar. Per-action Google/.ics export for external calendars. | Privacy by construction (no shared row exists), single source of truth (done/withdrawn items disappear automatically). |

## 1. Data model (new file `db/pipeline.sql`, plus `db/notifications.sql`)

```sql
-- Standalone application: the pipeline's own root table (no posts dependency).
create table pipeline_ideas (
  id           uuid primary key default gen_random_uuid(),
  author_id    uuid not null references profiles(id) on delete cascade,
  ifn          int  not null unique,            -- IFN-n, allocated under advisory lock (max+1)
  title        text not null,
  oneliner     text not null,                   -- shown to mentors in the queue
  problem      text not null,
  solution     text,                            -- optional pitch at entry
  startup      text,
  gate         int  not null default 1 check (gate between 1 and 6),
  gate_status  text not null default 'submitted'
               check (gate_status in ('awaiting_submission','submitted','revision_requested','approved')),
               -- 'approved' = G6 terminal (incubation confirmed, nothing awaited)
  pipeline_state text not null default 'active' check (pipeline_state in ('active','refine','rejected')),
  mentor_id    uuid references profiles(id) on delete set null,
  entered_gate_at timestamptz not null default now(),  -- staleness = now() - this
  created_at   timestamptz not null default now()
);
-- Every child table below keys off idea_id references pipeline_ideas(id) on delete cascade
-- (the sketches keep the old post_id name for brevity; the applied file uses idea_id).
-- indexes: (gate, pipeline_state), (mentor_id), (entered_gate_at)

-- Full audit of every state change. Append-only.
create table gate_transitions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  from_gate int, to_gate int,
  from_state text, to_state text,
  changed_by uuid references profiles(id) on delete set null,
  role text not null,            -- 'student' | 'mentor' | 'admin'
  reason text,                   -- MANDATORY for admin overrides/rejects
  created_at timestamptz not null default now()
);

-- One row per gate submission attempt. Revisions create NEW rows (history kept, diffable).
create table idea_submissions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  gate int not null,
  payload jsonb not null,        -- gate template fields (§3); read whole, never queried piecewise
  status text not null default 'submitted'
         check (status in ('submitted','revision_requested','approved','superseded')),
  created_at timestamptz not null default now()
);

-- Mentor rubric per gate decision. Kept across mentor reassignment.
create table idea_reviews (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  gate int not null,
  reviewer_id uuid references profiles(id) on delete set null,
  criteria jsonb not null,       -- {clarity, feasibility, market_potential, innovation, technical, scalability, ps_fit} 1–5
  feasibility jsonb,             -- mentor confirm/override of student self-assessment
  feedback text not null,
  decision text not null check (decision in ('approved','revision')),
  created_at timestamptz not null default now()
);

-- Concrete next-steps the mentor assigns; the off-app work tracker.
create table idea_actions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  gate int,
  label text not null,
  details text not null default '',
  due_date date,
  status text not null default 'open' check (status in ('open','done')),
  done_note text,                -- student's evidence/outcome when closing
  done_at timestamptz,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Private per-idea thread: author <-> mentor (+admin). The async channel.
create table idea_messages (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  author_id uuid references profiles(id) on delete set null,
  body text not null,
  kind text not null default 'message' check (kind in ('message','meeting','system')),
  created_at timestamptz not null default now()
);

-- File metadata; binaries live in Storage bucket 'idea-files'.
create table attachments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  submission_id uuid references idea_submissions(id) on delete set null,
  gate int,
  bucket_path text not null,     -- '{post_id}/{gate}/{uuid}-{filename}'
  file_name text not null,
  size_bytes bigint not null,
  mime text not null,
  uploaded_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Pipeline lock reuses the existing singleton settings row:
alter table app_settings add column if not exists pipeline_locked boolean not null default false;

-- db/notifications.sql
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  kind text not null,            -- §9 event list
  post_id uuid references posts(id) on delete cascade,
  actor_id uuid references profiles(id) on delete set null,
  payload jsonb not null default '{}',
  read_at timestamptz,
  created_at timestamptz not null default now()
);
-- RLS: select own; update own (read_at only — other columns revoked); inserts via definer fns only.
```

RLS: every table above default-deny. Reads and writes go through the RPC surface (§4) — no direct
table policies except `notifications` (read/mark-own). `is_mentor_or_admin()` helper added next to
`is_admin()`. IFN allocation: `pg_advisory_xact_lock(hashtext('ifn'))` + `max(ifn)+1` (gapless,
low volume, no sequence gaps from failed inserts).

## 2. State machine

`pipeline_state`: `active` | `refine` (admin sent back, student editing) | `rejected` (final).
`gate` 1–6 with `gate_status` within the gate.

| Transition | Actor | RPC | Guard |
|---|---|---|---|
| (none) → G1 | student | `pipeline_submit(title, oneliner, problem, ...)` | not banned, required fields, `pipeline_locked=false` |
| G1 → G2/G3 | mentor (self-pick) | `mentor_pick(post_id)` | mentor/admin role; idea unassigned; goes straight to G3 `awaiting_submission` (pick = accept) |
| G1 → G2 | admin (assign) | `admin_assign_mentor(post_id, mentor_id, reason)` | target is mentor/admin, not banned |
| G2 → G3 | mentor (accept) | `mentor_accept(post_id)` | caller is the assigned mentor |
| G3 → G4 | mentor | `review_gate(..., decision='approved')` | a `submitted` G3 submission exists; rubric complete |
| G4 → G5 | mentor | `review_gate(...)` | G4 submission (beta plan) approved |
| G5 → G6 | mentor | `review_gate(...)` | G5 submission with **evidence fields** (§3) approved |
| any ↔ any | admin | `admin_move_gate(post_id, to_gate, reason)` | reason mandatory; logged `role='admin'` |
| active → refine | admin | `admin_reject_idea(post_id, final=false, reason)` | student notified, edits + `resubmit_idea` → back to G1, **same IFN** |
| active → rejected | admin | `admin_reject_idea(post_id, final=true, reason)` | terminal; reason mandatory |
| reassign/unassign | admin | `admin_assign_mentor(post_id, mentor_id|null, reason)` | unassign returns idea to the pull-queue (G1) |

Within a gate: student `submit_gate` → `submitted`; mentor `review_gate(decision='revision')` →
`revision_requested` (+ feedback) → student resubmits (new submissions row, old → `superseded`).

**`waiting_on` (derived, returned by every list/detail RPC — nobody ever wonders whose turn):**

| Condition | waiting_on |
|---|---|
| `rejected` | nobody |
| `refine` | student |
| G1, no mentor | mentor-pool (admin sees backlog count) |
| no mentor mid-pipeline (unassigned at G4+) | admin |
| G2 (accept pending) | mentor |
| `awaiting_submission` / `revision_requested` | student |
| `submitted` | mentor |
| `approved` (G6 terminal) | nobody |

## 3. Gate submission templates (`idea_submissions.payload`)

Defined as frontend constants; definer RPC validates required keys per gate server-side.

| Gate | Required payload | Files |
|---|---|---|
| G1 (the application — columns + `application` jsonb on `pipeline_ideas`) | Required: `title` (startup/concept) · `sector` (filterable) · `problem` (detailed problem hypothesis, ≤500 chars: who has it, at what frequency) · `solution` (proposed mechanisms, ≤500) · `application.target_user` (target market segments) · `application.team` (composition + key roles). Optional: `application.traction` (experimentations/discussions held) · `application.market_size` (rough TAM/SAM/SOM). Required-ness and caps enforced server-side in `check_application` — the form cannot be bypassed. | — |
| G3 (logistics dossier, mentor engaged) | `{who_you_are, contact, market_value, market_size, feasibility_self:{technical,financial,market}}` | pitch doc/PDF/PPT allowed |
| G4 (beta plan) | `{beta_plan, milestones[]}` | optional |
| G5 (beta evidence) | `{prototype_url, demo_url?, users_count, interviews_count, learnings}` — **at least one verifiable artifact (URL/file) enforced**, OR `{bypass_requested: true, bypass_reason}` when the prototype needs money/resources the founder lacks; the mentor's review of a flagged submission is the bypass approval. | screenshots/demo files |
| G6 (incubation) | no submission — terminal gate; ongoing work tracked via actions + thread | — |

## 4. RPC surface (all security-definer, `set search_path = public`)

**Student** (ownership + banned checks):
`pipeline_submit(post_id)` · `submit_gate(post_id, payload)` · `resubmit_idea(post_id)` ·
`action_done(action_id, note)` · `idea_message_send(post_id, body)` · `my_pipeline()` ·
`idea_dossier(post_id)` (shared, §5) · `register_attachment(post_id, gate, path, name, size, mime)`

**Mentor** (`is_mentor_or_admin()`):
`mentor_queue()` — unassigned G1 ideas, sector/domain-match ordered ·
`mentor_pick(post_id)` · `mentor_accept(post_id)` · `my_mentees()` (+ `waiting_on` each) ·
`review_gate(post_id, criteria, feasibility, feedback, decision)` ·
`action_create(post_id, label, details, due_date)` · `idea_message_send` · `idea_dossier`

**Admin** (`is_admin()`; every mutation audited in `gate_transitions`, reason mandatory):
`admin_pipeline_board(p_gate, p_state, p_mentor, p_waiting_on, p_search, p_stale_days, p_limit, p_offset)` ·
`admin_pipeline_counts()` — funnel totals per gate/state + unassigned backlog ·
`admin_assign_mentor(post_id, mentor_id|null, reason)` · `admin_bulk_assign(post_ids[], mentor_id, reason)` ·
`admin_move_gate(post_id, to_gate, reason)` · `admin_reject_idea(post_id, final, reason)` ·
`admin_mentor_load()` — ideas per mentor per gate · `admin_set_pipeline_locked(bool)`

Access helper used everywhere (incl. storage policies):
`can_access_idea(post_id)` = author ∨ assigned mentor ∨ admin.

## 5. Dossier — the data-transfer contract (student → mentor)

One RPC, one round trip, the whole story. `idea_dossier(post_id)` returns jsonb:

```
{ idea:        {ifn, gate, gate_status, state, mentor, waiting_on, entered_gate_at,
                title, oneliner, problem, solution, startup, author identity (D4)},
  submissions: [all rows, all gates, incl. superseded — revision history is diffable],
  reviews:     [all rubrics + feedback, incl. previous mentors' after reassignment],
  actions:     [open + done, with done_note evidence],
  messages:    [thread, incl. meeting logs],
  attachments: [metadata; files via signed URLs],
  transitions: [full audit trail with reasons] }
```

Rendered as a single chronological timeline. Guarantees: nothing the student ever entered is
invisible to the mentor; nothing the mentor decided is invisible to the student (rubric scores
shown — transparency beats grading-behind-glass); a reassigned mentor inherits complete context
with zero re-explanation. The application itself is editable only at G1 or during refine
(`update_pipeline_idea`), so a mentor never reviews a document that shifts under them.

## 6. Admin at scale (100s of applications)

- **Pull-queue does the routing**: mentors self-pick; admin touches only exceptions. Admin
  per-idea cost ≈ 0 on the happy path.
- **Inbox, not a list**: Admin Panel pipeline tab defaults to `waiting_on=admin` ∪
  `stale > 14d` ∪ `unassigned backlog`. Everything else is reachable but not in the face.
- **Funnel header**: counts per gate/state (`admin_pipeline_counts`) — health at a glance.
- **Filters + search + pagination** on the board (gate, state, mentor, waiting_on, staleness,
  ILIKE on title/IFN/author), capped pages like `feed_posts`.
- **Bulk assign** + `admin_mentor_load` so assignment is informed (no mentor overload).
- **Staleness column** (`now() - entered_gate_at`), sort desc = triage view.

## 7. Files (PDF / PPT / DOC)

- Private Supabase Storage bucket **`idea-files`**: `file_size_limit = 20MB`,
  `allowed_mime_types = [pdf, doc, docx, ppt, pptx]` (bucket-level enforcement, set in the same
  SQL file via `storage.buckets` insert).
- Path: `{post_id}/{gate}/{uuid}-{filename}`.
- `storage.objects` policies: insert when `can_access_idea(split_part(name,'/',1)::uuid)` ∧ caller
  is the idea's author; select when `can_access_idea(...)`. No public access; downloads via
  short-lived signed URLs from the SPA.
- Metadata row registered via `register_attachment` RPC (validates ownership + path shape).
- Known trade-off: deleting an idea cascades metadata rows but Storage objects need a client-side
  delete or periodic sweep (SQL cannot call the Storage API). Documented, acceptable at campus scale.

## 8. Bias to real-world action (not in-app planning)

1. **Evidence-gated progression**: G5 cannot be approved without at least one verifiable artifact
   (prototype URL, demo, interview counts + learnings). Gates advance on artifacts, not prose.
2. **Action items with due dates**: mentor assigns concrete off-app tasks ("interview 10 hostel
   students by Friday"); student closes with `done_note` evidence; both sides see open/overdue
   state in the dossier and notifications. **Open action items block gate approval** (server
   guard in `review_gate`; revisions stay allowed) - assigned work must be done before moving on.
   The app is a commitment tracker, not a wiki.
3. **Meeting logs**: `idea_messages.kind='meeting'` records offline sessions (date, outcome, next
   actions) so in-person mentorship feeds back into the dossier.
4. **Stale nudges**: daily `pg_cron` job notifies author+mentor when an active idea sits in a gate
   > 14 days ("what's blocking?"). Momentum pressure without an admin chasing people.

## 9. Notifications (minimal, in-app)

Events: `mentor_assigned`, `mentor_unassigned`, `mentor_picked`, `mentor_accepted`, `gate_submitted`, `review_approved`,
`revision_requested`, `idea_rejected`, `idea_refine`, `gate_moved`, `action_created`, `action_done`,
`message_received`, `pipeline_stale`. Inserted inside the pipeline RPCs
(definer), read via existing bell UI + unread badge. RLS: read/mark own only.

## 10. Security summary

Same posture as the rest of `db/`: anon key public, RLS default-deny on every new table, all
cross-user reads/writes via definer RPCs with explicit guards (`is_admin`, `is_mentor_or_admin`,
`can_access_idea`, banned checks on every student write), no privilege column reachable by
`authenticated`, full admin audit trail with mandatory reasons, Storage private with
ownership-scoped policies. No service_role anywhere near the client.

## 11. Acceptance metrics (the `/goal` contract)

| # | Metric | Concrete checks |
|---|---|---|
| M1 | **Complete data transfer** | Every field a student enters is reachable by the mentor via `idea_dossier` (application + all submissions incl. superseded + files + actions + messages + transitions); revision history preserved; mentor reassignment loses nothing; the application cannot change mid-review (edit locked to G1/refine). |
| M2 | **Perfect communication clarity** | `waiting_on` derivable + returned by every list/detail RPC; every handoff fires a notification; structured per-gate templates; free-form private thread exists; rubric + feedback visible to the student. |
| M3 | **Admin endpoint controls** | Every mutation has an admin override RPC guarded by `is_admin()`; overrides/rejects require a reason and are logged in `gate_transitions`; global pipeline lock; assign/reassign/unassign; no state change trusts client-supplied role. |
| M4 | **Scales to 100s of applications** | Mentor pull-queue (admin not in the happy path); admin inbox = exceptions only (waiting_on=admin, stale, unassigned); funnel counts; filters/search/pagination; bulk assign; mentor-load view; staleness triage sort. |
| M5 | **File storage** | Private bucket, mime+size enforced at bucket level, ownership path convention, signed-URL downloads, access = author/mentor/admin only, metadata tracked, orphan trade-off documented. |
| M6 | **Promotes off-app action** | Evidence required to pass G5 (or an explicit mentor bypass); action items with due dates + done evidence; **open action items block approval**; meeting logs; automated stale nudges. |
| M9 | **Documentable + verifiable** | One-click dossier Export (markdown: application, submissions, reviews, actions, thread, audited history); repeatable E2E walk scripts (`web/scripts/e2e-pipeline.mjs` REST flow with both roles, `web/scripts/e2e-visual.mjs` Playwright screenshots) that create and withdraw their own test data. |
| M7 | **Fits the existing architecture** | Idempotent `db/*.sql` files in apply order; RLS default-deny + definer RPC pattern; column revokes; `is_admin()` reuse; `app_settings` reuse for the lock; no new infra beyond Supabase features already in use (Storage, pg_cron). |
| M8 | **Unambiguous, structured entry** | Every G1 field asks one concrete question with a real-example placeholder; required fields + 500-char caps enforced server-side (`check_application` — a curl call cannot bypass the form); the question set pre-answers a mentor's first questions (problem, target market, solution, team, evidence) so no G1 back-and-forth is needed; the dossier renders every application in one identical Q&A format (apples-to-apples in 60 seconds); sector filters on the mentor queue and admin board; founder effort protected by per-account draft autosave; the founder can withdraw their application at any time (mentor notified). |

## 12. Build order

1. `db/notifications.sql` (table + RLS + helper `notify()` definer fn + bell RPCs).
2. `db/pipeline.sql` (tables → helpers → student RPCs → mentor RPCs → admin RPCs → storage bucket
   + policies → pg_cron stale job). Idempotent, appended to `db/README.md` apply order.
3. UI: Pipeline page (6-circle gate bar + dossier timeline + submit forms per gate),
   Mentor Review page (queue + mentees + rubric form), Admin Panel pipeline tab (inbox + board +
   funnel + bulk assign), notification bell wiring.
4. Seed/demo data + `/goal` re-run against the implementation.
