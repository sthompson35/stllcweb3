# Dynasty PropertyOS — VS Code Starter Repo

Blender-powered real estate digital twin platform for contractors, investors, lenders, appraisers, property managers, accounting, and Web3 property-passport workflows.

## Open in VS Code

1. Unzip this folder.
2. Open VS Code.
3. File → Open Folder → select `dynasty_property_os_vscode`.
4. Review `.vscode/tasks.json` for runnable commands.

## What is included

- Supabase/PostgreSQL schema migration
- Seed data for the USDA 1-bedroom prototype
- Blender Python starter scripts
- Material swap engine using JSON/database-style records
- GLB export script
- Backend API scaffold
- Frontend/Three.js viewer scaffold
- AI agent folder structure
- AccountingOS folder structure
- Blockchain/NFT property passport folder structure

## First test: Blender script

From Blender:

1. Open Blender.
2. Go to Scripting.
3. Open `blender/scripts/propertyos_blender_starter.py`.
4. Run script.

Expected result: a simple digital twin shell with rooms, walls, floor slabs, roof planes, and material placeholders.

## Supabase setup

Run the SQL file:

```bash
supabase db reset
```

Or paste `database/migrations/001_dynasty_propertyos_schema.sql` into Supabase SQL Editor.

## Main files

```text
backend/app/main.py
frontend/app/page.tsx
blender/scripts/propertyos_blender_starter.py
blender/scripts/material_swap_from_db_export.py
blender/scripts/export_glb.py
database/migrations/001_dynasty_propertyos_schema.sql
database/seeds/seed_usda_1bedroom.sql
projects/USDA_1BEDROOM_PROTOTYPE/costs/sample_property.json
```

## Structure and Enhancement Check

Run this from Windows Command Prompt to verify the enhanced investor flow and frontend build:

```bat
scripts\verify_all.bat
```

Run this from PowerShell for the same checks:

```powershell
./scripts/verify_all.ps1
```

This runs:
- Frontend type/lint check
- Frontend production build
- Backend investor flow unit tests

## Security Audit Policy

See `docs/SECURITY_AUDIT_POLICY.md` for the current accepted residual advisory, rationale, and auto-remediation trigger conditions.
