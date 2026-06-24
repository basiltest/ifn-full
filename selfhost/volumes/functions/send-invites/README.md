# send-invites Edge Function

Creates mentor/admin invites and emails the links via [Resend](https://resend.com).
The Vite SPA holds only the anon key and has no server, so email delivery runs here.

It does **not** re-implement authorization: it calls the same admin-guarded RPCs the
client uses (`admin_create_invites`, `admin_mark_invites_sent`) with the **caller's JWT**,
so `is_admin()` in Postgres is the single gate. A non-admin caller gets a 403.

Prereq: `db/invites.sql` must be applied (provides the RPCs + `invites.sent_at`).

## Deploy

```bash
# from the repo root (where supabase/ lives)
supabase functions deploy send-invites

# secrets (SUPABASE_URL + SUPABASE_ANON_KEY are injected automatically)
supabase secrets set \
  RESEND_API_KEY=re_xxx \
  PUBLIC_SITE_URL=https://your-app-domain \
  INVITE_FROM_EMAIL="ICFAI Founders Network <invites@your-verified-domain>"
```

- `RESEND_API_KEY` — from the Resend dashboard.
- `PUBLIC_SITE_URL` — where invite links point (`<PUBLIC_SITE_URL>/register?invite=<token>`).
- `INVITE_FROM_EMAIL` — must use a domain verified in Resend (SPF/DKIM), or delivery fails.

## Request

`POST` with a logged-in admin's bearer token (the SPA sends this automatically via
`supabase.functions.invoke('send-invites', { body: { emails, role } })`).

```json
{ "emails": ["jane@acme.com", "bob@partner.org"], "role": "mentor" }
```

Response: `{ "created": 2, "sent": 2, "failed": [] }`.

## Local run

```bash
supabase functions serve send-invites --env-file supabase/functions/send-invites/.env.local
```
