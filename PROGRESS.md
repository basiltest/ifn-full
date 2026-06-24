# IFN — Progress / Session Context

> Read this first in a new session to know where we are. Update it as work happens.
> Design lives in `architecture.md`; deep reference in `reference/`.

## Right now
**Mode:** Claude writes the code; the user reviews in the browser and gives feedback.
**Stack:** Vite SPA on Vercel ↔ Supabase (Auth + Postgres + RLS). No backend. (see architecture.md)
**Repo:** github.com/basiltest/i (monorepo, app in web/, deployed on Vercel at ifn-gilt.vercel.app;
Supabase project ref uyepkmdpakwkpqxsofoi). Architecture + PlantUML diagrams: architecture.md.
Live DB schema + apply order: db/README.md.

## Current state (2026-06-10)
All five left-nav surfaces are built (Feed, Idea Pipeline, Team Acquisition, Calendar, Directory).
Pipeline is code-complete, pending SQL apply + browser test.

Built:
- **Auth + onboarding**: register, login, forgot/reset password, session (AuthProvider),
  ProtectedRoute / PublicOnlyRoute / OnboardingGate. First-time users complete /onboarding
  (name/region/sector/domain required) before the app. Audit: auth-architecture.md.
- **Profile** (/profile): read/edit own profile (email+role read-only).
- **Settings** (/settings): account, dark-mode, Directory privacy (list me + show email), log out.
- **Feed** (/, pages/Feed.jsx): kinds idea/problem/discussion; sort hot(momentum)/new/top with id
  tiebreak; full-text search (tsvector+GIN) + multi-#supertag AND filter from the search box;
  upvote/downvote (optimistic); trending tags; "X new posts" banner; infinite scroll; back-to-top;
  compact clamped cards; error+retry; drafts (inside the create modal: load/edit/publish via
  publish_post); edit post (update_post, original snapshot); feed-lock banner.
- **Post detail** (/post/:id): post + votes, creator updates (sub_threads), comments, edit/delete,
  kebab menu, admin pin + comment-lock, #Success request + pending banner.
- **Team Acquisition** (/team): post role needs, apply with message + contact, withdraw, applicants
  view (no email exposed), open/closed lifecycle, owner edit, admin delete, uniform popup cards.
- **Calendar** (/calendar): month grid, admin event CRUD (react-datepicker, dd/MM/yyyy + time),
  per-event Add-to-Google + .ics export, upcoming events in the right sidebar + notification bell.
  Personal layer: my open pipeline action-item deadlines (my_action_deadlines RPC, auth-scoped,
  never rows in the broadcast events table) render as dashed flag pills only the owner sees;
  click -> detail modal w/ Google/.ics export + Open idea. Same export inline in the dossier.
- **Directory** (/directory): search + filter by role/region/sector/domain; no phone shown;
  opt-in email; hidden unless directory_visible.
- **Admin Panel** (/admin): searchable members, assign roles, ban/unban (email blocked from
  re-registering), edit any profile, #Success approval queue, feed-posting lock, per-post comment lock.
- **Idea Pipeline** (design: pipeline-architecture.md; checked by the /goal skill):
  - STANDALONE: applications are their own table (pipeline_ideas), fully decoupled from the
    feed/posts (owner decision 2026-06-10). Editable only at G1 or during refine.
  - STRUCTURED G1 FORM (owner decisions 2026-06-10, rev 2 - no length minimums): mockup-style
    two-column form with uppercase labels + concrete example placeholders. Required: title,
    sector (select), problem hypothesis (<=500), target market segments, solution (<=500),
    team composition. Optional: experimentations held, TAM/market size. check_application
    enforces server-side. Per-account draft autosave. Dossier renders identical Q&A format.
    Sector filter on mentor queue + admin board. Founder can withdraw the application any
    time (mentor notified, dossier cascades). G5 has an explicit mentor-bypass path
    (prototype needs funding -> bypass_reason; mentor review = approval). Admin dossier view
    is read-only with a highlighted current-state strip (assigned / picked up).
  - DB: db/notifications.sql + db/pipeline.sql (gates G1-G6, IFN-n, dossier, mentor pull-queue,
    rubric reviews, action items, private thread, attachments via Storage bucket `idea-files`,
    admin board/counts/assign/move/reject/delete/lock, full gate_transitions audit, pg_cron
    stale nudge).
  - UI: /pipeline (my applications + application form modal), /pipeline/:id (dossier: application
    card, gate bar, per-gate forms G3/G4/G5 with G5 evidence gate, mentor rubric, action items,
    files upload/signed-URL download, thread w/ meeting logs, full history), /mentor (pull-queue
    + my mentees), Admin Panel "Pipeline" tab (inbox-first board, funnel counts, bulk assign,
    pipeline lock in Settings), Topbar bell shows real notifications (unread badge, mark-read)
    + upcoming events. Skeleton loaders (PipelineSkeleton) on all pipeline surfaces.
- DB files (apply via Supabase SQL editor, order in db/README.md): posts, votes, tags, feed,
  comments, admin, teamboard, calendar, directory, onboarding. profiles base table + handle_new_user
  still only in Supabase (db/profiles.sql backfill = TODO).

## Pending on the user (Supabase + push)
- RE-RUN db/pipeline.sql (one run, idempotent). Live DB verified missing: open-action-items
  approval guard, G3-only rubric, upload policy fix (is_idea_author), is_mine/is_mentor
  coalesce. Then re-run the E2E to confirm all green:
  `SUPA_URL=... SUPA_KEY=... STUDENT_EMAIL=... MENTOR_EMAIL=... PASSWORD=... node web/scripts/e2e-pipeline.mjs`
- Optional: enable the pg_cron extension (Dashboard -> Database -> Extensions) and re-run
  db/pipeline.sql so the 14-day stale-nudge job schedules (the file no-ops without it).
- Re-run any changed db/*.sql in Supabase after each pull (a `PGRST202`/"function not found" error
  means a changed RPC has not been re-run; `Status code: (null)`/CORS means an ad blocker is killing
  *.supabase.co, not a code bug).
- TODO: set the `SUPPORT_EMAIL` Supabase secret for the registration disapprove email
  (`supabase secrets set SUPPORT_EMAIL=...`). Until then the "couldn't validate, registration
  canceled — reach out to ..." email falls back to "the IFN team". Used by the
  `review-registration` edge function.
- git push the latest commits.

## Next (not built)
- Pipeline end-to-end browser test (student submit -> mentor pick -> G3 dossier -> rubric ->
  G5 evidence -> incubation; admin override/reject paths).
- #IdeaValidation self-badge + Idea Autopsy (FRD D4/W13/W15).
- Edit-post UI shows original-vs-edited diff (snapshot already stored in posts.original).
- Report/flag posts -> admin queue (moderation, v1 Scope rule for anonymous posting).
- @mentions; email notifications later (in-app shipped with the pipeline).

DB note: profiles table + handle_new_user trigger (security definer) + RLS (read/update own; role
column update revoked) live in Supabase (not in repo). Run via SQL editor when recreating.

---

## History
**Stage 3 — Forgot password** (built, pending test + push).

### Stage 3 built
- pages/ForgotPassword.jsx: resetPasswordForEmail(email, redirectTo /reset-password); generic
  "if an account exists, link sent" (no enumeration).
- pages/ResetPassword.jsx: the reset link creates a recovery session; updateUser({password}) sets
  new pw; guards: no session -> invalid/expired link; success -> Continue to /.
- Login.jsx: "Forgot password?" link -> /forgot-password. Routes added in App.jsx.
- NEEDS redirect URL allowlist: add /reset-password (vercel + localhost) in Supabase.

---

## Earlier stage
**Stage 2 — Login + session + guarded redirect**.

### Stage 2 built
- react-router-dom added. BrowserRouter + AuthProvider wrap the app (main.jsx).
- Routes (App.jsx): /register, /login, / (guarded). web/vercel.json adds SPA fallback so deep
  links and the email redirect do not 404 on Vercel.
- lib/AuthProvider.jsx: session context via getSession + onAuthStateChange (live across reloads).
- components/ProtectedRoute.jsx: no session -> Navigate to /login; waits on loading to avoid flash.
- pages/Login.jsx: signInWithPassword -> navigate('/'); generic error.
- pages/Home.jsx: blank authed page + email + logout (signOut) to test the cycle.
- Register "Log in" link now uses <Link>. Session is localStorage JWT (httpOnly still deferred).
- TODO: test locally (register/confirm/login/guard/logout), then commit + push.

---

## Earlier stage
**Stage 1 — Register + profiles table + signup trigger**.

### Stage 0 — walking skeleton ✅ DONE
- Supabase project `ifn` created (project ref uyepkmdpakwkpqxsofoi), Email provider + confirm on.
- Vite app in `web/`, deployed on Vercel, env vars set (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
- `web/src/lib/supabase.js` singleton client; `getSession()` → `session:null, error:null` confirmed.

### Stage 1 approach LOCKED: hybrid
Minimal signup (name+email+password). role auto='student' (NOT user-settable). region/sector/domain/etc
nullable, filled later via edit-profile (onboarding). Lower friction (adoption). Trigger creates the row.

### Stage 1 plan/status
- 1a concept: auth.users (managed) vs public.profiles (1:1 by id) -> DONE
- 1b/1c/1d SQL: profiles table + handle_new_user trigger (security definer) + RLS (read/update own,
  revoke update on role/id/created_at to block self-escalation). SQL written/given. STATUS: user to
  RUN + confirm in Supabase SQL editor (signup will not create a profile until this is run).
- 1e register form: DONE. web/src/pages/Register.jsx. Minimal signup (name+email+password),
  supabase.auth.signUp with name in options.data, emailRedirectTo /login, check-your-email success
  state, client validation (name, @ifheindia.org, pw>=8). role defaults student (admin promotes mentors).
- Logo: public/icfai-founders.svg (official ICFAI vector wordmark + red bar, GROUP swapped to
  FOUNDERS NETWORK), used as <img h-12> in Register. Tailwind v3 + oldcode theme tokens in place.
- NO em-dashes anywhere (user rule, saved to memory).
- 1f @ifheindia.org server enforcement (auth hook / trigger guard) -> TODO
- 1g end-to-end test: register -> confirm email -> profiles row appears with role=student -> TODO

### Two reminders the user must do (cannot be done from here)
1. Vercel env vars VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY set + redeploy.
2. Supabase Auth -> URL Configuration -> Redirect URLs: add the Vercel URL + /login (and
   http://localhost:5173/login) so the email confirm link works.

## Next stages
1. Register form fields + `public.profiles` table + signup trigger + `@ifheindia.org` rule.
2. Login + redirect to blank authed route + route guard.
3. Forgot password.
4. RLS on every table; role policies (student/mentor/admin).
5. Prod hardening (Supabase Pro at launch, backups, push-to-deploy already via Vercel).

## Locked decisions
- Supabase Auth (managed), email+password, `@ifheindia.org` only.
- Session = localStorage JWT (httpOnly deferred — needs Next.js SSR).
- anon key public (RLS protects); service_role never shipped.

## Open questions / watch
- httpOnly cookie: revisit only if XSS risk becomes unacceptable → Next.js + `@supabase/ssr`.
- Complex pipeline/gate logic later may need a real backend tier (service_role server-side).
- File uploads (attachments) later: Supabase Storage or Cloudflare R2.

## Pivots history (so context isn't lost)
magic-link (reference design) → password → Supabase Auth → Vercel+Supabase-direct (no Express).
