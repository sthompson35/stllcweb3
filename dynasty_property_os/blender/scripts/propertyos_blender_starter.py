"""
Dynasty PropertyOS Blender Starter
Creates a simple digital twin from JSON room records.
Run inside Blender Python or via blender --background --python this_file.py
"""
import json
import math
from pathlib import Path

import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2] if "__file__" in globals() else Path.cwd()
SAMPLE_JSON = ROOT / "projects" / "USDA_1BEDROOM_PROTOTYPE" / "costs" / "sample_property.json"


def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()


def hex_to_rgba(hex_color: str):
    hex_color = hex_color.lstrip('#')
    r = int(hex_color[0:2], 16) / 255
    g = int(hex_color[2:4], 16) / 255
    b = int(hex_color[4:6], 16) / 255
    return (r, g, b, 1)


def make_material(name, color_hex):
    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    rgba = hex_to_rgba(color_hex)
    # Keep viewport/material preview color in sync.
    mat.diffuse_color = rgba

    node_tree = mat.node_tree
    if node_tree:
        bsdf = node_tree.nodes.get("Principled BSDF")
        if bsdf:
            bsdf.inputs["Base Color"].default_value = rgba
            bsdf.inputs["Roughness"].default_value = 0.55
    return mat


def cube_object(name, location, scale, material=None):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if material:
        obj.data.materials.append(material)
    return obj


def create_floor(room, mat):
    x, y = room["x"], room["y"]
    w, l = room["width"], room["length"]
    return cube_object(
        f"{room['name']}_FLOOR",
        (x + w / 2, y + l / 2, 0),
        (w, l, 0.12),
        mat,
    )


def create_room_walls(room, wall_mat, thickness=0.35):
    x, y = room["x"], room["y"]
    w, l, h = room["width"], room["length"], room.get("height", 8)
    z = h / 2
    walls = []
    walls.append(cube_object(f"{room['name']}_WALL_N", (x + w / 2, y + l, z), (w, thickness, h), wall_mat))
    walls.append(cube_object(f"{room['name']}_WALL_S", (x + w / 2, y, z), (w, thickness, h), wall_mat))
    walls.append(cube_object(f"{room['name']}_WALL_E", (x + w, y + l / 2, z), (thickness, l, h), wall_mat))
    walls.append(cube_object(f"{room['name']}_WALL_W", (x, y + l / 2, z), (thickness, l, h), wall_mat))
    return walls


def create_roof(rooms, roof_mat):
    min_x = min(r["x"] for r in rooms)
    min_y = min(r["y"] for r in rooms)
    max_x = max(r["x"] + r["width"] for r in rooms)
    max_y = max(r["y"] + r["length"] for r in rooms)
    width = max_x - min_x + 2
    length = max_y - min_y + 2
    center_x = (min_x + max_x) / 2
    center_y = (min_y + max_y) / 2
    z = 8.7

    left = cube_object("PROP-USDA-001_EXT_ROOF_PLANE_A", (center_x - width / 4, center_y, z), (width / 2, length, 0.18), roof_mat)
    left.rotation_euler[1] = math.radians(18)
    right = cube_object("PROP-USDA-001_EXT_ROOF_PLANE_B", (center_x + width / 4, center_y, z), (width / 2, length, 0.18), roof_mat)
    right.rotation_euler[1] = math.radians(-18)
    return [left, right]


def add_camera_and_lights():
    bpy.ops.object.light_add(type='SUN', location=(10, -10, 20))
    sun = bpy.context.object
    sun.name = "SUN_DAYLIGHT"
    sun.data.energy = 3

    bpy.ops.object.camera_add(location=(35, -40, 24), rotation=(math.radians(60), 0, math.radians(40)))
    bpy.context.scene.camera = bpy.context.object


def create_model_from_json(path=SAMPLE_JSON):
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    clear_scene()
    mats = {}
    for name, meta in data["materials"].items():
        mats[name] = make_material(name, meta.get("color", "#cccccc"))

    wall_mat = make_material("Interior Wall Paint - Warm White", "#f2efe8")
    exterior_mat = mats.get("Exterior White Siding") or wall_mat
    roof_mat = mats.get("Architectural Shingle") or make_material("Roof Dark", "#333333")

    collection = bpy.data.collections.new(data["property_code"])
    bpy.context.scene.collection.children.link(collection)

    for room in data["rooms"]:
        floor_mat = mats.get(room.get("floor_material"), make_material("Default Floor", "#aaaaaa"))
        floor = create_floor(room, floor_mat)
        collection.objects.link(floor)
        bpy.context.collection.objects.unlink(floor)
        for wall in create_room_walls(room, wall_mat, data.get("wall_thickness", 0.35)):
            collection.objects.link(wall)
            bpy.context.collection.objects.unlink(wall)

    for roof in create_roof(data["rooms"], roof_mat):
        collection.objects.link(roof)
        bpy.context.collection.objects.unlink(roof)

    add_camera_and_lights()
    bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / "blender" / "property_models" / "USDA_1BEDROOM_PROTOTYPE" / "property_master.blend"))
    print("Dynasty PropertyOS model generated successfully.")


if __name__ == "__main__":
    create_model_from_json()
