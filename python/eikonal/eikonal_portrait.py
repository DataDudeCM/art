
"""Eikonal portrait: treat a face as a medium that waves travel through.

Brightness is wave speed: c = cmin + (1 - cmin) * I. From one or more seed
points we solve |grad T| = 1/c, where T is the arrival time of the wavefront.

  fronts  draw the fronts T = d, 2d, 3d ... Spacing is proportional to c, so
          dark regions pack lines tightly and the image halftones itself.
  seams   with several seeds, each front claims territory until it collides
          with a neighbour's. Draw only the collision seams, in gold, over the
          darkened photo (geodesic kintsugi).
  both    fronts in black plus seams in gold, on paper.

Needs numpy and Pillow; named seeds also need mediapipe. Examples:

  python eikonal_portrait.py photo.jpg --seed 0.37,0.40
  python eikonal_portrait.py photo.jpg --seed 0.37,0.40 --seed 0.62,0.40 --seed 0.5,0.62
  python eikonal_portrait.py photo.jpg --random 5 --rng 3 --mode both
  python eikonal_portrait.py photo.jpg --face --mode both
  python eikonal_portrait.py photo.jpg --seed left-eye --seed mouth --seed 0.9,0.1

A seed is x,y as fractions of the image (0,0 = top left, no space after the
comma), or a feature found on the face: left-eye, right-eye, nose, mouth,
chin, brow (left/right = side of the picture). --face adds both eyes, the
nose and the mouth.
"""

import argparse
import heapq
import math
import random
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter, ImageOps

PAPER = (247, 244, 236)
INK = (22, 20, 18)
GOLD = (222, 176, 66)
INF = float("inf")


def load_gray(path, size, blur):
    """Grayscale in [0,1], long side = size, lightly blurred, full tonal range."""
    img = ImageOps.exif_transpose(Image.open(path)).convert("L")
    k = size / max(img.size)
    img = img.resize((round(img.width * k), round(img.height * k)), Image.LANCZOS)
    if blur > 0:
        img = img.filter(ImageFilter.GaussianBlur(blur))
    img = ImageOps.autocontrast(img, cutoff=1)
    return np.asarray(img, dtype=np.float64) / 255.0


def march(slowness, seed):
    """Fast marching (first-order upwind): arrival time T from one seed."""
    h, w = slowness.shape
    W = w + 2  # padded with a border that is already "done", so no edge checks
    n = W * (h + 2)
    slow = np.pad(slowness, 1, constant_values=1.0).ravel().tolist()
    done = bytearray(np.pad(np.zeros((h, w), np.uint8), 1, constant_values=1).ravel())
    tent = [INF] * n  # tentative times
    acc = [INF] * n  # accepted times (INF until a pixel is done)
    start = (seed[1] + 1) * W + (seed[0] + 1)
    tent[start] = 0.0
    heap = [(0.0, start)]
    pop, push, sqrt = heapq.heappop, heapq.heappush, math.sqrt

    while heap:
        t, i = pop(heap)
        if done[i]:
            continue
        done[i] = 1
        acc[i] = t
        for nb in (i - 1, i + 1, i - W, i + W):
            if done[nb]:
                continue
            a = acc[nb - 1]
            r = acc[nb + 1]
            if r < a:
                a = r
            b = acc[nb - W]
            d = acc[nb + W]
            if d < b:
                b = d
            f = slow[nb]
            diff = a - b
            if diff >= f or diff <= -f:  # front arrives along one axis only
                tn = (a if a < b else b) + f
            else:
                tn = 0.5 * (a + b + sqrt(2.0 * f * f - diff * diff))
            if tn < tent[nb]:
                tent[nb] = tn
                push(heap, (tn, nb))

    return np.array(acc).reshape(h + 2, W)[1:-1, 1:-1]


def upsample(a, scale, resample=Image.BICUBIC):
    img = Image.fromarray(a.astype(np.float32), mode="F")
    img = img.resize((a.shape[1] * scale, a.shape[0] * scale), resample)
    return np.asarray(img, dtype=np.float64)


def front_alpha(T, n_fronts, scale, width):
    """Antialiased coverage of the level lines of T, constant width in pixels."""
    delta = T.max() / n_fronts
    Tu = upsample(T, scale)
    gy, gx = np.gradient(Tu)
    grad = np.maximum(np.hypot(gx, gy), 1e-9)
    phase = Tu / delta
    dist = np.abs(phase - np.round(phase)) * delta / grad  # px to nearest front
    return np.clip(width / 2 + 0.5 - dist, 0.0, 1.0)


def seam_alpha(times, scale, width):
    """Soft mask of the borders between seed territories. Each seed's arrival
    time is upsampled first, so the seams are smooth rather than stair-stepped."""
    owner = np.argmin(np.stack([upsample(T, scale) for T in times]), axis=0)
    edge = np.zeros(owner.shape, dtype=np.uint8)
    edge[:, :-1] |= owner[:, :-1] != owner[:, 1:]
    edge[:-1, :] |= owner[:-1, :] != owner[1:, :]
    img = Image.fromarray(edge * 255).filter(ImageFilter.GaussianBlur(1.6 * width))
    m = np.asarray(img, dtype=np.float64) / 255.0
    return np.clip((m - 0.10) / 0.08, 0.0, 1.0)


def blend(base, color, alpha):
    return base * (1 - alpha[..., None]) + np.array(color, dtype=np.float64) * alpha[..., None]


def parse_seed(text):
    """A feature name stays a string; anything else must be x,y."""
    from face_points import FEATURES

    if text in FEATURES:
        return text
    try:
        x, y = (float(v) for v in text.split(","))
    except ValueError:
        raise argparse.ArgumentTypeError(
            f"'{text}' is not x,y or one of: {', '.join(FEATURES)}")
    return x, y


def resolve_seeds(image, seeds):
    """Replace feature names with positions found on the face."""
    names = [s for s in seeds if isinstance(s, str)]
    if not names:
        return seeds
    from face_points import find_features

    found = find_features(image)
    if found is None:
        raise SystemExit("no face found in the image; use x,y seeds instead")
    return [found[s] if isinstance(s, str) else s for s in seeds]


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("image")
    ap.add_argument("--seed", action="append", type=parse_seed, default=[], metavar="X,Y|NAME",
                    help="x,y as fractions of width,height, or a face feature; repeat for several")
    ap.add_argument("--face", action="store_true", help="seed both eyes, the nose and the mouth")
    ap.add_argument("--random", type=int, default=0, metavar="N", help="add N random seeds")
    ap.add_argument("--rng", type=int, default=1, help="random seed for --random")
    ap.add_argument("--mode", choices=["fronts", "seams", "both"],
                    help="default: fronts for one seed, seams for several")
    ap.add_argument("--cmin", type=float, default=0.05, help="wave speed in pure black (0-1]")
    ap.add_argument("--gamma", type=float, default=2.0, help=">1 darkens midtones before solving")
    ap.add_argument("--fronts", type=int, default=220, help="number of wavefronts drawn")
    ap.add_argument("--size", type=int, default=400, help="long side of the solve grid, px")
    ap.add_argument("--scale", type=int, default=4, help="output = size * scale")
    ap.add_argument("--blur", type=float, default=1.0, help="blur before solving, px")
    ap.add_argument("--line", type=float, default=1.3, help="front line width, output px")
    ap.add_argument("--seam", type=float, default=1.0, help="seam width multiplier")
    ap.add_argument("--out", help="output PNG (default: out/<name>-<mode>.png)")
    args = ap.parse_args()

    gray = load_gray(args.image, args.size, args.blur) ** args.gamma
    h, w = gray.shape

    requested = list(args.seed)
    if args.face:
        from face_points import FACE_SET
        requested += [n for n in FACE_SET if n not in requested]
    fracs = resolve_seeds(args.image, requested)
    rnd = random.Random(args.rng)
    fracs += [(rnd.random(), rnd.random()) for _ in range(args.random)]
    if not fracs:
        fracs = [(0.5, 0.5)]
    seeds = [(min(w - 1, max(0, int(x * w))), min(h - 1, max(0, int(y * h)))) for x, y in fracs]
    mode = args.mode or ("fronts" if len(seeds) == 1 else "seams")

    speed = args.cmin + (1 - args.cmin) * gray
    times = [march(1.0 / speed, seed) for seed in seeds]
    T = np.minimum.reduce(times)  # first arrival from any seed

    if mode == "seams":
        photo = upsample(gray, args.scale)
        canvas = np.repeat((18 + 150 * photo)[..., None], 3, axis=2)  # darkened photo
    else:
        canvas = np.ones((h * args.scale, w * args.scale, 3)) * np.array(PAPER, dtype=np.float64)
        canvas = blend(canvas, INK, front_alpha(T, args.fronts, args.scale, args.line))
    if mode in ("seams", "both"):
        canvas = blend(canvas, GOLD, seam_alpha(times, args.scale, args.seam))

    out = Path(args.out) if args.out else Path(__file__).parent / "out" / f"{Path(args.image).stem}-{mode}.png"
    out.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(np.clip(canvas, 0, 255).astype(np.uint8)).save(out)
    print("seeds:", " ".join(f"--seed {x:.3f},{y:.3f}" for x, y in fracs))
    print("wrote", out)


if __name__ == "__main__":
    main()
