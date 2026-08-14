# abstractArtist v0.1

First implementation milestone from the project design.

This version intentionally contains **only the surface system**. It does not draw abstract compositions yet.

## Run

Open `index.html` using your normal local web server / VS Code workflow.

## Controls

- `R` — regenerate the paper surface with a new seed
- `S` — save the current paper surface as PNG

## What to evaluate

The goal is simple:

> The empty canvas should already resemble a plausible physical watercolor surface.

Look at:
- overall paper warmth
- fine grain
- fibers
- subtle mottling
- faint stains

If any individual effect calls attention to itself, it is probably too strong.

## Architecture

The project already creates separate graphics buffers for:
- paper
- watercolor washes
- texture
- ink

Only the paper buffer is actively rendered in v0.1. This preserves the architecture for later versions.
