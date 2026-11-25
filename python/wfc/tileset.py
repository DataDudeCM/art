"""Load a tile set from common/tilesets/<name>/tileset.json.

Each tile is expanded into its orientations ("variants"). A rotation is dropped
only when both its edges and its picture repeat an earlier rotation of the same
tile, so a symmetric tile isn't counted twice but a diagonal one keeps all four.

Which sides may touch is set by `match`, a "+"-joined list of rules that must
all hold (default "strings"):
  strings  edge codes fit: one is the other reversed
  edge     the two edge strips (outer 20% of each side) are within `tol` in brightness
  tile     the two tiles' overall brightness is within `tol`
e.g. "strings+edge". Brightness is 0-1, measured over `bg` for transparent tiles.

No pygame here: images are Pillow RGBA, so the solver and headless renders
work without a window.
"""

import json
from dataclasses import dataclass
from pathlib import Path

from PIL import Image

ART = Path(__file__).resolve().parents[2]
TILESETS = ART / "common" / "tilesets"
OPPOSITE = (2, 3, 0, 1)  # top<->bottom, right<->left
MATCH_RULES = ("strings", "edge", "tile")
EDGE_STRIP = 0.2  # fraction of the tile measured for an edge's brightness
DEFAULT_BG = "#202020"


@dataclass
class Variant:
    file: str
    rotation: int  # clockwise quarter turns
    edges: tuple
    weight: float
    image: Image.Image
    note: str = ""


def available():
    return sorted(p.parent.name for p in TILESETS.glob("*/tileset.json"))


def rotate_edges(edges, k):
    """Clockwise k quarter turns: the new top is the old left, and so on."""
    return tuple(edges[(i - k) % 4] for i in range(4))


def parse_match(match):
    rules = [r.strip() for r in (match or "strings").lower().split("+") if r.strip()]
    bad = [r for r in rules if r not in MATCH_RULES]
    if bad or not rules:
        raise SystemExit(f"--match: unknown rule {', '.join(bad) or '(none)'}; "
                         f"use {', '.join(MATCH_RULES)}, joined with + (e.g. strings+edge)")
    return rules


def _grey(image, bg):
    """Image composited over bg, as greyscale."""
    from PIL import ImageColor

    back = ImageColor.getrgb(bg or DEFAULT_BG)[:3] + (255,)
    canvas = Image.new("RGBA", image.size, back)
    canvas.alpha_composite(image)
    return canvas.convert("L")


def _mean(grey):
    return sum(i * n for i, n in enumerate(grey.histogram())) / (255.0 * grey.width * grey.height)


class TileSet:
    def __init__(self, name_or_path, match="strings", tol=0.1, bg=None):
        path = Path(name_or_path)
        if not path.exists():
            path = TILESETS / str(name_or_path)
        if path.is_dir():
            path = path / "tileset.json"
        if not path.exists():
            raise SystemExit(f"no tile set '{name_or_path}'. Available: {', '.join(available())}")
        self.dir = path.parent
        spec = json.loads(path.read_text(encoding="utf-8"))
        self.name = spec.get("name", self.dir.name)

        self.variants = []
        for t in spec["tiles"]:
            base = Image.open(self.dir / t["file"]).convert("RGBA")
            seen = set()
            for k in range(4 if t.get("rotate", True) else 1):
                edges = rotate_edges(t["edges"], k)
                img = base.rotate(-90 * k)
                key = (edges, img.tobytes())
                if key in seen:
                    continue
                seen.add(key)
                self.variants.append(Variant(t["file"], k, edges, float(t.get("weight", 100)),
                                             img, t.get("note", "")))

        self.match = parse_match(match)
        self.tol = tol
        self.bg = bg
        self._build_compat()

    def _build_compat(self):
        """compat[i][d]: bitmask of variants that may sit on side d of variant i."""
        rules = self.match
        lum = self.brightness(self.bg) if "tile" in rules else None
        edge = self.edge_brightness(self.bg) if "edge" in rules else None
        tol = self.tol + 1e-9  # so a tolerance of exactly the gap counts as a fit
        n = len(self.variants)
        self.compat = [[0] * 4 for _ in range(n)]
        for i, a in enumerate(self.variants):
            for d in range(4):
                o = OPPOSITE[d]
                mask = 0
                for j, b in enumerate(self.variants):
                    if "strings" in rules and a.edges[d] != b.edges[o][::-1]:
                        continue
                    if edge is not None and abs(edge[i][d] - edge[j][o]) > tol:
                        continue
                    if lum is not None and abs(lum[i] - lum[j]) > tol:
                        continue
                    mask |= 1 << j
                self.compat[i][d] = mask

    def __len__(self):
        return len(self.variants)

    def brightness(self, bg=None):
        """Average brightness (0-1) of each variant, composited over `bg`.
        Only transparent tiles depend on `bg`."""
        return [_mean(_grey(v.image, bg)) for v in self.variants]

    def edge_brightness(self, bg=None):
        """(top, right, bottom, left) brightness of each variant, 0-1: the average of
        the outer EDGE_STRIP of the tile on that side, composited over `bg`."""
        out = []
        for v in self.variants:
            g = _grey(v.image, bg)
            w, h = g.size
            sw, sh = max(1, round(w * EDGE_STRIP)), max(1, round(h * EDGE_STRIP))
            boxes = ((0, 0, w, sh), (w - sw, 0, w, h), (0, h - sh, w, h), (0, 0, sw, h))
            out.append(tuple(_mean(g.crop(b)) for b in boxes))
        return out

    def transparent(self):
        """True if any tile has see-through pixels (so brightness depends on the background)."""
        return any(v.image.getextrema()[3][0] < 255 for v in self.variants)

    def lint(self):
        """Warnings about sides nothing can ever sit next to (under the current match rules)."""
        sides = "top right bottom left".split()
        out = []
        for i, v in enumerate(self.variants):
            if v.rotation:
                continue
            for d in range(4):
                if not self.compat[i][d]:
                    rule = "" if self.match == ["strings"] else f" under --match {'+'.join(self.match)} --tol {self.tol:g}"
                    out.append(f"{v.file}: {sides[d]} edge {v.edges[d]} matches no tile{rule}")
        return out
