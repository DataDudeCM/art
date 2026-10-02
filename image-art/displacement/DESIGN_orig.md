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

* **Vortex / Twist** — rotate pixels around a chosen center, with radius and falloff. Probably the strongest next mode.
* **Wave Field** — sinusoidal horizontal/vertical displacement. Could support wavelength, amplitude, angle, phase.
* **Ripple** — concentric waves around a chosen center. Similar family to Radial, but oscillating rather than simply pushing/pulling.
* **Directional Smear** — push pixels along a fixed direction, optionally modulated by noise or luminance. Could feel more painterly.
* **Edge Field** — detect edges in the source and displace based on them. This is especially interesting because the image itself starts generating the force field.
* **Self-Map** — use the source image itself as the displacement map. Very easy to understand, but can produce surprisingly gnarly results.
* **RGB Split** — displace red, green, and blue independently. More glitch-oriented, but could be subtle rather than cheesy.
* **Bands / Stripes** — displacement varies by horizontal, vertical, or angled bands. Could resemble analog scanning, folding, or woven distortion.
* **Attractor Field** — one or more points pull or repel pixels. Radial is essentially one simple attractor; this would generalize it.
* **Multiple Radial Fields** — several push/pull centers interacting at once. This could get very organic.
* **Curl Noise** — a more fluid, swirling cousin of the current Flow Field. Less arbitrary-looking and more like currents or smoke.
* **Vector Noise** — separate noise functions determine X and Y displacement rather than deriving both from one angle.
* **Grid Warp** — distort space according to a warped lattice. Could feel architectural or geometric.
* **Perspective / Funnel** — displacement increases toward a vanishing point or line.
* **Shear Field** — progressively shift rows or columns, perhaps with nonlinear falloff.
* **Fold / Crease** — distort pixels around a line rather than a point, almost like bending a sheet of paper.
* **Lens / Bulge / Pinch** — technically related to Radial, but based on nonlinear spatial remapping rather than just directional displacement.
* **Spiral Ripple** — combine vortex and ripple math so waves rotate as they radiate.
* **Particle Field** — invisible particles generate local displacement around their trajectories.
* **Drawing Field** — draw strokes on the image and have those strokes become directional displacement forces.
* **Recursive Field** — subdivide the image and apply progressively smaller displacement structures recursively.
* **Image Gradient Field** — calculate luminance gradients and move pixels uphill/downhill or perpendicular to the gradient.
* **Color Field** — certain colors attract, repel, or redirect surrounding pixels.
* **Threshold / Region Field** — only distort pixels inside selected brightness or color ranges.
* **Pixel Sort / Displacement Hybrid** — not pure displacement anymore, but potentially a very interesting later direction.

There are also more experimental ones that fit the generative-art side of this project particularly well: **gravity wells, magnetic dipoles, reaction-diffusion fields, Voronoi/cellular fields, strange attractors, pendulum-driven fields, and agent-generated fields**.

If I were narrowing this to the **five most worth building soon**, I’d choose:

1. **Vortex**
2. **Edge Field**
3. **Wave Field**
4. **Curl Noise**
5. **Multiple Attractors**

Those five would give us five meaningfully different visual behaviors rather than minor variations of the same distortion.

These are possibilities, not current requirements.
