"""
Local helper for running Blender generator from VS Code.
Set BLENDER_PATH in .env or environment.
"""
import os
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def resolve_blender_path() -> str:
	env_path = os.getenv("BLENDER_PATH")
	if env_path:
		return env_path

	install_root = Path(r"C:\Program Files\Blender Foundation")
	candidates = sorted(install_root.glob("Blender */blender.exe"), reverse=True)
	if candidates:
		return str(candidates[0])

	# Fallback for older default setups.
	return r"C:\Program Files\Blender Foundation\Blender 4.2\blender.exe"


blender = resolve_blender_path()
script = ROOT / "blender" / "scripts" / "propertyos_blender_starter.py"

cmd = [blender, "--background", "--python", str(script)]
print("Running:", " ".join(cmd))
subprocess.run(cmd, check=True)
