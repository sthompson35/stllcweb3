"""
Material swap engine.
Reads JSON material selections and applies them to Blender objects by object name pattern.
"""
import json
from pathlib import Path
import bpy

ROOT = Path(__file__).resolve().parents[2] if "__file__" in globals() else Path.cwd()
SWAPS_JSON = ROOT / "blender" / "scripts" / "sample_material_swaps.json"


def hex_to_rgba(hex_color: str):
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) / 255 for i in (0, 2, 4)) + (1,)


def get_or_create_material(name, color_hex):
    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = hex_to_rgba(color_hex)
        bsdf.inputs["Roughness"].default_value = 0.6
    return mat


def apply_swaps(swaps_path=SWAPS_JSON):
    with open(swaps_path, "r", encoding="utf-8") as f:
        swaps = json.load(f)

    for swap in swaps["swaps"]:
        pattern = swap["object_name_contains"]
        mat = get_or_create_material(swap["material_name"], swap.get("color", "#cccccc"))
        for obj in bpy.data.objects:
            if pattern.lower() in obj.name.lower() and hasattr(obj.data, "materials"):
                obj.data.materials.clear()
                obj.data.materials.append(mat)
                print(f"Applied {mat.name} to {obj.name}")


if __name__ == "__main__":
    apply_swaps()
