#!/usr/bin/env bash
# Apply the IFN app schema into the self-hosted Supabase Postgres, in dependency order.
# BLANK schema only (no data). Safe to re-run — a few "already exists" / "cannot change return
# type" warnings on re-run are harmless and filtered out below.
#
# Order matters: readonly (can_write + restricted col) must precede comments/admin/teamboard/
# problemhub; pipeline (pipeline_ideas) precedes notifications_admin; registration_requests
# (adds profiles.member_type) precedes member_type.
#
# Usage:  ./selfhost/apply-schema.sh
set -uo pipefail
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE="$REPO/selfhost/docker-compose.yml"
DBROOT="$REPO/db"

ORDER="profiles readonly posts votes tags comments feed admin teamboard calendar directory \
onboarding notifications pipeline notifications_admin polls problemhub problem_upvotes \
problem_votes_v2 invites registration_requests member_type autopsies security_hardening"

fail=0
for f in $ORDER; do
  [ -f "$DBROOT/$f.sql" ] || { echo "‼ MISSING db/$f.sql"; fail=1; continue; }
  out=$(docker compose -f "$COMPOSE" exec -T db psql -U postgres -d postgres -q \
          -v ON_ERROR_STOP=0 -f - < "$DBROOT/$f.sql" 2>&1)
  errs=$(echo "$out" | grep -iE 'ERROR:' \
          | grep -ivE 'already exists|cannot change return type of existing function' | head -6)
  if [ -n "$errs" ]; then echo "✗ $f.sql"; echo "$errs" | sed 's/^/    /'; fail=1
  else echo "✓ $f.sql"; fi
done
exit $fail
