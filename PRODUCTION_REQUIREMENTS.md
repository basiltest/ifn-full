
Prepared for the IT team operating the Microsoft IIS httpd 10.0 (Windows Server) infrastructure.
Sizes a single Windows Server to host the entire ICFAI Founders Network (IFN) web application at a
target of about 10,000 monthly active users.

Status: Draft for IT review. Owner: IFN Team. Date: 2026-06-19.
Companion document: STAGING_REQUIREMENTS.md (smaller, pre-release mirror).

## 1. Purpose and scope

Allocate production compute, storage, network, and backup resources for IFN on one Windows Server,
sized to roughly 10,000 monthly active users (MAU). Everything runs on the Windows box: IIS serves the
frontend, and Docker (via WSL2) runs the backend. Numbers include headroom and a path to scale. Figures
derive from the load assumptions in section 3; change those and the sizing changes.

## 2. Architecture (everything on one Windows Server)

| Part | Technology | How it runs on Windows | Load profile |
|------|-----------|------------------------|--------------|
| Frontend | Vite + React static SPA (HTML/JS/CSS) | IIS 10.0 serves the static files directly. | Cheap. Cacheable static files. |
| Backend | Supabase stack: Postgres, GoTrue auth, Storage, edge functions | Docker containers via the WSL2 backend. Docker runs the Linux images; no separate Linux machine is provisioned. | The real capacity driver. Business logic lives in ~81 Postgres functions, so the DATABASE is the bottleneck, not an app tier. |

Docker handles the Linux side. Docker Desktop for Windows Server (or Docker Engine inside WSL2) runs
the Supabase containers on a lightweight WSL2 Linux VM that Windows manages for you. IT provisions one
Windows Server; Docker abstracts the rest.

There is no realtime/websocket tier (plain REST plus an optional 15 second poll on the idea-detail
view), so there is no persistent-connection scaling problem.

### 2.1 Request flow on a single box
IIS is the front door and terminates TLS for one hostname. It serves the static SPA, and reverse
proxies the backend paths to the Docker stack on loopback:

```
Browser -> IIS (443, TLS)
            |-- static SPA files            (served by IIS)
            `-- /auth, /rest, /storage, /functions  -> reverse proxy -> 127.0.0.1:8000 (Supabase Kong, Docker)
```

This keeps one public hostname, one certificate, and Docker bound to localhost only.

## 3. Load assumptions (the basis for every number below)

Stated so IT can challenge them. Sizing scales roughly linearly with these.

| Metric | Value | Basis |
|--------|-------|-------|
| Monthly active users (MAU) | 10,000 | Target given. |
| Daily active users (DAU) | ~1,500 | 15% DAU/MAU, typical for a campus community app. |
| Peak concurrent users | ~200 | Campus usage spikes between classes. ~10 to 13% of DAU at peak. |
| Average requests per active user | ~5 per minute | SPA bursts of RPC calls per interaction. |
| Steady poll load | ~4 req/min per user on an idea-detail page | 15 second poll. Assume up to 25% of concurrent users polling. |
| Peak request rate | ~50 to 100 req/s | 200 concurrent x ~5/min plus polling, with burst margin. |

Modest load. One correctly sized Windows host handles it; the design points are RAM for Postgres cache
(allocated to WSL2) and a connection pooler, not raw core count.

## 4. Single Windows Server: resource allocation

One Windows Server runs Windows + IIS + the Docker/WSL2 backend together. Allocate for all three.

| Resource | Recommended | Acceptable floor | Why |
|----------|-------------|------------------|-----|
| vCPU | 8 | 6 | ~4 for the Docker/WSL2 containers (Postgres + PostgREST + GoTrue + Storage + pooler), ~2 for Windows, ~2 for IIS and headroom. |
| RAM | 24 GB | 16 GB | Give 16 GB to the WSL2 VM (Postgres cache) via `.wslconfig`; leave ~8 GB for Windows + IIS. Postgres performance is RAM-bound. |
| Disk | 200 GB NVMe SSD | 120 GB SSD | Windows + IIS site + the WSL2 virtual disk (DB + WAL + attachments + container images). Local NVMe, not network or spinning disk. |
| Disk IOPS | 3,000+ provisioned | 1,000 | Postgres is latency-sensitive. Avoid burst-credit volumes that throttle. |
| Network | 1 Gbps | 250 Mbps | Comfortable for this request volume plus file up/downloads. |

One box at this spec covers 10k MAU. Do not build a cluster for this load.

### 4.1 WSL2 / Docker tuning (Windows-specific, important)
- Enable hardware virtualization (Hyper-V / VT-x) in BIOS/firmware. Required for WSL2.
- Install WSL2 and Docker (Docker Desktop for Windows Server, or Docker Engine in WSL2) + Docker Compose.
- Cap and grant WSL2 resources in `C:\Users\<user>\.wslconfig`, for example:
  ```
  [wsl2]
  memory=16GB
  processors=4
  ```
  Without this, WSL2 may grab too much or too little RAM.
- CRITICAL: keep Postgres and Storage data in Docker NAMED VOLUMES on the WSL2 ext4 filesystem (the
  managed vhdx), NOT bind-mounted from a Windows `C:\...` (NTFS) path. NTFS bind mounts cripple
  Postgres IO. This is the single biggest Docker-on-Windows performance mistake.
- Set the Docker service and the WSL distro to start on boot so the stack survives reboots.

### 4.2 Database configuration (Postgres, in the container)
- Use the bundled connection pooler (Supavisor / PgBouncer, transaction mode). The 200 concurrent
  users map to a small pool of real DB connections, NOT one each.
- `max_connections`: ~100 (clients go through the pooler; pool ~25 to 40 real connections).
- `shared_buffers`: ~25% of the RAM given to WSL2 (about 4 GB when WSL2 has 16 GB).
- `effective_cache_size`: ~50 to 75% of the WSL2 RAM.
- Starting points; tune from real query stats after launch.

## 5. Storage sizing (attachments + database, inside the WSL2 disk)

Two buckets: `idea-files` (10 to 20 MB cap per file) and `registration-certs`.

| Item | Estimate | Notes |
|------|----------|-------|
| Database size | a few GB at 10k MAU year one | Mostly text rows (posts, comments, pipeline, notifications). |
| Attachments | grows with uploads | A few thousand files at ~2 MB average = several GB; tens of GB over time. |
| WSL2 vhdx headroom | the rest of the 200 GB | The vhdx holds the DB + attachments + images. Alarm at 70% disk; the vhdx grows on demand, so ensure the host volume has room. |

If attachments outgrow the local disk, point the Storage container at S3-compatible object storage
(the Storage layer supports an S3 backend) instead of growing the vhdx forever.

## 6. Frontend hosting and bandwidth (IIS)

IIS serves the static SPA and reverse proxies the API (section 2.1).

### 6.1 Required IIS modules
- URL Rewrite 2.1 (REQUIRED): SPA deep-link fallback (rewrite any non-file path to `/index.html`,
  leave `/assets/*` served directly). A `web.config` with this rule ships with the build.
- Application Request Routing (ARR) (REQUIRED in this single-box model): reverse proxy the backend
  paths (`/auth`, `/rest`, `/storage`, `/functions`, or a single `/api` prefix) to `127.0.0.1:8000`.
- HTTP/2 enabled; static + dynamic compression for `.js`, `.css`, `.json`, `.svg`.
- App Pool: No Managed Code (the frontend is static; no ASP.NET).
- Confirm MIME types: `.svg`, `.woff2`, `.json`, `.webmanifest`.

### 6.2 Build-time configuration (important)
The backend URL and public anon key are baked into the static bundle at BUILD time, not read at
runtime. IIS needs no env vars or secrets for the frontend. A production build must be produced
(Node.js 20, off-box or in CI) pointed at the production backend URL + anon key; the resulting `dist`
folder is what gets published to IIS.

### 6.3 Bandwidth
First load ~250 KB gzipped (JS+CSS), cached afterward. At 10k MAU, egress is tens to low hundreds of
GB per month. IIS serves cached static files, so the static-site cost stays ~1 to 2 GB RAM / 1 vCPU
regardless of user count (already included in section 4). A CDN in front is optional and lowers egress
and latency further.

## 7. Network, ports, DNS, TLS

- Inbound: TCP 80 (redirect) and 443 to IIS only.
- Docker publishes the Supabase gateway on `127.0.0.1:8000` (loopback). Never expose it or Postgres
  (5432) publicly.
- DNS: one production hostname, for example `ifn.<college-domain>`, pointing at the Windows server.
- TLS certificate bound at IIS (win-acme / Let's Encrypt, internal CA, or commercial). One cert.
- CORS: the backend config must allow the production frontend origin (same hostname here).
- Outbound 443 from the box to the email provider (Resend SMTP) for auth + notification mail.

## 8. Backups and disaster recovery

- Database: scheduled `pg_dump` via `docker exec` into a dump file, copied off the box to S3-compatible
  object storage (Backblaze B2 or S3). A Windows Task Scheduler job can drive this.
- Attachments: archive the Storage volume (tar inside the container, or copy the volume) to the same
  offsite target.
- Whole-box: a Windows Server image/snapshot weekly (covers IIS config + the WSL2 vhdx).
- Retention: 7 daily + 4 weekly (about 30 days).
- Monthly restore drill into a throwaway environment. An untested backup is not a backup.

## 9. Scaling headroom and triggers

Fits one Windows host. When to act:
- CPU sustained above 70% or DB cache hit ratio dropping: raise the VM size, and raise the WSL2
  `memory=`/`processors=` allocation. RAM first, then vCPU.
- Growth well beyond 10k MAU: move the backend to a dedicated Linux host and add a Postgres read
  replica (the same Docker stack is portable off Windows when needed).
- Attachments outgrowing local disk: switch Storage to S3-compatible object storage.
- Latency for distant users: add a CDN in front of IIS.
No horizontal app-tier autoscaling is needed at 10k MAU.

## 10. Resource allocation summary

Single Windows Server, all-in:

| Subsystem | vCPU | RAM | Disk | Runtime |
|-----------|------|-----|------|---------|
| Windows + IIS (frontend + reverse proxy) | ~2 to 3 | ~8 GB | shares the 200 GB | IIS static + ARR |
| Docker / WSL2 (Supabase backend) | ~4 | 16 GB (via `.wslconfig`) | WSL2 vhdx on the same 200 GB | Docker |
| HOST TOTAL | 8 (6 floor) | 24 GB (16 GB floor) | 200 GB NVMe, 3,000+ IOPS | Windows Server |
| Offsite backups | n/a | n/a | a few x DB size | object storage |

Headline: one Windows Server, 8 vCPU / 24 GB RAM / 200 GB NVMe. IIS serves the SPA and reverse proxies
the API; Docker (WSL2) runs the Supabase backend on the same box. Covers 10,000 monthly active users
with room to grow.

## 11. Software prerequisites checklist (the Windows Server)

- [ ] Windows Server 2019 or 2022 (2022 recommended for WSL2 + container support).
- [ ] Hardware virtualization enabled in BIOS/firmware.
- [ ] WSL2 installed with a Linux distro (Ubuntu).
- [ ] Docker Desktop for Windows Server, or Docker Engine in WSL2, + Docker Compose.
- [ ] `.wslconfig` set (memory + processors) per section 4.1.
- [ ] Docker data in named volumes on ext4 (NOT NTFS bind mounts).
- [ ] IIS 10.0 with Static Content, URL Rewrite 2.1, and ARR.
- [ ] HTTP/2 + compression enabled; HTTP-to-HTTPS redirect.
- [ ] TLS certificate bound to 443.
- [ ] Docker + WSL distro set to auto-start on boot.
- [ ] Node.js NOT required on the server (builds happen off-box).

## 12. Decisions to confirm with IT

1. The DAU/MAU and peak-concurrency assumptions in section 3 (challenge if real numbers differ).
2. Windows Server version (2022 preferred).
3. Single hostname + TLS certificate source.
4. Backup offsite target (Backblaze B2, S3, or campus object storage).
5. Whether this production box is the existing `iiec.ifheindia.org` host or a separate server
   (separate is preferred so IFN cannot affect that site).
