"""Generate the fractal-pipe tile set: lines that wrinkle with depth.

Each tile is a blank, a straight line or a corner. The line is wrinkled
recursively (a quadratic Koch curve: every segment becomes eight quarter-length
segments with a bump to each side). It enters and leaves at the same points at
every depth, so the edge codes never change, but each depth doubles the line's
length and so its ink. That gives tiles with identical edges and different
brightness.

  python fractal_pipe_tilegen.py                 depths 0-3 into common/tilesets/fractal-pipe/
  python fractal_pipe_tilegen.py --depths 5 --name fractal-pipe-deep
  python fractal_pipe_tilegen.py --curve hilbert --style tube --bg dark --width 40 --depths 3 --margin 0.12 --name fractal-coil

Two curves. koch wrinkles the line in place; its segments shrink to a quarter
per depth, so only thin lines survive deep recursion. hilbert coils the line
through the middle of the tile like a radiator; its segments only halve per
depth, so thick pipes work.

Then:  python view.py fractal-pipe --size 12x12 --cell 128
"""

import argparse
import json
import math
import random
import re

from PIL import Image, ImageDraw

from tileset import ART, TILESETS

PAPER = (247, 244, 236)
INK = (28, 26, 24)
PIPE = (255, 255, 255)
DARK = (34, 34, 34)
BLACK = (0, 0, 0)
SS = 2  # draw at this multiple of the tile size, then shrink, for smooth lines

# Quadratic Koch curve: forward, left, forward, right, forward, right, forward,
# forward... written as turns between eight equal steps. +1 = turn left, -1 = right.
TURNS = (1, -1, -1, 0, 1, 1, -1)


def wrinkle(p0, p1, depth, flip=1):
    """Points from p0 to p1 (excluding p1), wrinkled `depth` times."""
    if depth == 0:
        return [p0]
    dx, dy = (p1[0] - p0[0]) / 4.0, (p1[1] - p0[1]) / 4.0
    pts, x, y = [], p0[0], p0[1]
    for k in range(8):
        nx, ny = x + dx, y + dy
        pts += wrinkle((x, y), (nx, ny), depth - 1, flip)
        x, y = nx, ny
        if k < 7:
            t = TURNS[k] * flip
            if t:  # rotate the step a quarter turn
                dx, dy = (dy * t, -dx * t)
    return pts


def hilbert(order):
    """Hilbert curve through a 2^order grid: from cell (0, 0) to cell (2^order - 1, 0)."""
    n = 1 << order
    pts = []
    for d in range(n * n):
        x = y = 0
        t, s = d, 1
        while s < n:
            rx, ry = 1 & (t >> 1), 1 & (t ^ (t >> 1))
            if ry == 0:
                if rx == 1:
                    x, y = s - 1 - x, s - 1 - y
                x, y = y, x
            x += s * rx
            y += s * ry
            t >>= 2
            s <<= 1
        pts.append((x, y))
    return pts


def coil_path(kind, order, margin=0.2):
    """A Hilbert coil in the middle of the tile, joined to the edges by short leads.
    The coil's two ends sit at its bottom corners; the leads run in the margin."""
    if order == 0:
        return path(kind, 0)
    n = 1 << order
    s = (1 - 2 * margin) / n  # spacing between passes of the coil
    coil = [(margin + (x + 0.5) * s, 1 - margin - (y + 0.5) * s) for x, y in hilbert(order)]
    (x0, yb), (x1, _) = coil[0], coil[-1]
    lead_in = [(0, 0.5), (margin / 2, 0.5), (margin / 2, yb)]
    if kind == "straight":
        lead_out = [(1 - margin / 2, yb), (1 - margin / 2, 0.5), (1, 0.5)]
    else:  # corner: out through the bottom edge
        lead_out = [(x1, 1 - margin / 2), (0.5, 1 - margin / 2), (0.5, 1)]
    return lead_in + coil + lead_out


def path(kind, depth):
    """The tile's line as points in 0-1 coordinates."""
    if kind == "straight":  # left edge to right edge
        return wrinkle((0, 0.5), (1, 0.5), depth) + [(1, 0.5)]
    # corner: left edge to centre to bottom edge. Both legs wrinkle the same
    # way round; mirroring the second leg would run it into the first.
    return (wrinkle((0, 0.5), (0.5, 0.5), depth) +
            wrinkle((0.5, 0.5), (0.5, 1), depth) + [(0.5, 1)])


def stroke(d, pts, colour, width):
    """A polyline with round joints and round ends (so neighbouring tiles join cleanly)."""
    d.line(pts, fill=colour, width=round(width), joint="curve")
    r = width / 2
    for x, y in pts:
        d.ellipse([x - r, y - r, x + r, y + r], fill=colour)


# -- palettes and brushes -------------------------------------------------------

LINE_ROLES = ["accent", "warm", "cool", "dark", "mid", "shadow", "neutral", "warm-neutral"]


def load_palette(name, n_colours):
    """Paper colour and line colours from art/common/js/palette.js (the shared palettes).
    Paper is the palette's paper (or lightest) colour; lines are picked by role."""
    text = (ART / "common" / "js" / "palette.js").read_text(encoding="utf-8")
    text = text[text.index("const PALETTES"):]
    found = None
    for m in re.finditer(r'name:\s*"([^"]+)".*?colors:\s*\[(.*?)\]', text, re.S):
        if m.group(1).lower() == name.lower():
            found = re.findall(r'hex:\s*"(#[0-9a-fA-F]{6})",\s*role:\s*"([^"]+)"', m.group(2))
            break
    if not found:
        names = re.findall(r'name:\s*"([^"]+)"', text)
        raise SystemExit(f"no palette '{name}'. Available: {', '.join(names)}")
    rgb = lambda h: tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))
    colours = [(rgb(h), role) for h, role in found]
    paper = next((c for c, r in colours if r == "paper"), None)
    if paper is None:
        paper = max((c for c, _ in colours), key=sum) if max(sum(c) for c, _ in colours) > 600 else PAPER
    lines = [c for c, r in sorted(colours, key=lambda cr: LINE_ROLES.index(cr[1]) if cr[1] in LINE_ROLES else 99)
             if c != paper and r not in ("paper", "light", "highlight")]
    if not lines:
        raise SystemExit(f"palette '{name}' has no colours dark enough for lines")
    return paper, lines[:n_colours]


class Brush:
    """Stamps a brush image (white shape, soft alpha) along a path, tinted with the line colour."""

    def __init__(self, name, width, rng):
        path = ART / "common" / "brushes" / f"{name}.png"
        if not path.exists():
            names = sorted(p.stem for p in path.parent.glob("*.png"))
            raise SystemExit(f"no brush '{name}'. Available: {', '.join(names)}")
        alpha = Image.open(path).convert("RGBA").getchannel("A")
        alpha = alpha.crop(alpha.getbbox())
        self.width, self.rng = width, rng
        self.pool = []  # (relative size, mask) in a range of sizes, turns and strengths
        for _ in range(36):
            rel = rng.uniform(0.6, 1.6)
            side = max(4, round(width * 1.9 * rel))
            m = alpha.resize((side, side), Image.LANCZOS).rotate(rng.uniform(0, 360), expand=True)
            # Faint stamps: colour builds up where they overlap, like pooled pigment.
            self.pool.append((rel, m.point(lambda v, k=rng.uniform(0.10, 0.34): int(v * k))))
        self.pool.sort(key=lambda t: t[0])

    def paint(self, img, pts, colour):
        """A solid core keeps the line continuous and its ends identical on every tile,
        so tiles join; the stamps around it give the ragged, painted edge."""
        core = Image.new("L", img.size, 0)  # translucent, so the stamps' texture shows through
        stroke(ImageDraw.Draw(core), pts, 150, self.width * 0.5)
        img.paste(colour, (0, 0), core)
        total = sum(math.dist(a, b) for a, b in zip(pts, pts[1:]))
        step, phase, freq = self.width * 0.3, self.rng.uniform(0, 1), self.rng.uniform(1.5, 3.5)
        travelled = 0.0
        for a, b in zip(pts, pts[1:]):
            seg = math.dist(a, b)
            n = max(1, int(seg / step))
            for i in range(n):
                t = (travelled + seg * i / n) / total
                # Pressure swells and fades along the stroke, but not at the two ends.
                pressure = 1 + 0.32 * math.sin(2 * math.pi * (t * freq + phase)) * math.sin(math.pi * t) ** 0.5
                k = min(len(self.pool) - 1, max(0, int((pressure - 0.68) / 0.64 * len(self.pool)
                                                        + self.rng.uniform(-6, 6))))
                mask = self.pool[k][1]
                x = a[0] + (b[0] - a[0]) * i / n + self.rng.uniform(-1, 1) * self.width * 0.16
                y = a[1] + (b[1] - a[1]) * i / n + self.rng.uniform(-1, 1) * self.width * 0.16
                img.paste(colour, (round(x - mask.width / 2), round(y - mask.height / 2)), mask)
            travelled += seg


# -- drawing --------------------------------------------------------------------

def paint_line(img, pts, colour, width, style, dark, brush):
    if brush:
        brush.paint(img, pts, colour)
        return
    d = ImageDraw.Draw(img)
    # On dark, a plain line is drawn in white; a tube keeps its black outline.
    stroke(d, pts, colour, width)
    if style == "tube":  # a white body inside an ink outline, like a drawn pipe
        stroke(d, pts, PIPE, max(1.0, width - 2 * max(2.0 * SS, width * 0.18)))


def draw_tile(kind, depth, size, width, curve="koch", style="line", bg="paper", margin=0.2,
              paper=None, colour=None, under=None, brush_name=None, seed=0):
    """kind: blank, straight, corner, or cross (colour passes over `under`)."""
    big = size * SS
    dark = bg == "dark"
    ground = paper or (DARK if dark else PAPER)
    img = Image.new("RGB", (big, big), ground)
    if kind == "blank":
        return img.resize((size, size), Image.LANCZOS)
    if colour is None:
        colour = PIPE if dark and style == "line" else (BLACK if dark else INK)
    w = width * SS
    brush = Brush(brush_name, w, random.Random(seed)) if brush_name else None
    scale = lambda points: [(x * big, y * big) for x, y in points]
    if kind == "cross":  # a vertical line, a gap in it, then a horizontal line over the top
        paint_line(img, scale([(0.5, 0), (0.5, 1)]), under, w, style, dark, brush)
        gap = (2.6 if brush else 1.9) * width / size
        ImageDraw.Draw(img).line(scale([(0.5 - gap, 0.5), (0.5 + gap, 0.5)]), fill=ground,
                                 width=round(w * (2.6 if brush else 1.9)))
        paint_line(img, scale([(0, 0.5), (1, 0.5)]), colour, w, style, dark, brush)
    else:
        points = coil_path(kind, depth, margin) if curve == "hilbert" else path(kind, depth)
        paint_line(img, scale(points), colour, w, style, dark, brush)
    return img.resize((size, size), Image.LANCZOS)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--name", default="fractal-pipe", help="folder name in common/tilesets/")
    ap.add_argument("--depths", type=int, default=4, help="number of depths, starting at 0 (default 4)")
    ap.add_argument("--size", type=int, default=512, help="tile size in pixels")
    ap.add_argument("--width", type=float, default=3.0, help="line width in pixels")
    ap.add_argument("--blank", type=int, default=60, help="weight of the blank tile (lines are 100 each)")
    ap.add_argument("--curve", choices=["koch", "hilbert"], default="koch",
                    help="koch: the line wrinkles in place. hilbert: the line coils through the "
                         "middle of the tile, which leaves room for much thicker lines")
    ap.add_argument("--style", choices=["line", "tube"], default="line",
                    help="tube: a white pipe body inside an ink outline")
    ap.add_argument("--bg", choices=["paper", "dark"], default="paper",
                    help="dark: white pipes on near-black, like the hand-drawn plumbing set")
    ap.add_argument("--margin", type=float, default=0.2,
                    help="hilbert only: gap between the coil and the tile edge, 0-0.4 (smaller = bigger coil)")
    ap.add_argument("--palette", help='a palette name from common/js/palette.js, e.g. "Charcoal Coral". '
                                      "Its paper colour is the ground; each line colour gets its own edge "
                                      "letter, so a line keeps its colour for its whole run")
    ap.add_argument("--colours", type=int, default=3, help="line colours to take from the palette (default 3)")
    ap.add_argument("--brush", help='a brush from common/brushes/, e.g. "Watercolor 1": lines are painted '
                                    "by stamping it along the path")
    ap.add_argument("--cross", type=int, default=0, metavar="WEIGHT",
                    help="add crossing tiles (one line passing over another) with this weight, e.g. 30")
    ap.add_argument("--seed", type=int, default=1, help="brush randomness; same seed, same set")
    args = ap.parse_args()

    # A line wider than about half its shortest segment fuses into a blob.
    shortest = ((1 - 2 * args.margin) / 2 ** (args.depths - 1) if args.curve == "hilbert"
                else 0.5 / 4 ** (args.depths - 1)) * args.size
    if args.width > shortest / 2:
        print(f"note: at depth {args.depths - 1} the shortest segment is {shortest:.0f} px; "
              f"a {args.width:g} px line will fuse there. Use fewer --depths or a thinner --width.")

    paper, colours = (load_palette(args.palette, args.colours) if args.palette else (None, [None]))
    letters = "BCDEFGHIJ"[:len(colours)]
    tag = lambda i: f"-c{i + 1}" if args.palette else ""
    draw = lambda kind, depth, i, **kw: draw_tile(
        kind, depth, args.size, args.width, args.curve, args.style, args.bg, args.margin,
        paper=paper, colour=colours[i], brush_name=args.brush, seed=f"{args.seed}:{kind}:{depth}:{i}", **kw)

    out = TILESETS / args.name
    out.mkdir(parents=True, exist_ok=True)
    for old in out.glob("*.png"):  # a rerun with fewer depths shouldn't leave strays
        old.unlink()
    tiles = []
    draw("blank", 0, 0).save(out / "blank.png")
    tiles.append({"file": "blank.png", "edges": ["AAA"] * 4, "weight": args.blank, "rotate": False, "note": "blank"})
    for i, letter in enumerate(letters):
        e = f"A{letter}A"
        edges = {"straight": ["AAA", e, "AAA", e], "corner": ["AAA", "AAA", e, e]}  # top, right, bottom, left
        for depth in range(args.depths):
            for kind in ("straight", "corner"):
                name = f"{kind}{tag(i)}-d{depth}.png"
                draw(kind, depth, i).save(out / name)
                tiles.append({"file": name, "edges": edges[kind], "weight": 100, "rotate": True,
                              "note": f"{kind}, depth {depth}" + (f", colour {i + 1}" if args.palette else "")})
        if args.cross:
            for j, other in enumerate(letters):
                if j == i and len(letters) > 1:
                    continue  # with several colours, only different colours cross
                name = f"cross{tag(i)}-over{tag(j)}.png" if args.palette else "cross.png"
                draw("cross", 0, i, under=colours[j]).save(out / name)
                tiles.append({"file": name, "edges": [f"A{other}A", e, f"A{other}A", e], "weight": args.cross,
                              "rotate": True, "note": f"colour {i + 1} over colour {j + 1}"})

    used = " ".join(f"--{k.replace('_', '-')} {v!r}" if isinstance(v, str) else f"--{k} {v:g}"
                    for k, v in vars(args).items() if v not in (None, 0, False) and k != "name")
    head = {"name": args.name,
            "source": f"generated by python/wfc/fractal_pipe_tilegen.py ({used})",
            "edge_convention": "Edges are [top, right, bottom, left], read clockwise. A = ground; B, C, D... = "
                               "a line crossing at the middle of the side, one letter per line colour. Every "
                               "depth of a tile has the same edges; depth only changes how much line is in it."}
    if args.palette:
        head["colours"] = {"ground": "#%02x%02x%02x" % paper,
                           **{letters[i]: "#%02x%02x%02x" % c for i, c in enumerate(colours)}}
    body = ",\n    ".join(json.dumps(t) for t in tiles)
    (out / "tileset.json").write_text(f'{json.dumps(head, indent=2)[:-2]},\n  "tiles": [\n    {body}\n  ]\n}}\n',
                                      encoding="utf-8")
    print(f"wrote {len(tiles)} tiles to {out}")


if __name__ == "__main__":
    main()
