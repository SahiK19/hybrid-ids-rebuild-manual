#!/usr/bin/env bash
set -euo pipefail

# Usage:
# export DB_HOST="your-rds-endpoint"
# export DB_USER="admin"
# export DB_NAME="hybrididsdb"   # optional
# ./database/scripts/restore_db.sh

DB_HOST="${DB_HOST:?Set DB_HOST (RDS endpoint)}"
DB_USER="${DB_USER:?Set DB_USER (DB username)}"
DB_NAME="${DB_NAME:-hybrididsdb}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DUMP_FILE="${SCRIPT_DIR}/../dumps/hybrididsdb.sql.gz"

if [[ ! -f "$DUMP_FILE" ]]; then
  echo "[ERROR] Dump file not found: $DUMP_FILE"
  exit 1
fi

echo "[INFO] Restoring into host=${DB_HOST}, db=${DB_NAME}"
gunzip -c "$DUMP_FILE" | mysql -h "$DB_HOST" -u "$DB_USER" -p "$DB_NAME"
echo "[OK] Restore complete."
