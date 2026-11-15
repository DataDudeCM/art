"""WFC inside WFC: build a tile set whose tiles are small WFC boards of another set.

Each tile of the source set becomes a grid of that set's own tiles, solved with:

  - a forced border: wherever the big tile's edge has a pipe (or a coloured
    region), the small tiles along that edge must show the same thing in the
    same place, so the new tiles fit together exactly as the originals did;
  - a steered inside: small tiles are weighted by the big tile's own picture
    (bright where it is bright), so the big tile's shape stays visible.

The new set keeps the source's edge codes, weights and rotate flags, so it runs
anywhere the source does. Run it on its own output to go a level deeper.

  python meta_tilegen.py plumbing                    -> common/tilesets/plumbing-2/
  python meta_tilegen.py plumbing --k 5 --steer 80   finer grid, stronger shape
  python meta_tilegen.py plumbing-2 --name plumbing-3

Then:  python view.py plumbing-2 --size 8x6 --cell 216 --bg black

How edges map: an edge code has one letter per section (e.g. "ASA"). Each
section becomes k small tiles. A letter that also appears as a whole edge
("AAA") is a region and fills its section. Any other letter is a line on that
ground and sits in the middle small tile of its section.
"""

import argparse
import json

import numpy as np
from PIL import Image, ImageColor

from solver import Solver
from tileset import TILESETS, TileSet


def edge_cells(code, k, regions, ground):
    """The small-tile edge codes along one side of a big tile, in the code's reading order."""
    out = []
    for i, letter in enumerate(code):
        if letter in regions:
            out += [letter * len(code)] * k
            continue
        # A line letter: find the ground it is drawn on from its neighbours in the code.
        near = [c for c in (code[i - 1] if i else "", code[i + 1] if i + 1 < len(code) else "") if c in regions]
        g = near[0] if near else ground
        blank, line = g * len(code), g + letter + g if len(code) == 3 else g * len(code)
        out += [blank] * (k // 2) + [line] + [blank] * (k - k // 2 - 1)
    return out


def border_rules(edges, k, regions, ground):
    """{(x, y): {side: required small-tile edge}} for the cells on the border."""
    n = len(edges[0]) * k
    top, right, bottom, left = (edge_cells(e, k, regions, ground) for e in edges)
    rules = {}
    for i in range(n):
        rules.setdefault((i, 0), {})[0] = top[i]                 # top reads left to right
        rules.setdefault((n - 1, i), {})[1] = right[i]           # right reads top to bottom
        rules.setdefault((n - 1 - i, n - 1), {})[2] = bottom[i]  # bottom reads right to left
        rules.setdefault((0, n - 1 - i), {})[3] = left[i]        # left reads bottom to top
    return n, rules


def tile_picture(image, n, bg):
    """The big tile as one brightness per small cell, 0-1."""
    canvas = Image.new("RGBA", image.size, ImageColor.getrgb(bg)[:3] + (255,))
    canvas.alpha_composite(image)
    small = canvas.convert("L").resize((n, n), Image.BOX)
    return np.asarray(small, dtype=np.float64) / 255.0


def solve_tile(ts, lum, edges, picture, k, steer, seed, regions, ground):
    n, rules = border_rules(edges, k, regions, ground)
    lo, span = lum.min(), max(1e-6, lum.max() - lum.min())
    goal = lo + span * picture

    def weight(x, y, v):
        need = rules.get((x, y))
        if need:
            e = ts.variants[v].edges
            if any(e[side] != code for side, code in need.items()):
                return 0.0  # forbidden: would break the big tile's edge
        if steer <= 0:
            return 1.0
        d = (lum[v] - goal[y, x]) / span
        return float(np.exp(-steer * d * d))

    solver = Solver(ts, n, n, seed=seed, weight_fn=weight, max_attempts=400)
    return n, solver.solve(), solver.attempt + 1


def render_transparent(ts, cells, n, cell_px):
    """Like view.render, but keeps transparency so the new tiles work on any background."""
    canvas = Image.new("RGBA", (n * cell_px, n * cell_px), (0, 0, 0, 0))
    cache = {}
    for idx, v in enumerate(cells):
        if v not in cache:
            cache[v] = ts.variants[v].image.resize((cell_px, cell_px), Image.LANCZOS)
        canvas.alpha_composite(cache[v], ((idx % n) * cell_px, (idx // n) * cell_px))
    return canvas


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("tileset", help="source set in common/tilesets/")
    ap.add_argument("--name", help="new set's folder name (default: <source>-2)")
    ap.add_argument("--k", type=int, default=3, help="small tiles per edge section; odd (default 3, so 9x9 per tile)")
    ap.add_argument("--steer", type=float, default=40.0,
                    help="how strongly the big tile's picture shapes the inside (0 = border only)")
    ap.add_argument("--variants", type=int, default=2, help="different versions of each tile (default 2)")
    ap.add_argument("--cell", type=int, default=48, help="pixels per small tile in the new tiles")
    ap.add_argument("--bg", default="black", help="background used to measure brightness (transparent sets)")
    ap.add_argument("--seed", type=int, default=1)
    args = ap.parse_args()
    if args.k % 2 == 0:
        raise SystemExit("--k must be odd, so a line sits in the middle of its section")

    ts = TileSet(args.tileset)
    spec = json.loads((ts.dir / "tileset.json").read_text(encoding="utf-8"))
    lum = np.array(ts.brightness(args.bg))
    codes = [e for t in spec["tiles"] for e in t["edges"]]
    regions = {c[0] for c in codes if len(set(c)) == 1}
    ground = max(regions, key=lambda r: sum(c.count(r) for c in codes)) if regions else codes[0][0]

    out = TILESETS / (args.name or f"{args.tileset}-2")
    out.mkdir(parents=True, exist_ok=True)
    for old in out.glob("*.png"):
        old.unlink()
    tiles, failed = [], []
    for i, t in enumerate(spec["tiles"]):
        base = Image.open(ts.dir / t["file"]).convert("RGBA")
        picture = tile_picture(base, len(t["edges"][0]) * args.k, args.bg)
        made = 0
        for v in range(args.variants):
            try:
                n, cells, attempts = solve_tile(ts, lum, t["edges"], picture, args.k, args.steer,
                                                f"{args.seed}:{i}:{v}", regions, ground)
            except RuntimeError:
                continue
            name = f"{t['file'].rsplit('.', 1)[0]}-{chr(97 + v)}.png"
            render_transparent(ts, cells, n, args.cell).save(out / name)
            made += 1
            tiles.append({"file": name, "edges": t["edges"], "weight": t.get("weight", 100),
                          "rotate": t.get("rotate", True), "note": t.get("note", "")})
        for entry in tiles[len(tiles) - made:]:  # share the original weight between the versions
            entry["weight"] = round(entry["weight"] / made, 2)
        print(f"  {t['file']:>8}  {' '.join(t['edges'])}  {made} version(s)")
        if not made:
            failed.append(t["file"])

    head = {"name": out.name,
            "source": f"generated by python/wfc/meta_tilegen.py from {args.tileset} "
                      f"(--k {args.k} --steer {args.steer:g} --variants {args.variants} --seed {args.seed})",
            "edge_convention": spec.get("edge_convention", "")}
    body = ",\n    ".join(json.dumps(t) for t in tiles)
    (out / "tileset.json").write_text(f'{json.dumps(head, indent=2)[:-2]},\n  "tiles": [\n    {body}\n  ]\n}}\n',
                                      encoding="utf-8")
    print(f"wrote {len(tiles)} tiles to {out}")
    if failed:
        print("no solution for:", ", ".join(failed), "- these tiles are missing from the new set")


if __name__ == "__main__":
    main()
