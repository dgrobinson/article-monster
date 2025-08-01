#!/bin/bash

# PostgreSQL Backup Script for Article Library
# This script creates full database dumps with compression and retention management

set -euo pipefail

# Configuration
BACKUP_DIR="/backups"
DB_NAME="article_library"
DB_USER="article_user"
DB_HOST="db"
DB_PORT="5432"
RETENTION_DAYS=30
COMPRESSION="gzip"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/article_library_${TIMESTAMP}.sql"

# Logging
LOG_FILE="${BACKUP_DIR}/backup.log"
exec 1> >(tee -a "$LOG_FILE")
exec 2>&1

echo "=== Starting backup at $(date) ==="

# Check if backup directory exists
if [ ! -d "$BACKUP_DIR" ]; then
    echo "Creating backup directory: $BACKUP_DIR"
    mkdir -p "$BACKUP_DIR"
fi

# Check disk space (warn if less than 1GB free)
AVAILABLE_SPACE=$(df "$BACKUP_DIR" | awk 'NR==2 {print $4}')
if [ "$AVAILABLE_SPACE" -lt 1048576 ]; then
    echo "WARNING: Less than 1GB free space available in $BACKUP_DIR"
fi

# Perform database dump
echo "Creating database dump..."
if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    --verbose \
    --clean \
    --if-exists \
    --create \
    --format=custom \
    --no-password \
    --file="${BACKUP_FILE}.backup"; then
    
    echo "Database dump created successfully: ${BACKUP_FILE}.backup"
    
    # Create SQL dump for human readability
    echo "Creating readable SQL dump..."
    pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        --verbose \
        --clean \
        --if-exists \
        --create \
        --no-password > "$BACKUP_FILE"
    
    # Compress the SQL dump
    if [ "$COMPRESSION" = "gzip" ]; then
        echo "Compressing SQL dump..."
        gzip "$BACKUP_FILE"
        BACKUP_FILE="${BACKUP_FILE}.gz"
    fi
    
    echo "Backup completed: $BACKUP_FILE"
    
    # Get file size
    BACKUP_SIZE=$(du -h "${BACKUP_FILE}.backup" | cut -f1)
    SQL_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "Backup sizes - Custom format: $BACKUP_SIZE, SQL dump: $SQL_SIZE"
    
else
    echo "ERROR: Database dump failed!"
    exit 1
fi

# Create manifest file with backup information
MANIFEST_FILE="${BACKUP_DIR}/manifest_${TIMESTAMP}.json"
cat > "$MANIFEST_FILE" << EOF
{
    "timestamp": "$TIMESTAMP",
    "database": "$DB_NAME",
    "backup_files": {
        "custom_format": "${BACKUP_FILE}.backup",
        "sql_dump": "$BACKUP_FILE"
    },
    "sizes": {
        "custom_format": "$BACKUP_SIZE",
        "sql_dump": "$SQL_SIZE"
    },
    "created_at": "$(date -Iseconds)",
    "retention_days": $RETENTION_DAYS
}
EOF

# Backup application data (articles directory)
ARTICLES_BACKUP="${BACKUP_DIR}/articles_${TIMESTAMP}.tar.gz"
if [ -d "/app/articles" ] && [ "$(ls -A /app/articles)" ]; then
    echo "Backing up articles directory..."
    tar -czf "$ARTICLES_BACKUP" -C /app articles/
    ARTICLES_SIZE=$(du -h "$ARTICLES_BACKUP" | cut -f1)
    echo "Articles backup created: $ARTICLES_BACKUP ($ARTICLES_SIZE)"
    
    # Update manifest with articles backup
    tmp_manifest=$(mktemp)
    jq --arg articles_file "$ARTICLES_BACKUP" --arg articles_size "$ARTICLES_SIZE" \
        '.backup_files.articles = $articles_file | .sizes.articles = $articles_size' \
        "$MANIFEST_FILE" > "$tmp_manifest" && mv "$tmp_manifest" "$MANIFEST_FILE"
else
    echo "No articles directory found or it's empty, skipping articles backup"
fi

# Clean old backups (keep only last N days)
echo "Cleaning old backups (keeping last $RETENTION_DAYS days)..."
find "$BACKUP_DIR" -name "article_library_*.sql*" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "article_library_*.backup" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "articles_*.tar.gz" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "manifest_*.json" -mtime +$RETENTION_DAYS -delete

# List current backups
echo "Current backups:"
ls -lh "$BACKUP_DIR"/article_library_* "$BACKUP_DIR"/articles_* 2>/dev/null || echo "No backup files found"

echo "=== Backup completed at $(date) ==="
echo ""