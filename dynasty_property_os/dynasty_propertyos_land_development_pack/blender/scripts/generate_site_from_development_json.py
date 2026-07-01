"""
Dynasty PropertyOS - Universal Site + Structure Generator for Blender
Run inside Blender Python. Reads a development JSON and creates:
- raw parcel plane
- build pads
- driveways / parking / landscape / stormwater zones
- placeholder structures for residential or commercial buildings
- basic materials assigned by zone type
"""
import bpy, json, math
from pathlib import Path

INPUT_JSON = Path(__file__).resolve().parents[2] / "samples" / "raw_land_infill_sample.json"
SCALE = 1.0  # 1 Blender unit = 1 foot

def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()

def mat(name, color):
    material = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    material.diffuse_color = color
    return material

MATS = {
    "parcel": mat("MAT_raw_land_base", (0.32, 0.45, 0.22, 1)),
    "BUILD_PAD": mat("MAT_compacted_pad", (0.45, 0.42, 0.36, 1)),
    "DRIVEWAY": mat("MAT_concrete_drive", (0.55, 0.55, 0.52, 1)),
    "PARKING": mat("MAT_asphalt_parking", (0.08, 0.08, 0.08, 1)),
    "LANDSCAPE": mat("MAT_lawn_landscape", (0.10, 0.48, 0.12, 1)),
    "STORMWATER": mat("MAT_gravel_swale", (0.36, 0.36, 0.34, 1)),
    "STRUCTURE": mat("MAT_structure_placeholder", (0.75, 0.72, 0.66, 1)),
    "ROOF": mat("MAT_roof_placeholder", (0.18, 0.18, 0.18, 1))
}

def add_plane(name, width, depth, x=0, y=0, material=None):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, y, 0))
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = (width, depth, 0.08)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if material:
        obj.data.materials.append(material)
    return obj

def add_box(name, width, depth, height, x=0, y=0, z=None, material=None):
    if z is None:
        z = height / 2
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, y, z))
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = (width, depth, height)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if material:
        obj.data.materials.append(material)
    return obj

def add_gable_roof(name, width, depth, x=0, y=0, wall_height=10, roof_height=4):
    mesh = bpy.data.meshes.new(name + "Mesh")
    verts = [
        (-width/2, -depth/2, wall_height), (width/2, -depth/2, wall_height), (0, -depth/2, wall_height+roof_height),
        (-width/2, depth/2, wall_height), (width/2, depth/2, wall_height), (0, depth/2, wall_height+roof_height)
    ]
    faces = [(0,1,2), (3,5,4), (0,3,4,1), (0,2,5,3), (1,4,5,2)]
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.location = (x, y, 0)
    obj.data.materials.append(MATS["ROOF"])
    return obj

def square_dims(area):
    side = math.sqrt(area)
    return side, side

def build(data):
    parcel = data["parcel"]
    project = data["project"]
    lot_sqft = parcel.get("lot_sqft") or parcel.get("acreage", 0) * 43560
    parcel_w, parcel_d = square_dims(lot_sqft)
    add_plane(f"{parcel['parcel_code']}_PARCEL_BASE", parcel_w, parcel_d, material=MATS["parcel"])

    cursor_x = -parcel_w/4
    cursor_y = parcel_d/4
    for zone in data.get("site_zones", []):
        w, d = square_dims(zone["area_sqft"])
        ztype = zone["zone_type"]
        add_plane(f"{project['project_code']}_{ztype}_{zone['zone_name'].replace(' ', '_')}", w, d, cursor_x, cursor_y, MATS.get(ztype, MATS["parcel"]))
        cursor_y -= d + 12

    struct_x = 0
    struct_y = 0
    for structure in data.get("structures", []):
        footprint = structure.get("footprint_sqft", 1000)
        w, d = square_dims(footprint)
        stories = structure.get("stories", 1)
        height = 10 * stories
        add_box(f"{structure['structure_code']}_{structure['structure_type']}_MASSING", w, d, height, struct_x, struct_y, material=MATS["STRUCTURE"])
        if structure.get("roof_type", "flat") == "gable":
            add_gable_roof(f"{structure['structure_code']}_GABLE_ROOF", w + 2, d + 2, struct_x, struct_y, height, 4)
        else:
            add_box(f"{structure['structure_code']}_FLAT_ROOF", w+2, d+2, 1, struct_x, struct_y, z=height+0.5, material=MATS["ROOF"])
        struct_x += w + 30

    camera_data = bpy.data.cameras.new("CAM_site_overview")
    camera = bpy.data.objects.new("CAM_site_overview", camera_data)
    bpy.context.collection.objects.link(camera)
    camera.location = (parcel_w/2, -parcel_d/2, max(parcel_w, parcel_d) * 0.65)
    camera.rotation_euler = (math.radians(60), 0, math.radians(45))
    bpy.context.scene.camera = camera

if __name__ == "__main__":
    clear_scene()
    with open(INPUT_JSON, "r", encoding="utf-8") as f:
        build(json.load(f))
    print("Dynasty PropertyOS site digital twin generated.")
