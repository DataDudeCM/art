# Displacement Mapper

## Project Intent

Create a small p5.js image-displacement tool that supports both traditional image-based displacement maps and code-generated displacement fields.

The goal is not only to reproduce Photoshop-style displacement, but to create a flexible experimental environment where different systems can define how pixels move.

---

## Core Principle

Every displacement mode answers one question:

> For source pixel `(x, y)`, how far should it move?

Each mode must return:

```js
{
  dx: horizontal displacement,
  dy: vertical displacement
}
```

The rendering engine does not care how those values were created.

---

## Architecture

```text
Sketch
│
├── UI
│   ├── source image
│   ├── mode selection
│   ├── mode-specific controls
│   └── before / after
│
├── Displacement Engine
│   ├── iterates through pixels
│   ├── requests dx / dy
│   ├── samples source image
│   └── creates output image
│
└── Displacement Modes
    ├── Image Map
    └── Flow Field
```

---

## Initial Modes

### Image Map

Uses a user-supplied image as the displacement source.

Current behavior:

- red channel controls horizontal displacement
- green channel controls vertical displacement
- 128 is approximately neutral
- displacement map is resized to match the source image
- original map remains unchanged

Controls:

- horizontal strength
- vertical strength

### Flow Field

Generates displacement procedurally using Perlin noise.

Controls:

- strength
- noise scale
- angle multiplier
- seed / randomize

---

## Shared Behavior

All modes share:

- browser-based local image loading
- full-resolution image processing
- scaled display that fits the browser window
- before / after toggle
- common pixel sampling and edge handling

---

## Proposed File Structure

```text
displacement/
├── DESIGN.md
├── displacement.md
├── index.html
└── js/
    ├── sketch.js
    ├── ui.js
    ├── displacementEngine.js
    └── displacementModes.js
```

## UI Direction

The current interface is temporary scaffolding.

The intended layout is:

- image workspace on the left
- control panel on the right
- source image selector
- mode selector
- mode-specific controls
- before / after control
- randomize where relevant
- save output

The image should scale to fit the remaining workspace while preserving its aspect ratio.

Mode-specific controls should only appear when relevant.

---

## Saving

Saving is part of the Version 1 feature set.

The saved image must use the full-resolution processed image rather than the scaled browser preview.

Display scaling and processing resolution must remain separate concerns.

---

## Rendering Strategy

The initial renderer is CPU-based.

This is appropriate for:

- understanding displacement behavior
- debugging new modes
- still-image rendering
- experimenting with displacement algorithms

The architecture should not depend on CPU rendering, however.

A future GPU / shader renderer may be introduced for interactive or animated displacement.

Conceptually, both renderers follow the same model:

Source Image
    ↓
Displacement Field
    ↓
Pixel Sampling
    ↓
Output

---

## Design Rules

1. Displacement modes calculate displacement only.
2. The engine owns pixel iteration and sampling.
3. UI logic should remain separate from displacement logic.
4. Source images should not be resized for processing.
5. Working copies may be resized when needed.
6. Mode-specific controls should only appear when relevant.
7. New modes should plug into the existing engine rather than duplicate it.
8. Avoid unnecessary class hierarchies until real duplication justifies them.

---

## Initial Milestone - DONE

Version 1 is complete when the tool supports:

- local source image loading
- before / after toggle
- Image Map mode
- Flow Field mode
- mode switching without reloading the source image
- Image Map X/Y strength controls
- Flow Field strength, noise scale, angle multiplier, and randomize
- save output

No additional displacement modes should be added until this combined version is stable.

---

## Future Possibilities

Potential later modes:

- self-displacement
- use result as source
- radial attraction / repulsion 
- wave fields
- edge-based displacement
- drawing-driven displacement
- particle-generated displacement
- recursive displacement
- independent RGB channel displacement

These are possibilities, not current requirements.
