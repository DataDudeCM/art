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

from PIL import Image, ImageDraw

from tileset import TILESETS

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


def draw_tile(kind, depth, size, width, curve="koch", style="line", bg="paper", margin=0.2):
    big = size * SS
    dark = bg == "dark"
    img = Image.new("RGB", (big, big), DARK if dark else PAPER)
    if kind != "blank":
        points = coil_path(kind, depth, margin) if curve == "hilbert" else path(kind, depth)
        pts = [(x * big, y * big) for x, y in points]
        d = ImageDraw.Draw(img)
        # On dark, a plain line is drawn in white; a tube keeps its black outline.
        stroke(d, pts, PIPE if dark and style == "line" else (BLACK if dark else INK), width * SS)
        if style == "tube":  # a white body inside an ink outline, like a drawn pipe
            stroke(d, pts, PIPE, max(1.0, width - 2 * max(2.0, width * 0.18)) * SS)
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
    args = ap.parse_args()

    # A line wider than about half its shortest segment fuses into a blob.
    shortest = ((1 - 2 * args.margin) / 2 ** (args.depths - 1) if args.curve == "hilbert"
                else 0.5 / 4 ** (args.depths - 1)) * args.size
    if args.width > shortest / 2:
        print(f"note: at depth {args.depths - 1} the shortest segment is {shortest:.0f} px; "
              f"a {args.width:g} px line will fuse there. Use fewer --depths or a thinner --width.")

    out = TILESETS / args.name
    out.mkdir(parents=True, exist_ok=True)
    edges = {"blank": ["AAA", "AAA", "AAA", "AAA"],      # top, right, bottom, left
             "straight": ["AAA", "ABA", "AAA", "ABA"],
             "corner": ["AAA", "AAA", "ABA", "ABA"]}
    tiles = []
    for old in out.glob("*.png"):  # a rerun with fewer depths shouldn't leave strays
        old.unlink()
    draw_tile("blank", 0, args.size, args.width, bg=args.bg).save(out / "blank.png")
    tiles.append({"file": "blank.png", "edges": edges["blank"], "weight": args.blank,
                  "rotate": False, "note": "blank"})
    for depth in range(args.depths):
        for kind in ("straight", "corner"):
            name = f"{kind}-d{depth}.png"
            draw_tile(kind, depth, args.size, args.width, args.curve, args.style,
                      args.bg, args.margin).save(out / name)
            tiles.append({"file": name, "edges": edges[kind], "weight": 100,
                          "rotate": True, "note": f"{kind}, depth {depth}"})

    head = {"name": args.name,
            "source": f"generated by python/wfc/fractal_pipe_tilegen.py (--curve {args.curve} --style {args.style} "
                      f"--depths {args.depths} --size {args.size} --width {args.width:g} --blank {args.blank} "
                      f"--bg {args.bg} --margin {args.margin:g})",
            "edge_convention": "Edges are [top, right, bottom, left], read clockwise. A = paper, "
                               "B = the line crossing at the middle of the side. Every depth of a "
                               "tile has the same edges; depth only changes how wrinkled the line is."}
    body = ",\n    ".join(json.dumps(t) for t in tiles)
    (out / "tileset.json").write_text(f'{json.dumps(head, indent=2)[:-2]},\n  "tiles": [\n    {body}\n  ]\n}}\n',
                                      encoding="utf-8")
    print(f"wrote {len(tiles)} tiles to {out}")


if __name__ == "__main__":
    main()
