"""Extract Dynasty PropertyOS clean source files — skip build artifacts and venv."""
import zipfile
import os
import sys
from pathlib import Path

ZIP_PATH = r'C:/Users/sdtho/OneDrive/Desktop/dynasty_property_os.zip'
DEST = Path(r'C:/stllcweb3/dynasty_property_os')

# Patterns to EXCLUDE
SKIP_DIRS = {
    '.venv', 'node_modules', '.next', '__pycache__', '.dist-info',
    '.pytest_cache', '.mypy_cache', 'dist', 'build', '.git',
    'dynasty_property_os_vscode',   # duplicate vscode variant
}

SKIP_EXTENSIONS = {'.pyc', '.pyd', '.so', '.dll', '.blend1'}  # keep .blend

def should_skip(name: str) -> bool:
    parts = name.split('/')
    # Strip top-level 'dynasty_property_os/' prefix
    rel_parts = parts[1:] if parts[0] == 'dynasty_property_os' else parts
    for p in rel_parts:
        if p in SKIP_DIRS:
            return True
    # Skip the vscode variant subtree
    if len(rel_parts) > 0 and rel_parts[0] == 'dynasty_property_os_vscode':
        return True
    ext = os.path.splitext(name)[-1].lower()
    if ext in SKIP_EXTENSIONS:
        return True
    return False

extracted = []
skipped = 0

with zipfile.ZipFile(ZIP_PATH, 'r') as z:
    all_names = z.namelist()
    for name in all_names:
        if name.endswith('/'):
            continue
        if should_skip(name):
            skipped += 1
            continue

        # Strip 'dynasty_property_os/' prefix
        rel = name
        if rel.startswith('dynasty_property_os/'):
            rel = rel[len('dynasty_property_os/'):]

        dest_path = DEST / rel
        dest_path.parent.mkdir(parents=True, exist_ok=True)

        with z.open(name) as src, open(dest_path, 'wb') as dst:
            dst.write(src.read())
        extracted.append(rel)

print(f"Extracted: {len(extracted)} files")
print(f"Skipped (build artifacts): {skipped}")
print(f"\nExtracted to: {DEST}")
print("\nTop-level structure:")
for d in sorted(set(Path(f).parts[0] for f in extracted)):
    count = sum(1 for f in extracted if Path(f).parts[0] == d)
    print(f"  {d}/  ({count} files)")
