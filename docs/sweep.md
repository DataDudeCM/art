# Sweep: Parameter Themes for My Sketches

A general tool to sweep through the parameters of any of my sketches, show the results as contact sheets, and turn my picks into **themes**: named parameter ranges with weights. A possible end point is a hash-driven Art Blocks version of a sketch that reads the themes.

Status: idea and plan, 2026-11-08. Nothing built yet. Drafted with Claude in a diamond-age-studio session; the vault session is `Sessions/2026-11-08-sweep-tool.md`.

---

## Why

diamond-age-studio's `sketch_tune` recipe tunes the parameters of one of my sketches with local agents (critic, tuner, judge). It works mechanically (every render succeeds, edits are visible), but:

- it climbs from one starting point and stops after a few passes, so it finds a nearby improvement, not the range of what a sketch can do;
- "better" means better by a 4B vision model, whose taste may not be mine (a blind check hinted it isn't);
- it tunes for one seed's layout.

Rendering a variation costs about 3 seconds and needs no model. So the cheap, useful thing is to **render many variations and let me choose**, then use agents only to refine near what I chose.

## The loop

```text
sweep (wide) → contact sheet → I mark favourites, rejects and theme names
     → themes: a range per parameter around my favourites, clear of rejects, plus a weight
     → sample the themes across many seeds ("what a collector would see") → contact sheet
     → I reject outliers → ranges tighten → repeat
     → export themes.json → a hash-driven version of the sketch reads it
```

- **Regions, not points.** On Art Blocks the collector doesn't get one of my presets; the token's hash picks the output. What ships is a distribution: which themes occur, how often, and how far each parameter varies within one. Theme names map naturally to Art Blocks features (traits).
- **Rejects matter as much as favourites.** In long-form work the floor matters more than the ceiling: one ugly mint in 500 hurts. The sweep's main job is to map where a sketch breaks (too sparse, muddy, blank) so the ranges stay clear of it.
- **Seeds.** A theme has to look good across many seeds, not with one lucky layout.

## Pieces

1. **Starter format** (already exists, in diamond-age-studio's `config/starters/`). A sketch adapted so its tunable values sit in a `PARAMS` block and all randomness comes from one `SEED`:
   - `sketch.js`: `PARAMS` and `SEED` between `/*PARAMS*/ ... /*END PARAMS*/` and `/*SEED*/ ... /*END SEED*/` markers; no DOM controls or mouse; sets `window.studioDone` when finished.
   - `params.yaml`: per parameter, default, `min`, `max`, optional `integer: true`, and a one-line `about`.
   - Converting a sketch is a one-time job of about 20–40 minutes. First one: `substrate`.
2. **`sweep.py`**: samples N parameter sets spread across a starter's ranges (optionally K seeds each), renders them headless (Playwright), and writes a contact sheet. Later it samples from `themes.yaml` instead of the full ranges.
3. **Interactive contact sheet** (one local HTML file): click favourite or reject on each tile, group favourites under a theme name, press Export to download `picks.json`.
4. **`themes.py`**: turns `picks.json` into `themes.yaml`: for each theme, a range per parameter around its favourites, kept clear of nearby rejects, and a weight.
5. **Later, separately: the Art Blocks export.** A hash-driven version of the sketch that reads the themes.

## Open decisions

- **Where starters live.** Today in diamond-age-studio. They belong here with the sweep; diamond-age would then read them from `art/`, the way it reads `common/js/palette.js`. Folder to be agreed, e.g. `tools/sweep/` for the scripts and `tools/sweep/starters/<name>/` or a `starter/` folder inside each sketch's own folder.
- **Rendering code.** Reuse diamond-age's Playwright renderer, or a small copy here so `art` stays independent of it.
- **How ranges are derived** from favourites (min/max of the picks plus a margin, or a box shrunk away from rejects).
- **Sketches with 20–30 parameters** (Chris's question). A random sweep across all of them leaves big gaps, and each tile changes everything at once. Likely answer:
  1. Start with one strip per parameter (vary one, others at defaults) to find the few that matter, and to see where the sketch breaks. Freeze the rest at Chris's values.
  2. Sweep only those, with Latin hypercube sampling, so every range is covered even with ~100 tiles.
  3. Go coarse to fine: wide sweep, picks, then resample tightly around each pick.
  4. Optionally group related parameters into a few macro knobs (e.g. "density").

  So the strips are probably the first thing `sweep.py` should do.

## Art Blocks: check before building the export

Not verified yet; from memory:

- a single self-contained script with everything determined by the token hash;
- renders at any window size, so canvas size and pixel-based logic must scale (substrate reads pixels for collisions and uses a fixed 1000 px canvas);
- which p5 versions are supported (diamond-age bundles p5 2.x; my substrate used 1.11);
- getting onto Art Blocks is a curation and application process, not only a technical one.
