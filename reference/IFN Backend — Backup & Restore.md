---
title: IFN Backend — Backup & Restore
tags: [ifn, backend, operations, backup, recovery]
status: Draft
owner: IFN Team
updated: 2026-06-09
---

# IFN Backend — Backup & Restore

All persistent state lives in **two Docker volumes**: `pgdata` (the Postgres database) and `uploads`
(attachment bytes). There is currently no backup — a volume loss or an accidental `down -v` is **total,
unrecoverable data loss**. This doc defines the minimum viable backup + a tested restore. Not a formal
DR plan (RTO/RPO) — that is post-MVP; this is the part that must simply *exist*.

See [[IFN Backend Index]] · [[IFN Backend — Runbook]] · [[IFN Backend — Decisions (ADR)]] (ADR-025 retention).

## What to back up
| Item | Where | How |
|------|-------|-----|
| Database | `pgdata` volume (postgres:16) | logical dump via `pg_dump` |
| Attachments | `uploads` volume (`/data/uploads`) | file copy / archive of the volume |
| Config | `.env` (secrets) | store **separately + encrypted** (a secrets manager / sealed note), **not** with the data dumps |

The DB dump is the source of truth for relational data; the uploads archive must be taken **close in
time** to the dump so attachment rows and files stay consistent.

## Database backup (logical dump)
```
# from the host; writes a timestamped dump
docker compose exec -T db pg_dump -U ifn -d ifn -Fc > ifn-db-$(date +%Y%m%d-%H%M%S).dump
```
- `-Fc` = custom format (compressed, restorable with `pg_restore`, supports selective restore).
- Schedule via cron, e.g. nightly:
  ```
  0 2 * * *  cd /path/to/deploy && docker compose exec -T db pg_dump -U ifn -d ifn -Fc > /backups/ifn-db-$(date +\%Y\%m\%d).dump
  ```

## Uploads backup
```
# archive the uploads volume contents (taken right after the DB dump)
docker run --rm -v ifn_uploads:/data -v /backups:/out alpine \
  tar czf /out/ifn-uploads-$(date +%Y%m%d-%H%M%S).tgz -C /data .
```

## Retention (per ADR-025)
- Keep **daily** dumps for 14 days, **weekly** for 8 weeks (adjust to disk). Prune older.
- Store backups **off the app host** (another box / object storage) — a host failure must not take the
  backups with it.

## Restore — database
```
# fresh/empty target DB (stack up, db healthy):
cat ifn-db-YYYYMMDD-HHMMSS.dump | docker compose exec -T db pg_restore -U ifn -d ifn --clean --if-exists
```
- `--clean --if-exists` drops + recreates objects before restoring (use against the intended DB only).
- If restoring into a brand-new volume, bring the stack up first so migrations create the schema, or
  let `pg_restore` recreate it from the dump; do **not** also run a conflicting seed (the seed guard
  skips a non-empty `users` table).

## Restore — uploads
```
docker run --rm -v ifn_uploads:/data -v /backups:/in alpine \
  sh -c "rm -rf /data/* && tar xzf /in/ifn-uploads-YYYYMMDD-HHMMSS.tgz -C /data"
```

## Restore order (full recovery)
1. Provision host + Docker + restore `.env` from the secrets store.
2. `docker compose up -d` (db comes up; migrations create schema if the volume is fresh).
3. `pg_restore` the latest DB dump.
4. Restore the matching uploads archive.
5. Start/verify api + web; `curl /healthz`; spot-check a post + an attachment download.

## Restore testing (do not skip)
A backup you have never restored is not a backup. **Quarterly**, restore the latest dump + uploads into
a throwaway stack and verify: row counts look right, a known attachment downloads, login works. Record
the date of the last successful restore test here:

| Last restore test | Result |
|-------------------|--------|
| _none yet_ | — |
