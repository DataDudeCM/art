"""One-off: copy the tile sets from python/pygame/tileart/ into common/tilesets/
and write a tileset.json for each.

Already run (November 2026). tileart/ was removed afterwards, so this no longer
runs as is; it stays as the record of where each edge table came from. To run
it again, restore tileart/ from git history first.

Edge tables are read straight out of tileart/tiles_v2/tile.py (setuptiles), so
the codes and weights are Chris's own, not retyped. `numsym` becomes a
per-tile "rotate" flag: tiles before numsym were never rotated.

A few sets had no table in tile.py; their tables are below, with where they
came from. Run from anywhere:  python import_tileart.py
"""

import json
import re
import shutil
from pathlib import Path

ART = Path(__file__).resolve().parents[2]
OLD = ART / "python" / "pygame" / "tileart"
NEW = ART / "common" / "tilesets"

CONVENTION = ("Edges are [top, right, bottom, left], each read clockwise around the tile "
              "(top left>right, right top>bottom, bottom right>left, left bottom>top). "
              "Two sides fit when one is the other reversed. Weights are per orientation. "
              "rotate=false: the tile is used only as drawn.")

# Old folder name -> new folder name (lowercase, hyphenated).
NAMES = {
    "ArcanePipe": "arcane-pipe",
    "circuit": "circuit",
    "circuit-coding-train": "circuit-coding-train",
    "circuit2": "circuit2",
    "hole": "hole",
    "ironpipe": "ironpipe",
    "Mondrian": "mondrian",
    "plumbing": "plumbing",
    "road": "road",
    "Subway": "subway",
}

# Sets with no live table in tile.py.
EXTRA = {
    # Pixel-art version of circuit-coding-train, same 13 tiles in the same order.
    # Its only table (tileart/tileart.py) had errors (e.g. "ACA"), so it uses the
    # corrected circuit-coding-train table.
    "circuit": {"same_as": "circuit-coding-train",
                "source": "edge table from circuit-coding-train in tiles_v2/tile.py"},
    # Commented-out "Road images" table in tiles_v2/tile.py and tileart/tileart.py.
    # The four T-junctions are drawn in all four orientations, so nothing rotates.
    # tileart_old.py listed the blank twice, so it gets double weight.
    "road": {"numsym": 5, "source": "commented-out table in tiles_v2/tile.py",
             "tiles": [(0, ["AAA", "AAA", "AAA", "AAA"], 200, "blank"),
                       (1, ["AAA", "ABA", "ABA", "ABA"], 100, "T, opens down"),
                       (2, ["ABA", "AAA", "ABA", "ABA"], 100, "T, opens left"),
                       (3, ["ABA", "ABA", "ABA", "AAA"], 100, "T, opens right"),
                       (4, ["ABA", "ABA", "AAA", "ABA"], 100, "T, opens up")]},
}
# Not imported: pipe (tile 1 is a copy of tile 0 but its table calls it a cross;
# an early version of ironpipe) and datamodel (one unfinished tile).

def write_manifest(path, manifest):
    """JSON with one tile per line, so edges and weights are easy to edit by hand."""
    head = {k: v for k, v in manifest.items() if k != "tiles"}
    body = json.dumps(head, indent=2)[:-2]
    tiles = ",\n    ".join(json.dumps(t) for t in manifest["tiles"])
    path.write_text(f'{body},\n  "tiles": [\n    {tiles}\n  ]\n}}\n', encoding="utf-8")


LINE = re.compile(r'Tile\(tileImages\[(\d+)\],\s*\[([^\]]*)\]\s*(?:,\s*(\d+))?\)\)\s*(?:#\s*(.*))?')


def parse_tile_py():
    """Return {set name: {"numsym": n, "tiles": [(i, edges, weight, note)]}}."""
    text = (OLD / "tiles_v2" / "tile.py").read_text(encoding="utf-8")
    text = text.split('"""')[0]  # everything after the first docstring is commented out
    sets, current = {}, None
    for line in text.splitlines():
        m = re.match(r'\s*case\s+"([^"]+)"', line)
        if m:
            current = sets.setdefault(m.group(1), {"numsym": 0, "tiles": []})
            continue
        if current is None:
            continue
        m = re.match(r"\s*numsym\s*=\s*(\d+)", line)
        if m:
            current["numsym"] = int(m.group(1))
            continue
        m = LINE.search(line)
        if m and not line.lstrip().startswith("#"):
            edges = [e.strip().strip('"') for e in m.group(2).split(",")]
            note = (m.group(4) or "").strip()
            if note in ("corner", "cross", "t", ""):  # copy-pasted labels, not descriptions
                note = ""
            current["tiles"].append((int(m.group(1)), edges, int(m.group(3) or 100), note))
    return sets


def main():
    tables = parse_tile_py()
    for name, spec in EXTRA.items():
        tables[name] = tables[spec["same_as"]] if "same_as" in spec else spec

    NEW.mkdir(parents=True, exist_ok=True)
    for old, new in NAMES.items():
        table = tables[old]
        src, dst = OLD / "tiles" / old, NEW / new
        dst.mkdir(exist_ok=True)
        for f in src.iterdir():
            if f.is_file():
                shutil.copy2(f, dst / f.name)
        tiles = []
        for i, edges, weight, note in table["tiles"]:
            t = {"file": f"{i}.png", "edges": edges, "weight": weight,
                 "rotate": i >= table["numsym"]}
            if note:
                t["note"] = note
            tiles.append(t)
        manifest = {"name": new,
                    "source": f"python/pygame/tileart/tiles/{old}; "
                              + EXTRA.get(old, {}).get("source", "edge table from tiles_v2/tile.py"),
                    "edge_convention": CONVENTION,
                    "tiles": tiles}
        write_manifest(dst / "tileset.json", manifest)
        print(f"{new:22} {len(tiles):3} tiles  ({sum(t['rotate'] for t in tiles)} rotate)")

    # carbon-silicon: generated tiles plus their own manifest.
    cs_src, cs_dst = OLD / "carbon_silicon_out", NEW / "carbon-silicon"
    cs = json.loads((cs_src / "manifest.json").read_text(encoding="utf-8"))
    cs_dst.mkdir(exist_ok=True)
    for f in (cs_src / "tiles").iterdir():
        shutil.copy2(f, cs_dst / f.name)
    shutil.copy2(cs_src / "contact_sheet.png", cs_dst / "contact_sheet.png")
    manifest = {"name": "carbon-silicon",
                "source": "generated by python/pygame/tileart/carbon_silicon_tilegen.py "
                          f"(seed {cs['seed']})",
                "edge_convention": CONVENTION,
                "tiles": [{"file": t["filename"], "edges": t["edges"], "weight": t["weight"],
                           "rotate": True, "note": t["set"]} for t in cs["tiles"]]}
    write_manifest(cs_dst / "tileset.json", manifest)
    print(f"{'carbon-silicon':22} {len(manifest['tiles']):3} tiles")


if __name__ == "__main__":
    main()
