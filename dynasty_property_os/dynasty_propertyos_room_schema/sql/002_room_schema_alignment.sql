-- Dynasty PropertyOS Room Schema Alignment Migration
-- Purpose: normalize room records so Supabase, API, Blender, cost engine, and AccountingOS share one contract.

CREATE TABLE IF NOT EXISTS rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id TEXT NOT NULL,
    room_id TEXT NOT NULL,
    room_code TEXT NOT NULL,
    room_name TEXT NOT NULL,
    room_type TEXT NOT NULL,
    floor_level TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'planned',
    source_plan_reference TEXT,
    origin_x NUMERIC NOT NULL DEFAULT 0,
    origin_y NUMERIC NOT NULL DEFAULT 0,
    origin_z NUMERIC NOT NULL DEFAULT 0,
    width NUMERIC NOT NULL,
    length NUMERIC NOT NULL,
    height NUMERIC NOT NULL,
    area_sqft NUMERIC NOT NULL DEFAULT 0,
    perimeter_lf NUMERIC NOT NULL DEFAULT 0,
    floor_area_sqft NUMERIC NOT NULL DEFAULT 0,
    ceiling_area_sqft NUMERIC NOT NULL DEFAULT 0,
    wall_type TEXT NOT NULL,
    floor_type TEXT NOT NULL,
    ceiling_type TEXT NOT NULL,
    exterior_exposure BOOLEAN NOT NULL DEFAULT false,
    conditioned_space BOOLEAN NOT NULL DEFAULT true,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(property_id, room_id),
    UNIQUE(property_id, room_code)
);

CREATE TABLE IF NOT EXISTS room_openings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id TEXT NOT NULL,
    room_id TEXT NOT NULL,
    opening_id TEXT NOT NULL,
    opening_kind TEXT NOT NULL CHECK (opening_kind IN ('door', 'window')),
    opening_type TEXT NOT NULL,
    width NUMERIC NOT NULL,
    height NUMERIC NOT NULL,
    sill_height NUMERIC,
    wall TEXT NOT NULL CHECK (wall IN ('north', 'south', 'east', 'west')),
    offset_from_corner NUMERIC NOT NULL DEFAULT 0,
    swing_direction TEXT,
    material_package TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(property_id, opening_id)
);

CREATE TABLE IF NOT EXISTS room_material_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id TEXT NOT NULL,
    room_id TEXT NOT NULL,
    floor_material_id TEXT NOT NULL,
    wall_material_id TEXT NOT NULL,
    ceiling_material_id TEXT NOT NULL,
    trim_material_id TEXT,
    countertop_material_id TEXT,
    cabinet_material_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(property_id, room_id)
);

CREATE TABLE IF NOT EXISTS room_mep_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id TEXT NOT NULL,
    room_id TEXT NOT NULL,
    electrical_zone_id TEXT,
    plumbing_zone_id TEXT,
    hvac_zone_id TEXT,
    has_water BOOLEAN NOT NULL DEFAULT false,
    has_gas BOOLEAN NOT NULL DEFAULT false,
    has_exhaust BOOLEAN NOT NULL DEFAULT false,
    required_outlets INTEGER DEFAULT 0,
    required_lights INTEGER DEFAULT 0,
    UNIQUE(property_id, room_id)
);

CREATE TABLE IF NOT EXISTS room_cost_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id TEXT NOT NULL,
    room_id TEXT NOT NULL,
    cost_code TEXT NOT NULL,
    labor_complexity TEXT NOT NULL,
    finish_level TEXT NOT NULL,
    estimated_material_cost NUMERIC NOT NULL DEFAULT 0,
    estimated_labor_cost NUMERIC NOT NULL DEFAULT 0,
    estimated_total_cost NUMERIC NOT NULL DEFAULT 0,
    accounting_job_code TEXT NOT NULL,
    UNIQUE(property_id, room_id)
);

CREATE TABLE IF NOT EXISTS room_blender_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id TEXT NOT NULL,
    room_id TEXT NOT NULL,
    blender_collection TEXT NOT NULL,
    blender_object_prefix TEXT NOT NULL,
    generate_floor BOOLEAN NOT NULL DEFAULT true,
    generate_walls BOOLEAN NOT NULL DEFAULT true,
    generate_ceiling BOOLEAN NOT NULL DEFAULT true,
    generate_openings BOOLEAN NOT NULL DEFAULT true,
    default_camera_target BOOLEAN DEFAULT false,
    UNIQUE(property_id, room_id)
);
