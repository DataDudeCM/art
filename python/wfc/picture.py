"""WFC pictures: any image steers which tile goes in each cell.

Two modes:

  tone      Works with any image. Each tile's average brightness is measured,
            the picture is shrunk to one brightness per cell, and tiles close
            to their cell's brightness are favoured. With circuit2, chips fall
            in the shadows and white roads in the highlights.
  material  Needs a face. MediaPipe's face outline becomes a mask; tiles whose
            note matches --inside are favoured inside the face, --outside
            outside it. Nothing is shaded.

  python picture.py ../../common/images/bigeyes.jpg                 tone, circuit2
  python picture.py photo.jpg --cols 72 --strength 40 --seed 3 --debug
  python picture.py photo.jpg --mode material --edge 30             carbon-silicon
  python picture.py photo.jpg --tileset mondrian --equalize --strength 60 --cols 72 --window

--strength is how hard the picture pushes against the tile set's own weights
(0 ignores the picture). Each run prints how closely the result's brightness
follows the picture (r = 1 is perfect). Output goes to out/ (gitignored).
"""

import argparse
import sys
import time
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageOps

from solver import Solver
from tileset import TileSet
from view import add_match_args, render

HERE = Path(__file__).resolve().parent
DEFAULT_SET = {"tone": "circuit2", "material": "carbon-silicon"}


# -- tone ------------------------------------------------------------------

def picture_brightness(image_path, cols, rows, gamma, equalize=False):
    """The picture as one brightness per cell, 0-1, full tonal range.
    equalize spreads the tones evenly, so midtones get as many tile choices as the extremes."""
    img = ImageOps.exif_transpose(Image.open(image_path)).convert("L")
    img = ImageOps.autocontrast(img, cutoff=1).resize((cols, rows), Image.BOX)
    if equalize:
        img = ImageOps.equalize(img)
    return (np.asarray(img, dtype=np.float64) / 255.0) ** gamma


def tone_weights(lum, target, strength):
    """weight_fn: favour tiles whose brightness is near their cell's target.
    The target is stretched onto the tile set's own brightness range."""
    lo, hi = lum.min(), lum.max()
    goal = lo + (hi - lo) * target
    span = hi - lo

    def weight(x, y, v):
        d = (lum[v] - goal[y, x]) / span
        return float(np.exp(-strength * d * d))

    return weight


# -- material --------------------------------------------------------------

def face_mask(image_path, cols, rows, supersample=8):
    """Fraction of each grid cell inside the face outline, shape (rows, cols)."""
    sys.path.insert(0, str(HERE.parent / "eikonal"))  # shared face finder
    from face_points import face_outline

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
            band |= np.roll(np.roll(inside, dy, axis=0), dx, axis=1) != inside
    return band


def material_weights(ts, mask, inside, outside, strength, hard, edge=1.0):
    """weight_fn: favour `inside` tiles where the mask is 1, `outside` where it is 0,
    and multiply interface tiles by `edge` along the outline."""
    band = outline_band(mask) if edge != 1.0 else None
    material = [v.note for v in ts.variants]
    if inside not in material or outside not in material:
        raise SystemExit(f"tile notes in {ts.name} are {sorted(set(material))}; "
                         "pick --inside/--outside from those")

    def weight(x, y, v):
        m = mask[y, x]
        t = 2.0 * m - 1.0  # -1 fully outside, +1 fully inside
        if material[v] == inside:
            return 0.0 if hard and m == 0.0 else strength ** t
        if material[v] == outside:
            return 0.0 if hard and m == 1.0 else strength ** -t
        if material[v] == "interface" and band is not None and band[y, x]:
            return edge
        return 1.0

    return weight


# -- output ----------------------------------------------------------------

def tint_mask(art, mask, cell_px):
    """The render with the face mask tinted red, for checking the fit."""
    rows, cols = mask.shape
    tint = Image.fromarray((mask * 110).astype(np.uint8)).resize((cols * cell_px, rows * cell_px), Image.NEAREST)
    return Image.composite(Image.new("RGB", art.size, (220, 40, 40)), art, tint)


def side_by_side(target, art, height=600):
    """Target brightness grid | render | render blurred (how it reads from across a room)."""
    rows, cols = target.shape
    w = round(height * cols / rows)
    tgt = Image.fromarray((target * 255).astype(np.uint8)).resize((w, height), Image.NEAREST).convert("RGB")
    a = art.resize((w, height), Image.LANCZOS)
    far = art.resize((cols, rows), Image.BOX).resize((w, height), Image.BICUBIC)
    sheet = Image.new("RGB", (3 * w + 20, height), "white")
    for k, im in enumerate((tgt, a, far)):
        sheet.paste(im, (k * (w + 10), 0))
    return sheet


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("image")
    ap.add_argument("--mode", choices=["tone", "material"], default="tone")
    ap.add_argument("--tileset", help="default: circuit2 for tone, carbon-silicon for material")
    ap.add_argument("--cols", type=int, default=48, help="grid width in cells; rows follow the image shape")
    ap.add_argument("--strength", type=float, help="how hard the picture pushes (tone default 20, material 6)")
    ap.add_argument("--seed", type=int)
    ap.add_argument("--cell", type=int, default=24, help="pixels per cell in the PNG")
    ap.add_argument("--bg", help="background colour or image behind transparent tiles")
    ap.add_argument("--debug", action="store_true", help="also save a comparison sheet")
    ap.add_argument("--entropy", action="store_true",
                    help="also save <name>-entropy.png: options each cell had when decided (black = forced)")
    ap.add_argument("--window", action="store_true",
                    help="watch it collapse in a window (Backspace = new seed, S = save, Space = pause, Esc = quit)")
    ap.add_argument("--speed", type=int, help="window: collapses per frame (default: scales with grid)")
    ap.add_argument("--out", help="output PNG (default: out/<mode>-<image>-s<seed>.png)")
    tone = ap.add_argument_group("tone mode")
    tone.add_argument("--gamma", type=float, default=1.0, help=">1 darkens midtones before matching")
    tone.add_argument("--flat", action="store_true", help="ignore the tile set's own weights")
    tone.add_argument("--equalize", action="store_true", help="spread the picture's tones evenly first")
    mat = ap.add_argument_group("material mode")
    mat.add_argument("--inside", default="carbon", help="tile note favoured inside the face")
    mat.add_argument("--outside", default="silicon", help="tile note favoured outside the face")
    mat.add_argument("--hard", action="store_true", help="forbid the wrong material entirely")
    mat.add_argument("--edge", type=float, default=1.0, help="multiply electrode tiles along the outline")
    add_match_args(ap)
    args = ap.parse_args()

    ts = TileSet(args.tileset or DEFAULT_SET[args.mode], match=args.match, tol=args.tol, bg=args.bg,
                 sections=args.sections)
    if args.flat:
        for v in ts.variants:
            v.weight = 1.0
    w, h = ImageOps.exif_transpose(Image.open(args.image)).size
    cols, rows = args.cols, max(1, round(args.cols * h / w))

    if args.mode == "tone":
        strength = 20.0 if args.strength is None else args.strength
        lum = np.array(ts.brightness(args.bg))
        target = picture_brightness(args.image, cols, rows, args.gamma, args.equalize)
        weight_fn = tone_weights(lum, target, strength)
    else:
        strength = 6.0 if args.strength is None else args.strength
        mask = face_mask(args.image, cols, rows)
        weight_fn = material_weights(ts, mask, args.inside, args.outside, strength, args.hard, args.edge)

    if args.window:
        import view

        view_args = argparse.Namespace(seed=args.seed, cell=args.cell, bg=args.bg, window=1000, entropy=args.entropy,
                                       speed=args.speed, save_prefix=f"{args.mode}-{Path(args.image).stem}")
        view.window(ts, view_args, weight_fn=weight_fn, size=(cols, rows),
                    title=f"{ts.name} from {Path(args.image).name}")
        return

    t0 = time.time()
    solver = Solver(ts, cols, rows, seed=args.seed, weight_fn=weight_fn)
    cells = solver.solve()
    print(f"{ts.name} {cols}x{rows}, strength {strength:g}, seed {solver.seed}, "
          f"attempt {solver.attempt + 1}, {time.time() - t0:.2f}s")

    if args.mode == "tone":
        got = lum[np.array(cells)].reshape(rows, cols)
        r = np.corrcoef(got.ravel(), target.ravel())[0, 1]
        print(f"  brightness follows the picture: r = {r:.2f}")
    else:
        notes = np.array([ts.variants[v].note for v in cells]).reshape(rows, cols)
        inside = mask > 0.5
        for name in (args.inside, args.outside, "interface"):
            print(f"  {name:10} inside face {np.mean(notes[inside] == name):5.0%}   "
                  f"outside {np.mean(notes[~inside] == name):5.0%}")

    art = render(ts, cells, cols, rows, args.cell, args.bg)
    out = Path(args.out) if args.out else HERE / "out" / f"{args.mode}-{Path(args.image).stem}-s{solver.seed}.png"
    out.parent.mkdir(parents=True, exist_ok=True)
    art.save(out)
    print("wrote", out)
    if args.debug:
        extra = out.with_name(out.stem + "-debug.png")
        (side_by_side(target, art) if args.mode == "tone" else tint_mask(art, mask, args.cell)).save(extra)
        print("wrote", extra)
    if args.entropy:
        from view import entropy_map

        extra = out.with_name(out.stem + "-entropy.png")
        entropy_map(solver, args.cell).save(extra)
        print("wrote", extra)


if __name__ == "__main__":
    main()
