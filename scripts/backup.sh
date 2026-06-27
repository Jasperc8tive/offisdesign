#!/usr/bin/env bash
# Database backup.
#
# Usage:   scripts/backup.sh [destination-directory]
# Default: backups/<timestamp>.sql.gz
#
# Requires `pg_dump` on PATH and a populated DATABASE_URL. Writes a
# gzip-compressed plain-SQL dump suitable for `pg_restore --no-owner` or
# `gunzip | psql`. Run this from cron (see scripts/cron.example).
#
# For media: S3 lifecycle rules + versioning are the production-grade
# pattern. Local-driver media should be backed up separately by snapshotting
# the underlying volume; we deliberately do not script that here because
# the right answer is "use the storage provider's snapshot tooling."

set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is not set" >&2
  exit 1
fi

DEST_DIR="${1:-backups}"
mkdir -p "${DEST_DIR}"

TS="$(date -u +%Y%m%dT%H%M%SZ)"
FILE="${DEST_DIR}/db-${TS}.sql.gz"

echo "Backing up to ${FILE}"
pg_dump \
  --no-owner \
  --no-privileges \
  --format=plain \
  --no-comments \
  "${DATABASE_URL}" \
  | gzip -9 > "${FILE}"

# Soft retention: keep last 30 daily dumps locally. Off-site rotation
# (S3 lifecycle / GCS bucket lifecycle) is the actual long-term store.
ls -1t "${DEST_DIR}"/db-*.sql.gz 2>/dev/null | tail -n +31 | xargs -r rm -f

echo "Backup complete: ${FILE} ($(du -h "${FILE}" | awk '{print $1}'))"
