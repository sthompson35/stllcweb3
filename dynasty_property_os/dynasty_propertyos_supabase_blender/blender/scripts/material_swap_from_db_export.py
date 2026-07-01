"""
Material swap utility.
Input JSON format:
[
  {"object_name":"ROOF_GABLE_MAIN", "material_name":"Standing Seam Metal Roof", "base_color_hex":"#4b4f56", "roughness":0.35},
  {"object_name":"LIVING_ROOM_FLOOR", "material_name":"White Oak Hardwood", "base_color_hex":"#c49a6c", "roughness":0.48}
]
Run inside Blender after loading the model.
"""

import json
import os
from pathlib import Path
import bpy


def make_material(name, color_hex, roughness=0.5):
    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        color_hex = color_hex.lstrip("#")
        rgb = tuple(int(color_hex[i:i+2], 16) / 255 for i in (0, 2, 4))
        bsdf.inputs["Base Color"].default_value = (*rgb, 1)
        bsdf.inputs["Roughness"].default_value = roughness
    return mat


def swap_materials(swap_file):
    with open(swap_file, "r", encoding="utf-8") as f:
        swaps = json.load(f)
    results = []
    for row in swaps:
        obj = bpy.data.objects.get(row["object_name"])
        if not obj:
            results.append({"object_name": row["object_name"], "status": "missing_object"})
            continue
        mat = make_material(row["material_name"], row.get("base_color_hex", "#ffffff"), row.get("roughness", 0.5))
        obj.data.materials.clear()
        obj.data.materials.append(mat)
        obj["selected_material"] = row["material_name"]
        results.append({"object_name": row["object_name"], "status": "updated"})
    return results


if __name__ == "__main__":
    swap_file = os.environ.get("PROPERTYOS_MATERIAL_SWAPS")
    if not swap_file:
        raise RuntimeError("Set PROPERTYOS_MATERIAL_SWAPS to a JSON file path.")
    print(json.dumps(swap_materials(Path(swap_file)), indent=2))
