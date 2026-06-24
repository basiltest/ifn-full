# IFN Architecture (living design)

> Single design doc for what we are building now. The deep pre-build reference material
> (PRD, data model, ADRs, sequence flows) lives in `reference/`. Day-to-day state and the
> next-steps list live in `PROGRESS.md`. Live database schema + apply order live in `db/README.md`.

## What IFN is
ICFAI Founders Network: a tech-incubator network for ICFAI students. Members share startup
ideas and problems, vote and comment, find teammates, browse a member directory, follow a
shared events calendar, and (planned) move ideas through a gated mentorship pipeline (G1 to G6).
Product spec: `reference/IFN PRD.md`.

## Locked stack (2026-06-10)
- Frontend: Vite + React SPA, hosted on Vercel.
- Backend + Database: Supabase (Auth + Postgres + Row Level Security). No separate Express server.
  The SPA talks straight to Supabase via `@supabase/supabase-js`.
- Auth: Supabase Auth (managed), email + password. Session is the Supabase default for a Vite SPA:
  a JWT in localStorage (not a server httpOnly cookie; that would need a server runtime).
- Why no backend tier: removes CORS, cross-site cookies, and a whole deploy surface. RLS is the
  data guard. A server tier can be added later for the gate/pipeline state machine if needed.

### System context

```plantuml
@startuml
left to right direction
skinparam componentStyle rectangle

actor "Member\n(browser)" as user

node "Vercel" {
  [React SPA\n(Vite build)] as spa
  [vercel.json\nSPA rewrite + CSP/headers] as vc
}

node "Supabase project" {
  [GoTrue Auth\n(email+password, JWT)] as auth
  database "Postgres\n+ Row Level Security" as pg
  [PostgREST\n(/rest/v1, RPC)] as rest
}

cloud "User calendar\n(Google / Apple)" as cal

user --> spa : HTTPS
spa --> auth : signUp / signIn / reset
spa --> rest : anon key + JWT\n(tables + RPC)
rest --> pg : SQL under RLS
spa ..> cal : Add to Google link / .ics download
@enduml
```

## Security model
- anon key: public, ships in the frontend. Safe only because RLS guards every row.
- service_role key: secret, bypasses RLS. Server-only; this stack never ships it (not in frontend,
  not in git).
- RLS: enabled on every table, default-deny, with explicit policies keyed to `auth.uid()` and role.
- Privileged writes go through `security definer` RPCs that re-check authorization inside the
  function (`is_admin()`, ownership), so the client never needs elevated table grants. Sensitive
  columns are revoked from the `authenticated` role (pinned, badges, success_request, comments_locked,
  banned, role, kind, created_at) so they can only change via the definer RPCs.
- Anonymous posting: the author id is stored, but the masking RPCs (`feed_posts`, `post_detail`,
  `post_subthreads`) return null author for anonymous posts unless the viewer is the author or an admin.

### How a request is authorized

```plantuml
@startuml
actor Member
participant "React SPA" as SPA
participant "PostgREST" as API
database "Postgres (RLS)" as DB

== plain table read (e.g. events) ==
Member -> SPA : open Calendar
SPA -> API : select events (anon key + JWT)
API -> DB : SELECT ... (policy: read true)
DB --> SPA : rows the policy allows

== definer RPC (privileged) ==
Member -> SPA : Admin pins a post
SPA -> API : rpc admin_pin_post(id, true)
API -> DB : call function (security definer)
DB -> DB : is_admin() check, then UPDATE
DB --> SPA : ok / raised error
@enduml
```

## Frontend shape
- Routing: React Router. Public routes (login, register, forgot/reset password) are wrapped in
  `PublicOnlyRoute`. The app shell is wrapped in `ProtectedRoute` (requires a session, shows a
  banned wall) then `OnboardingGate` (first-time users are sent to `/onboarding`).
- Shell: `Layout` = `Topbar` (logo, notification bell of nearby events, profile menu) + `SideNav`
  (left rail) + page `Outlet` + `RightSidebar` (feed only: trending tags, upcoming events).
- State: `AuthProvider` holds the session and the caller's own profile row, and derives
  `isAdmin`, `banned`, `onboarded`, plus `refreshProfile()`.

### Routes and modules

```plantuml
@startuml
left to right direction
skinparam componentStyle rectangle

[ProtectedRoute] as prot
[OnboardingGate] as gate
[Layout shell] as shell

[/login /register /forgot /reset] as pub
[/onboarding] as onb
[/ Feed] as feed
[/post/:id Post detail] as post
[/team Team Acquisition] as team
[/calendar Calendar] as caln
[/directory Directory] as dir
[/profile] as prof
[/settings] as setn
[/admin Admin Panel] as admin

pub --> onb : after login, if not onboarded
prot --> gate
gate --> shell
shell --> feed
shell --> post
shell --> team
shell --> caln
shell --> dir
shell --> prof
shell --> setn
shell --> admin : admins only
@enduml
```

## Data model
Profiles is 1:1 with `auth.users`. Everything else hangs off profiles and posts. Full column
detail and apply order: `db/README.md`. ER overview:

```plantuml
@startuml
hide circle
skinparam linetype ortho

entity "auth.users" as users {
  * id : uuid
  --
  email
}
entity "profiles" as profiles {
  * id : uuid <<FK users>>
  --
  name, role
  region, sector, domain
  startup, phone, linkedin, bio
  incubation_interest
  banned, onboarded
  show_email, directory_visible
}
entity "posts" as posts {
  * id : uuid
  --
  author_id <<FK>>
  kind (idea|problem|discussion)
  title, problem, solution, startup
  status (draft|published)
  anonymous, pinned, comments_locked
  badges[], success_request
  edited, original (jsonb)
  search_vec (tsvector)
}
entity "tags" as tags {
  * id : uuid
  name (unique), approved
}
entity "post_tags" as ptags {
  * post_id <<FK>>
  * tag_id <<FK>>
}
entity "post_votes" as votes {
  * post_id <<FK>>
  * user_id <<FK>>
  value (-1|1)
}
entity "comments" as comments {
  * id : uuid
  post_id <<FK>>, author_id <<FK>>, body
}
entity "sub_threads" as subs {
  * id : uuid
  post_id <<FK>>, author_id <<FK>>, body
}
entity "team_posts" as tposts {
  * id : uuid
  author_id <<FK>>
  title, startup, description
  looking_for, skills[], commitment, stage
  closed
}
entity "team_applications" as tapps {
  * id : uuid
  team_post_id <<FK>>, applicant_id <<FK>>
  message, contact, status
}
entity "events" as events {
  * id : uuid
  type, starts_at, ends_at
  title, description, location
  source, created_by <<FK>>
}
entity "app_settings" as settings {
  * id : bool (single row)
  feed_locked
}
entity "banned_emails" as banned {
  * email
}

users ||--|| profiles
profiles ||--o{ posts
posts ||--o{ ptags
tags ||--o{ ptags
posts ||--o{ votes
profiles ||--o{ votes
posts ||--o{ comments
posts ||--o{ subs
profiles ||--o{ tposts
tposts ||--o{ tapps
profiles ||--o{ tapps
profiles ||--o{ events
@enduml
```

## Key flows

### Register, onboard, enter the app

```plantuml
@startuml
actor New as user
participant SPA
participant "GoTrue Auth" as auth
database Postgres as db

user -> SPA : register (name, email, password)
SPA -> auth : signUp
auth -> db : insert auth.users\n(trigger block_banned_signup checks banned_emails)
db -> db : handle_new_user trigger\ncreates profiles row (role=student, onboarded=false)
auth --> user : confirm email
user -> SPA : log in
SPA -> db : load own profile
alt onboarded = false
  SPA -> user : redirect /onboarding
  user -> SPA : submit profile details
  SPA -> db : update profiles (fields + onboarded=true)
  SPA -> SPA : refreshProfile
end
SPA -> user : Feed
@enduml
```

### Feed read (ranking, search, masking)

```plantuml
@startuml
actor Member
participant SPA
participant "feed_posts (definer)" as fn
database Postgres as db

Member -> SPA : open Feed (sort, #tags, text)
SPA -> fn : rpc feed_posts(kind, search, tags[], sort, limit, offset)
fn -> db : join author + tags + score + comment_count
note right of fn
  sort = hot (momentum: score / (age_hours+2)^1.8),
  new, or top. pinned float to the top.
  full-text via search_vec @@ websearch_to_tsquery.
  anonymous authors masked unless mine/admin.
end note
db --> SPA : page of posts
SPA -> SPA : render cards; poll posts_since for the "new posts" banner
@enduml
```

## Built modules (2026-06-10)
- Auth: register, login, forgot/reset password, session, route guards. Audit: `auth-architecture.md`.
- Onboarding: first-time profile setup gate (`/onboarding`).
- Feed: kinds idea/problem/discussion, momentum/new/top sort, FTS + multi-supertag filter, votes,
  drafts (in the create modal), edit post, infinite scroll, new-posts banner, error+retry.
- Post detail: votes, creator updates (sub-threads), comments, edit/delete, admin pin + comment lock.
- Team Acquisition: post role needs, apply with message + contact, withdraw, applicants view,
  open/closed lifecycle, owner edit, admin delete.
- Calendar: month grid, admin event CRUD, add-to-Google + .ics export, sidebar + bell surfacing.
- Directory: search + filter by role/region/sector/domain, opt-in email, no phone.
- Admin Panel: member roles, ban/unban, edit any profile, #Success approval queue, feed lock,
  per-post comment lock, searchable members.

## Reference (pre-build design)
`reference/` holds the original design set (PRD, Data Model, ADRs, Authorization Matrix, Sequence
Flows, Security & Threats, Runbook, Backup & Restore, v1 Scope, Workflows, Index). That set assumed
an Express + Postgres backend with passwordless magic-link auth. This build pivoted to Supabase Auth
+ password (see the decision log). Treat `reference/` as design input, not current truth where it
conflicts with this file.

## Decision log
- 2026-06-10: Auth method magic-link to password (user choice), built on Supabase Auth.
- 2026-06-10: Provider Supabase Auth (managed) over hand-rolled.
- 2026-06-10: Topology Vercel SPA to Supabase direct, no Express. Session = localStorage JWT.
- 2026-06-10: httpOnly cookie requirement relaxed for this stack (would need Next.js SSR).
- 2026-06-10: Removed the @ifheindia.org email restriction (can re-add server-side later).
- 2026-06-10: Tags auto-approve; only #Success needs admin approval. Moderation lives in admin RPCs.
- 2026-06-10: Calendar integration via per-event export (Google link + .ics), no OAuth sync.
- 2026-06-10: Ban is app-level (profiles.banned + banned_emails + write guards + logout wall);
  a hard auth-level ban would need the service_role key on a server, which we do not ship.
```
