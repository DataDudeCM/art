"""Watch wave function collapse fill a grid with one of the tile sets in
common/tilesets/, or render straight to a PNG.

  python view.py --list                       tile sets: brightness range and spread, edge warnings
  python view.py --list --bg white            the same, measured over a white background
  python view.py circuit2                     animate a 20x20 grid in a window
  python view.py circuit2 --size 40x30 --seed 7
  python view.py plumbing --size 60x60 --out board.png    no window, just the PNG

Window keys: Backspace = new seed, S = save PNG to out/, Space = pause, Esc = quit.
The seed is printed and shown in the title, so a picture can be made again.
"""

import argparse
import time
from pathlib import Path

from PIL import Image, ImageColor

from solver import Solver
from tileset import TileSet, available

OUT = Path(__file__).resolve().parent / "out"


def parse_size(text):
    w, _, h = text.lower().partition("x")
    return int(w), int(h or w)


def background(spec, size):
    """A colour like #202020, or a path to an image that is stretched to fit."""
    if spec and Path(spec).exists():
        return Image.open(spec).convert("RGBA").resize(size)
    return Image.new("RGBA", size, ImageColor.getrgb(spec or "#202020"))


def render(ts, cells, w, h, cell_px, bg=None):
    canvas = background(bg, (w * cell_px, h * cell_px))
    cache = {}
    for idx, v in enumerate(cells):
        if v not in cache:
            cache[v] = ts.variants[v].image.resize((cell_px, cell_px), Image.LANCZOS)
        tile = cache[v]
        canvas.alpha_composite(tile, ((idx % w) * cell_px, (idx // w) * cell_px))
    return canvas.convert("RGB")


def save(ts, solver, args, path=None):
    prefix = getattr(args, "save_prefix", None) or ts.name
    path = Path(path) if path else OUT / f"{prefix}_{solver.w}x{solver.h}_s{solver.seed}.png"
    path.parent.mkdir(parents=True, exist_ok=True)
    render(ts, solver.result(), solver.w, solver.h, args.cell, args.bg).save(path)
    print("wrote", path)


BARS = " ▁▂▃▄▅▆▇█"


def spread_bar(values, bins=20):
    """One character per brightness band from black (left) to white (right);
    taller means more tile variants at that brightness."""
    counts = [0] * bins
    for v in values:
        counts[min(bins - 1, int(v * bins))] += 1
    top = max(counts)
    return "".join(BARS[0 if c == 0 else max(1, round(c / top * 8))] for c in counts)


def list_sets(bg=None):
    print(f"{'tile set':22} {'variants':>8}   brightness     black {'':12} white")
    for name in available():
        ts = TileSet(name)
        lum = ts.brightness(bg)
        flag = "  *" if ts.transparent() else ""
        print(f"{name:22} {len(ts):8}   {min(lum):.2f} - {max(lum):.2f}    |{spread_bar(lum)}|{flag}")
        for warning in ts.lint():
            print("    warning:", warning)
    print(f"\n* has transparent tiles: brightness measured over --bg ({bg or '#202020'}); "
          "a different background changes it.")


def window(ts, args, weight_fn=None, size=None, title=None):
    """Animated solve. weight_fn and size let picture.py reuse this window;
    without them it behaves as before."""
    import pygame

    w, h = size or args.size
    title = title or ts.name
    px = max(4, min(args.window // w, args.window // h))
    pygame.init()
    screen = pygame.display.set_mode((w * px, h * px))
    surfaces = [pygame.image.fromstring(v.image.resize((px, px), Image.LANCZOS).tobytes(),
                                        (px, px), "RGBA") for v in ts.variants]
    bg = render_bg = pygame.image.fromstring(background(args.bg, (w * px, h * px)).tobytes(),
                                             (w * px, h * px), "RGBA")
    speed = args.speed or max(1, (w * h) // 400)  # steps per frame: about 7 s per grid
    clock = pygame.time.Clock()

    def start(seed):
        solver = Solver(ts, w, h, seed=seed, weight_fn=weight_fn)
        screen.blit(bg, (0, 0))
        pygame.display.set_caption(f"{title}  seed {solver.seed}")
        print("seed", solver.seed)
        return solver, solver.steps()

    solver, steps = start(args.seed)
    finished = paused = False
    while True:
        for event in pygame.event.get():
            if event.type == pygame.QUIT or (event.type == pygame.KEYDOWN and event.key == pygame.K_ESCAPE):
                pygame.quit()
                return
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_BACKSPACE:
                    solver, steps = start(None)
                    finished = False
                elif event.key == pygame.K_SPACE:
                    paused = not paused
                elif event.key == pygame.K_s:
                    if finished:
                        save(ts, solver, args)
                    else:
                        print("still solving; save when it's finished")
        if not finished and not paused:
            for _ in range(speed):
                try:
                    kind, decided = next(steps)
                except StopIteration:
                    finished = True
                    pygame.display.set_caption(f"{title}  seed {solver.seed}  done "
                                               f"(attempt {solver.attempt + 1})  S = save")
                    break
                if kind == "restart":
                    screen.blit(render_bg, (0, 0))
                    continue
                for idx in decided:
                    v = solver.cells[idx].bit_length() - 1
                    screen.blit(surfaces[v], ((idx % w) * px, (idx // w) * px))
        pygame.display.flip()
        clock.tick(60)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("tileset", nargs="?", help="name of a folder in common/tilesets/")
    ap.add_argument("--list", action="store_true", help="list tile sets and check their edges")
    ap.add_argument("--size", type=parse_size, default=(20, 20), metavar="WxH", help="grid in cells (default 20x20)")
    ap.add_argument("--seed", type=int, help="same seed, same picture (default: random)")
    ap.add_argument("--out", help="render to this PNG without opening a window")
    ap.add_argument("--cell", type=int, default=64, help="pixels per cell in saved PNGs (default 64)")
    ap.add_argument("--bg", help="background colour (#202020) or image path, behind transparent tiles")
    ap.add_argument("--window", type=int, default=1000, help="window size limit in pixels")
    ap.add_argument("--speed", type=int, help="collapses per frame (default: scales with grid)")
    args = ap.parse_args()

    if args.list or not args.tileset:
        list_sets(args.bg)
        return
    ts = TileSet(args.tileset)
    if args.out:
        t0 = time.time()
        solver = Solver(ts, *args.size, seed=args.seed)
        solver.solve()
        print(f"seed {solver.seed}, attempt {solver.attempt + 1}, {time.time() - t0:.2f}s")
        save(ts, solver, args, args.out)
    else:
        window(ts, args)


if __name__ == "__main__":
    main()
