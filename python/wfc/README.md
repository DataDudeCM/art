# wfc

Wave function collapse with the tile sets in `common/tilesets/`. This replaces the old `python/pygame/tileart/` scripts, which are in git history if ever needed.

Everything runs from any folder; the examples assume you are in `python/wfc/`. Every script lists its options with `--help`.

| I want to… | Script |
|---|---|
| see what tile sets exist | `view.py --list` |
| watch a board fill in, or save one | `view.py` |
| make a board that follows a picture | `picture.py` |
| make a new set where each tile is a small board of an existing set | `meta_tilegen.py` |
| generate line tiles that wrinkle or coil | `fractal_pipe_tilegen.py` |
| turn a saved board into a lit relief | `python/blender/heightfield.py` (see `docs/blender.md`) |

## Boards: `view.py`

```
python view.py --list                      tile sets: brightness range and spread, edge warnings
python view.py --list --bg white           the same, measured over a white background
python view.py circuit2                    animate a 20x20 grid in a window
python view.py circuit2 --size 40x30 --seed 7
python view.py plumbing --size 60x60 --bg gray --out board.png    no window, just the PNG
```

- Window keys: Backspace = new seed, S = save to `out/`, Space = pause, Esc = quit.
- The seed is printed and shown in the title; the same seed gives the same board.
- `--bg` is a colour (`white`, `gray`, `"#d8d4cc"`) or an image path. It shows behind transparent tiles such as plumbing.
- `--cell` sets the pixels per tile in saved PNGs.

### Match rules: `--match` and `--tol`

`--match` decides which sides may touch. It also works in `picture.py`.

| `--match` | Two sides fit when |
|---|---|
| `strings` (default) | the edge codes fit (one is the other reversed) |
| `edge` | the outer 20% strips of the two touching sides are within `--tol` in brightness |
| `tile` | the two tiles' overall brightness is within `--tol` |

Join rules with `+` to require all of them: `strings+edge`, `strings+tile`, `edge+tile`. `--tol` is on a 0–1 scale, default 0.1. Brightness is measured from the images each time the set loads (over `--bg` for transparent tiles), so nothing is stored in `tileset.json`.

```
python view.py circuit2 --match edge --size 40x30
python view.py mondrian --match strings+tile --tol 0.15
python view.py --list --match edge --tol 0.05      warnings for sides that fit nothing under these rules
```

- `edge` and `tile` ignore edge codes, so lines no longer join up; expect texture and tone fields.
- With `tile`, neighbours differ by at most `--tol`, so if the set's brightness has a gap wider than `--tol`, one board stays on one side of it. `edge` does the same unless some tile has a dark side and a light side to bridge the gap. Mondrian at 0.1 loses its yellow and white under both. `--list` shows each set's brightness and edge ranges.
- Too small a `--tol` gives restarts or "no solution"; too large and the rule does nothing.

## Pictures: `picture.py`

Any image steers which tile goes in each cell. Every tile still obeys the edge rules; the picture only tilts which legal tile is picked.

```
python picture.py ../../common/images/bigeyes.jpg                         tone mode, circuit2
python picture.py photo.jpg --tileset mondrian --equalize --strength 60 --cols 72
python picture.py photo.jpg --tileset plumbing --bg black --equalize --cols 72 --window
python picture.py photo.jpg --mode material --edge 30                     needs a face
```

- `--mode tone` (default) matches each tile's brightness to the picture. `--strength` is how hard the picture pushes (0 ignores it), `--equalize` spreads the picture's tones evenly, `--flat` ignores the set's own weights.
- `--mode material` needs a face: tiles whose note matches `--inside` are favoured inside the face outline, `--outside` outside it. Made for carbon-silicon.
- `--window` animates it in the same window as `view.py`; `--debug` saves a comparison sheet (target, render, distant view).
- Each run prints how closely the result's brightness follows the picture (r = 1 is perfect).
- Bold, simple shapes work best. Sets with a wide brightness range (see `--list`) work best for tone.

## Making tile sets

### `meta_tilegen.py`: WFC inside WFC

Builds a new set in which every tile of a source set is replaced by a small board of that set's own tiles.

```
python meta_tilegen.py plumbing                         -> common/tilesets/plumbing-2/
python view.py plumbing-2 --size 8x6 --cell 216 --bg black
```

How each new tile is made:

- **The border is forced.** Where the big tile's edge has a pipe, a small pipe of the same kind crosses at the same spot, and nowhere else. So the new tiles fit together exactly as the originals did.
- **The inside is steered** by the big tile's own picture, so small pipes gather where the big pipe is drawn.
- The new set keeps the source's edge codes, weights and rotate flags, so it works in `view.py`, `picture.py` and the relief script.

Options:

| Option | Default | What it does |
|---|---|---|
| `--name` | `<source>-2` | Folder name of the new set |
| `--k` | 3 | Small tiles per edge section; must be odd. Edges have 3 sections, so 3 gives 9x9 per tile, 5 gives 15x15 |
| `--steer` | 40 | How strongly the big tile's picture shapes the inside. 0 = border only; 100+ gives crisper big shapes and emptier backgrounds |
| `--variants` | 2 | Different versions of each tile, for variety. They share the original tile's weight |
| `--cell` | 48 | Pixels per small tile, so a new tile is `sections x k x cell` pixels |
| `--bg` | black | Background used to measure brightness for steering (matters for transparent sets) |
| `--seed` | 1 | Same seed, same set |

Things to know:

- Bigger `--k` shows the big shapes better but shrinks the drawings; at 15x15 hand-drawn plumbing starts to look like circuitry.
- The big pipes are suggested by denser, thicker pipework, not drawn with an outline.
- It runs on its own output for a deeper level (`python meta_tilegen.py plumbing-2 --name plumbing-3`), but the drawings shrink again.
- A rerun replaces the PNGs in the target folder. If a tile can't be solved it is reported and left out.
- How edge letters are read: a letter that also appears as a whole edge (`AAA`) is a region and fills its section; any other letter (`S`, `T`) is a line on that ground and sits in the middle small tile of its section.

### `fractal_pipe_tilegen.py`: lines that wrinkle or coil

Generates a blank, a straight and a corner at several depths. Every depth has the same edge codes; depth only changes how much line is in the tile.

```
python fractal_pipe_tilegen.py                                             -> fractal-pipe (thin Koch wrinkle, depths 0-3)
python fractal_pipe_tilegen.py --curve hilbert --style tube --bg dark --width 40 --depths 3 --margin 0.12 --name fractal-coil
python fractal_pipe_tilegen.py --curve hilbert --depths 3 --margin 0.12 --width 30 --palette "Charcoal Coral" --brush "Watercolor 1" --cross 30 --name brush-threads
python view.py brush-threads --size 8x6 --cell 192
```

- `--curve koch` wrinkles the line in place; only thin lines survive deep recursion. `--curve hilbert` coils the line through the middle of the tile, which leaves room for thick pipes.
- `--style tube` draws a white body inside an ink outline; `--bg dark` gives white pipes on near-black.
- `--width` and `--depths` trade off: the script warns when a line is too wide for the deepest level.
- `--palette "<name>"` takes colours from `common/js/palette.js`: the palette's paper colour becomes the ground, and each of `--colours` line colours (default 3) gets its own edge letter, so a line keeps its colour for its whole run, as in the hand-drawn subway set.
- `--brush "<name>"` paints the lines by stamping a brush from `common/brushes/` along the path. Works best with `--curve hilbert` and a width of 24 or more; `--seed` changes the brush randomness.
- `--cross WEIGHT` adds crossing tiles, one colour passing over another.

### By hand

Make a folder in `common/tilesets/`, add the PNGs, write `tileset.json` (format below), then run `view.py --list` to catch edges that match nothing.

## Files

| File | Job |
|---|---|
| `tileset.py` | Loads `common/tilesets/<name>/tileset.json`, expands rotations, works out which tiles fit next to which, measures tile brightness |
| `solver.py` | The collapse itself. No pygame. `weight_fn(x, y, variant)` steers tile choice per cell; returning 0 forbids a tile |
| `view.py` | Window and headless rendering. pygame is needed only for the window |
| `picture.py` | Boards steered by an image |
| `meta_tilegen.py` | WFC inside WFC |
| `fractal_pipe_tilegen.py` | Generated line tiles |
| `carbon_silicon_tilegen.py` | Generates the carbon-silicon tiles. It writes its own `manifest.json` (and has its own small solver); after regenerating, copy the PNGs into `common/tilesets/carbon-silicon/` and update `tileset.json` to match |
| `import_tileart.py` | One-off that converted the old `tileart` sets. Kept as a record of where each table came from |

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
- Rotated tiles are made in memory when a set loads; only the originals are on disk.

## Known limits

- `road` has only T-junctions and a blank, so most layouts can't close. It works up to about 30x30 and fails at 40x40.
- On a dead end the solver restarts the whole grid (with a seed derived from yours, so results stay repeatable). Fine for every set so far. If picture weighting causes frequent dead ends, backtracking is the next step.
- Tone pictures render silhouettes better than features: in most sets a tile's brightness is tied to its connections.
