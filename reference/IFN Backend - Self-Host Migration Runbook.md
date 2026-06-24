---
title: IFN Backend - Self-Host Migration Runbook
tags: [ifn, backend, operations, supabase, self-host, migration]
status: Approved
owner: IFN Team
updated: 2026-06-19
---

Step-by-step guide to migrate the **live** IFN backend off Supabase Cloud onto a college-controlled
server, by self-hosting the **same** Supabase stack with Docker. Lowest-churn path: keep Row Level
Security, the Postgres RPC functions, GoTrue auth, Storage, and the edge functions exactly as they
are. The frontend only repoints its URL and anon key.

> Scope note. This is NOT the abandoned PERN backend described in [[IFN Backend Index]] (Express,
> `sessions` table, magic-link). That plan is dead. The current production app is the Vite + React SPA
> talking directly to Supabase (anon key + RLS), and this runbook self-hosts that exact backend.

See [[IFN Backend - Backup & Restore]] for the ongoing backup detail this runbook bootstraps.

## Locked decisions (grilled 2026-06-19)

| Area       | Decision                                                                                                              |
| ---------- | --------------------------------------------------------------------------------------------------------------------- |
| Driver     | Institution ownership: ICFAI owns the box + data                                                                      |
| Host       | College-owned cloud VM (Linux, 4 GB RAM / 2 vCPU / 80 GB disk minimum)                                                |
| Strategy   | Self-host the official Supabase Docker stack. Keep RLS, RPCs, GoTrue, Storage, edge-runtime                           |
| Data       | Preserve all real users + data. Dump public schema + auth users + storage, match Postgres major version               |
| Keys       | Regenerate JWT secret + anon/service keys. One-time forced re-login. Passwords preserved (bcrypt hashes are portable) |
| Cutover    | Maintenance window. Keep cloud project alive 1 to 2 weeks as rollback                                                 |
| TLS        | Caddy + automatic Let's Encrypt, in front of the Kong gateway, at `api.<IFN_DOMAIN>`                                  |
| Email      | GoTrue SMTP pointed at Resend (self-hosted GoTrue has no default mailer)                                              |
| Edge funcs | Keep the 5 Deno functions on the self-hosted edge-runtime container                                                   |
| Backups    | Nightly `pg_dump` + storage tar to Backblaze B2 / S3, weekly VM snapshot, monthly restore drill                       |
| Output     | This note (canonical) + a Drive Google Doc copy                                                                       |

## Inventory being migrated

- **Auth (GoTrue):** email + password. Domain allowlist is changing (no longer `@ifheindia.org` only).
- **Postgres:** ~81 RPC functions (business logic lives in the DB), RLS on ~17 tables, 18
  `SECURITY DEFINER` functions, the `handle_new_user` trigger.
- **Storage:** 2 private buckets. `idea-files` (20 MB cap, mime allowlist) and `registration-certs`.
- **Edge functions (Deno):** `send-invites`, `send-contact`, `create-member`, `register-request`,
  `review-registration`. They use Resend + the service role key.
- **Frontend:** Vite SPA, currently on Vercel, possibly moving to Cloudflare Pages.

## Placeholders to fill before you start

- `<IFN_DOMAIN>`: the API hostname, for example `api.ifn.example.edu`.
- `<CLOUD_DB_URL>`: cloud direct connection string (Dashboard: Project Settings, Database,
  Connection string, URI, direct connection on port 5432, NOT the pooler).
- `<PG_MAJOR>`: cloud Postgres major version (Dashboard: Project Settings, Infrastructure). Match it.
- Resend SMTP credentials, Backblaze B2 (or S3) bucket + keys.

---

## Phase 0: Prerequisites

1. Provision the VM under the college's cloud account (Hetzner, DigitalOcean, AWS, or Azure). Ubuntu
   22.04 or 24.04 LTS, 4 GB RAM minimum (8 GB is comfortable), 2 vCPU, 80 GB disk.
2. Point DNS: create an `A` record `api.<IFN_DOMAIN>` to the VM public IP. Confirm with
   `dig +short api.<IFN_DOMAIN>`.
3. Open firewall ports 80 and 443 only. Do NOT expose Postgres (5432) or Kong (8000) publicly.
4. On a workstation, confirm the Supabase CLI is logged in and the cloud project is linked (the repo
   already has `supabase/.temp/linked-project.json`, project ref `uyepkmdpakwkpqxsofoi`).
5. Record `<PG_MAJOR>` from the cloud dashboard. Everything downstream pins to it.

## Phase 1: Install Docker + the Supabase stack on the VM

```bash
# On the VM
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER   # re-login after this

# Pull the official self-host compose
git clone --depth 1 https://github.com/supabase/supabase
cd supabase/docker
cp .env.example .env
```

The `docker/docker-compose.yml` includes: postgres, gotrue (auth), postgrest (rest), realtime,
storage, imgproxy, kong (gateway), studio, meta, the edge-runtime (functions), and the analytics
service. This is the same stack the cloud runs.

Pin Postgres to match the cloud major version. In `.env` (or the compose image tag) set the
`supabase/postgres` image to the `<PG_MAJOR>` line, for example `supabase/postgres:15.x`. A major
version mismatch breaks the auth/storage data-only restore in Phase 4.

## Phase 2: Generate fresh secrets and keys

Regenerating means existing JWTs die at cutover (one-time re-login). Passwords survive because the
bcrypt hashes ride along in the `auth.users` dump.

```bash
# JWT secret (40+ chars)
openssl rand -base64 48

# Postgres + dashboard passwords
openssl rand -base64 24
```

Derive the `ANON_KEY` and `SERVICE_ROLE_KEY` from the new JWT secret using Supabase's key generator
(the self-host docs link a JWT generator, or use the `supabase` CLI). Put all of these in `.env`:

- `POSTGRES_PASSWORD`, `JWT_SECRET`, `ANON_KEY`, `SERVICE_ROLE_KEY`
- `DASHBOARD_USERNAME`, `DASHBOARD_PASSWORD` (Studio basic auth)
- `SITE_URL` = the frontend origin (Vercel or Cloudflare Pages URL)
- `API_EXTERNAL_URL` = `https://api.<IFN_DOMAIN>`
- `ADDITIONAL_REDIRECT_URLS` = every allowed post-login redirect (frontend `/login`, localhost dev)

Keep `.env` out of git. Store a copy encrypted (sealed note / secrets manager), never beside the dumps.

## Phase 3: SMTP (so auth emails actually send) + allowlist

Self-hosted GoTrue has no built-in mailer. Without SMTP, confirm + reset + invite emails silently
fail. Point GoTrue at Resend (already used by the edge functions). In `.env`:

```
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_USER=resend
SMTP_PASS=<RESEND_API_KEY>
SMTP_ADMIN_EMAIL=no-reply@<IFN_DOMAIN>
SMTP_SENDER_NAME=ICFAI Founders Network
MAILER_AUTOCONFIRM=false
```

Email domain allowlist (changing away from `@ifheindia.org` only): GoTrue itself does not do
domain allowlists natively. The current rule lives client-side and/or in a signup trigger. Update the
allowlist where it is enforced:
- If enforced in the `handle_new_user` trigger or an auth hook, edit that SQL (it rides along in the
  public schema dump, so edit after restore or in the cloud before dumping).
- If enforced only in the frontend `Register.jsx`, update there.
Decide the new allowed domains and apply in both the trigger guard and the frontend before launch.

## Phase 4: Reverse proxy + TLS (Caddy)

Add Caddy to terminate TLS in front of Kong. Create `caddy/Caddyfile`:

```
api.<IFN_DOMAIN> {
    reverse_proxy localhost:8000
}
```

Add a Caddy service to the compose (or run it as a host service). Caddy auto-issues and auto-renews
the Let's Encrypt cert once the DNS `A` record resolves and ports 80/443 are open. Kong stays bound to
localhost only.

## Phase 5: First boot (empty stack) to create auth + storage schemas

Bring the stack up once on an EMPTY database. This lets GoTrue and Storage run their own migrations
and create the `auth` and `storage` schema tables at the versions your images ship. You restore DATA
into those tables in Phase 7, so the table layout must already exist.

```bash
docker compose up -d
docker compose ps          # all healthy
curl -s https://api.<IFN_DOMAIN>/auth/v1/health   # GoTrue ok
```

Recreate the storage buckets + their RLS policies by running the bucket SQL from the repo against the
new DB (this creates `idea-files` and `registration-certs` with the right caps, mime allow-list, and
access policies):

```bash
# from ~/lumenor/ifn, point psql at the new DB
psql "$LOCAL_DB_URL" -f db/pipeline.sql           # contains the idea-files bucket + policies
psql "$LOCAL_DB_URL" -f db/registration_requests.sql  # contains registration-certs bucket + policies
```

If those files also create public tables you will restore in Phase 6, run only the bucket-creation
sections here, or accept that the Phase 6 restore will conflict and instead create the buckets via the
Storage API / Studio. Cleanest: extract the two `insert into storage.buckets ...` blocks + their
`create policy` statements into a small `buckets.sql` and run only that here.

## Phase 6: Export from cloud + restore the public schema

Do the bulk (all app tables, the 81 RPC functions, RLS policies, triggers) first. This part is not
time-sensitive and can be rehearsed before the maintenance window.

```bash
# Dump the public schema (structure + data) from cloud
pg_dump "<CLOUD_DB_URL>" \
  --schema=public --no-owner --no-privileges \
  -Fc -f public.dump

# Restore into the self-hosted DB
pg_restore --no-owner --no-privileges \
  -d "$LOCAL_DB_URL" public.dump
```

The self-hosted stack already has the `anon`, `authenticated`, and `service_role` roles, so the RLS
policies and grants resolve. Spot-check: `select count(*) from pg_proc where pronamespace =
'public'::regnamespace;` should be near the ~81 RPC count, and `select count(*) from
pg_policies where schemaname='public';` should be non-zero.

## Phase 7: Maintenance-window cutover

Announce the window. Then, in order:

1. **Freeze writes on cloud.** Take the frontend down (or to a maintenance page) so no new rows land.
2. **Final delta dump of public** (re-run Phase 6 dump + restore) so the self-host has the last writes.
   Because keys are regenerating and sessions die anyway, a brief freeze is clean.
3. **Auth users (data only).** Passwords live here.
   ```bash
   pg_dump "<CLOUD_DB_URL>" --data-only \
     -n auth -t 'auth.users' -t 'auth.identities' \
     -f auth-data.sql
   # restore with triggers disabled (self-host postgres role is superuser)
   psql "$LOCAL_DB_URL" -c "set session_replication_role = replica;" -f auth-data.sql
   ```
   Add `auth.mfa_factors` / `auth.mfa_*` tables only if MFA is in use. Verify:
   `select count(*) from auth.users;` matches the cloud user count.
4. **Storage objects.** Recreate of buckets was done in Phase 5. Copy the file bytes. Most robust:
   a small script using the service role to list every object in cloud and re-upload to self-host via
   the Storage API (this recreates `storage.objects` metadata automatically; object timestamps reset,
   acceptable for handover). Buckets: `idea-files`, `registration-certs`. Alternative: data-only dump
   `storage.objects` + copy the underlying files into the storage volume, but the file-backend layout
   is fragile, so prefer re-upload.
5. **Edge functions.** They are volume-mounted into the edge-runtime container from
   `supabase/functions`. Copy the 5 function dirs there and set their secrets in `.env`
   (`RESEND_API_KEY`, `SERVICE_ROLE_KEY`, SMTP). Confirm:
   `curl https://api.<IFN_DOMAIN>/functions/v1/send-contact` responds (not 404).
6. **Repoint the frontend.** Set `VITE_SUPABASE_URL=https://api.<IFN_DOMAIN>` and
   `VITE_SUPABASE_ANON_KEY=<new anon key>` in the host env (Vercel or Cloudflare Pages), redeploy.
7. **Auth redirect + CORS.** In `.env`, ensure `SITE_URL` + `ADDITIONAL_REDIRECT_URLS` include the
   frontend origin and `/login`. If moving to Cloudflare Pages, use the Pages URL (and custom domain).
8. **Open the app.** Remove the maintenance page.

## Phase 8: Smoke test (do every one)

- Sign up a new account, receive the confirm email (Resend), confirm, profile row appears.
- Log in an existing migrated account (proves the password hash migration).
- Reset password flow (proves SMTP + redirect URLs).
- Read the feed, open an idea dossier, post a comment (proves RPCs + RLS).
- Upload a file to an idea, download it (proves Storage bucket + policies).
- Trigger an edge function (send a contact message, or admin invite) (proves edge-runtime + Resend).
- Admin action: move a pipeline gate, assign a mentor (proves `SECURITY DEFINER` RPCs + admin role).

## Phase 9: Backups (bootstrap immediately, do not defer)

```bash
# /opt/ifn/backup.sh  (run nightly via cron)
set -euo pipefail
STAMP=$(date +%F)
pg_dump "$LOCAL_DB_URL" -Fc -f /opt/ifn/backups/db-$STAMP.dump
docker run --rm -v supabase_storage:/data -v /opt/ifn/backups:/out \
  alpine tar czf /out/storage-$STAMP.tgz -C /data .
rclone copy /opt/ifn/backups remote:ifn-backups   # remote = Backblaze B2 / S3
find /opt/ifn/backups -mtime +30 -delete
```

- Cron nightly. Retain 7 daily + 4 weekly (30 days), offsite to Backblaze B2 or S3.
- Weekly provider VM snapshot for whole-box rollback.
- Store `.env` encrypted, separately from the dumps.
- Monthly restore drill into a throwaway stack. An untested backup is not a backup. Fold the schedule
  into [[IFN Backend - Backup & Restore]].

## Phase 10: Rollback + decommission

- **Rollback (during the window):** repoint the frontend env back to the cloud URL + old anon key and
  redeploy. The cloud project stays fully live for 1 to 2 weeks specifically for this.
- **Decommission:** after 1 to 2 weeks of stable self-hosted operation and a clean restore drill,
  pause then delete the cloud project. Take a final cloud backup first and archive it offsite.

## Open items

- Fill `<IFN_DOMAIN>` and add the DNS `A` record.
- Confirm `<PG_MAJOR>` from the cloud dashboard and pin the Postgres image to it.
- Decide the new email domain allowlist and apply it in both the signup trigger and the frontend.
- Confirm whether the frontend lands on Vercel or Cloudflare Pages (sets `SITE_URL` + redirect URLs).
- Decide MFA inclusion in the auth dump (only if enabled).
