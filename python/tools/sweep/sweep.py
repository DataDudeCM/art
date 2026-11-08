"""
Sweep the parameters of a starter sketch and make contact sheets.

    python python/tools/sweep/sweep.py strips substrate
    python python/tools/sweep/sweep.py strips substrate --steps 9 --seeds 3

strips: one strip per parameter. That parameter takes --steps values
across its range while the others stay at their defaults; each row is a
seed. Shows which parameters matter and where the sketch breaks.

Output goes to <sketch>/sweeps/<date>-strips/ (kept out of git):
  tiles/                 every render at full size
  strip_<param>.png      one contact sheet per parameter
  index.png              all strips stacked
  manifest.json          every tile's params, seed, file, status, timing
"""

import argparse
import datetime
import json
import math
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, str(Path(__file__).parent))

from render import Job, render_all  # noqa: E402
from starter import build_sketch, defaults, find_starter, load_starter  # noqa: E402

TILE = 200          # thumbnail size on the sheets
GAP = 10
LABEL_H = 34        # value + coverage under each tile
TITLE_H = 46        # parameter name + about above each strip
SEED_W = 64         # seed labels left of each row

INK = (40, 40, 40)
MUTED = (120, 120, 120)
PAPER = (245, 243, 238)
DEFAULT_RING = (200, 60, 40)
FAILED = (190, 190, 190)


# ---------------------------------------------------------------- values

def strip_values(p: dict, steps: int) -> list:
    """The values one parameter takes in its strip."""

    if isinstance(p["default"], bool):
        return [False, True]

    low, high = p["min"], p["max"]

    if p.get("scale") == "log" and low > 0:
        values = [low * (high / low) ** (i / (steps - 1)) for i in range(steps)]
    else:
        values = [low + (high - low) * i / (steps - 1) for i in range(steps)]

    if p.get("integer"):
        values = {int(round(v)) for v in values}
    else:
        values = {float(f"{v:.4g}") for v in values}

    # Always include the exact default, so its tile is a true reference.
    values.add(p["default"])
    return sorted(values)


def find_default(values: list, default) -> int:
    """Index of the default's tile (it gets a ring)."""

    return values.index(default)


def fmt(value) -> str:
    if isinstance(value, bool):
        return str(value).lower()
    if isinstance(value, int):
        return str(value)
    return f"{value:g}"


# ---------------------------------------------------------------- sheets

def font(size: int):
    for name in ("segoeui.ttf", "arial.ttf", "DejaVuSans.ttf"):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default(size=size)


def draw_strip(name: str, p: dict, values: list, seeds: list, tiles: dict,
               default_index: int) -> Image.Image:
    """One parameter's sheet: values across, seeds down."""

    width = SEED_W + len(values) * (TILE + GAP) + GAP
    height = TITLE_H + len(seeds) * (TILE + LABEL_H + GAP) + GAP
    sheet = Image.new("RGB", (width, height), PAPER)
    draw = ImageDraw.Draw(sheet)
    title, small = font(18), font(13)

    about = p.get("about", "")
    while about and draw.textlength(about, font=small) > width - 2 * GAP:
        about = about[:-2].rstrip() + "…"
    draw.text((GAP, 6), name, fill=INK, font=title)
    draw.text((GAP, 28), about, fill=MUTED, font=small)

    for row, seed in enumerate(seeds):
        y = TITLE_H + row * (TILE + LABEL_H + GAP)
        draw.text((GAP, y + TILE // 2 - 8), f"seed {seed}", fill=MUTED, font=small)

        for col, value in enumerate(values):
            x = SEED_W + col * (TILE + GAP)
            tile = tiles[(col, seed)]

            if tile["file"] and tile["status"] != "error":
                with Image.open(tile["path"]) as image:
                    sheet.paste(image.convert("RGB").resize((TILE, TILE), Image.Resampling.LANCZOS), (x, y))
            else:
                draw.rectangle([x, y, x + TILE - 1, y + TILE - 1], fill=FAILED)

            if tile["status"] != "ok":
                draw.rectangle([x, y, x + TILE - 1, y + 20], fill=(60, 60, 60))
                draw.text((x + 6, y + 3), tile["status"].upper(), fill=(255, 255, 255), font=small)

            if col == default_index:
                draw.rectangle([x - 3, y - 3, x + TILE + 2, y + TILE + 2], outline=DEFAULT_RING, width=3)

            label = fmt(value) + ("  (default)" if col == default_index else "")
            draw.text((x, y + TILE + 3), label, fill=INK, font=small)
            if tile["coverage"] is not None:
                draw.text((x, y + TILE + 18), f"ink {tile['coverage']:.0%}", fill=MUTED, font=small)

    return sheet


def stack(images: list[Image.Image]) -> Image.Image:
    width = max(im.width for im in images)
    height = sum(im.height for im in images)
    sheet = Image.new("RGB", (width, height), PAPER)
    y = 0
    for im in images:
        sheet.paste(im, (0, y))
        y += im.height
    return sheet


# ---------------------------------------------------------------- strips

def out_folder(starter_dir: Path, kind: str) -> Path:
    base = starter_dir.parent / "sweeps" / f"{datetime.date.today():%Y-%m-%d}-{kind}"
    folder, n = base, 2
    while folder.exists():
        folder = base.with_name(f"{base.name}-{n}")
        n += 1
    return folder


def cmd_strips(args) -> None:
    starter_dir = find_starter(args.starter)
    sketch, spec = load_starter(starter_dir)
    base = defaults(spec)
    seeds = list(range(args.seed, args.seed + args.seeds))

    only = set(args.only.split(",")) if args.only else None
    names = [n for n in spec["params"] if not only or n in only]

    folder = out_folder(starter_dir, "strips")
    plan = []   # (name, values, default_index, [tile dicts])
    jobs, tiles = [], []

    for name in names:
        p = spec["params"][name]
        values = strip_values(p, args.steps)
        strip_tiles = []

        for col, value in enumerate(values):
            for seed in seeds:
                params = {**base, name: value}
                path = folder / "tiles" / f"{name}_{col:02d}_s{seed}.png"
                tile = {
                    "param": name, "value": value, "index": col, "seed": seed,
                    "params": params, "file": str(path.relative_to(folder)).replace("\\", "/"),
                    "path": path, "status": None, "ms": None, "coverage": None, "errors": [],
                }
                jobs.append(Job(sketch=build_sketch(sketch, params, seed), out_path=path))
                tiles.append(tile)
                strip_tiles.append(tile)

        plan.append((name, values, find_default(values, p["default"]), strip_tiles))

    print(f"{spec.get('name', args.starter)}: {len(names)} parameters, "
          f"{len(jobs)} renders, {args.workers} at a time -> {folder}")

    def on_done(index, job, result):
        tile = tiles[index]
        tile.update(status=result.status, ms=result.ms, coverage=result.coverage, errors=result.errors)
        if not job.out_path.exists():
            tile["file"] = None
        done = sum(1 for t in tiles if t["status"])
        mark = "" if result.status == "ok" else f"  {result.status.upper()}"
        print(f"  [{done:>4}/{len(jobs)}] {tile['param']}={fmt(tile['value'])} "
              f"seed {tile['seed']}  {result.ms / 1000:.1f}s{mark}", flush=True)

    render_all(jobs, workers=args.workers, timeout_ms=args.timeout * 1000, on_done=on_done)

    strips = []
    for name, values, default_index, strip_tiles in plan:
        by_cell = {(t["index"], t["seed"]): t for t in strip_tiles}
        image = draw_strip(name, spec["params"][name], values, seeds, by_cell, default_index)
        image.save(folder / f"strip_{name}.png")
        strips.append(image)

    stack(strips).save(folder / "index.png")

    manifest = {
        "kind": "strips",
        "starter": args.starter,
        "starter_dir": str(starter_dir),
        "created": datetime.datetime.now().isoformat(timespec="seconds"),
        "steps": args.steps,
        "seeds": seeds,
        "defaults": base,
        "tiles": [{k: v for k, v in t.items() if k != "path"} for t in tiles],
    }
    (folder / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")

    counts = {}
    for t in tiles:
        counts[t["status"]] = counts.get(t["status"], 0) + 1
    total_s = sum(t["ms"] for t in tiles) / 1000
    print(f"Done: {counts}. Render time {total_s:.0f}s total. Sheets in {folder}")


# ---------------------------------------------------------------- main

def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest="command", required=True)

    strips = sub.add_parser("strips", help="one strip per parameter, others at defaults")
    strips.add_argument("starter", help="starter name (its sketch's folder name) or path")
    strips.add_argument("--steps", type=int, default=7, help="values per parameter (default 7)")
    strips.add_argument("--seeds", type=int, default=1, help="seeds per value, one row each (default 1)")
    strips.add_argument("--seed", type=int, default=1, help="first seed (default 1)")
    strips.add_argument("--only", help="comma-separated parameter names to strip")
    strips.add_argument("--workers", type=int, default=4, help="pages rendering at once (default 4)")
    strips.add_argument("--timeout", type=int, default=20, help="seconds before a render is taken as it is")
    strips.set_defaults(func=cmd_strips)

    args = parser.parse_args()
    if getattr(args, "steps", 2) < 2:
        parser.error("--steps must be at least 2")
    args.func(args)


if __name__ == "__main__":
    main()
