"""WFC portrait, step 1: material only.

The face outline (found with MediaPipe) becomes a mask over the grid. Tiles
whose note matches --inside are favoured inside the face, tiles matching
--outside are favoured outside it, and nothing is shaded. With the
carbon-silicon set the two materials can only meet through electrode
("interface") tiles, so if it works, the face's silhouette is drawn by where
those electrodes land.

  python portrait.py ../../common/images/bigeyes.jpg
  python portrait.py photo.jpg --cols 60 --strength 8 --seed 3 --debug
  python portrait.py photo.jpg --hard          forbid the wrong material outright

--strength is how hard the picture pushes: 1 ignores the face, 4 is a nudge,
20+ is close to --hard. Output goes to out/ (gitignored).
"""

import argparse
import sys
import time
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageOps

from solver import Solver
from tileset import TileSet
from view import render

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / "eikonal"))  # shared face finder
from face_points import face_outline  # noqa: E402


def face_mask(image_path, cols, rows, supersample=8):
    """Fraction of each grid cell that lies inside the face outline, shape (rows, cols)."""
    outline = face_outline(image_path)
    if outline is None:
        raise SystemExit("no face found in the image")
    W, H = cols * supersample, rows * supersample
    img = Image.new("L", (W, H), 0)
    ImageDraw.Draw(img).polygon([(x * W, y * H) for x, y in outline], fill=255)
    a = np.asarray(img, dtype=np.float64) / 255.0
    return a.reshape(rows, supersample, cols, supersample).mean(axis=(1, 3))


def outline_band(mask, width=1):
    """True for cells within `width` cells of the face outline."""
    inside = mask > 0.5
    band = np.zeros_like(inside)
    for dy in range(-width, width + 1):
        for dx in range(-width, width + 1):
            shifted = np.roll(np.roll(inside, dy, axis=0), dx, axis=1)
            band |= shifted != inside
    return band


def material_weights(ts, mask, inside, outside, strength, hard, edge=1.0):
    """weight_fn: favour `inside` tiles where the mask is 1, `outside` where it is 0,
    and multiply interface tiles by `edge` along the outline."""
    band = outline_band(mask) if edge != 1.0 else None
    material = [v.note for v in ts.variants]
    if inside not in material or outside not in material:
        names = sorted(set(material))
        raise SystemExit(f"tile notes in {ts.name} are {names}; pick --inside/--outside from those")

    def weight(x, y, v):
        m = mask[y, x]
        t = 2.0 * m - 1.0  # -1 fully outside, +1 fully inside
        if material[v] == inside:
            if hard and m == 0.0:
                return 0.0
            return strength ** t
        if material[v] == outside:
            if hard and m == 1.0:
                return 0.0
            return strength ** -t
        if material[v] == "interface" and band is not None and band[y, x]:
            return edge
        return 1.0  # shared tiles, and interface tiles away from the outline: neutral

    return weight


def debug_image(art, mask, cell_px):
    """The render with the face mask tinted red, for checking the fit."""
    rows, cols = mask.shape
    tint = Image.fromarray((mask * 110).astype(np.uint8)).resize((cols * cell_px, rows * cell_px), Image.NEAREST)
    red = Image.new("RGB", art.size, (220, 40, 40))
    return Image.composite(red, art, tint)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("image")
    ap.add_argument("--tileset", default="carbon-silicon")
    ap.add_argument("--inside", default="carbon", help="tile note favoured inside the face")
    ap.add_argument("--outside", default="silicon", help="tile note favoured outside the face")
    ap.add_argument("--cols", type=int, default=48, help="grid width in cells; rows follow the image shape")
    ap.add_argument("--strength", type=float, default=6.0, help="how hard the face pushes (1 = not at all)")
    ap.add_argument("--hard", action="store_true", help="forbid the wrong material entirely")
    ap.add_argument("--edge", type=float, default=1.0,
                    help="multiply interface (electrode) tiles along the face outline, e.g. 30")
    ap.add_argument("--seed", type=int)
    ap.add_argument("--cell", type=int, default=24, help="pixels per cell in the PNG")
    ap.add_argument("--bg", help="background colour or image behind transparent tiles")
    ap.add_argument("--debug", action="store_true", help="also save a copy with the face mask tinted")
    ap.add_argument("--out", help="output PNG (default: out/portrait-<image>-s<seed>.png)")
    args = ap.parse_args()

    ts = TileSet(args.tileset)
    w, h = ImageOps.exif_transpose(Image.open(args.image)).size
    cols, rows = args.cols, max(1, round(args.cols * h / w))
    mask = face_mask(args.image, cols, rows)
    weight_fn = material_weights(ts, mask, args.inside, args.outside, args.strength, args.hard, args.edge)

    t0 = time.time()
    solver = Solver(ts, cols, rows, seed=args.seed, weight_fn=weight_fn)
    cells = solver.solve()
    print(f"{cols}x{rows} grid, seed {solver.seed}, attempt {solver.attempt + 1}, {time.time() - t0:.2f}s")

    notes = np.array([ts.variants[v].note for v in cells]).reshape(rows, cols)
    inside = mask > 0.5
    for name in (args.inside, args.outside, "interface"):
        print(f"  {name:10} inside face {np.mean(notes[inside] == name):5.0%}   "
              f"outside {np.mean(notes[~inside] == name):5.0%}")

    art = render(ts, cells, cols, rows, args.cell, args.bg)
    out = Path(args.out) if args.out else HERE / "out" / f"portrait-{Path(args.image).stem}-s{solver.seed}.png"
    out.parent.mkdir(parents=True, exist_ok=True)
    art.save(out)
    print("wrote", out)
    if args.debug:
        dbg = out.with_name(out.stem + "-mask.png")
        debug_image(art, mask, args.cell).save(dbg)
        print("wrote", dbg)


if __name__ == "__main__":
    main()
