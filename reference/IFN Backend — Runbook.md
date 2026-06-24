---
title: IFN Backend — Runbook
tags: [ifn, backend, operations, runbook]
status: Draft
owner: IFN Team
updated: 2026-06-09
---

# IFN Backend — Runbook

Operational procedures for running IFN in production. The stack is the 3-service Docker compose from
[[IFN Backend — Decisions (ADR)]] (ADR-016): **db** (postgres:16), **api** (node, Express), **web**
(nginx serving the built SPA + proxying `/api`). The api entrypoint waits for the db, runs migrations,
runs the seed, then starts.

See [[IFN Backend Index]] · [[IFN Backend — Backup & Restore]] · [[IFN Backend — Security & Threats]].

## Prerequisites
- Docker + Docker Compose on the host.
- A populated `.env` (copied from `.env.example`) — see **Secrets** below.
- TLS terminator in front (reverse proxy) for any real domain; compose publishes `web` on `:80`.

## Deploy (first time / new release)
1. Pull the release: `git pull` (or check out the tag) in the deploy directory.
2. Ensure `.env` is present and correct (never committed).
3. Build + start:
   ```
   docker compose -f docker-compose.yml up -d --build
   ```
4. The api entrypoint automatically: waits for db health → `knex migrate:latest` → seed (idempotent,
   guarded on a non-empty `users` table) → start.
5. Verify: `docker compose ps` (all healthy) and `curl -fsS http://localhost/api/v1/healthz` (or the
   container `/healthz`).

## Rollback
Migrations run forward on every deploy, so prefer **forward-fix** over destructive rollback.
- **App-only regression (no schema change):** redeploy the previous image/tag —
  `git checkout <prev-tag> && docker compose up -d --build`.
- **Bad migration:** roll back the last batch, then redeploy the prior code:
  ```
  docker compose exec api npm run migrate:rollback
  ```
  Only safe if the rollback `down()` is correct and no data depends on the new shape. If in doubt,
  restore from backup ([[IFN Backend — Backup & Restore]]) rather than rolling a destructive migration.

## Run a migration manually
```
docker compose exec api npm run migrate          # latest
docker compose exec api npm run migrate:rollback  # last batch
```
Migrations are FK-ordered + idempotent; they also run automatically at api start.

## Secret rotation
Secrets live only in `.env` (and the running container env). To rotate:
1. Update the value in `.env`.
2. Recreate the api (and db, if rotating its credentials) so the new env is picked up:
   ```
   docker compose up -d --force-recreate api
   ```
- **DB password:** rotate `POSTGRES_PASSWORD` **and** the matching `DATABASE_URL` together; recreate
  db + api. Existing sessions survive (opaque cookies are unaffected).
- **SMTP creds:** update `SMTP_*`, recreate api. Test with a login → confirm a magic link is sent.
- **Session cookie name** (`SESSION_COOKIE`): changing it invalidates all current cookies (everyone
  re-logs in) — treat as a forced logout.

## Emergency admin access
- Admin accounts are passwordless; an admin signs in via the magic-link flow (they already exist +
  are verified). To create/restore an admin when none can log in: insert/flip a verified `users` row
  with `role = admin` for a known `@ifheindia.org` address, then use the normal login flow. (The prod
  bootstrap seed creates the initial admin.)
- If email delivery is down, an admin cannot receive a link — fix SMTP first (or read the magic-link
  token from the api logs if the console transport is temporarily enabled in a controlled session).

## Incident response (quick loop)
1. **Triage:** `docker compose ps` (health), `docker compose logs --tail=200 api` (structured pino
   logs), check `/healthz`.
2. **DB down:** the api healthcheck fails and it won't serve; check `docker compose logs db`,
   confirm the `pgdata` volume is intact, restart `db`.
3. **Bad deploy:** roll back (above).
4. **Data corruption / loss:** restore from backup ([[IFN Backend — Backup & Restore]]).
5. **Abuse / spam flood:** confirm rate limits (ADR-019) are active; if needed, lock the pipeline or
   hide content via the admin/moderation path; rotate affected secrets.
6. Record what happened + the fix (feeds future ADRs / this runbook).

## Health & logs
- **Health:** `/healthz` (also pings the DB pool); compose healthchecks gate startup.
- **Logs:** structured JSON via pino — `docker compose logs -f api`; pretty with `| npx pino-pretty`.
- (Dashboards / alerting / error-tracking are deferred — see the Index doc review, observability item.)

## Danger
- `docker compose down -v` **deletes the `pgdata` and `uploads` volumes** = total data loss. Never run
  with `-v` in production without a verified, restorable backup in hand.
