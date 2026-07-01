"""
Dynasty PropertyOS Blender Starter
Creates a functional digital twin shell from JSON records or Supabase-style exported data.
Run inside Blender: Text Editor > Run Script, or blender --python propertyos_blender_starter.py
"""

import json
import math
import os
from pathlib import Path

import bpy
from mathutils import Vector

DEFAULT_METADATA = Path(__file__).resolve().parents[1] / "metadata" / "sample_property.json"


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()


def ensure_collection(name):
    collection = bpy.data.collections.get(name)
    if not collection:
        collection = bpy.data.collections.new(name)
        bpy.context.scene.collection.children.link(collection)
    return collection


def link_to_collection(obj, collection_name):
    collection = ensure_collection(collection_name)
    for col in obj.users_collection:
        col.objects.unlink(obj)
    collection.objects.link(obj)


def make_principled_material(name, color_hex="#ffffff", roughness=0.55, metallic=0.0):
    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        color_hex = color_hex.lstrip("#")
        rgb = tuple(int(color_hex[i:i+2], 16) / 255 for i in (0, 2, 4))
        bsdf.inputs["Base Color"].default_value = (*rgb, 1)
        bsdf.inputs["Roughness"].default_value = roughness
        bsdf.inputs["Metallic"].default_value = metallic
    return mat


def create_cube(name, location, scale, material=None, collection="Architecture"):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if material:
        obj.data.materials.append(material)
    link_to_collection(obj, collection)
    return obj


def create_floor(room, material):
    x, y, z = room["x"], room["y"], room.get("z", 0)
    w, l = room["width"], room["length"]
    name = f"{room['room_name'].upper().replace(' ', '_')}_FLOOR"
    return create_cube(name, (x + w/2, y + l/2, z - 0.05), (w, l, 0.1), material, "Floors")


def create_room_walls(room, interior_mat, exterior_mat=None):
    x, y, z = room["x"], room["y"], room.get("z", 0)
    w, l, h = room["width"], room["length"], room.get("height", 8)
    t = room.get("wall_thickness", 0.5)
    prefix = room["room_name"].upper().replace(" ", "_")
    mat = interior_mat
    walls = []
    walls.append(create_cube(f"{prefix}_WALL_NORTH", (x+w/2, y+l+t/2, z+h/2), (w+t*2, t, h), mat, "Walls"))
    walls.append(create_cube(f"{prefix}_WALL_SOUTH", (x+w/2, y-t/2, z+h/2), (w+t*2, t, h), mat, "Walls"))
    walls.append(create_cube(f"{prefix}_WALL_EAST", (x+w+t/2, y+l/2, z+h/2), (t, l, h), mat, "Walls"))
    walls.append(create_cube(f"{prefix}_WALL_WEST", (x-t/2, y+l/2, z+h/2), (t, l, h), mat, "Walls"))
    return walls


def create_simple_door(name, x, y, z=0, rotation_z=0, width=3, height=6.8, thickness=0.18):
    mat = make_principled_material("Door - Painted White", "#f4f1ea", 0.45)
    obj = create_cube(name, (x, y, z + height/2), (width, thickness, height), mat, "Doors")
    obj.rotation_euler[2] = math.radians(rotation_z)
    return obj


def create_simple_window(name, x, y, z=3.5, rotation_z=0, width=3, height=4, thickness=0.12):
    frame = make_principled_material("Window Frame - Black", "#111111", 0.35)
    glass = make_principled_material("Glass - Light Blue", "#b8d8ea", 0.05)
    obj = create_cube(name, (x, y, z + height/2), (width, thickness, height), glass, "Windows")
    obj.rotation_euler[2] = math.radians(rotation_z)
    obj["asset_type"] = "window"
    return obj


def create_gable_roof(rooms, roof_material, pitch=0.333, overhang=1.0):
    min_x = min(r["x"] for r in rooms) - overhang
    min_y = min(r["y"] for r in rooms) - overhang
    max_x = max(r["x"] + r["width"] for r in rooms) + overhang
    max_y = max(r["y"] + r["length"] for r in rooms) + overhang
    wall_height = max(r.get("height", 8) + r.get("z", 0) for r in rooms)
    span = max_x - min_x
    rise = (span / 2) * pitch
    ridge_x = (min_x + max_x) / 2

    verts = [
        (min_x, min_y, wall_height),
        (max_x, min_y, wall_height),
        (ridge_x, min_y, wall_height + rise),
        (min_x, max_y, wall_height),
        (max_x, max_y, wall_height),
        (ridge_x, max_y, wall_height + rise),
    ]
    faces = [(0, 3, 5, 2), (1, 2, 5, 4), (0, 1, 4, 3), (0, 2, 1), (3, 4, 5)]
    mesh = bpy.data.meshes.new("GABLE_ROOF_MESH")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new("ROOF_GABLE_MAIN", mesh)
    obj.data.materials.append(roof_material)
    bpy.context.scene.collection.objects.link(obj)
    link_to_collection(obj, "Roof")
    return obj


def apply_material_by_name(object_name, material_name, color_hex="#ffffff", roughness=0.5):
    obj = bpy.data.objects.get(object_name)
    if not obj:
        raise ValueError(f"Object not found: {object_name}")
    mat = make_principled_material(material_name, color_hex, roughness)
    obj.data.materials.clear()
    obj.data.materials.append(mat)
    return obj


def add_labels(rooms):
    for room in rooms:
        bpy.ops.object.text_add(location=(room["x"] + room["width"]/2, room["y"] + room["length"]/2, 0.15), rotation=(0, 0, 0))
        txt = bpy.context.object
        txt.name = f"LABEL_{room['room_name'].upper().replace(' ', '_')}"
        txt.data.body = room["room_name"]
        txt.data.size = 0.6
        txt.data.align_x = "CENTER"
        txt.data.align_y = "CENTER"
        link_to_collection(txt, "Labels")


def setup_camera_and_light(rooms):
    min_x = min(r["x"] for r in rooms)
    min_y = min(r["y"] for r in rooms)
    max_x = max(r["x"] + r["width"] for r in rooms)
    max_y = max(r["y"] + r["length"] for r in rooms)
    cx, cy = (min_x + max_x)/2, (min_y + max_y)/2
    bpy.ops.object.light_add(type="SUN", location=(cx, cy, 20))
    sun = bpy.context.object
    sun.name = "SUN_MAIN"
    sun.data.energy = 3.5
    bpy.ops.object.camera_add(location=(cx - 15, cy - 25, 22), rotation=(math.radians(60), 0, math.radians(-32)))
    bpy.context.scene.camera = bpy.context.object


def build_from_metadata(metadata_path=DEFAULT_METADATA):
    clear_scene()
    with open(metadata_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    materials = {
        "floor": make_principled_material("Luxury Vinyl Plank", "#b28a5b", 0.55),
        "wall_interior": make_principled_material("White Semi Gloss Paint", "#f5f4ef", 0.9),
        "roof": make_principled_material("Architectural Asphalt Shingle", "#303036", 0.8),
        "siding": make_principled_material("Builder Grade Vinyl Siding", "#d9d9d2", 0.65),
    }

    rooms = data["rooms"]
    for room in rooms:
        room.setdefault("wall_thickness", data.get("default_wall_thickness", 0.5))
        create_floor(room, materials["floor"])
        create_room_walls(room, materials["wall_interior"], materials["siding"])

    create_gable_roof(rooms, materials["roof"], data.get("roof", {}).get("pitch", 0.333), data.get("roof", {}).get("overhang", 1.0))

    # Starter openings/fixtures. In production, create from DB component records.
    create_simple_door("ENTRY_DOOR_FRONT", 6, -0.35, rotation_z=0)
    create_simple_window("LIVING_ROOM_FRONT_WINDOW", 3, -0.45, rotation_z=0)
    create_simple_window("BEDROOM_SIDE_WINDOW", 23.45, 6, rotation_z=90)

    add_labels(rooms)
    setup_camera_and_light(rooms)

    bpy.context.scene.unit_settings.system = "IMPERIAL"
    bpy.context.scene.render.engine = "CYCLES"
    return data


if __name__ == "__main__":
    metadata_path = os.environ.get("PROPERTYOS_METADATA", str(DEFAULT_METADATA))
    build_from_metadata(Path(metadata_path))
