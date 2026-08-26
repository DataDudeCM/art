"""
organizer.py — Reads manifest and copies full-resolution originals
into a sorted folder hierarchy for easy Photoshop browsing.
"""

import os
import shutil
from pathlib import Path
from typing import Callable, Optional

from analyzer import (
    BRIGHTNESS_BINS,
    CONTRAST_BINS,
    load_manifest,
)


ORGANIZE_SCHEMES = {
    "by_brightness": lambda t: f"by_brightness/{t['brightness_zone']}_{_brightness_range(t['brightness_zone'])}",
    "by_contrast":   lambda t: f"by_contrast/{t['contrast_zone']}_{_contrast_range(t['contrast_zone'])}",
    "by_tone_zone":  lambda t: f"by_tone_zone/{t['tone_zone']}",
    "by_frequency":  lambda t: f"by_frequency/{t['dominant_frequency']}",
    "by_orientation":lambda t: f"by_orientation/{t['orientation']}",
}


def _brightness_range(zone: str) -> str:
    lo, hi = BRIGHTNESS_BINS[zone]
    return f"{lo}-{hi}"


def _contrast_range(zone: str) -> str:
    lo, hi = CONTRAST_BINS[zone]
    return f"{lo}-{hi}"


def organize(
    manifest_path: str,
    organized_dir: str,
    schemes: list[str],
    overwrite: bool = False,
    progress_cb: Optional[Callable[[int, int, str], None]] = None,
) -> dict:
    """
    Copy full-res originals into organized folder structure.

    Returns a summary dict: {scheme: {folder: [filenames]}}
    """
    manifest = load_manifest(manifest_path)
    textures = [t for t in manifest["textures"].values() if not t.get("excluded", False)]

    summary = {s: {} for s in schemes}
    total = len(textures) * len(schemes)
    done  = 0

    for texture in textures:
        src = texture["path"]
        if not os.path.exists(src):
            done += len(schemes)
            continue

        fname = Path(src).name

        for scheme in schemes:
            folder_rel = ORGANIZE_SCHEMES[scheme](texture)
            dest_dir   = Path(organized_dir) / folder_rel
            dest_dir.mkdir(parents=True, exist_ok=True)
            dest_file  = dest_dir / fname

            if not dest_file.exists() or overwrite:
                shutil.copy2(src, dest_file)

            # Track summary
            folder_key = str(folder_rel)
            summary[scheme].setdefault(folder_key, []).append(fname)

            done += 1
            if progress_cb:
                progress_cb(done, total, f"{scheme} → {fname}")

    return summary


def clean_organized(organized_dir: str):
    """Remove entire organized folder tree (for full rebuild)."""
    p = Path(organized_dir)
    if p.exists():
        shutil.rmtree(p)
    p.mkdir(parents=True, exist_ok=True)
