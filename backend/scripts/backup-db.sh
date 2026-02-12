#!/bin/bash
# Kimitter DB Backup Script
# Schedule: NAS Task Scheduler에서 매일 새벽 2시 실행
# Usage: sudo /volume1/docker/kimitter/backup-db.sh

BACKUP_DIR="/volume1/docker/kimitter/backups"
CONTAINER="kimitter-db"
DB_USER="family_user"
DB_NAME="family_threads"
DATE=$(date +%Y%m%d_%H%M%S)
LOG_FILE="$BACKUP_DIR/backup.log"

# Create backup directory if not exists
mkdir -p "$BACKUP_DIR"

# Dump database
echo "[$DATE] Starting backup..." >> "$LOG_FILE"

if docker exec "$CONTAINER" pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_DIR/db_$DATE.sql.gz"; then
  SIZE=$(du -h "$BACKUP_DIR/db_$DATE.sql.gz" | cut -f1)
  echo "[$DATE] Backup completed: db_$DATE.sql.gz ($SIZE)" >> "$LOG_FILE"
else
  echo "[$DATE] ERROR: Backup failed!" >> "$LOG_FILE"
  exit 1
fi

# Delete backups older than 30 days
DELETED=$(find "$BACKUP_DIR" -name "db_*.sql.gz" -mtime +30 -delete -print | wc -l)
if [ "$DELETED" -gt 0 ]; then
  echo "[$DATE] Cleaned up $DELETED old backup(s)" >> "$LOG_FILE"
fi
