# wfc

Wave function collapse with the tile sets in `common/tilesets/`. This replaces the old `python/pygame/tileart/` scripts, which are in git history if ever needed.

```
python view.py --list                      tile sets, with any edge warnings
python view.py circuit2                    animate a 20x20 grid in a window
python view.py circuit2 --size 40x30 --seed 7
python view.py plumbing --size 60x60 --out board.png    no window, just the PNG
```

Runs from any folder. Window keys: Backspace = new seed, S = save to `out/`, Space = pause, Esc = quit. `python view.py --help` lists every option.

| File | Job |
|---|---|
| `tileset.py` | Loads `common/tilesets/<name>/tileset.json`, expands rotations, works out which tiles fit next to which |
| `solver.py` | The collapse itself. No pygame. `weight_fn(x, y, variant)` steers tile choice per cell |
| `view.py` | Window and headless rendering |
| `import_tileart.py` | One-off that converted the old `tileart` sets. Kept as a record of where each table came from |
| `carbon_silicon_tilegen.py` | Generates the carbon-silicon tiles. It writes its own `manifest.json` (and has its own small solver); after regenerating, copy the PNGs into `common/tilesets/carbon-silicon/` and update `tileset.json` to match |

`common/tilesets/pipe/` and `datamodel/` are unfinished sets with no `tileset.json`, so `--list` skips them.

## Tile set format

Each set is a folder of PNGs plus `tileset.json`:

```json
{"file": "3.png", "edges": ["BBB", "BDB", "BBB", "BDB"], "weight": 20, "rotate": true, "note": "white road"}
```

- `edges` are top, right, bottom, left, each read clockwise around the tile. Two sides fit when one is the other reversed (`"ABB"` fits `"BBA"`).
- `weight` applies to each orientation.
- `rotate: false` uses the tile only as drawn (blanks, or sets drawn in every orientation already).
- A rotation is skipped only when its edges and its picture both repeat, so symmetric tiles aren't counted twice.

To add a set: make the folder, write the JSON, and run `view.py --list` to catch edges that match nothing.

## Known limits

- `road` has only T-junctions and a blank, so most layouts can't close. It works up to about 30x30 and fails at 40x40.
- On a dead end the solver restarts the whole grid (with a seed derived from yours, so results stay repeatable). Fine for every set so far. If portrait weighting causes frequent dead ends, backtracking is the next step.
