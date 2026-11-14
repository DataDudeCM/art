"""Load a tile set from common/tilesets/<name>/tileset.json.

Each tile is expanded into its orientations ("variants"). A rotation is dropped
only when both its edges and its picture repeat an earlier rotation of the same
tile, so a symmetric tile isn't counted twice but a diagonal one keeps all four.

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


class TileSet:
    def __init__(self, name_or_path):
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

        # compat[i][d]: bitmask of variants that may sit on side d of variant i.
        n = len(self.variants)
        self.compat = [[0] * 4 for _ in range(n)]
        for i, a in enumerate(self.variants):
            for d in range(4):
                mask = 0
                for j, b in enumerate(self.variants):
                    if a.edges[d] == b.edges[OPPOSITE[d]][::-1]:
                        mask |= 1 << j
                self.compat[i][d] = mask

    def __len__(self):
        return len(self.variants)

    def brightness(self, bg="#202020"):
        """Average brightness (0-1) of each variant, composited over `bg`.
        Only transparent tiles depend on `bg`."""
        from PIL import ImageColor

        back = ImageColor.getrgb(bg or "#202020")[:3] + (255,)
        out = []
        for v in self.variants:
            canvas = Image.new("RGBA", v.image.size, back)
            canvas.alpha_composite(v.image)
            gray = canvas.convert("L")
            out.append(sum(i * n for i, n in enumerate(gray.histogram())) / (255.0 * gray.width * gray.height))
        return out

    def transparent(self):
        """True if any tile has see-through pixels (so brightness depends on the background)."""
        return any(v.image.getextrema()[3][0] < 255 for v in self.variants)

    def lint(self):
        """Warnings about sides nothing can ever sit next to."""
        sides = "top right bottom left".split()
        out = []
        for i, v in enumerate(self.variants):
            if v.rotation:
                continue
            for d in range(4):
                if not self.compat[i][d]:
                    out.append(f"{v.file}: {sides[d]} edge {v.edges[d]} matches no tile")
        return out
