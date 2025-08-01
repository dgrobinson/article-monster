#!/bin/bash

# PostgreSQL Restore Script for Article Library
# This script restores database from backup files

set -euo pipefail

# Configuration
BACKUP_DIR="/backups"
DB_NAME="article_library"
DB_USER="article_user"
DB_HOST="db"
DB_PORT="5432"

# Logging
LOG_FILE="${BACKUP_DIR}/restore.log"
exec 1> >(tee -a "$LOG_FILE")
exec 2>&1

# Usage function
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo "Options:"
    echo "  -f, --file BACKUP_FILE    Specify backup file to restore from"
    echo "  -l, --list               List available backups"
    echo "  -a, --articles           Also restore articles directory"
    echo "  -y, --yes                Skip confirmation prompts"
    echo "  -h, --help               Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 -l                                    # List available backups"
    echo "  $0 -f article_library_20240101_120000   # Restore specific backup"
    echo "  $0 -f latest -a -y                      # Restore latest backup with articles, no prompts"
}

# Parse command line arguments
BACKUP_FILE=""
LIST_BACKUPS=false
RESTORE_ARTICLES=false
SKIP_CONFIRMATION=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -f|--file)
            BACKUP_FILE="$2"
            shift 2
            ;;
        -l|--list)
            LIST_BACKUPS=true
            shift
            ;;
        -a|--articles)
            RESTORE_ARTICLES=true
            shift
            ;;
        -y|--yes)
            SKIP_CONFIRMATION=true
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

# Function to list available backups
list_backups() {
    echo "Available database backups:"
    echo "=========================="
    
    if ls "$BACKUP_DIR"/article_library_*.backup 2>/dev/null; then
        for backup in "$BACKUP_DIR"/article_library_*.backup; do
            filename=$(basename "$backup")
            timestamp=$(echo "$filename" | sed 's/article_library_\(.*\)\.backup/\1/')
            size=$(du -h "$backup" | cut -f1)
            date_formatted=$(date -d "${timestamp:0:8} ${timestamp:9:2}:${timestamp:11:2}:${timestamp:13:2}" "+%Y-%m-%d %H:%M:%S" 2>/dev/null || echo "Invalid date")
            echo "  $timestamp - $date_formatted ($size)"
        done
    else
        echo "No backup files found in $BACKUP_DIR"
    fi
    
    echo ""
    echo "Available articles backups:"
    echo "=========================="
    
    if ls "$BACKUP_DIR"/articles_*.tar.gz 2>/dev/null; then
        for backup in "$BACKUP_DIR"/articles_*.tar.gz; do
            filename=$(basename "$backup")
            timestamp=$(echo "$filename" | sed 's/articles_\(.*\)\.tar\.gz/\1/')
            size=$(du -h "$backup" | cut -f1)
            date_formatted=$(date -d "${timestamp:0:8} ${timestamp:9:2}:${timestamp:11:2}:${timestamp:13:2}" "+%Y-%m-%d %H:%M:%S" 2>/dev/null || echo "Invalid date")
            echo "  $timestamp - $date_formatted ($size)"
        done
    else
        echo "No articles backup files found in $BACKUP_DIR"
    fi
}

# If list flag is set, show backups and exit
if [ "$LIST_BACKUPS" = true ]; then
    list_backups
    exit 0
fi

# Check if backup file is specified
if [ -z "$BACKUP_FILE" ]; then
    echo "Error: No backup file specified. Use -f option or -l to list available backups."
    usage
    exit 1
fi

echo "=== Starting restore at $(date) ==="

# Handle 'latest' keyword
if [ "$BACKUP_FILE" = "latest" ]; then
    LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/article_library_*.backup 2>/dev/null | head -n1)
    if [ -z "$LATEST_BACKUP" ]; then
        echo "Error: No backup files found in $BACKUP_DIR"
        exit 1
    fi
    BACKUP_FILE=$(basename "$LATEST_BACKUP" .backup)
    echo "Using latest backup: $BACKUP_FILE"
fi

# Construct full paths
DB_BACKUP_FILE="${BACKUP_DIR}/${BACKUP_FILE}.backup"
ARTICLES_BACKUP_FILE="${BACKUP_DIR}/articles_${BACKUP_FILE#article_library_}.tar.gz"

# Check if database backup file exists
if [ ! -f "$DB_BACKUP_FILE" ]; then
    echo "Error: Database backup file not found: $DB_BACKUP_FILE"
    exit 1
fi

# Check if articles backup file exists (if requested)
if [ "$RESTORE_ARTICLES" = true ] && [ ! -f "$ARTICLES_BACKUP_FILE" ]; then
    echo "Warning: Articles backup file not found: $ARTICLES_BACKUP_FILE"
    echo "Continuing with database restore only..."
    RESTORE_ARTICLES=false
fi

# Show restore summary
echo "Restore Summary:"
echo "==============="
echo "Database backup: $DB_BACKUP_FILE"
if [ "$RESTORE_ARTICLES" = true ]; then
    echo "Articles backup: $ARTICLES_BACKUP_FILE"
fi
echo "Target database: $DB_NAME on $DB_HOST:$DB_PORT"
echo ""

# Confirmation prompt
if [ "$SKIP_CONFIRMATION" = false ]; then
    echo "WARNING: This will completely replace the existing database and data!"
    read -p "Are you sure you want to continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Restore cancelled."
        exit 1
    fi
fi

# Stop services that might be using the database
echo "Note: You should stop the application services before running this restore."
echo "Run: docker-compose -f docker-compose.prod.yml stop app worker scheduler"
echo ""

# Wait for user confirmation to continue
if [ "$SKIP_CONFIRMATION" = false ]; then
    read -p "Have you stopped the services? Continue with restore? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Restore cancelled."
        exit 1
    fi
fi

# Restore database
echo "Restoring database from $DB_BACKUP_FILE..."
if pg_restore -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres \
    --verbose \
    --clean \
    --if-exists \
    --create \
    --no-password \
    "$DB_BACKUP_FILE"; then
    
    echo "Database restore completed successfully!"
else
    echo "ERROR: Database restore failed!"
    exit 1
fi

# Restore articles if requested
if [ "$RESTORE_ARTICLES" = true ]; then
    echo "Restoring articles from $ARTICLES_BACKUP_FILE..."
    
    # Backup existing articles if they exist
    if [ -d "/app/articles" ] && [ "$(ls -A /app/articles)" ]; then
        BACKUP_EXISTING="/tmp/articles_backup_$(date +%Y%m%d_%H%M%S).tar.gz"
        echo "Backing up existing articles to $BACKUP_EXISTING..."
        tar -czf "$BACKUP_EXISTING" -C /app articles/
    fi
    
    # Remove existing articles directory
    rm -rf /app/articles
    
    # Extract articles backup
    if tar -xzf "$ARTICLES_BACKUP_FILE" -C /app; then
        echo "Articles restore completed successfully!"
        echo "Articles restored to /app/articles"
        
        # Set proper permissions
        chown -R 1000:1000 /app/articles 2>/dev/null || true
        chmod -R 755 /app/articles
        
    else
        echo "ERROR: Articles restore failed!"
        if [ -n "${BACKUP_EXISTING:-}" ]; then
            echo "Restoring previous articles from backup..."
            tar -xzf "$BACKUP_EXISTING" -C /app
        fi
        exit 1
    fi
fi

# Verify restore
echo "Verifying database connection..."
if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT version();" > /dev/null; then
    echo "Database connection verified successfully!"
else
    echo "WARNING: Could not verify database connection. Please check manually."
fi

echo "=== Restore completed at $(date) ==="
echo ""
echo "Next steps:"
echo "1. Start your services: docker-compose -f docker-compose.prod.yml up -d"
echo "2. Verify application functionality"
echo "3. Check logs for any issues"