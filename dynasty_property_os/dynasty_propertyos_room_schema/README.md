# Dynasty PropertyOS Room Schema Pack

This pack contains the engineering artifact that synchronizes room data across:

- Supabase
- Blender Python scripts
- API endpoints
- cost engine
- AccountingOS
- contractor scopes
- lender/appraiser/property manager workflows

## Files

- `docs/ROOM_DATA_DICTIONARY_USDA_1BEDROOM_001.md`
- `schema/room.schema.json`
- `samples/USDA_1BEDROOM_001.rooms.json`
- `sql/002_room_schema_alignment.sql`
- `blender/generate_rooms_from_schema.py`
- `api/rooms_contract.md`

## Recommended placement

Copy these folders into:

`C:\dynasty_property_os\`

## Blender usage

Open Blender, run:

`blender/generate_rooms_from_schema.py`

It will read the sample room JSON and create floors, walls, ceilings, and opening markers.

## Important

The sample room dimensions are prototype placeholders. Replace with exact CAD/field measurements before construction, bidding, or lending use.
