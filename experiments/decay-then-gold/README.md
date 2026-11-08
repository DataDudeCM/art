# Decay, then Gold

A portrait decays for ~60 generations under one rule, then a single repair pass draws gold along the edges of the losses (kintsugi).

**Rule:** a cell's chance of dying rises with the number of its dead neighbors. Decay starts from one hole at the strongest edge in the image. A fixed seed makes every run with the same image reproducible.

## Run
Open with Live Server rooted at `art/`, then drop a portrait onto the canvas.

| Key | Action |
|---|---|
| Space | play / pause |
| N | one generation |
| G | gold repair pass on/off |
| S | save PNG |
| R | reset (same seed) |
| click | add another hole |

Tunables are constants at the top of `js/sketch.js` (`CELL`, `GENERATIONS`, `PER_NEIGHBOR`, `NOISE_SCALE`, `SEED`, colors).

## Origin
Spark from the ideas vault: "Spark: Decay, then Gold" (2026-10-27), part of the Fracture & Repair thread.
