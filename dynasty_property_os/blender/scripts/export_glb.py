"""Export active Blender scene to GLB for web/Three.js viewer."""
from pathlib import Path
import bpy

ROOT = Path(__file__).resolve().parents[2] if "__file__" in globals() else Path.cwd()
OUT = ROOT / "blender" / "exports" / "glb" / "usda_1bedroom_prototype.glb"
OUT.parent.mkdir(parents=True, exist_ok=True)

bpy.ops.export_scene.gltf(
    filepath=str(OUT),
    export_format='GLB',
    export_apply=True,
    export_materials='EXPORT'
)
print(f"Exported GLB to {OUT}")
