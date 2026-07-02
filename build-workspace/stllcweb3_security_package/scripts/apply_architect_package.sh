#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-.}"
PACKAGE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

mkdir -p "$ROOT/supabase/migrations" "$ROOT/supabase/seed" "$ROOT/src/lib" "$ROOT/src/config" "$ROOT/src/components" "$ROOT/src/components/wallet" "$ROOT/src/app/dashboard/contracts" "$ROOT/src/app/dashboard/agents" "$ROOT/deploy"

cp "$PACKAGE_DIR/supabase/migrations/001_web3_core_schema.sql" "$ROOT/supabase/migrations/001_web3_core_schema.sql"
cp "$PACKAGE_DIR/supabase/seed/001_contract_registry_seed.sql" "$ROOT/supabase/seed/001_contract_registry_seed.sql"
cp "$PACKAGE_DIR/src/lib/supabaseClient.ts" "$ROOT/src/lib/supabaseClient.ts"
cp "$PACKAGE_DIR/src/lib/walletAuth.ts" "$ROOT/src/lib/walletAuth.ts"
cp "$PACKAGE_DIR/src/config/agents.ts" "$ROOT/src/config/agents.ts"
cp "$PACKAGE_DIR/src/components/AgentPanel.tsx" "$ROOT/src/components/AgentPanel.tsx"
cp "$PACKAGE_DIR/src/components/ContractRegistry.tsx" "$ROOT/src/components/ContractRegistry.tsx"
cp "$PACKAGE_DIR/src/components/wallet/WalletConnectButtons.tsx" "$ROOT/src/components/wallet/WalletConnectButtons.tsx"
cp "$PACKAGE_DIR/src/app/dashboard/page.tsx" "$ROOT/src/app/dashboard/page.tsx"
cp "$PACKAGE_DIR/src/app/dashboard/contracts/page.tsx" "$ROOT/src/app/dashboard/contracts/page.tsx"
cp "$PACKAGE_DIR/src/app/dashboard/agents/page.tsx" "$ROOT/src/app/dashboard/agents/page.tsx"
cp "$PACKAGE_DIR/deploy/render.yaml" "$ROOT/deploy/render.yaml"
cp "$PACKAGE_DIR/deploy/railway.env.example" "$ROOT/deploy/railway.env.example"
cp "$PACKAGE_DIR/.env.example" "$ROOT/.env.example"
cp "$PACKAGE_DIR/ARCHITECT_IMPLEMENTATION_ORDER.md" "$ROOT/ARCHITECT_IMPLEMENTATION_ORDER.md"

echo "Architect package applied to $ROOT"
echo "Next: npm install @supabase/supabase-js && supabase db push && supabase db execute --file supabase/seed/001_contract_registry_seed.sql"
