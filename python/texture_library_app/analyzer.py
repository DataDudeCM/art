"""
analyzer.py — Texture image analysis engine.
Computes brightness, contrast, frequency, orientation, and auto-suggests tags.
CLIP-based tagging used if open_clip is available; falls back to heuristic tagging.
"""

import json
import math
import os
import hashlib
from pathlib import Path
from typing import Optional

import numpy as np
from PIL import Image, ImageFilter

# ── CLIP (optional) ──────────────────────────────────────────────────────────
try:
    import open_clip
    import torch
    _CLIP_AVAILABLE = True
except ImportError:
    _CLIP_AVAILABLE = False

CLIP_TAG_CANDIDATES = [
    "organic texture", "geometric texture", "rough surface", "smooth surface",
    "fine grain", "coarse grain", "linear pattern", "chaotic pattern",
    "wood grain", "stone texture", "fabric texture", "water texture",
    "cracked surface", "rust texture", "paper texture", "bark texture",
    "sand texture", "concrete texture", "leaf texture", "metal texture",
]

_clip_model = None
_clip_preprocess = None
_clip_tokenizer = None

def _load_clip():
    global _clip_model, _clip_preprocess, _clip_tokenizer
    if _clip_model is None and _CLIP_AVAILABLE:
        _clip_model, _, _clip_preprocess = open_clip.create_model_and_transforms(
            "ViT-B-32", pretrained="openai"
        )
        _clip_tokenizer = open_clip.get_tokenizer("ViT-B-32")
        _clip_model.eval()

# ── CACHE SIZE ────────────────────────────────────────────────────────────────
CACHE_SIZE = 512  # square thumb px

# ── TONE ZONES ────────────────────────────────────────────────────────────────
BRIGHTNESS_BINS = {
    "shadow":    (0,   85),
    "midtone":   (85,  170),
    "highlight": (170, 256),
}

CONTRAST_BINS = {
    "flat": (0,  40),
    "mid":  (40, 80),
    "rich": (80, 256),
}

def brightness_zone(b: float) -> str:
    for name, (lo, hi) in BRIGHTNESS_BINS.items():
        if lo <= b < hi:
            return name
    return "highlight"

def contrast_zone(c: float) -> str:
    for name, (lo, hi) in CONTRAST_BINS.items():
        if lo <= c < hi:
            return name
    return "rich"

def tone_zone(b: float, c: float) -> str:
    return f"{brightness_zone(b)}_{contrast_zone(c)}"

# ── FILE HASH ─────────────────────────────────────────────────────────────────
def file_hash(path: str) -> str:
    h = hashlib.md5()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()[:12]

# ── ANALYSIS ──────────────────────────────────────────────────────────────────
def analyze_image(
    path: str,
    cache_dir: str,
    use_clip: bool = True,
) -> dict:
    """Full analysis of a single texture image."""
    img_path = Path(path)
    img = Image.open(path)
    orig_w, orig_h = img.size

    # ── Cache thumb ──────────────────────────────────────────────────────────
    cache_path = Path(cache_dir) / (img_path.stem + "_thumb.jpg")
    thumb = _make_square_thumb(img, CACHE_SIZE)
    thumb.save(str(cache_path), "JPEG", quality=85)

    # ── Grayscale for metrics ─────────────────────────────────────────────────
    gray = np.array(thumb.convert("L"), dtype=np.float32)

    avg_brightness = float(np.mean(gray))
    contrast_rms   = float(np.std(gray))
    dominant_freq  = _dominant_frequency(gray)
    orientation    = _dominant_orientation(gray)

    # ── Auto-tags ─────────────────────────────────────────────────────────────
    if use_clip and _CLIP_AVAILABLE:
        tags = _clip_tags(thumb)
    else:
        tags = _heuristic_tags(avg_brightness, contrast_rms, dominant_freq, orientation)

    bzone = brightness_zone(avg_brightness)
    czone = contrast_zone(contrast_rms)

    return {
        "id":                  file_hash(path),
        "filename":            img_path.name,
        "path":                str(img_path.resolve()),
        "cache_path":          str(cache_path.resolve()),
        "orig_width":          orig_w,
        "orig_height":         orig_h,
        "brightness":          round(avg_brightness, 2),
        "contrast_rms":        round(contrast_rms, 2),
        "dominant_frequency":  dominant_freq,
        "orientation":         orientation,
        "brightness_zone":     bzone,
        "contrast_zone":       czone,
        "tone_zone":           tone_zone(avg_brightness, contrast_rms),
        "tags":                tags,
        "user_tags":           [],
        "excluded":            False,
    }


def _make_square_thumb(img: Image.Image, size: int) -> Image.Image:
    """Center-crop to square then resize."""
    w, h = img.size
    min_dim = min(w, h)
    left  = (w - min_dim) // 2
    top   = (h - min_dim) // 2
    img   = img.crop((left, top, left + min_dim, top + min_dim))
    return img.resize((size, size), Image.LANCZOS)


def _dominant_frequency(gray: np.ndarray) -> str:
    """Estimate texture grain size via FFT energy distribution."""
    fft  = np.fft.fft2(gray)
    fft  = np.fft.fftshift(fft)
    mag  = np.abs(fft)
    h, w = mag.shape
    cy, cx = h // 2, w // 2
    y, x = np.ogrid[:h, :w]
    dist = np.sqrt((x - cx)**2 + (y - cy)**2)

    # low freq = center ring, high freq = outer ring
    low_mask  = dist < (min(h, w) * 0.1)
    high_mask = dist > (min(h, w) * 0.3)

    low_energy  = float(np.sum(mag[low_mask]))
    high_energy = float(np.sum(mag[high_mask]))
    total = low_energy + high_energy + 1e-9

    if high_energy / total > 0.55:
        return "fine"
    elif low_energy / total > 0.55:
        return "coarse"
    else:
        return "medium"


def _dominant_orientation(gray: np.ndarray) -> str:
    """Detect dominant edge orientation via Sobel gradients."""
    # Use scipy or manual convolution — PIL Kernel API varies by version
    try:
        from scipy.ndimage import sobel
        sx = sobel(gray, axis=1)
        sy = sobel(gray, axis=0)
    except ImportError:
        # Manual 3x3 Sobel via numpy stride tricks
        g = np.pad(gray, 1, mode='reflect')
        sx = (
            -g[:-2,:-2] + g[:-2,2:] +
            -2*g[1:-1,:-2] + 2*g[1:-1,2:] +
            -g[2:,:-2]  + g[2:,2:]
        )
        sy = (
            -g[:-2,:-2] - 2*g[:-2,1:-1] - g[:-2,2:] +
             g[2:,:-2]  + 2*g[2:,1:-1]  + g[2:,2:]
        )

    h_energy = float(np.sum(np.abs(sy)))  # horizontal edges → vertical gradient
    v_energy = float(np.sum(np.abs(sx)))  # vertical edges   → horizontal gradient
    total    = h_energy + v_energy + 1e-9

    if h_energy / total > 0.6:
        return "horizontal"
    elif v_energy / total > 0.6:
        return "vertical"
    else:
        return "chaotic"


def _clip_tags(thumb: Image.Image, top_k: int = 4) -> list[str]:
    """Use CLIP zero-shot to pick the most likely tags."""
    _load_clip()
    import torch
    image_input = _clip_preprocess(thumb).unsqueeze(0)
    text_tokens = _clip_tokenizer(CLIP_TAG_CANDIDATES)
    with torch.no_grad():
        image_features = _clip_model.encode_image(image_input)
        text_features  = _clip_model.encode_text(text_tokens)
        image_features /= image_features.norm(dim=-1, keepdim=True)
        text_features  /= text_features.norm(dim=-1, keepdim=True)
        sims = (image_features @ text_features.T).squeeze(0)
    top_idx = sims.topk(top_k).indices.tolist()
    # Strip the generic word "texture" / "surface" / "pattern" / "grain"
    clean = []
    for i in top_idx:
        label = CLIP_TAG_CANDIDATES[i]
        for drop in (" texture", " surface", " pattern", " grain"):
            label = label.replace(drop, "")
        clean.append(label.strip())
    return clean


def _heuristic_tags(
    brightness: float,
    contrast: float,
    frequency: str,
    orientation: str,
) -> list[str]:
    """Fallback rule-based tag suggestions."""
    tags = []
    if brightness < 80:
        tags.append("dark")
    elif brightness > 180:
        tags.append("light")
    else:
        tags.append("midtone")

    if contrast > 70:
        tags.append("high-contrast")
    elif contrast < 30:
        tags.append("subtle")

    tags.append(frequency)          # fine / medium / coarse
    tags.append(orientation)        # horizontal / vertical / chaotic
    return tags


# ── MANIFEST I/O ──────────────────────────────────────────────────────────────
def load_manifest(manifest_path: str) -> dict:
    if os.path.exists(manifest_path):
        with open(manifest_path, "r") as f:
            return json.load(f)
    return {"textures": {}}


def save_manifest(manifest: dict, manifest_path: str):
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)
