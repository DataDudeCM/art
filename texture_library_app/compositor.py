"""
compositor.py — Portrait Texture Compositor
Slices a portrait into 5 luminosity zones, selects best-match textures
from the manifest, and outputs a layered PSD with masks intact.
"""

import os
import math
from pathlib import Path
from typing import Callable, Optional

import numpy as np
from PIL import Image, ImageFilter

from analyzer import load_manifest

# ── 5-ZONE DEFINITIONS ────────────────────────────────────────────────────────
# Each zone: (name, label, lo, hi) — lo/hi on 0-255 luminosity scale
ZONES_5 = [
    ("deep_shadow",      "Deep Shadow",      0,   51),
    ("shadow",           "Shadow",           51,  102),
    ("midtone",          "Midtone",          102, 153),
    ("highlight",        "Highlight",        153, 204),
    ("bright_highlight", "Bright Highlight", 204, 256),
]

# Feather radius as fraction of image short dimension
FEATHER_FRACTION = 0.012


def _luminosity(img: Image.Image) -> np.ndarray:
    """Perceptual luminosity array (0-255 float32)."""
    rgb = np.array(img.convert("RGB"), dtype=np.float32)
    return 0.299 * rgb[..., 0] + 0.587 * rgb[..., 1] + 0.114 * rgb[..., 2]


def _zone_mask(luma: np.ndarray, lo: float, hi: float, feather: int) -> Image.Image:
    """
    Smooth luminosity mask for a tonal zone [lo, hi].
    Values inside the range are white; edges are feathered with a Gaussian.
    """
    h, w = luma.shape
    mask = np.zeros((h, w), dtype=np.float32)

    zone_width = hi - lo
    if zone_width <= 0:
        return Image.fromarray(mask.astype(np.uint8), mode="L")

    # Hard mask
    inside = (luma >= lo) & (luma < hi)
    mask[inside] = 255.0

    # Feather edges with distance-based soft ramp
    # Blend in a 10% soft border at each edge of the zone
    ramp = zone_width * 0.15
    if ramp > 1:
        lower_ramp = (luma >= lo) & (luma < lo + ramp)
        upper_ramp = (luma >= hi - ramp) & (luma < hi)
        mask[lower_ramp] = ((luma[lower_ramp] - lo) / ramp) * 255.0
        mask[upper_ramp] = ((hi - luma[upper_ramp]) / ramp) * 255.0

    # Gaussian blur to soften mask edges
    pil_mask = Image.fromarray(np.clip(mask, 0, 255).astype(np.uint8), mode="L")
    if feather > 0:
        pil_mask = pil_mask.filter(ImageFilter.GaussianBlur(radius=feather))

    return pil_mask


def _best_texture(
    manifest: dict,
    zone_name: str,
    lo: float,
    hi: float,
    used_ids: set,
) -> Optional[dict]:
    """
    Pick the texture whose brightness is closest to zone midpoint.
    Prefers unused textures; falls back to any if all used.
    """
    mid = (lo + hi) / 2.0
    textures = [
        t for t in manifest["textures"].values()
        if not t.get("excluded", False) and os.path.exists(t["path"])
    ]
    if not textures:
        return None

    def score(t):
        unused_bonus = 0 if t["id"] in used_ids else -1000
        return abs(t["brightness"] - mid) + unused_bonus

    return min(textures, key=score)


def _fill_texture(texture_img: Image.Image, target_w: int, target_h: int) -> Image.Image:
    """Scale texture to fill target size, center-crop."""
    tw, th = texture_img.size
    scale = max(target_w / tw, target_h / th)
    new_w = math.ceil(tw * scale)
    new_h = math.ceil(th * scale)
    resized = texture_img.resize((new_w, new_h), Image.LANCZOS)
    left = (new_w - target_w) // 2
    top  = (new_h - target_h) // 2
    return resized.crop((left, top, left + target_w, top + target_h))


def composite(
    portrait_path: str,
    manifest_path: str,
    output_path: str,
    progress_cb: Optional[Callable[[int, int, str], None]] = None,
) -> list[dict]:
    """
    Build a layered PSD where each tonal zone is filled with a texture.

    Returns a list of zone info dicts (zone name, texture used, coverage %).
    """
    from psd_tools import PSDImage

    # ── Load portrait ─────────────────────────────────────────────────────────
    portrait = Image.open(portrait_path).convert("RGB")
    W, H = portrait.size
    feather = max(2, int(min(W, H) * FEATHER_FRACTION))

    luma = _luminosity(portrait)
    manifest = load_manifest(manifest_path)

    total_steps = len(ZONES_5) + 1
    step = 0

    if progress_cb:
        progress_cb(step, total_steps, "Loading portrait…")

    # ── Create PSD ────────────────────────────────────────────────────────────
    psd = PSDImage.new("RGB", (W, H))

    used_ids = set()
    zone_results = []

    # Build zones bottom-to-top (deep shadow first = bottom layer)
    for zone_name, zone_label, lo, hi in ZONES_5:
        step += 1
        if progress_cb:
            progress_cb(step, total_steps, f"Building zone: {zone_label}…")

        # Select texture
        texture_entry = _best_texture(manifest, zone_name, lo, hi, used_ids)
        if texture_entry is None:
            zone_results.append({
                "zone": zone_label,
                "texture": None,
                "coverage_pct": 0,
                "warning": "No texture found",
            })
            continue

        used_ids.add(texture_entry["id"])

        # Load + fill texture to portrait size
        tex_img = Image.open(texture_entry["path"]).convert("RGB")
        tex_filled = _fill_texture(tex_img, W, H)

        # Build luminosity mask
        mask = _zone_mask(luma, lo, hi, feather)

        # Compute coverage for reporting
        mask_arr = np.array(mask, dtype=np.float32)
        coverage = float(np.sum(mask_arr > 127) / (W * H) * 100)

        # Add layer to PSD
        layer = psd.create_pixel_layer(tex_filled, name=f"{zone_label} — {texture_entry['filename']}")
        layer.create_mask(mask)
        psd.append(layer)

        zone_results.append({
            "zone":         zone_label,
            "zone_name":    zone_name,
            "lo":           lo,
            "hi":           hi,
            "texture_id":   texture_entry["id"],
            "texture_file": texture_entry["filename"],
            "brightness":   texture_entry["brightness"],
            "coverage_pct": round(coverage, 1),
            "warning":      None,
        })

    # ── Save PSD ──────────────────────────────────────────────────────────────
    step += 1
    if progress_cb:
        progress_cb(step, total_steps, "Writing PSD…")

    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    psd.save(output_path)

    return zone_results
