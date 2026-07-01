-- =============================================================
-- Dynasty PropertyOS — Seed Data: 502 Buckley, St. Louis MO
-- Shylow Thompson LLC | BRRR Strategy | Intake 2026-05-30
-- =============================================================

-- Fixed UUIDs for predictable cross-table references
-- org:      a0000000-0000-0000-0000-000000000001
-- user:     a0000000-0000-0000-0000-000000000002
-- property: a0000000-0000-0000-0000-000000000003
-- twin:     a0000000-0000-0000-0000-000000000004
-- floor_crawl: a0000000-0000-0000-0000-000000000005
-- floor_main:  a0000000-0000-0000-0000-000000000006
-- floor_future_bsmt: a0000000-0000-0000-0000-000000000007
-- rooms: a0000000-0000-0001-0000-000000000001 … 0006
-- rehab_project: a0000000-0000-0002-0000-000000000001
-- ledger: a0000000-0000-0003-0000-000000000001
-- deal_analysis: a0000000-0000-0004-0000-000000000001
-- network (polygon): a0000000-0000-0005-0000-000000000001

-- ============================================================
-- 1. ORGANIZATION
-- ============================================================
INSERT INTO organizations (id, name, legal_name, business_type, created_at, updated_at)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'Shylow Thompson LLC',
    'Shylow Thompson LLC',
    'LLC',
    now(), now()
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 2. USER
-- ============================================================
INSERT INTO app_users (id, organization_id, full_name, email, role, created_at, updated_at)
VALUES (
    'a0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'Shylow Thompson',
    'sdthompson35@gmail.com',
    'owner',
    now(), now()
) ON CONFLICT (id) DO NOTHING;

-- Set owner on org
UPDATE organizations
SET owner_user_id = 'a0000000-0000-0000-0000-000000000002'
WHERE id = 'a0000000-0000-0000-0000-000000000001';

-- ============================================================
-- 3. PROPERTY — 502 Buckley
-- ============================================================
INSERT INTO properties (
    id, organization_id, property_code,
    address, city, state, zip, county,
    property_type, year_built,
    sqft, beds, baths, lot_size,
    acquisition_price, estimated_arv, estimated_rent,
    status, metadata,
    created_at, updated_at
) VALUES (
    'a0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000001',
    'STLLC-502BUCKLEY',
    '502 Buckley Street',
    'St. Louis', 'MO', '63137', 'St. Louis City',
    'single_family', 1955,
    1050, 2, 1, 5000,
    114000.00, 200000.00, 1400.00,
    'active_rehab',
    '{
        "exit_strategy": "BRRR",
        "loan_type": "FHA",
        "objectives": ["fix_crawlspace", "fix_floors", "add_basement", "add_3rd_bedroom"],
        "rehab_budget": 90000,
        "target_beds": 3,
        "target_baths": 2,
        "target_sqft": 1400,
        "neighborhood": "Baden",
        "excel_sheet": "52_REHAB_ENGINE"
    }'::jsonb,
    now(), now()
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 4. DIGITAL TWIN STUB
-- ============================================================
INSERT INTO digital_twins (
    id, property_id, model_status, scale_unit,
    origin_x, origin_y, origin_z, metadata,
    created_at, updated_at
) VALUES (
    'a0000000-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000003',
    'draft', 'feet',
    0, 0, 0,
    '{"blender_version": "4.x", "source": "manual_intake"}'::jsonb,
    now(), now()
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 5. FLOORS
-- ============================================================
INSERT INTO floors (id, property_id, digital_twin_id, floor_name, floor_level, elevation, height, sort_order)
VALUES
    ('a0000000-0000-0000-0000-000000000005',
     'a0000000-0000-0000-0000-000000000003',
     'a0000000-0000-0000-0000-000000000004',
     'Crawlspace', 0, -3.0, 3.0, 0),
    ('a0000000-0000-0000-0000-000000000006',
     'a0000000-0000-0000-0000-000000000003',
     'a0000000-0000-0000-0000-000000000004',
     'Main Level', 1, 0.0, 8.0, 1),
    ('a0000000-0000-0000-0000-000000000007',
     'a0000000-0000-0000-0000-000000000003',
     'a0000000-0000-0000-0000-000000000004',
     'Future Basement', -1, -9.0, 8.0, 2)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 6. ROOMS (using 001 schema + 002 extended columns)
-- ============================================================
-- property_id = UUID, room_code / room_id = TEXT canonical refs
INSERT INTO rooms (
    id, property_id, digital_twin_id, floor_id,
    room_name, room_type,
    x, y, z, width, length, height, sqft,
    room_id, room_code, floor_level, status,
    area_sqft, perimeter_lf, floor_area_sqft, ceiling_area_sqft,
    wall_type, floor_type, ceiling_type,
    exterior_exposure, conditioned_space,
    notes, metadata
) VALUES
-- Living Room
(
    'a0000000-0000-0001-0000-000000000001',
    'a0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000006',
    'Living Room', 'living_room',
    0, 0, 0, 14, 16, 8, 224,
    'LR001', 'BUCKLEY-LR001', '1', 'active_rehab',
    224, 60, 224, 224,
    'drywall', 'lvp', 'drywall',
    true, true,
    'Front of house, needs new flooring and paint',
    '{"blender_collection": "502BUCKLEY_MAIN_LR001", "priority": "high"}'::jsonb
),
-- Kitchen
(
    'a0000000-0000-0001-0000-000000000002',
    'a0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000006',
    'Kitchen', 'kitchen',
    14, 0, 0, 12, 10, 8, 120,
    'KIT001', 'BUCKLEY-KIT001', '1', 'active_rehab',
    120, 44, 120, 120,
    'drywall', 'vinyl_tile', 'drywall',
    true, true,
    'Full gut — new cabinets, countertops, appliances',
    '{"blender_collection": "502BUCKLEY_MAIN_KIT001", "priority": "high"}'::jsonb
),
-- Primary Bedroom
(
    'a0000000-0000-0001-0000-000000000003',
    'a0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000006',
    'Primary Bedroom', 'bedroom',
    0, 16, 0, 12, 11, 8, 132,
    'BR001', 'BUCKLEY-BR001', '1', 'active_rehab',
    132, 46, 132, 132,
    'drywall', 'lvp', 'drywall',
    true, true,
    'Primary bedroom — new flooring, paint',
    '{"blender_collection": "502BUCKLEY_MAIN_BR001", "priority": "medium"}'::jsonb
),
-- Bedroom 2
(
    'a0000000-0000-0001-0000-000000000004',
    'a0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000006',
    'Bedroom 2', 'bedroom',
    12, 16, 0, 11, 10, 8, 110,
    'BR002', 'BUCKLEY-BR002', '1', 'active_rehab',
    110, 42, 110, 110,
    'drywall', 'lvp', 'drywall',
    true, true,
    'Secondary bedroom',
    '{"blender_collection": "502BUCKLEY_MAIN_BR002", "priority": "medium"}'::jsonb
),
-- Bathroom
(
    'a0000000-0000-0001-0000-000000000005',
    'a0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000006',
    'Bathroom', 'bathroom',
    23, 16, 0, 7, 8, 8, 56,
    'BA001', 'BUCKLEY-BA001', '1', 'active_rehab',
    56, 30, 56, 56,
    'cement_board', 'ceramic_tile', 'drywall',
    false, true,
    'Full bath — new tile, vanity, tub/shower combo',
    '{"blender_collection": "502BUCKLEY_MAIN_BA001", "priority": "high", "has_plumbing": true}'::jsonb
),
-- Utility / Laundry
(
    'a0000000-0000-0001-0000-000000000006',
    'a0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000006',
    'Utility / Laundry', 'utility',
    14, 10, 0, 8, 6, 8, 48,
    'UT001', 'BUCKLEY-UT001', '1', 'planned',
    48, 28, 48, 48,
    'drywall', 'concrete', 'drywall',
    false, true,
    'Utility room — washer/dryer hook-up',
    '{"blender_collection": "502BUCKLEY_MAIN_UT001", "priority": "low"}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 7. ROOM OPENINGS (soft TEXT refs via property_code + room_id)
-- ============================================================
INSERT INTO room_openings (property_id, room_id, opening_id, opening_kind, opening_type, width, height, sill_height, wall, offset_from_corner)
VALUES
    ('STLLC-502BUCKLEY','LR001','LR001-D01','door','exterior_wood',3,6.83,0,'west',1.5),
    ('STLLC-502BUCKLEY','LR001','LR001-W01','window','double_hung',3,4,2.5,'north',2),
    ('STLLC-502BUCKLEY','LR001','LR001-W02','window','double_hung',3,4,2.5,'west',5),
    ('STLLC-502BUCKLEY','KIT001','KIT001-W01','window','double_hung',2.5,3.5,3,'east',2),
    ('STLLC-502BUCKLEY','BR001','BR001-W01','window','double_hung',3,4,2.5,'north',1.5),
    ('STLLC-502BUCKLEY','BR001','BR001-D01','door','interior_hollow_core',2.83,6.83,0,'south',0.5),
    ('STLLC-502BUCKLEY','BR002','BR002-W01','window','double_hung',2.5,4,2.5,'north',1),
    ('STLLC-502BUCKLEY','BR002','BR002-D01','door','interior_hollow_core',2.83,6.83,0,'south',0.5),
    ('STLLC-502BUCKLEY','BA001','BA001-W01','window','casement',2,3,4,'east',2),
    ('STLLC-502BUCKLEY','BA001','BA001-D01','door','interior_hollow_core',2.5,6.83,0,'west',0.5)
ON CONFLICT (property_id, opening_id) DO NOTHING;

-- ============================================================
-- 8. ROOM MEP ZONES
-- ============================================================
INSERT INTO room_mep_zones (property_id, room_id, has_water, has_gas, has_exhaust, required_outlets, required_lights)
VALUES
    ('STLLC-502BUCKLEY','LR001',false,false,false,6,2),
    ('STLLC-502BUCKLEY','KIT001',true,true,true,8,4),
    ('STLLC-502BUCKLEY','BR001',false,false,false,4,2),
    ('STLLC-502BUCKLEY','BR002',false,false,false,4,2),
    ('STLLC-502BUCKLEY','BA001',true,false,true,2,2),
    ('STLLC-502BUCKLEY','UT001',true,true,true,4,2)
ON CONFLICT (property_id, room_id) DO NOTHING;

-- ============================================================
-- 9. ROOM MATERIAL ASSIGNMENTS
-- ============================================================
INSERT INTO room_material_assignments (property_id, room_id, floor_material_id, wall_material_id, ceiling_material_id, trim_material_id)
VALUES
    ('STLLC-502BUCKLEY','LR001','MAT-LVP-001','MAT-PAINT-WHITE','MAT-PAINT-WHITE','MAT-TRIM-WHITE'),
    ('STLLC-502BUCKLEY','KIT001','MAT-VT-001','MAT-PAINT-WHITE','MAT-PAINT-WHITE','MAT-TRIM-WHITE'),
    ('STLLC-502BUCKLEY','BR001','MAT-LVP-001','MAT-PAINT-WHITE','MAT-PAINT-WHITE','MAT-TRIM-WHITE'),
    ('STLLC-502BUCKLEY','BR002','MAT-LVP-001','MAT-PAINT-WHITE','MAT-PAINT-WHITE','MAT-TRIM-WHITE'),
    ('STLLC-502BUCKLEY','BA001','MAT-TILE-001','MAT-TILE-001','MAT-PAINT-WHITE',NULL),
    ('STLLC-502BUCKLEY','UT001','MAT-CONC-001','MAT-PAINT-WHITE','MAT-PAINT-WHITE',NULL)
ON CONFLICT (property_id, room_id) DO NOTHING;

-- ============================================================
-- 10. ROOM COST MAPPINGS
-- ============================================================
INSERT INTO room_cost_mappings (
    property_id, room_id, cost_code, labor_complexity, finish_level,
    estimated_material_cost, estimated_labor_cost, estimated_total_cost, accounting_job_code
) VALUES
    ('STLLC-502BUCKLEY','LR001','05-1010','standard','standard_plus',3920,2800,6720,'502BUCKLEY-LR001'),
    ('STLLC-502BUCKLEY','KIT001','06-1010','complex','premium',18000,12000,30000,'502BUCKLEY-KIT001'),
    ('STLLC-502BUCKLEY','BR001','05-1010','standard','standard_plus',2310,1650,3960,'502BUCKLEY-BR001'),
    ('STLLC-502BUCKLEY','BR002','05-1010','standard','standard_plus',1925,1375,3300,'502BUCKLEY-BR002'),
    ('STLLC-502BUCKLEY','BA001','09-3000','complex','premium',7840,6720,14560,'502BUCKLEY-BA001'),
    ('STLLC-502BUCKLEY','UT001','15-1010','standard','economy',960,640,1600,'502BUCKLEY-UT001')
ON CONFLICT (property_id, room_id) DO NOTHING;

-- ============================================================
-- 11. ROOM BLENDER MAPPINGS
-- ============================================================
INSERT INTO room_blender_mappings (
    property_id, room_id, blender_collection, blender_object_prefix,
    generate_floor, generate_walls, generate_ceiling, generate_openings, default_camera_target
) VALUES
    ('STLLC-502BUCKLEY','LR001','502BUCKLEY_MAIN','LR001_',true,true,true,true,true),
    ('STLLC-502BUCKLEY','KIT001','502BUCKLEY_MAIN','KIT001_',true,true,true,true,false),
    ('STLLC-502BUCKLEY','BR001','502BUCKLEY_MAIN','BR001_',true,true,true,true,false),
    ('STLLC-502BUCKLEY','BR002','502BUCKLEY_MAIN','BR002_',true,true,true,true,false),
    ('STLLC-502BUCKLEY','BA001','502BUCKLEY_MAIN','BA001_',true,true,true,true,false),
    ('STLLC-502BUCKLEY','UT001','502BUCKLEY_MAIN','UT001_',true,true,false,true,false)
ON CONFLICT (property_id, room_id) DO NOTHING;

-- ============================================================
-- 12. REHAB PROJECT
-- ============================================================
INSERT INTO rehab_projects (
    id, property_id, project_name, strategy,
    start_date, target_completion_date,
    status, total_budget, contingency_percent, metadata, created_at
) VALUES (
    'a0000000-0000-0002-0000-000000000001',
    'a0000000-0000-0000-0000-000000000003',
    '502 Buckley — Full Rehab + BRRR',
    'BRRR',
    '2026-06-01', '2026-10-01',
    'planning',
    90000.00, 10.00,
    '{"excel_reference": "52_REHAB_ENGINE", "health_score": "GREEN"}'::jsonb,
    now()
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 13. REHAB SCOPES (30 line items from Excel 52_REHAB_ENGINE)
-- ============================================================
INSERT INTO rehab_scopes (
    rehab_project_id, room_id, category, scope_item, description,
    priority, quantity, unit, material_cost, labor_cost, total_cost, status
) VALUES
-- DEMO
('a0000000-0000-0002-0000-000000000001', NULL,
 'Demo','Demolition & Haul Away','Full interior demo — remove old flooring, cabinets, fixtures, drywall patching',
 'high',1,'ls',500,2500,3000,'not_started'),

-- STRUCTURAL
('a0000000-0000-0002-0000-000000000001', NULL,
 'Structural','Crawlspace Repair','Pier reinforcement, moisture barrier, ventilation — primary rehab objective',
 'critical',1,'ls',4500,5500,10000,'not_started'),
('a0000000-0000-0002-0000-000000000001', NULL,
 'Structural','Foundation Inspection & Repair','Crack sealing, waterproofing, engineer report',
 'critical',1,'ls',2000,3000,5000,'not_started'),
('a0000000-0000-0002-0000-000000000001', NULL,
 'Structural','Subfloor Repair','Replace damaged subfloor sections — 200 sqft estimated',
 'high',200,'sqft',600,1200,1800,'not_started'),

-- FLOORING
('a0000000-0000-0002-0000-000000000001', 'a0000000-0000-0001-0000-000000000001',
 'Flooring','LVP Flooring — Living Room','Luxury vinyl plank 14x16',
 'high',224,'sqft',840,560,1400,'not_started'),
('a0000000-0000-0002-0000-000000000001', 'a0000000-0000-0001-0000-000000000003',
 'Flooring','LVP Flooring — Primary Bedroom','LVP 12x11',
 'medium',132,'sqft',495,330,825,'not_started'),
('a0000000-0000-0002-0000-000000000001', 'a0000000-0000-0001-0000-000000000004',
 'Flooring','LVP Flooring — Bedroom 2','LVP 11x10',
 'medium',110,'sqft',413,275,688,'not_started'),
('a0000000-0000-0002-0000-000000000001', 'a0000000-0000-0001-0000-000000000005',
 'Flooring','Ceramic Tile — Bathroom','Floor + surround tile 7x8',
 'high',56,'sqft',672,896,1568,'not_started'),

-- INTERIOR PAINT
('a0000000-0000-0002-0000-000000000001', NULL,
 'Interior Finishes','Interior Paint — Full House','All rooms, ceilings, trim — approx 1,050 sqft',
 'high',1050,'sqft',893,1838,2731,'not_started'),

-- KITCHEN
('a0000000-0000-0002-0000-000000000001', 'a0000000-0000-0001-0000-000000000002',
 'Kitchen','Kitchen Cabinets','Semi-custom shaker cabinets — uppers and lowers',
 'high',1,'ls',6000,3000,9000,'not_started'),
('a0000000-0000-0002-0000-000000000001', 'a0000000-0000-0001-0000-000000000002',
 'Kitchen','Kitchen Countertops','Quartz countertops ~25 lf',
 'high',25,'lf',2750,1250,4000,'not_started'),
('a0000000-0000-0002-0000-000000000001', 'a0000000-0000-0001-0000-000000000002',
 'Kitchen','Kitchen Appliances','Stove, refrigerator, dishwasher — builder grade',
 'high',1,'ls',3500,500,4000,'not_started'),
('a0000000-0000-0002-0000-000000000001', 'a0000000-0000-0001-0000-000000000002',
 'Kitchen','Kitchen Sink & Faucet','Stainless drop-in sink with faucet',
 'medium',1,'ea',350,350,700,'not_started'),

-- BATHROOM
('a0000000-0000-0002-0000-000000000001', 'a0000000-0000-0001-0000-000000000005',
 'Bathroom','Bathroom Vanity','30" single vanity with mirror and light bar',
 'high',1,'ea',650,350,1000,'not_started'),
('a0000000-0000-0002-0000-000000000001', 'a0000000-0000-0001-0000-000000000005',
 'Bathroom','Tub/Shower Combo','Alcove tub with tile surround',
 'high',1,'ea',1200,1800,3000,'not_started'),
('a0000000-0000-0002-0000-000000000001', 'a0000000-0000-0001-0000-000000000005',
 'Bathroom','Toilet','Elongated comfort height',
 'medium',1,'ea',275,225,500,'not_started'),

-- MEP
('a0000000-0000-0002-0000-000000000001', NULL,
 'HVAC','HVAC System Replacement','Central air + furnace — 2.5 ton',
 'critical',1,'ls',4800,2700,7500,'not_started'),
('a0000000-0000-0002-0000-000000000001', NULL,
 'Electrical','Electrical Panel Upgrade','100A → 200A service upgrade',
 'critical',1,'ls',1800,2700,4500,'not_started'),
('a0000000-0000-0002-0000-000000000001', NULL,
 'Electrical','Wiring Update','GFCI, smoke detectors, outlet update per code',
 'high',1,'ls',1200,1800,3000,'not_started'),
('a0000000-0000-0002-0000-000000000001', NULL,
 'Plumbing','Plumbing Update','Re-pipe kitchen & bath supply lines',
 'high',1,'ls',2000,3000,5000,'not_started'),
('a0000000-0000-0002-0000-000000000001', NULL,
 'Plumbing','Water Heater Replacement','40-gal electric',
 'high',1,'ea',650,350,1000,'not_started'),

-- EXTERIOR
('a0000000-0000-0002-0000-000000000001', NULL,
 'Exterior','Roof Inspection & Repair','Spot repairs / patch — full replacement if needed',
 'critical',1,'ls',1200,800,2000,'not_started'),
('a0000000-0000-0002-0000-000000000001', NULL,
 'Exterior','Gutters & Downspouts','New K-style gutters full perimeter',
 'medium',1,'ls',600,600,1200,'not_started'),
('a0000000-0000-0002-0000-000000000001', NULL,
 'Exterior','Exterior Paint / Siding Touch-Up','Scrape, prime, paint — spot vinyl repair',
 'medium',1,'ls',1200,1300,2500,'not_started'),

-- WINDOWS & DOORS
('a0000000-0000-0002-0000-000000000001', NULL,
 'Windows & Doors','Window Replacement','6 windows — double-pane vinyl',
 'high',6,'ea',2400,1800,4200,'not_started'),
('a0000000-0000-0002-0000-000000000001', NULL,
 'Windows & Doors','Interior Doors','4 hollow-core prehung doors with hardware',
 'medium',4,'ea',600,600,1200,'not_started'),
('a0000000-0000-0002-0000-000000000001', NULL,
 'Windows & Doors','Exterior Door Replacement','Front + rear steel doors with deadbolts',
 'high',2,'ea',900,700,1600,'not_started'),

-- INSULATION & DRYWALL
('a0000000-0000-0002-0000-000000000001', NULL,
 'Insulation & Drywall','Insulation','Attic blown-in insulation R-38',
 'medium',1,'ls',1500,1000,2500,'not_started'),
('a0000000-0000-0002-0000-000000000001', NULL,
 'Insulation & Drywall','Drywall Repair','Patch, tape, float, texture — approx 400 sqft',
 'medium',400,'sqft',480,720,1200,'not_started'),

-- FUTURE / ADDITION
('a0000000-0000-0002-0000-000000000001', 'a0000000-0000-0000-0000-000000000007',
 'Addition','Add 3rd Bedroom (Basement Conversion)','Convert basement footprint to legal bedroom — egress window, framing, drywall, flooring',
 'high',1,'ls',8000,7000,15000,'not_started'),

-- PERMITS & SOFT COSTS
('a0000000-0000-0002-0000-000000000001', NULL,
 'Soft Costs','Permits & Inspections','Building permit, electrical, plumbing, HVAC permits',
 'high',1,'ls',1500,0,1500,'not_started');

-- ============================================================
-- 14. COMPS (3 St. Louis comps supporting $200K ARV)
-- ============================================================
INSERT INTO comps (property_id, comp_address, sale_price, sale_date, sqft, beds, baths, distance_miles, adjustment_amount, adjusted_value, source)
VALUES
    ('a0000000-0000-0000-0000-000000000003',
     '498 Redfield Ave, St. Louis MO 63137',
     192000, '2025-11-15', 1080, 3, 1, 0.3, 8000, 200000, 'MLS'),
    ('a0000000-0000-0000-0000-000000000003',
     '612 Emerson Ave, St. Louis MO 63137',
     205000, '2025-09-20', 1150, 3, 2, 0.6, -5000, 200000, 'MLS'),
    ('a0000000-0000-0000-0000-000000000003',
     '543 Bircher Blvd, St. Louis MO 63137',
     198500, '2025-12-01', 1020, 3, 1, 0.8, 1500, 200000, 'MLS')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 15. DEAL ANALYSIS — BRRR
-- ============================================================
INSERT INTO deal_analyses (
    id, property_id, analysis_name, strategy,
    purchase_price, closing_costs, repair_budget,
    holding_costs, selling_costs, arv,
    estimated_rent, monthly_expenses,
    loan_amount, interest_rate, loan_term_years, down_payment,
    metadata, created_at
) VALUES (
    'a0000000-0000-0004-0000-000000000001',
    'a0000000-0000-0000-0000-000000000003',
    '502 Buckley BRRR Analysis v1',
    'brrrr',
    114000.00, 4000.00, 90000.00,
    9000.00, 0.00, 200000.00,
    1400.00, 350.00,
    150000.00, 7.00, 30, 14000.00,
    '{
        "refi_ltv": 0.75,
        "refi_amount": 150000,
        "total_cash_in": 204000,
        "cash_returned_at_refi": 150000,
        "cash_left_in_deal": 54000,
        "target_coc_return": 0.132,
        "notes": "FHA acquisition, conventional refi after seasoning"
    }'::jsonb,
    now()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO deal_outputs (
    deal_analysis_id,
    max_allowable_offer, wholesale_fee, flip_profit, flip_roi,
    cash_on_cash_return, cap_rate, dscr,
    refinance_value, equity_created, monthly_cashflow,
    decision, risk_score, created_at
) VALUES (
    'a0000000-0000-0004-0000-000000000001',
    50000.00, 0.00, 0.00, 0.00,
    13.20, 6.17, 1.40,
    150000.00, 86000.00, 595.00,
    'EXECUTE — Strong BRRR Candidate',
    3.2,
    now()
) ON CONFLICT DO NOTHING;

-- ============================================================
-- 16. CHART OF ACCOUNTS (key accounts for 502 Buckley ops)
-- ============================================================
INSERT INTO chart_of_accounts (id, organization_id, account_code, account_name, account_type)
VALUES
-- ASSETS
(gen_random_uuid(),'a0000000-0000-0000-0000-000000000001','1000','Checking Account — Operating','asset'),
(gen_random_uuid(),'a0000000-0000-0000-0000-000000000001','1010','Checking Account — Reserves','asset'),
(gen_random_uuid(),'a0000000-0000-0000-0000-000000000001','1020','Checking Account — Rehab','asset'),
(gen_random_uuid(),'a0000000-0000-0000-0000-000000000001','1100','Accounts Receivable','asset'),
(gen_random_uuid(),'a0000000-0000-0000-0000-000000000001','1200','Prepaid Expenses','asset'),
(gen_random_uuid(),'a0000000-0000-0000-0000-000000000001','1500','Real Estate — 502 Buckley (Land)','asset'),
(gen_random_uuid(),'a0000000-0000-0000-0000-000000000001','1501','Real Estate — 502 Buckley (Improvements)','asset'),
(gen_random_uuid(),'a0000000-0000-0000-0000-000000000001','1600','Rehab Work in Progress — 502 Buckley','asset'),
(gen_random_uuid(),'a0000000-0000-0000-0000-000000000001','1700','Security Deposits Held','asset'),
-- LIABILITIES
(gen_random_uuid(),'a0000000-0000-0000-0000-000000000001','2000','Accounts Payable','liability'),
(gen_random_uuid(),'a0000000-0000-0000-0000-000000000001','2100','Accrued Expenses','liability'),
(gen_random_uuid(),'a0000000-0000-0000-0000-000000000001','2200','Mortgage — 502 Buckley','liability'),
(gen_random_uuid(),'a0000000-0000-0000-0000-000000000001','2300','Rehab Line of Credit','liability'),
(gen_random_uuid(),'a0000000-0000-0000-0000-000000000001','2400','Security Deposits Payable','liability'),
-- EQUITY
(gen_random_uuid(),'a0000000-0000-0000-0000-000000000001','3000','Member Capital — Shylow Thompson','equity'),
(gen_random_uuid(),'a0000000-0000-0000-0000-000000000001','3100','Retained Earnings','equity'),
(gen_random_uuid(),'a0000000-0000-0000-0000-000000000001','3200','Owner Draw','equity'),
-- REVENUE
(gen_random_uuid(),'a0000000-0000-0000-0000-000000000001','4000','Rental Income — 502 Buckley','revenue'),
(gen_random_uuid(),'a0000000-0000-0000-0000-000000000001','4100','Late Fees','revenue'),
(gen_random_uuid(),'a0000000-0000-0000-0000-000000000001','4200','Disposition Proceeds','revenue'),
-- COGS
(gen_random_uuid(),'a0000000-0000-0000-0000-000000000001','5000','Rehab Materials — 502 Buckley','cogs'),
(gen_random_uuid(),'a0000000-0000-0000-0000-000000000001','5010','Rehab Labor — 502 Buckley','cogs'),
(gen_random_uuid(),'a0000000-0000-0000-0000-000000000001','5020','Permits & Inspections','cogs'),
-- OPERATING EXPENSES
(gen_random_uuid(),'a0000000-0000-0000-0000-000000000001','6000','Mortgage Interest — 502 Buckley','expense'),
(gen_random_uuid(),'a0000000-0000-0000-0000-000000000001','6010','Property Taxes — 502 Buckley','expense'),
(gen_random_uuid(),'a0000000-0000-0000-0000-000000000001','6020','Property Insurance','expense'),
(gen_random_uuid(),'a0000000-0000-0000-0000-000000000001','6030','Utilities — Rehab Period','expense'),
(gen_random_uuid(),'a0000000-0000-0000-0000-000000000001','6040','Property Management Fees','expense'),
(gen_random_uuid(),'a0000000-0000-0000-0000-000000000001','6050','Maintenance & Repairs','expense'),
(gen_random_uuid(),'a0000000-0000-0000-0000-000000000001','6060','Landscaping','expense'),
(gen_random_uuid(),'a0000000-0000-0000-0000-000000000001','6070','Accounting & Legal','expense'),
(gen_random_uuid(),'a0000000-0000-0000-0000-000000000001','6080','Software & Technology','expense'),
(gen_random_uuid(),'a0000000-0000-0000-0000-000000000001','6090','Auto & Travel','expense'),
(gen_random_uuid(),'a0000000-0000-0000-0000-000000000001','6100','Marketing & Advertising','expense'),
(gen_random_uuid(),'a0000000-0000-0000-0000-000000000001','6500','Depreciation Expense','expense'),
(gen_random_uuid(),'a0000000-0000-0000-0000-000000000001','6990','Miscellaneous Expense','expense')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 17. PROPERTY LEDGER
-- ============================================================
INSERT INTO property_ledgers (id, property_id, ledger_name, fiscal_year, status)
VALUES (
    'a0000000-0000-0003-0000-000000000001',
    'a0000000-0000-0000-0000-000000000003',
    '502 Buckley Operating Ledger',
    2026, 'active'
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 18. INITIAL TRANSACTIONS (acquisition + opening entries)
-- ============================================================
-- Acquisition purchase price
INSERT INTO transactions (
    organization_id, property_id, ledger_id,
    transaction_date, vendor, description,
    debit, credit, category
)
SELECT
    'a0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0003-0000-000000000001',
    '2026-05-30', 'Title Company',
    description, debit, credit, category
FROM (VALUES
    ('Real Estate Acquisition — 502 Buckley (Land)', 22800.00, 0, '1500'),
    ('Real Estate Acquisition — 502 Buckley (Improvements)', 91200.00, 0, '1501'),
    ('Mortgage — 502 Buckley (FHA)', 0, 108300.00, '2200'),
    ('Member Capital Contribution — Down Payment + Closing', 0, 9700.00, '3000'),
    ('Closing Costs Paid', 4000.00, 0, '6070'),
    ('Closing Costs Funded by Capital', 0, 4000.00, '3000'),
    ('Rehab Reserves Transferred', 90000.00, 0, '1600'),
    ('Rehab Line of Credit Draw', 0, 90000.00, '2300')
) AS t(description, debit, credit, category);

-- ============================================================
-- 19. BLOCKCHAIN / WEB3 PROPERTY PASSPORT
-- ============================================================
INSERT INTO blockchain_networks (id, network_name, chain_id, rpc_url, explorer_url, native_currency)
VALUES (
    'a0000000-0000-0005-0000-000000000001',
    'Polygon Mainnet', '137',
    'https://polygon-rpc.com',
    'https://polygonscan.com',
    'MATIC'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO property_passports (
    property_id, passport_name,
    token_contract_address, token_id,
    network_id, mint_status
) VALUES (
    'a0000000-0000-0000-0000-000000000003',
    '502 Buckley Property Passport',
    '0x14C77...', NULL,
    'a0000000-0000-0005-0000-000000000001',
    'not_minted'
) ON CONFLICT DO NOTHING;

-- ============================================================
-- 20. PARCEL (land development schema)
-- ============================================================
INSERT INTO parcels (
    organization_id, parcel_code, apn,
    address, city, state, zip, county,
    acreage, lot_sqft, frontage_ft, depth_ft,
    zoning_code, current_use, highest_best_use,
    utilities_available, status
) VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'PCL-502BUCKLEY', '5145-00-0502-0',
    '502 Buckley Street',
    'St. Louis', 'MO', '63137', 'St. Louis City',
    0.1148, 5000, 40, 125,
    'R-2', 'residential_vacant_rehab', 'single_family_rental',
    '{"electric": true, "gas": true, "water": true, "sewer": true, "cable": true}'::jsonb,
    'intake'
) ON CONFLICT (parcel_code) DO NOTHING;

-- ============================================================
-- 21. AI AGENTS
-- ============================================================
INSERT INTO ai_agents (organization_id, agent_name, agent_role, model_name, status)
VALUES
    ('a0000000-0000-0000-0000-000000000001',
     'DynastyAnalyst', 'deal_analyzer',
     'claude-3-5-sonnet', 'active'),
    ('a0000000-0000-0000-0000-000000000001',
     'RehabCoach', 'rehab_scope_advisor',
     'claude-3-5-sonnet', 'active'),
    ('a0000000-0000-0000-0000-000000000001',
     'CashflowOracle', 'forecasting',
     'claude-3-5-sonnet', 'active')
ON CONFLICT DO NOTHING;

-- ============================================================
-- VERIFICATION QUERIES (commented out — uncomment in Studio)
-- ============================================================
-- SELECT * FROM organizations;
-- SELECT * FROM properties WHERE property_code = 'STLLC-502BUCKLEY';
-- SELECT count(*) FROM rehab_scopes;  -- expect 30
-- SELECT count(*) FROM chart_of_accounts;  -- expect 36
-- SELECT count(*) FROM rooms;  -- expect 6
-- SELECT sum(total_cost) FROM rehab_scopes;  -- expect ~81,271 pre-contingency
