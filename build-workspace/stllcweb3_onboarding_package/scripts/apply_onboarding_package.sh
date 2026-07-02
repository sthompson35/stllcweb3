#!/usr/bin/env bash
set -euo pipefail
ROOT="${1:-.}"
PACKAGE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

mkdir -p "$ROOT/src" "$ROOT/supabase/migrations"
cp -R "$PACKAGE_DIR/src" "$ROOT/"
cp -R "$PACKAGE_DIR/supabase" "$ROOT/"
cp "$PACKAGE_DIR/ARCHITECT_IMPLEMENTATION_ORDER.md" "$ROOT/ARCHITECT_ONBOARDING_IMPLEMENTATION_ORDER.md"
cp "$PACKAGE_DIR/ARCHITECT_NEXT_COMMAND.md" "$ROOT/ARCHITECT_NEXT_COMMAND.md"

echo "Onboarding package applied to $ROOT"
echo "Next: supabase db push && npm run dev"
