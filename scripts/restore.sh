#!/usr/bin/env bash
# Database restore.
#
# Usage: scripts/restore.sh <dump-file.sql.gz>
#
# Restores a `pg_dump` output produced by scripts/backup.sh. The target
# database is identified by DATABASE_URL — it must already exist. This
# script does NOT drop the database; if you need a clean target, do that
# explicitly *before* running this. Refusing-to-drop is a safety feature.
#
# A successful restore should always be followed by:
#   1. Migration check:  pnpm --filter @offisdesign/database migrate-status
#   2. Smoke test:       curl -fsS "${API_PUBLIC_URL:-http://localhost:4000}/v1/system/healthz"
#   3. Search reindex:   POST /v1/admin/ops/search/reindex (Stage 14 candidate)
#
# Document the restore in docs/runbooks.md whenever you run it for real.

set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is not set" >&2
  exit 1
fi
if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <dump-file.sql.gz>" >&2
  exit 1
fi

FILE="$1"
if [[ ! -f "${FILE}" ]]; then
  echo "Dump not found: ${FILE}" >&2
  exit 1
fi

echo "Restoring ${FILE} into ${DATABASE_URL}"
gunzip -c "${FILE}" | psql "${DATABASE_URL}"

echo "Restore complete. Run migrate-status next."
