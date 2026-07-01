# Dynasty PropertyOS Room Data Dictionary

PROPERTY_ID: USDA_1BEDROOM_001  
Artifact: Room Data Dictionary  
Version: 1.0.0  
Status: Engineering Contract / Source of Truth  
Purpose: Standardize room, component, material, system, cost, and Blender mapping data across Supabase, API endpoints, Blender Python scripts, reports, accounting, lender packets, appraiser workflows, and property management tools.

---

## 1. Core Rule

Every room in Dynasty PropertyOS must have one canonical record. That room record drives:

- Supabase `rooms` table
- Blender room generation
- Wall, floor, ceiling, roof, and opening placement
- Material selection
- Cost estimation
- Contractor scopes
- Investor analysis
- Accounting job costing
- Appraisal support
- Property Passport metadata

No duplicate naming. No mystery rooms. No contractor chaos. Chaos is expensive.

---

## 2. Required Room Identity Fields

| Field | Type | Required | Description | Example |
|---|---:|---:|---|---|
| property_id | string | yes | Master property identifier | USDA_1BEDROOM_001 |
| room_id | string | yes | Canonical room identifier | ROOM_001 |
| room_code | string | yes | Human-readable stable room code | LIVING_001 |
| room_name | string | yes | Display name | Living Room |
| room_type | string | yes | Functional type | living_room |
| floor_level | string | yes | Building level | level_1 |
| status | string | yes | planned, active, demo, future, optional | active |
| source_plan_reference | string | no | Page or plan note reference | PDF page 1 floor plan |

---

## 3. Geometry Fields

| Field | Type | Required | Description | Unit |
|---|---:|---:|---|---|
| origin_x | number | yes | Blender/global X origin | feet |
| origin_y | number | yes | Blender/global Y origin | feet |
| origin_z | number | yes | Blender/global Z origin | feet |
| width | number | yes | Room width | feet |
| length | number | yes | Room length | feet |
| height | number | yes | Wall height | feet |
| area_sqft | number | yes | Calculated or verified area | sqft |
| perimeter_lf | number | yes | Wall perimeter | linear feet |
| ceiling_area_sqft | number | yes | Ceiling area | sqft |
| floor_area_sqft | number | yes | Floor area | sqft |

Rule: Blender uses feet in metadata and converts to meters internally if needed.

---

## 4. Envelope Fields

| Field | Type | Required | Description |
|---|---:|---:|---|
| wall_type | string | yes | interior, exterior, load_bearing, partition |
| floor_type | string | yes | slab, subfloor, basement_slab, crawlspace_floor |
| ceiling_type | string | yes | flat, vaulted, open_to_roof |
| exterior_exposure | boolean | yes | Whether room touches exterior wall |
| conditioned_space | boolean | yes | Whether room is HVAC-conditioned |

---

## 5. Opening Fields

Each room may contain doors, windows, pass-throughs, and mechanical openings.

Door object fields:

| Field | Type | Required | Example |
|---|---:|---:|---|
| door_id | string | yes | DR001 |
| door_type | string | yes | entry, interior, closet, mechanical |
| width | number | yes | 3.0 |
| height | number | yes | 6.67 |
| wall | string | yes | north |
| offset_from_corner | number | yes | 2.0 |
| swing_direction | string | no | left_in |
| material_package | string | no | solid_core |

Window object fields:

| Field | Type | Required | Example |
|---|---:|---:|---|
| window_id | string | yes | WN001 |
| window_type | string | yes | double_hung |
| width | number | yes | 3.0 |
| height | number | yes | 4.0 |
| sill_height | number | yes | 3.0 |
| wall | string | yes | east |
| offset_from_corner | number | yes | 4.0 |
| material_package | string | no | vinyl_standard |

---

## 6. Material Assignment Fields

Each room must reference material IDs, not raw material names.

| Field | Type | Required | Description | Example |
|---|---:|---:|---|---|
| floor_material_id | string | yes | Floor material key | MAT_FLOOR_LVP_STANDARD |
| wall_material_id | string | yes | Wall material key | MAT_WALL_PAINT_WHITE |
| ceiling_material_id | string | yes | Ceiling material key | MAT_CEILING_FLAT_WHITE |
| trim_material_id | string | no | Baseboard/casing material | MAT_TRIM_WHITE_MDF |
| countertop_material_id | string | no | Kitchen/bath counter material | MAT_COUNTER_LAMINATE |
| cabinet_material_id | string | no | Cabinet material | MAT_CABINET_SHAKER_WHITE |

---

## 7. MEP Mapping Fields

MEP = Mechanical, Electrical, Plumbing.

| Field | Type | Required | Description |
|---|---:|---:|---|
| electrical_zone_id | string | no | Electrical circuit/zone reference |
| plumbing_zone_id | string | no | Plumbing fixture/line reference |
| hvac_zone_id | string | no | HVAC zone reference |
| has_water | boolean | yes | True for kitchen/bath/utility |
| has_gas | boolean | yes | True if gas line required |
| has_exhaust | boolean | yes | True for bath/kitchen/mechanical exhaust |
| required_outlets | integer | no | Estimated outlet count |
| required_lights | integer | no | Estimated fixture count |

---

## 8. Cost Mapping Fields

| Field | Type | Required | Description |
|---|---:|---:|---|
| cost_code | string | yes | Primary cost category |
| labor_complexity | string | yes | low, standard, complex, specialty |
| finish_level | string | yes | builder, rental, flip, luxury, ultra_luxury |
| estimated_material_cost | number | yes | Material cost estimate |
| estimated_labor_cost | number | yes | Labor cost estimate |
| estimated_total_cost | number | yes | Total cost estimate |
| accounting_job_code | string | yes | AccountingOS job code |

---

## 9. Blender Mapping Fields

| Field | Type | Required | Description | Example |
|---|---:|---:|---|---|
| blender_collection | string | yes | Blender collection name | USDA001_LEVEL1_LIVING |
| blender_object_prefix | string | yes | Object naming prefix | USDA001_LIVING |
| generate_floor | boolean | yes | Create floor mesh | true |
| generate_walls | boolean | yes | Create wall meshes | true |
| generate_ceiling | boolean | yes | Create ceiling mesh | true |
| generate_openings | boolean | yes | Add doors/windows | true |
| default_camera_target | boolean | no | Use as walkthrough camera target | false |

Object naming pattern:

`{PROPERTY_SHORT}_{ROOM_CODE}_{COMPONENT}_{VARIANT}`

Example:

`USDA001_LIVING_001_FLOOR_A`

---

## 10. Canonical Room Schedule: USDA_1BEDROOM_001

| Room ID | Room Code | Room Name | Type | Level | Status |
|---|---|---|---|---|---|
| ROOM_001 | LIVING_001 | Living Room | living_room | level_1 | active |
| ROOM_002 | KITCHEN_001 | Kitchen | kitchen | level_1 | active |
| ROOM_003 | DINING_001 | Dining Area | dining | level_1 | active |
| ROOM_004 | BEDROOM_001 | Bedroom | bedroom | level_1 | active |
| ROOM_005 | BATH_001 | Bathroom | bathroom | level_1 | active |
| ROOM_006 | UTILITY_001 | Utility Area | utility | level_1 | active |
| ROOM_007 | HALL_001 | Hallway | hallway | level_1 | active |
| ROOM_008 | BASEMENT_001 | Optional Basement | basement | basement | optional |
| ROOM_009 | FUTURE_BED_001 | Future Bedroom Expansion | bedroom | level_1 | future |

---

## 11. API Contract

Primary endpoints:

- `GET /api/properties/{property_id}/rooms`
- `GET /api/properties/{property_id}/rooms/{room_id}`
- `POST /api/properties/{property_id}/rooms`
- `PATCH /api/properties/{property_id}/rooms/{room_id}`
- `POST /api/properties/{property_id}/rooms/sync-blender`
- `POST /api/properties/{property_id}/rooms/apply-material-package`

API must validate payloads against `room.schema.json` before writing to database or triggering Blender workers.

---

## 12. Supabase Alignment

Recommended tables using this schema:

- `properties`
- `rooms`
- `room_openings`
- `room_material_assignments`
- `room_mep_zones`
- `room_cost_mappings`
- `room_blender_mappings`

---

## 13. Blender Script Alignment

Blender scripts must read:

`/samples/USDA_1BEDROOM_001.rooms.json`

Then generate:

- Floors
- Walls
- Ceilings
- Door/window opening placeholders
- Material slots
- Collections
- Object names
- GLB exports

---

## 14. Final Engineering Rule

The JSON record is the source of truth. Blender is the visual result. Supabase is the database result. Reports are the business result.

If they disagree, the JSON schema wins.
