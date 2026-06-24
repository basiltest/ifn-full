---
title: IFN Backend — Architecture
tags: [ifn, backend, architecture]
status: Approved
owner: IFN Team
updated: 2026-06-09
---
G
# IFN Backend — Architecture

The **ICFAI Founders Network** backend is a **modular monolith** on the PERN stack
(PostgreSQL · Express · React · Node). One Express process, split internally by domain
module, fronted by nginx and backed by Postgres + a file-storage volume + an outbound mailer
(magic-link only). It replaces the current localStorage mock data layer; the React SPA does a
hard cut to `/api/v1`.

See [[IFN Backend Index]] · [[IFN Backend — Data Model]] · [[IFN Backend — Sequence Flows]] · [[IFN Backend — Decisions (ADR)]].

## Component view (C4 container/component)

```plantuml
@startuml
skinparam componentStyle rectangle
skinparam shadowing false
skinparam defaultTextAlignment center

actor "Student / Mentor / Super Admin" as User

node "Browser" {
  component "React SPA\n(Vite, React Router)" as SPA
}

node "web (nginx)" as Web {
  component "Static dist/ + /api proxy" as NginxProxy
}

node "api (Node 20, Express)" as API {
  component "HTTP layer\nhelmet · cors · pino" as Http
  component "Session middleware\n(opaque cookie)" as SessMw
  component "zod validate" as Validate
  component "Role guard\n(student/mentor/admin)" as Guard
  component "Serializer\n(anonymous masking)" as Serial

  package "Domain modules" {
    component "auth" as Mauth
    component "users / directory" as Musers
    component "posts" as Mposts
    component "comments" as Mcomments
    component "votes" as Mvotes
    component "tags + requests" as Mtags
    component "pipeline\n(gate machine)" as Mpipe
    component "reviews" as Mrev
    component "teamboard" as Mteam
    component "calendar" as Mcal
    component "autopsy" as Mautopsy
    component "admin" as Madmin
  }
  component "Storage interface" as Storage
  component "Mailer\n(console/SMTP)" as Mailer
}

database "PostgreSQL 16" as PG
folder "File volume\n(attachments)" as Vol
cloud "SMTP / Ethereal" as Smtp

User --> SPA
SPA --> NginxProxy : HTTPS
NginxProxy --> Http : /api/v1/* (proxy)
NginxProxy --> SPA : static assets

Http --> SessMw
SessMw --> Validate
Validate --> Guard
Guard --> Mposts
Guard --> Mauth
Guard --> Musers
Guard --> Mcomments
Guard --> Mvotes
Guard --> Mtags
Guard --> Mpipe
Guard --> Mrev
Guard --> Mteam
Guard --> Mcal
Guard --> Mautopsy
Guard --> Madmin

Mposts --> Serial
Mpipe --> PG
Mposts --> PG
Mauth --> PG
Musers --> PG
Mtags --> PG
Mcal --> PG
Mteam --> PG
Mrev --> PG
Mautopsy --> PG
Mcomments --> PG
Mvotes --> PG
Madmin --> PG

Mpipe --> Storage
Storage --> Vol
Mauth --> Mailer
Mailer --> Smtp
@enduml
```

## Deployment view (Docker)

```plantuml
@startuml
skinparam shadowing false
skinparam defaultTextAlignment center

node "Host / docker compose" {
  node "web\nnginx:alpine" as web
  node "api\nnode:20-alpine" as api
  database "db\npostgres:16" as db
  folder "vol: pgdata" as pgdata
  folder "vol: uploads" as uploads
}
cloud "SMTP (prod)" as smtp

[Browser] --> web : 80/443
web --> api : proxy /api/v1
api --> db : 5432 (private net)
db --> pgdata
api --> uploads
api ..> smtp : magic-link mail (prod)

note bottom of api
  entrypoint: wait-for db healthy
  -> run migrations
  -> run seed (once, by NODE_ENV)
  -> start server
end note

note bottom of db
  healthcheck: pg_isready
  api depends_on: db (service_healthy)
end note
@enduml
```

`docker-compose.dev.yml` overrides `api` (bind mount + `nodemon`) and `web` (`vite dev`) for hot reload.

## Module responsibilities

| Module | Owns | Key endpoints (under `/api/v1`) |
|---|---|---|
| `auth` | register, magic-link issue/verify, login, logout, `me` | `POST /auth/register`, `GET /auth/verify`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` |
| `users` / directory | profiles, directory filter, admin role changes | `GET /users`, `GET /users/:id`, `PATCH /me`, `PATCH /users/:id/role` |
| `posts` | feed + problem-hub posts, badges, pin, edit-with-history | `GET/POST /posts`, `PATCH/DELETE /posts/:id`, `POST /posts/:id/pin` |
| `comments` | public comment threads | `GET/POST /posts/:id/comments`, `DELETE …/:cid` |
| `votes` | per-user up/down | `PUT /posts/:id/vote` |
| `tags` | tags, new-tag + `#Success` approval queue | `GET /tags`, `POST /tag-requests`, `POST /tag-requests/:id/approve|reject`, `POST /posts/:id/success-request` |
| `pipeline` | ideas, IFN-n, gate machine, lock, reject/refine, **dossier**, per-stage deliverables, extra asks, attachments | `POST /ideas`, `GET /ideas/:id/dossier`, `POST /ideas/:id/stages/:gate/submit`, `POST /ideas/:id/assign`, `/pickup`, `/gate`, `/reject`, `/refine`, `/resubmit`, `POST /ideas/:id/extra-asks`, `POST /pipeline/lock` |
| `reviews` | per-stage mentor rubric + feasibility + feedback (review history) | `POST /ideas/:id/stages/:gate/review`, `GET /ideas/:id/reviews` |
| `teamboard` | talent posts + applications | `GET/POST /team-posts`, `POST /team-posts/:id/apply` |
| `calendar` | events, per-user hide, event requests | `GET/POST /events`, `DELETE /events/:id/me`, `POST /event-requests`, `…/approve` |
| `autopsy` | idea autopsy reports | `POST /posts/:id/autopsy` |
| `admin` | queue views, pin, pipeline lock, overrides | `GET /admin/queue`, … |

## Request lifecycle

```plantuml
@startuml
skinparam shadowing false
start
:request -> nginx;
:proxy to Express /api/v1;
:helmet + cors;
:pino request log;
:session middleware\n(SELECT sessions by cookie -> req.user);
if (route protected?) then (yes)
  if (valid session?) then (no)
    :401;
    stop
  endif
endif
:zod validate (body/query/params);
if (schema ok?) then (no)
  :400 {error:{code,message,details}};
  stop
endif
:role guard\n(student/mentor/admin; admin inherits mentor);
if (authorized?) then (no)
  :403;
  stop
endif
:handler (domain module);
:serializer\n(mask anonymous author unless admin);
:200/201 JSON;
stop
@enduml
```

## Cross-cutting rules baked into the layers

- **Anonymous masking** lives in the serializer, never the client: `author_id` is always stored;
  the response strips author identity for `anonymous` posts unless the requester is `admin`.
- **Roles are server-owned.** The old client-side role switcher is gone; only an admin can change a
  role via `PATCH /users/:id/role`.
- **Gate transitions** are validated by a single state machine (see [[IFN Backend — Sequence Flows]])
  and every change is audited.
- **Errors** use one envelope: `{ "error": { "code", "message", "details" } }`.

Related: [[IFN Backend — Data Model]] · [[IFN Backend — Decisions (ADR)]] · [[IFN PRD]]
