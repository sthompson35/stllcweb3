"""Export active Blender scene to GLB for web viewer / Three.js."""
import os
from pathlib import Path
import bpy

output = Path(os.environ.get("PROPERTYOS_GLB_OUTPUT", "./exports/propertyos_model.glb"))
output.parent.mkdir(parents=True, exist_ok=True)
bpy.ops.export_scene.gltf(filepath=str(output), export_format="GLB")
print(f"Exported GLB: {output}")
