# sweep

Render many parameter variations of a sketch headless and lay them out as contact sheets. The why and the plan are in [docs/sweep.md](../../../docs/sweep.md).

## Setup

Miniconda base Python, once:

```
pip install playwright pillow pyyaml
python -m playwright install chromium
```

## Strips

One strip per parameter: that parameter steps across its range while the others stay at their defaults. Use it first, to see which parameters matter and where the sketch breaks.

```
python python/tools/sweep/sweep.py strips substrate
python python/tools/sweep/sweep.py strips substrate --steps 9 --seeds 3
python python/tools/sweep/sweep.py strips substrate --only spawnChance,wobble
```

| Option | Default | Meaning |
|---|---|---|
| `--steps` | 7 | values per parameter, evenly spaced from min to max; the exact default is always added |
| `--seeds` | 1 | seeds per value, one row each |
| `--seed` | 1 | first seed |
| `--only` | all | comma-separated parameters |
| `--workers` | 4 | pages rendering at once |
| `--timeout` | 20 | seconds before a render is taken as it is |

Output goes to `<sketch folder>/sweeps/<date>-strips/`, which git ignores:

- `strip_<param>.png`: values across, seeds down. Your default has a red ring. Under each tile: its value and **ink**, the share of the canvas that differs from the background (a quick hint for too sparse or muddy). Failed tiles carry a label: `BLANK`, `TIMEOUT` (saved as it was), `ERROR`, `NO_CANVAS`.
- `index.png`: all strips stacked.
- `tiles/`: every render at full size.
- `manifest.json`: every tile's params, seed, file, status, ink and render time. Later tools (the interactive sheet, themes) read it.

Substrate, 14 parameters × 8 values × 2 seeds = 208 renders: about 2.5 minutes.

## Starters

The sweep works on **starters**: a `starter/` folder inside a sketch's own folder (e.g. `generative/substrate/starter/`). A starter's name is its sketch's folder name.

- `sketch.js`: tunable values in a `PARAMS` object between `/*PARAMS*/ ... /*END PARAMS*/`, one seed between `/*SEED*/ ... /*END SEED*/` that drives all randomness (`randomSeed` and `noiseSeed`), no DOM controls or mouse, and `window.studioDone = true` when the image is finished.
- `params.yaml`: per parameter `default`, `min`, `max`, optional `integer: true`, optional `scale: log` (steps spaced evenly by ratio, for ranges like 0.002–0.08), and a one-line `about`. True/false parameters just need `default`.

The page loads p5 from `assets/p5.min.js` (2.3.3, the same copy diamond-age-studio bundles) and `common/js/palette.js`. The marker format matches diamond-age-studio's `starter_tool.py`.

## Files

- `sweep.py`: command line, strip values, contact sheets
- `render.py`: one headless Chromium, several pages at once, files served from memory with `page.route`
- `starter.py`: find, load and fill in starters
