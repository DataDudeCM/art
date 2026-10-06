# regionPainter — Design / Architecture v1.0

## Project Status

`regionPainter` is now a functioning boundary-driven generative painting instrument.

The current system includes:

- Chaikin-generated boundaries;
- particle-fed Chaikin boundaries;
- rectangle boundaries;
- direct drawn / stylus boundaries;
- hidden raster boundary detection;
- brush-rendered visible boundaries;
- flood-fill region discovery;
- repeated probabilistic region selection;
- fixed-per-region or random-per-hit color behavior;
- translucent image-brush painting;
- region-size-responsive mark and brush scaling;
- separate edge bleed;
- center-weighted or uniform region sampling;
- progressive generation animation;
- particle-boundary animation;
- grid composition mode;
- grid parameter variation;
- preset save/load;
- shared palette and brush systems;
- user-selected surface textures;
- PNG export.

The project has moved beyond proving the core technique.

Future development should focus on extending the artistic possibilities of discovered regions without weakening the accidental, layered, and painterly character that makes the current system interesting.

---

# Project Intent

`regionPainter` is a p5.js generative painting instrument built around the discovery of enclosed space.

Its fundamental process is:

```text
boundary source
    ->
hidden detection boundary
    ->
region discovery
    ->
probabilistic region hits
    ->
artistic event
    ->
layered composition
```

The engine does not need to define all regions in advance.

A boundary establishes barriers. Flood fill discovers the spaces between them. Repeated random hits determine which discovered spaces receive attention.

The current primary artistic event is translucent painting, but the architecture should allow other rare events to occur within regions.

---

# Core Design Principles

1. **Boundary generation and region rendering remain independent.**
2. **The computational boundary and visible boundary are separate representations.**
3. **Flood fill discovers regions; it does not decide how they are rendered.**
4. **Repeated region hits are intentional and should remain possible.**
5. **Low-opacity layering is a primary mechanism for hierarchy and depth.**
6. **Negative space is important.** The system should not attempt to fill every region.
7. **Randomness should create variation without making every decision equally arbitrary.**
8. **`SETTINGS` remains the canonical tunable state.**
9. **Shared repository palettes and brushes remain sources of truth.**
10. **A successful region hit is an artistic event, not an automatic instruction to paint.**
11. **New behaviors should reuse existing region masks and compositing infrastructure whenever possible.**
12. **Performance changes should preserve the visual behavior of the instrument.**
13. **Technical sophistication alone is not a reason to add a feature.**
14. **The system should remain easy to experiment with.** New subsystems should start small and earn complexity through use.

---

# High-Level Architecture

```text
Boundary Source
    |
    |-- Chaikin
    |-- Particle Chaikin
    |-- Rectangle
    `-- Drawn / Stylus
            |
            v
Boundary Geometry
      |             |
      |             |
      v             v
Detection        Visible
Renderer         Boundary Renderer
      |             |
      v             v
Boundary Mask    Brush / Line Layer
      |
      v
Region Discovery
      |
      v
Region Hit
      |
      v
Artistic Event Selection
      |
      |-- Paint [default]
      `-- Artifact [rare]
              |
              v
      Region-clipped rendering
              |
              v
        Final Composition
              |
              |-- paper / background
              |-- paint + artifacts
              |-- visible boundary
              |-- texture overlay
              `-- export
```

This introduces one important conceptual shift:

> A successful region hit no longer necessarily means "paint this region."

Instead, it means:

> Something may happen in this region.

Painting remains the overwhelmingly dominant event.

---

# Boundary System

## Current Sources

### Chaikin

Random control points are softened and subdivided into a closed organic path.

```text
random points
    ->
softening
    ->
Chaikin subdivision
    ->
closed path
```

The generated path is used for both hidden detection and visible boundary rendering.

### Particle Chaikin

One or more moving particles generate sampled control points.

Current particle behavior includes:

- multiple particles;
- interval or heading-change sampling;
- round-robin, sequential, or random-particle point ordering;
- noise movement;
- optional attractor influence;
- wrapping behavior;
- animated particle visualization.

The collected points feed the same Chaikin boundary pipeline used by the standard generated source.

### Rectangle

A rigid enclosed rectangular boundary source.

This provides a simple geometric contrast to the organic sources and confirms that the engine is not fundamentally dependent on Chaikin.

### Drawn / Stylus

Pointer or stylus input creates one or more strokes directly on the canvas.

Captured stroke data includes:

- x/y location;
- time;
- pressure;
- pointer type.

The same strokes feed both:

- hidden boundary detection;
- visible boundary rendering.

This is currently the preferred path for intentionally hand-designed boundary structures.

---

# Detection vs Visible Boundary

This distinction remains central.

The hidden detection renderer exists only to create reliable barriers for region discovery.

The visible renderer exists only for the finished artwork.

```text
same boundary geometry
       |
       |-- thin continuous detection line
       |
       `-- artistic brush / line rendering
```

The visible boundary does not need to visually match the exact detection line.

---

# Region Detection

The current flood-fill system uses 4-neighbor connectivity:

```text
up
right
down
left
```

A detected region contains:

```js
{
  pixels,
  pixelCount,
  bounds: {
    minX,
    minY,
    maxX,
    maxY
  }
}
```

A region is rejected when:

- the sample lands on a boundary;
- it is smaller than `minRegionPixels`;
- it exceeds `maxRegionFraction` and is treated as exterior/background.

Repeated hits remain valid and desirable.

```text
first hit       -> faint attention
later hits      -> richer accumulation
many hits       -> visual emphasis
```

The same region may therefore be selected many times during one generation.

---

# Region Identity

Regions already have a stable generation-time key derived from their geometry:

```js
getRegionKey(region)
```

This currently supports fixed-per-region color behavior.

The same mechanism should be reused for future region state, including artifact placement.

Do not introduce a second competing region-identity system unless necessary.

---

# Region Painting

The current painter:

- chooses a region brush;
- scales mark count based on region size;
- scales brush size based on region size;
- stamps translucent marks inside a temporary graphics layer;
- clips that layer to the exact region mask;
- composites it onto the paint layer;
- adds a separate finite amount of edge bleed.

The core clipping pipeline is:

```text
temporary content
    ->
region mask
    ->
destination-in
    ->
paint layer
```

This clipping system should become a reusable rendering primitive for media other than paint.

A likely future cleanup is to rename:

```js
compositeRegionPaint(...)
```

to something more general such as:

```js
compositeToRegion(...)
```

once non-paint content is using the same mechanism.

---

# Color Behavior

Current region color behavior supports:

```text
fixedPerRegion
randomPerHit
```

`fixedPerRegion` uses the region key so repeated hits accumulate with a stable color.

`randomPerHit` allows repeated hits to vary across the palette.

This behavior should remain independent of artifact selection.

---

# Surface Texture

User-selected texture images remain a final compositing behavior.

Current controls include:

- opacity;
- blend mode;
- scale.

Texture images are runtime assets and are not assumed to be portable inside preset files.

Texture should remain separate from region painting and artifact logic.

---

# Grid Composition

The system supports optional multi-cell composition.

Each cell receives:

- its own viewport;
- a deterministic seed derived from the main generation seed;
- its own boundary generation;
- its own repeated region hits.

Grid variation may sweep selected parameters across rows or columns.

The grid system should remain an orchestration layer rather than introducing separate painting logic.

---

# Animation

Animation is implemented as progressive artistic state rather than continuous full regeneration.

Current behavior includes:

- progressive boundary reveal;
- animated particle motion for particle boundaries;
- progressive region painting;
- grid-aware animation.

The guiding rule remains:

> Animate artistic events, not expensive full recomputation at frame rate.

Any new region event, including artifacts, should eventually be compatible with progressive animation.

The first artifact implementation does not need special animation behavior beyond appearing when its region hit is processed.

---

# New Feature — Region Artifacts

## Intent

The next feature should allow rare non-paint events to occur when a valid region is hit.

The first artifact type will be **text scrap images**.

Examples could include:

- scanned handwriting;
- typed fragments;
- asemic writing;
- old labels;
- isolated words;
- numbers;
- symbols;
- printed scraps.

The purpose is not to turn `regionPainter` into a collage generator.

Artifacts should remain rare enough to feel discovered.

---

## Core Behavior

Every successful region hit normally paints.

With a very low probability, a hit may instead place an artifact.

```text
successful region hit
        |
        v
artifact already exists in region?
        |
        |-- yes -> paint normally
        |
        `-- no
             |
             v
        random artifact roll
             |
             |-- fail -> paint normally
             |
             `-- pass -> place one artifact
```

Important rules:

1. Painting remains the default event.
2. Artifact chance should be low.
3. A region may receive at most one artifact.
4. Artifact insertion replaces painting for that specific hit.
5. Later hits on the same region paint normally.
6. Later paint may partially obscure or bury the artifact.
7. Artifact placement should remain stable for the rest of the generation.
8. Turning artifacts off must preserve current Region Painter behavior.

This should create natural states such as:

```text
artifact remains clear

artifact receives one later paint layer

artifact becomes partially obscured

artifact becomes almost lost beneath repeated paint
```

That history is desirable.

---

# Artifact Assets

Initial structure:

```text
../common/
  artifacts/
    text/
      scraps.json
      scrap01.png
      scrap02.png
      scrap03.png
```

Example manifest:

```json
{
  "artifacts": [
    {
      "file": "scrap-1.png",
      "weight": 1
    },
    {
      "file": "scrap-2.png",
      "weight": 1
    }
  ]
}
```

The first manifest should remain deliberately small.

Do not initially add unnecessary per-image metadata such as:

- mood;
- semantic category;
- preferred palette;
- custom rotation limits;
- individual scale ranges;
- composition roles.

Those can be added only if real use demonstrates a need.

---

# Artifact Runtime State

Use the existing region key.

```js
generationRegionArtifacts = new Map();
```

Possible stored state:

```js
{
  artifactName,
  x,
  y,
  scale,
  rotation,
  opacity
}
```

Once assigned, that artifact state should not change during the generation.

The region map prevents a second artifact from being placed in the same region.

---

# Artifact Placement

The first version should:

- reject regions below an artifact-size threshold;
- choose one random scrap from the manifest;
- choose a random rotation;
- choose an appropriate scale based partly on region bounds;
- place the artifact near the region center with limited positional variation;
- render it onto a temporary graphics layer;
- clip it using the existing region-mask compositor;
- composite it onto the artwork layer.

The clipping mechanism should reuse:

```js
compositeRegionPaint(...)
```

or a generalized equivalent.

The artifact should not need any knowledge of flood fill beyond receiving the detected region object.

---

# Artifact Probability

Artifact selection should happen at the **region hit** level.

Conceptually:

```js
if (
  artifactEnabled &&
  !generationRegionArtifacts.has(regionKey) &&
  region.pixelCount >= minArtifactRegionPixels &&
  random() < artifactChance
) {
  placeArtifact(region);
} else {
  paintRegion(region);
}
```

The artifact roll should occur only after a valid region has been discovered.

Do not roll artifact probability for invalid seeds or rejected regions.

---

# Initial Artifact Settings

Proposed first settings:

```js
artifact: {
  enabled: false,

  chance: 0.02,

  minRegionPixels: 2500,

  scaleMin: 0.5,
  scaleMax: 1.4,

  rotationMin: -Math.PI,
  rotationMax: Math.PI,

  alphaMin: 140,
  alphaMax: 230
}
```

Exact values should be tuned visually.

The first UI should remain small:

```text
Artifacts
[ ] Enable Text Scraps

Chance
[ slider ]

Minimum Region Size
[ slider ]
```

Scale, rotation, and alpha can remain settings-only until actual use shows they need live controls.

---

# Artifact Module

Keep artifact logic separate from the painter.

Suggested module:

```text
js/artifacts.js
```

Responsibilities:

```text
load artifact manifest
load artifact images
choose artifact
determine eligibility
place artifact
store artifact state
render artifact into temporary layer
clip artifact into region
```

The painter should continue to know how to paint.

The artifact system should know how to insert artifacts.

The region-hit logic decides which event occurs.

---

# Region Hit Model

The region-hit stage becomes an explicit part of the architecture.

Current behavior is effectively:

```text
valid region
    ->
paint
```

The updated behavior becomes:

```text
valid region
    ->
resolve region event
        |
        |-- paint
        `-- artifact
```

This is intentionally small now, but it creates a useful architectural seam for later experimentation.

Do not build a large event framework yet.

The first implementation only needs two outcomes:

```text
paint
artifact
```

---

# Why Artifacts Fit Region Painter

The feature uses the existing system rather than bypassing it.

Artifacts still depend on:

- discovered regions;
- random hits;
- region masks;
- repeated selection;
- layering over time.

They therefore feel like a mutation of Region Painter's existing logic rather than a separate collage subsystem.

The intended visual behavior is:

```text
region discovered
    ->
rare fragment appears
    ->
later pigment accumulates
    ->
fragment becomes embedded in the painting
```

Artifacts should feel found rather than deliberately placed.

---

# Boundary Image Import (planned)

Status: phase 1 implemented 2026-10-06 (`js/boundaryImage.js`); phases 2 and 3 planned. This supersedes the earlier "Deferred Boundary Import" decision.

## Why now

The earlier decision deferred image import because drawn/stylus input already allowed handmade boundaries.

A new need changes that: boundaries drawn *outside* regionPainter. For example, a deliberately simplified portrait in black and white, which regionPainter then paints.

Raster import (an image) is in scope. SVG import and tracing a raster into vector paths stay deferred.

## Core idea

Region detection already works on pixels, not geometry. Any pixel in `boundaryDetectionLayer` with alpha > 20 is a wall, and flood fill uses 4-neighbour connectivity.

So an image doesn't need converting into lines. It only needs thresholding into wall pixels in the detection layer. Flood fill, region identity, painting, artifacts and animation then work unchanged.

```text
uploaded image
     |
     |-- fit into viewport (keep proportions, centred), times boundary.scale
     |-- threshold: dark pixels -> wall, light pixels -> empty
     |-- thicken walls by N pixels (closes small gaps)
     |
     |-- detection layer: opaque wall pixels  -> region detection (unchanged)
     `-- visible layer:   the drawing itself, if boundary.visible is on
```

4-neighbour connectivity helps here: a one-pixel line with diagonal steps still blocks the fill. Only real gaps leak.

## Behaviour

### New boundary source: `image`

- Added to the boundary source select, after `drawn`.
- When selected, it shows a file chooser, following the same pattern as the surface texture upload in `texture.js`: a button, a hidden input and a file name display.
- The image is held in memory (`uploadedBoundaryImage`), like uploaded textures.
- `generate()` returns a pixel mask instead of strokes. `generateBoundary()` gets a branch that writes the mask into the detection layer, and draws the visible version, for the active viewport.
- Primitive strokes (circles, squares, triangles) still apply on top, using their existing settings. Mixing a drawing with random primitives may be interesting. Setting their count to zero gives the pure drawing.

### Conversion settings

| Setting | Default | Purpose |
|---|---|---|
| `boundary.image.threshold` | 128 | Brightness below which a pixel counts as a wall (0–255). Handles grey or anti-aliased lines. |
| `boundary.image.thicken` | 1 | Pixels to grow walls by (0–4). Closes small gaps so regions don't leak into each other. |
| `boundary.image.invert` | false | For white-on-black drawings. |

Each one gets a slider or checkbox in the boundary section, shown only when the source is `image`.

Two existing settings also apply to the image source:

- **`boundary.visible`**, the existing "show boundary" toggle. When on, the thresholded drawing is drawn as the visible line work. When off, only the painted regions show. There is no separate image setting.
- **`boundary.scale`**, the same scale slider that Chaikin uses:
  - 1.0 fits the whole image in the viewport;
  - below 1.0 shrinks it, leaving more margin;
  - above 1.0 enlarges it past the viewport edges, cropped by the viewport (`drawClippedToViewport`).

  Because it's the same setting, the grid "boundary.scale" sweep works with images for free: a series zooming into one drawing.

Conversion steps, per viewport:
1. Draw the image into an offscreen buffer the size of the fitted rectangle: "contain" (whole image visible, centred, proportions kept), multiplied by `boundary.scale`. Only the part inside the viewport is needed.
2. Threshold to a wall mask, using alpha too: transparent pixels are never walls.
3. Thicken: dilate the mask by `thicken` pixels with a square kernel.
4. Write the mask into `boundaryDetectionLayer` as opaque black pixels inside the viewport. Then `loadPixels()` as usual.
5. If `boundary.visible` is on, draw the visible version onto `boundaryLayer`.

Cache the processed mask by image, fitted size (including scale), threshold, thicken and invert, so regenerating with a new seed doesn't reprocess the image.

Check pixel density: the mask must match the detection layer's actual pixel dimensions, not just its width and height.

### Small features: systematic fill (phase 2)

Region discovery is random sampling: `fill.attempts` random points, with regions under `minRegionPixels` (default 2500) rejected. Small portrait features, such as eyes, nostrils and lips, may never be hit, or may be rejected for size.

Add a fill mode setting:
- `random` (current behaviour, and the default).
- `every`: scan the viewport for unvisited non-wall pixels, flood-fill each one, and paint every region above `minRegionPixels`. This uses the existing region cache for visited pixels.

Lowering `minRegionPixels` matters for portraits too, so the `every` mode should come with a visible control for it.

### Grid composition

Each grid cell fits the same image into its own viewport. Grid variation could then sweep `boundary.scale`, `threshold` or `thicken` across rows or columns, giving a series from one drawing. Sweeping `threshold` and `thicken` means adding them to `GRID_SWEEP_PARAMETERS`.

### Margins

When the image's proportions don't match the viewport, or `boundary.scale` is below 1.0, the margins are empty space, not walls. They're paintable: they join whatever region they touch, usually the drawing's outside area.

### Presets

Presets can store `source: "image"` and the conversion settings, but not the image itself. When loading such a preset with no image uploaded, show a message and fall back to `chaikin`.

### Background region

The area outside a drawing is usually one large region. `maxRegionFraction` (0.7) rejects a region as exterior only if it covers more than 70% of the viewport. A portrait's background may be smaller than that, so it could get painted like any other region.

That may be fine, or not. If not, add a `boundary.image.background` option to always treat the region touching the viewport edge as background.

## Phases

1. **Image source.** Source option, upload, fit, threshold, thicken, invert, detection mask and visible modes. Test with a hand-drawn image, plus a test image with deliberate gaps of 1–3 px to check `thicken`.
2. **Systematic fill.** The `every` fill mode, plus a `minRegionPixels` control.
3. **Polish.** Preset handling. A "show detection layer" view (none exists yet), for debugging leaking regions.

Phase 1 test notes: gaps are measured after scaling, so a gap closed by `thicken` at scale 1.2 can reopen at larger scales; closing gaps in the drawing itself is more reliable than a high `thicken`.
Deferred: SVG import, tracing raster to vector paths (so imported lines can get brush strokes), and edge detection on photos.

## Drawing guidelines (for the user guide)

- Pure black lines on white work best.
- Close every shape you want as a separate region.
- Bold lines survive scaling; very thin lines may break when the image is shrunk to fit.
- Solid black areas become walls and are never painted. Use this deliberately, for example for hair or shadows that stay dark.

## Decisions (2026-10-06)

- Line visibility follows the existing `boundary.visible` toggle; there's no image-specific setting.
- Margins outside the image are paintable.
- The image scales with the existing `boundary.scale`, including above 1.0 (larger than the canvas, cropped).
- Images use the same default `boundary.scale` of 1.2, so a new image starts slightly enlarged and cropped.
- An enlarged image stays centred. There's no pan or offset control.

---

# Future Artistic Directions

These remain promising but are not the next implementation priority.

## Region Personality / Analysis

Analyze region geometry such as:

- size;
- compactness;
- aspect ratio;
- adjacency;
- isolation;
- position;
- irregularity.

Use those measurements to influence which regions receive attention or how they are rendered.

## Overlooked Region Selection

Bias attention toward unusual or easily ignored regions rather than purely random selection.

## Region-to-Region Influence

Allow painting one region to affect the probability or style of neighboring regions.

## Recursive Regions

Occasionally create secondary structure or micro-compositions inside selected regions.

These should remain experiments, not commitments.

---

# Performance

Performance work should continue where it materially improves artistic iteration.

Current high-value opportunities include:

- connected-component caching;
- cached edge pixels;
- reduced full-canvas temporary allocations;
- reusable buffers;
- lower-cost visible-boundary resampling.

However, optimization should not delay the artifact experiment unless artifact rendering exposes a real bottleneck.

---

# Known Cleanup / Technical Debt

Continue removing abandoned implementation paths once replacements are proven.

Keep naming aligned with actual behavior.

In particular, if the artifact feature proves useful, review painter-specific names that now describe shared compositing behavior.

Examples:

```text
compositeRegionPaint
```

may eventually become:

```text
compositeToRegion
```

Do not rename purely for theoretical cleanliness before the artifact feature is working.

---

# Immediate Roadmap

## Milestone 1 — Text Artifact System

Implement the first rare artifact event.

Scope:

- add artifact manifest;
- preload scrap images;
- add artifact settings;
- add generation artifact state;
- use `getRegionKey()` to prevent duplicates;
- add low-probability artifact substitution;
- clip the artifact to the region;
- allow later paint hits to cover it;
- add minimal UI controls;
- keep seeded generation reproducible.

Definition of done:

- text scraps appear rarely;
- no region receives more than one;
- later region hits continue painting;
- artifacts are clipped cleanly;
- artifacts remain stable within a seeded generation;
- artifacts work in normal generation;
- artifacts work in progressive animation;
- turning artifacts off reproduces normal Region Painter behavior.

---

## Milestone 2 — Evaluate Artifact Behavior

Generate a meaningful body of work before expanding the system.

Evaluate:

- ideal probability;
- useful minimum region size;
- whether scraps need positioning bias;
- whether transparency should vary;
- whether scraps are too legible;
- whether later paint obscures them at the right rate;
- whether the artifact should occasionally extend beyond the region or remain strictly clipped.

Only then decide whether additional artifact types are worthwhile.

---

## Milestone 3 — Generalize Only If Earned

If text scraps produce strong work, the artifact mechanism may later support:

- image fragments;
- scanned symbols;
- handwriting;
- diagrams;
- photo fragments;
- generated marks.

Do not generalize before the text-scrap experiment proves useful.

---

## Milestone 4 — Region Intelligence Experiments

After the artifact feature has been evaluated, revisit geometry-aware selection.

Possible experiments:

- region personality;
- overlooked-region scoring;
- region-to-region influence;
- recursive regions.

These should build on actual artistic results rather than become a parallel architecture project.

---

# Long-Term Direction

`regionPainter` should remain a boundary-driven generative painting instrument whose compositions emerge from repeated attention to discovered spaces.

Its core identity is becoming:

```text
boundary structure
        +
discovered regions
        +
probabilistic attention
        +
layered paint
        +
rare interruptions
        +
surface character
```

The next stage should not focus mainly on adding more ways to create boundaries.

The stronger opportunity is to expand what can happen when a region is discovered.
