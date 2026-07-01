# Rooms API Contract

## Validate Room Payload

All requests that create or update rooms must validate against:

`schema/room.schema.json`

## Endpoints

### GET /api/properties/{property_id}/rooms
Returns canonical room payload.

### POST /api/properties/{property_id}/rooms
Creates room records and dependent records.

### PATCH /api/properties/{property_id}/rooms/{room_id}
Updates one room.

### POST /api/properties/{property_id}/rooms/sync-blender
Triggers Blender worker using current canonical room JSON.

### POST /api/properties/{property_id}/rooms/apply-material-package
Applies a material package to matching room material fields.

## Contract Rule

API does not accept loose room names. Every payload must contain room_id and room_code.
