"""
Dynasty PropertyOS - Blender Room Generator Starter
Reads samples/USDA_1BEDROOM_001.rooms.json and creates simple room floors, walls, ceilings, and material slots.
Run inside Blender Python.
"""
import json
import math
from pathlib import Path

import bpy

FEET_TO_METERS = 0.3048
WALL_THICKNESS_FT = 0.35


def ft(value):
    return value * FEET_TO_METERS


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()


def get_or_create_collection(name):
    collection = bpy.data.collections.get(name)
    if collection is None:
        collection = bpy.data.collections.new(name)
        bpy.context.scene.collection.children.link(collection)
    return collection


def create_material(material_id):
    mat = bpy.data.materials.get(material_id)
    if mat is None:
        mat = bpy.data.materials.new(material_id)
        mat.use_nodes = True
    return mat


def add_cube(name, location, scale, material_id, collection):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(create_material(material_id))
    for c in obj.users_collection:
        c.objects.unlink(obj)
    collection.objects.link(obj)
    return obj


def generate_room(room):
    geo = room["geometry"]
    mats = room["materials"]
    mapping = room["blender_mapping"]

    prefix = mapping["blender_object_prefix"]
    collection = get_or_create_collection(mapping["blender_collection"])

    ox, oy, oz = ft(geo["origin_x"]), ft(geo["origin_y"]), ft(geo["origin_z"])
    width, length, height = ft(geo["width"]), ft(geo["length"]), ft(geo["height"])
    wall_thickness = ft(WALL_THICKNESS_FT)

    center_x = ox + width / 2
    center_y = oy + length / 2

    if mapping.get("generate_floor", True):
        add_cube(
            f"{prefix}_FLOOR_A",
            (center_x, center_y, oz - ft(0.05)),
            (width, length, ft(0.1)),
            mats["floor_material_id"],
            collection,
        )

    if mapping.get("generate_ceiling", True):
        add_cube(
            f"{prefix}_CEILING_A",
            (center_x, center_y, oz + height),
            (width, length, ft(0.08)),
            mats["ceiling_material_id"],
            collection,
        )

    if mapping.get("generate_walls", True):
        add_cube(f"{prefix}_WALL_NORTH_A", (center_x, oy + length, oz + height / 2), (width, wall_thickness, height), mats["wall_material_id"], collection)
        add_cube(f"{prefix}_WALL_SOUTH_A", (center_x, oy, oz + height / 2), (width, wall_thickness, height), mats["wall_material_id"], collection)
        add_cube(f"{prefix}_WALL_EAST_A", (ox + width, center_y, oz + height / 2), (wall_thickness, length, height), mats["wall_material_id"], collection)
        add_cube(f"{prefix}_WALL_WEST_A", (ox, center_y, oz + height / 2), (wall_thickness, length, height), mats["wall_material_id"], collection)

    if mapping.get("generate_openings", True):
        openings = room.get("openings", {})
        for door in openings.get("doors", []):
            add_opening_marker(prefix, door, geo, collection, "DOOR")
        for window in openings.get("windows", []):
            add_opening_marker(prefix, window, geo, collection, "WINDOW")


def add_opening_marker(prefix, opening, geo, collection, kind):
    ox, oy, oz = ft(geo["origin_x"]), ft(geo["origin_y"]), ft(geo["origin_z"])
    width, length = ft(geo["width"]), ft(geo["length"])
    opening_width = ft(opening["width"])
    opening_height = ft(opening["height"])
    offset = ft(opening["offset_from_corner"])
    sill = ft(opening.get("sill_height", 0))
    wall = opening["wall"]
    marker_depth = ft(0.12)

    if wall == "north":
        loc = (ox + offset + opening_width / 2, oy + length + ft(0.05), oz + sill + opening_height / 2)
        scale = (opening_width, marker_depth, opening_height)
    elif wall == "south":
        loc = (ox + offset + opening_width / 2, oy - ft(0.05), oz + sill + opening_height / 2)
        scale = (opening_width, marker_depth, opening_height)
    elif wall == "east":
        loc = (ox + width + ft(0.05), oy + offset + opening_width / 2, oz + sill + opening_height / 2)
        scale = (marker_depth, opening_width, opening_height)
    else:
        loc = (ox - ft(0.05), oy + offset + opening_width / 2, oz + sill + opening_height / 2)
        scale = (marker_depth, opening_width, opening_height)

    mat_id = f"MARKER_{kind}"
    add_cube(f"{prefix}_{kind}_{opening.get('door_id', opening.get('window_id', 'OPENING'))}", loc, scale, mat_id, collection)


def main(json_path):
    clear_scene()
    with open(json_path, "r", encoding="utf-8") as f:
        payload = json.load(f)
    for room in payload["rooms"]:
        generate_room(room)
    bpy.ops.wm.save_as_mainfile(filepath=str(Path(json_path).with_suffix(".blend")))


if __name__ == "__main__":
    # Adjust path if running from another directory.
    json_path = Path(__file__).resolve().parents[1] / "samples" / "USDA_1BEDROOM_001.rooms.json"
    main(json_path)
