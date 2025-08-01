#!/bin/bash

# Secret Generation Script for Article Monster
# This script generates secure secrets for production deployment

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Article Monster - Secret Generation Script${NC}"
echo "==========================================="
echo

# Function to generate random password
generate_password() {
    local length=${1:-32}
    openssl rand -base64 $length | tr -d "=+/" | cut -c1-$length
}

# Function to generate UUID
generate_uuid() {
    if command -v uuidgen &> /dev/null; then
        uuidgen | tr '[:upper:]' '[:lower:]'
    else
        cat /proc/sys/kernel/random/uuid
    fi
}

# Create secrets directory if it doesn't exist
mkdir -p secrets

echo -e "${YELLOW}Generating secrets...${NC}"

# Generate database password
DB_PASSWORD=$(generate_password 24)
echo "$DB_PASSWORD" > secrets/postgres_password.txt
echo "✓ Generated PostgreSQL password"

# Generate application secret key
SECRET_KEY=$(generate_password 48)
echo "$SECRET_KEY" > secrets/secret_key.txt
echo "✓ Generated application secret key"

# Generate Grafana admin password
GRAFANA_PASSWORD=$(generate_password 16)
echo "$GRAFANA_PASSWORD" > secrets/grafana_password.txt
echo "✓ Generated Grafana admin password"

# Generate Flower credentials
FLOWER_PASSWORD=$(generate_password 16)
echo "admin" > secrets/flower_user.txt
echo "$FLOWER_PASSWORD" > secrets/flower_password.txt
echo "✓ Generated Flower monitoring credentials"

# Generate session key for Redis
SESSION_KEY=$(generate_password 32)
echo "$SESSION_KEY" > secrets/session_key.txt
echo "✓ Generated session key"

# Generate API keys
API_KEY=$(generate_uuid)
echo "$API_KEY" > secrets/api_key.txt
echo "✓ Generated API key"

# Generate JWT signing key
JWT_SECRET=$(generate_password 64)
echo "$JWT_SECRET" > secrets/jwt_secret.txt
echo "✓ Generated JWT signing key"

# Set proper permissions on secrets
chmod 600 secrets/*
echo "✓ Set secure permissions on secret files"

echo
echo -e "${GREEN}Secrets generated successfully!${NC}"
echo
echo "Generated secrets:"
echo "=================="
echo "• PostgreSQL password: secrets/postgres_password.txt"
echo "• Application secret key: secrets/secret_key.txt"
echo "• Grafana admin password: secrets/grafana_password.txt"
echo "• Flower credentials: secrets/flower_user.txt, secrets/flower_password.txt"
echo "• Session key: secrets/session_key.txt"
echo "• API key: secrets/api_key.txt"
echo "• JWT secret: secrets/jwt_secret.txt"
echo
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Review the generated secrets"
echo "2. Update your .env.prod file with these values"
echo "3. Store secrets securely (consider using a password manager)"
echo "4. Never commit these secret files to version control"
echo
echo -e "${RED}IMPORTANT SECURITY NOTES:${NC}"
echo "• Keep these secret files secure and never share them"
echo "• Add secrets/ directory to your .gitignore"
echo "• Consider using Docker secrets or Kubernetes secrets for production"
echo "• Rotate secrets regularly (every 90 days recommended)"
echo
echo "For Docker Swarm secrets:"
echo "========================"
echo "docker secret create postgres_password secrets/postgres_password.txt"
echo "docker secret create secret_key secrets/secret_key.txt"
echo "docker secret create grafana_password secrets/grafana_password.txt"
echo
echo "For Kubernetes secrets:"
echo "======================"
echo "kubectl create secret generic article-library-secrets \\"
echo "  --from-file=postgres-password=secrets/postgres_password.txt \\"
echo "  --from-file=secret-key=secrets/secret_key.txt \\"
echo "  --from-file=grafana-password=secrets/grafana_password.txt \\"
echo "  --from-file=flower-password=secrets/flower_password.txt \\"
echo "  --from-file=jwt-secret=secrets/jwt_secret.txt"