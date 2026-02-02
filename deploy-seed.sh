#!/bin/bash

# =============================================================================
# Convidera Career Universe - Deployment & Database Seed Script
# =============================================================================
#
# This script initializes the database schema and seeds role data.
# Run after Vercel deployment to populate the production database.
#
# Prerequisites:
#   - DATABASE_URL and DIRECT_URL must be set in .env
#   - pnpm must be installed
#
# Usage:
#   chmod +x deploy-seed.sh
#   ./deploy-seed.sh
#
# =============================================================================

set -e  # Exit on error

echo "=============================================="
echo "  Convidera Career Universe - Deploy & Seed"
echo "=============================================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "ERROR: .env file not found!"
    echo "Please create .env from .env.example and add your Supabase credentials."
    exit 1
fi

# Check if DATABASE_URL is set
if ! grep -q "DATABASE_URL=" .env || grep -q "DATABASE_URL=\"postgresql://postgres:password@localhost" .env; then
    echo "ERROR: DATABASE_URL is not configured or still using localhost!"
    echo "Please update .env with your Supabase connection string."
    exit 1
fi

echo "[1/4] Installing dependencies..."
pnpm install --frozen-lockfile 2>/dev/null || pnpm install

echo ""
echo "[2/4] Pushing Prisma schema to database..."
npx prisma db push --accept-data-loss
echo "✓ Schema pushed successfully"

echo ""
echo "[3/4] Generating Prisma client..."
npx prisma generate
echo "✓ Prisma client generated"

echo ""
echo "[4/4] Seeding database with role data..."

# Check if HTML files exist in data/roles
HTML_FILES=$(find ./data/roles -name "*.html" 2>/dev/null | head -1)
JSON_FILES=$(find ./data/roles -name "*.json" 2>/dev/null | head -1)

if [ -n "$HTML_FILES" ]; then
    echo "Found HTML role files, seeding from HTML..."
    npx tsx scripts/seed/seed.ts --html ./data/roles/*.html
elif [ -n "$JSON_FILES" ]; then
    echo "Found JSON role files, seeding from JSON..."
    npx tsx scripts/seed/seed-json-roles.ts
else
    echo "No role files found. Seeding only soft skills..."
    npx tsx scripts/seed/seed.ts
fi

echo "✓ Database seeded successfully"

echo ""
echo "=============================================="
echo "  Deployment Complete!"
echo "=============================================="
echo ""
echo "Your Career Universe database is ready."
echo ""
echo "Next steps:"
echo "  1. Verify data: npx prisma studio"
echo "  2. Test locally: pnpm dev"
echo "  3. Deploy to Vercel: git push origin main"
echo ""
