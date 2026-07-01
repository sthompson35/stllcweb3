-- Dynasty PropertyOS Universal Land + Development Schema
-- PostgreSQL / Supabase migration

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS parcels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID,
    parcel_code TEXT UNIQUE NOT NULL,
    apn TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip TEXT,
    county TEXT,
    latitude NUMERIC,
    longitude NUMERIC,
    acreage NUMERIC,
    lot_sqft NUMERIC,
    frontage_ft NUMERIC,
    depth_ft NUMERIC,
    zoning_code TEXT,
    current_use TEXT,
    highest_best_use TEXT,
    flood_zone TEXT,
    topography TEXT,
    road_access TEXT,
    utilities_available JSONB DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'intake',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS development_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parcel_id UUID REFERENCES parcels(id) ON DELETE CASCADE,
    property_id UUID,
    project_code TEXT UNIQUE NOT NULL,
    project_name TEXT NOT NULL,
    project_type TEXT NOT NULL,
    strategy TEXT,
    intended_use TEXT,
    residential_units INT DEFAULT 0,
    commercial_sqft NUMERIC DEFAULT 0,
    building_count INT DEFAULT 0,
    total_building_sqft NUMERIC DEFAULT 0,
    target_arv NUMERIC,
    target_rent NUMERIC,
    target_noi NUMERIC,
    status TEXT DEFAULT 'concept',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS site_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES development_projects(id) ON DELETE CASCADE,
    zone_name TEXT NOT NULL,
    zone_type TEXT NOT NULL,
    area_sqft NUMERIC,
    surface_material TEXT,
    blender_collection_name TEXT,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS site_improvements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES development_projects(id) ON DELETE CASCADE,
    zone_id UUID REFERENCES site_zones(id),
    improvement_type TEXT NOT NULL,
    improvement_name TEXT,
    quantity NUMERIC DEFAULT 1,
    unit TEXT,
    material_id UUID,
    estimated_material_cost NUMERIC DEFAULT 0,
    estimated_labor_cost NUMERIC DEFAULT 0,
    total_estimated_cost NUMERIC DEFAULT 0,
    blender_asset_name TEXT,
    status TEXT DEFAULT 'planned'
);

CREATE TABLE IF NOT EXISTS utility_systems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES development_projects(id) ON DELETE CASCADE,
    utility_type TEXT NOT NULL,
    provider TEXT,
    connection_status TEXT DEFAULT 'unknown',
    distance_to_connection_ft NUMERIC,
    estimated_connection_cost NUMERIC,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS structures_universal (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES development_projects(id) ON DELETE CASCADE,
    structure_code TEXT NOT NULL,
    structure_type TEXT NOT NULL,
    occupancy_type TEXT,
    footprint_sqft NUMERIC,
    gross_sqft NUMERIC,
    stories NUMERIC DEFAULT 1,
    unit_count INT DEFAULT 0,
    beds NUMERIC,
    baths NUMERIC,
    construction_type TEXT,
    foundation_type TEXT,
    roof_type TEXT,
    status TEXT DEFAULT 'concept'
);

CREATE TABLE IF NOT EXISTS development_material_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_code TEXT UNIQUE NOT NULL,
    category_name TEXT NOT NULL,
    parent_category_code TEXT,
    applies_to TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS development_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_code TEXT REFERENCES development_material_categories(category_code),
    material_code TEXT UNIQUE NOT NULL,
    material_name TEXT NOT NULL,
    unit TEXT NOT NULL,
    cost_per_unit NUMERIC DEFAULT 0,
    labor_per_unit NUMERIC DEFAULT 0,
    lifespan_years NUMERIC,
    commercial_grade BOOLEAN DEFAULT false,
    residential_grade BOOLEAN DEFAULT true,
    land_grade BOOLEAN DEFAULT false,
    blender_material_name TEXT,
    texture_url TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS development_cost_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES development_projects(id) ON DELETE CASCADE,
    cost_model_name TEXT NOT NULL,
    sitework_cost NUMERIC DEFAULT 0,
    utility_cost NUMERIC DEFAULT 0,
    foundation_cost NUMERIC DEFAULT 0,
    vertical_construction_cost NUMERIC DEFAULT 0,
    soft_costs NUMERIC DEFAULT 0,
    contingency NUMERIC DEFAULT 0,
    financing_costs NUMERIC DEFAULT 0,
    total_project_cost NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);
