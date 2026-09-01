# regionPainter — Design / Architecture v0.3

## Project Status

`regionPainter` has moved beyond proof-of-concept and is now a usable generative painting instrument.

The current system successfully combines:

- generated self-intersecting boundary geometry;
- raster flood-fill region discovery;
- repeated probabilistic region selection;
- translucent image-brush painting;
- separate edge bleed;
- brush-rendered visible boundaries;
- shared repository palettes and brush assets;
- a control-panel UI;
- preset save/load;
- user-selected texture overlays loaded from the local file picker;
- texture opacity, blend mode, and scale controls;
- PNG export.

The current visual results are strong enough that future work should protect the loose, emergent character of the system rather than adding complexity for its own sake.

---

# Project Intent

`regionPainter` is a p5.js painting engine that discovers enclosed regions from one or more boundary sources and selectively paints those regions using layered rendering behavior.

The fundamental idea is:

```text
boundary geometry
      +
region discovery
      +
probabilistic selection
      +
painterly rendering
      +
surface treatment
```

The engine should not need to know the regions in advance. The boundary defines barriers; flood fill discovers what exists between those barriers.

Watercolor-like rendering is currently the primary visual language, but the architecture remains broader than watercolor.

---

# Core Design Principles

1. **Boundary generation and painting remain independent.**
2. **The computational boundary and the visible artistic boundary are separate representations.**
3. **Flood fill discovers geometry; it does not render artwork.**
4. **Painters consume detected regions and decide how those regions look.**
5. **Repeated region selection remains intentional.** Repeated hits create natural visual hierarchy.
6. **Low-opacity layering is a primary mechanism for value and pigment buildup.**
7. **The system should preserve negative space rather than attempting to fill every region.**
8. **`SETTINGS` remains the canonical tunable state.** UI and presets read/write it.
9. **Shared repository palette and brush systems remain sources of truth.**
10. **Texture overlays are finishing/compositing behavior, not region-painting logic.**
11. **Local user-selected texture images are runtime assets and should not be treated as portable preset data.**
12. **New boundary geometry must participate in both the hidden detection representation and, when desired, the visible boundary renderer.**
13. **Animation should animate artistic state rather than blindly rerunning expensive flood fill every frame.**
14. **Performance improvements should preserve generation semantics and visual character.**
15. **Technical sophistication is not a reason to change a visual behavior that is already producing stronger artwork.**

---

# High-Level Architecture

```text
Boundary Sources
    |
    |-- Generated organic path (current Chaikin source)
    |-- Geometric primitives [next exploration]
    |     |-- rectangles / squares
    |     |-- circles / ellipses
    |     |-- polygons
    |     `-- open divider lines
    |-- Uploaded drawing / image [future]
    `-- Other procedural sources [future]
            |
            v
Boundary Geometry Collection
    |                    |
    |                    |
    v                    v
Detection Renderer    Visible Boundary Renderer
    |                    |
    v                    v
Boundary Mask         Artistic ink/brush layer
    |
    v
Region Detection
    |
    v
Region Selection
    |
    v
Region Painter
    |
    v
Paint Layer
    |
    +----------+
               v
        Final Compositor
        |-- paper/background
        |-- paint
        |-- visible boundary
        |-- user texture overlay
        `-- export
```

This separation is increasingly important. Chaikin is a boundary *source*, not the definition of the boundary system.

---

# Current Working State

## Boundary

The current generated boundary pipeline is:

```text
random control points
    ->
optional control-point softening
    ->
Chaikin subdivision
    ->
closed self-intersecting point path
```

The same path is then used in two different ways:

```text
smoothedPoints
    |-- hidden raster detection line
    `-- visible line or brush-stamped boundary
```

This is the correct architecture and should be preserved.

The visible brush renderer already supports:

- image or simple-line mode;
- forced or random brush choice;
- base brush size;
- thickening through the middle of original segments;
- spacing;
- opacity;
- size jitter;
- rotation jitter.

---

# New Direction — Boundary Vocabulary

## Core Idea

The engine does **not** fundamentally depend on Chaikin.

Flood fill only cares about the final raster detection mask. Any geometry that produces continuous boundary pixels can participate.

This means `regionPainter` can evolve from a single generated curve into a **boundary vocabulary**.

Initial vocabulary candidates:

```text
organic path      current Chaikin path
square / rect     rigid enclosed geometry
circle / ellipse  enclosed curved geometry
polygon           triangle / quad / irregular closed form
open divider      line that splits a region when it connects boundaries
```

## Why This Is Artistically Promising

The current organic path has a flowing, accidental quality. Introducing a small number of rigid geometric forms could create useful tension:

```text
organic vs geometric
soft vs rigid
accident vs order
flow vs interruption
```

The goal should not be to turn the canvas into a geometry sampler. A few strategically generated primitives may be more effective than many.

A likely first experiment:

- keep the existing Chaikin path;
- add `0–4` rectangles/squares;
- allow some to be fully enclosed inside existing regions;
- allow some to intersect the organic path;
- render them through the same detection + visible-boundary separation.

## Closed vs Open Geometry

A closed square creates a region by itself.

An open line only creates a new region if it connects existing barriers strongly enough to divide an existing connected area.

All detection geometry must remain continuous at raster resolution; tiny gaps can cause flood-fill leakage.

---

# Proposed Boundary Geometry Model

A future refactor can represent boundary components explicitly:

```js
{
  type: "path",        // path | rect | ellipse | polygon | line
  points: [...],
  detection: {
    enabled: true,
    weight: 1
  },
  visible: {
    enabled: true,
    mode: "brush"
  }
}
```

For a rectangle:

```js
{
  type: "rect",
  x,
  y,
  width,
  height,
  rotation,
  detection: { enabled: true },
  visible: { enabled: true }
}
```

The important architectural shift is:

```text
create geometry
    ->
render geometry to detection mask
    ->
render same geometry artistically
```

rather than:

```text
Chaikin function owns the entire boundary system
```

This refactor is desirable before the boundary vocabulary grows much further.

---

# Region Detection

The current flood-fill implementation uses 4-neighbor connectivity:

```text
up
right
down
left
```

A valid detected region contains:

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

Regions are rejected when:

- the seed falls on a boundary pixel;
- the region is below `minRegionPixels`;
- the region exceeds `maxRegionFraction` and is assumed to be the exterior/background.

Repeated selection remains desirable:

```text
one hit      -> faint
several hits -> richer
many hits    -> visual emphasis
```

Do not add a default "paint each region only once" rule.

---

# Region Painter

The current image-brush painter is now a major part of the successful visual character.

Current behavior includes:

- region-size-responsive mark count;
- region-size-responsive brush scale;
- one brush per region or random brush per stamp;
- palette tinting;
- random rotation;
- aspect variation;
- low opacity;
- exact region clipping;
- separate finite edge-bleed marks.

The separation remains:

```text
interior paint -> exact mask
bleed          -> deliberately allowed beyond mask
```

This should remain intact.

---

# Surface Texture Overlay

The texture system now uses a **user-selected local image** rather than procedurally simulated texture.

Workflow:

```text
Choose Texture
    ->
Windows/browser file picker
    ->
load selected image into memory
    ->
fit as cover without aspect distortion
    ->
apply blend mode + opacity + scale
    ->
composite over final artwork
```

Current texture controls:

- opacity;
- blend mode;
- scale/zoom.

Texture scale begins at `1.0`, representing the densest full-canvas cover without exposing empty edges. Values above `1.0` zoom into the texture and produce coarser visible grain/structure.

The selected texture file itself is a runtime asset. Presets may store texture *settings*, but should not assume they can reopen an arbitrary local file later.

Possible future additions only if actual use demonstrates a need:

- rotation;
- X/Y offset;
- apply to artwork only;
- stacked texture overlays.

These are intentionally deferred.

---

# Presets and UI

The control panel now supports:

- preset selection;
- Save / Load preset file workflow;
- palette selection;
- boundary visibility and mode;
- boundary generation controls;
- boundary brush controls;
- texture selection and compositing controls;
- generation controls.

`SETTINGS` remains canonical.

Preset application should follow:

```text
load preset
    ->
reset SETTINGS to defaults
    ->
merge saved settings
    ->
restore palette identity
    ->
sync UI
    ->
generate artwork
```

Local texture images remain outside portable preset state.

---

# Animation — Planned Direction

Animation remains a desirable next-stage capability, but it should be designed around the existing expensive generation pipeline.

## Important Rule

Do **not** begin by regenerating the complete boundary, flood fill, masks, and brush painting at 30–60 FPS.

Instead separate:

```text
expensive generation
        from
lightweight presentation over time
```

## Animation Mode A — Progressive Painting

This is the preferred first animation experiment.

Generation creates a sequence of painting events:

```js
[
  { region, color, brush, marks, ... },
  { region, color, brush, marks, ... },
  ...
]
```

Rather than painting all selected regions immediately, process a few events or marks per frame.

Possible visual behavior:

- boundary appears first;
- regions slowly receive transparent pigment;
- repeated hits gradually deepen existing forms;
- edge bleed follows each paint event;
- texture remains a static finishing layer.

Benefits:

- preserves the current artwork-generating logic;
- lets viewers watch composition emerge;
- avoids rerunning flood fill continuously;
- produces a natural "painting itself" behavior.

## Animation Mode B — Region Reveal

A simpler variant:

- precompute the complete artwork plan;
- paint one region every N frames;
- optionally ease opacity during each reveal.

This is lower-risk than mark-by-mark animation.

## Animation Mode C — Slowly Evolving Boundary

Later, the control points could drift or morph slowly.

However, changing the boundary changes the region topology, which means the detection map and region relationships must be rebuilt.

Therefore boundary morphing should likely happen:

- at low frequency;
- as discrete transitions between states;
- or through interpolation between separately generated compositions.

It should **not** be the first animation implementation.

## Animation Controls — Possible Future UI

```text
Animate [toggle]
Mode [Progressive Paint | Region Reveal | Evolve]
Speed [slider]
Pause / Resume
Restart Animation
```

---

# Performance Roadmap

Performance is now one of the most valuable technical areas because it will directly determine how usable animation and richer boundary systems can become.

The goal is not abstract optimization. The goal is faster iteration and enough headroom for animation.

## Priority 1 — Stop Loading Boundary Pixels for Every Flood Fill

The current flood-fill function calls `boundaryDetectionLayer.loadPixels()` for each seed attempt.

The boundary does not change during one generation.

Better pattern:

```text
generate boundary
    ->
load boundary pixels once
    ->
perform all region queries
```

This is a low-risk optimization.

## Priority 2 — Cache / Label Regions Once Per Boundary

Currently each seed attempt performs a full flood fill with a newly allocated `visited` array.

A stronger optimization is **connected-component labeling**:

```text
boundary mask
    ->
scan once
    ->
assign a region ID to every non-boundary pixel
    ->
cache valid Region objects
```

Then a random seed becomes:

```js
regionId = regionMap[y * width + x];
region = cachedRegions[regionId];
```

This can preserve current selection semantics:

- seed points remain uniformly random;
- large regions remain more likely to be hit because they contain more pixels;
- repeated hits remain allowed;
- invalid exterior/small regions remain rejected.

This is likely the single biggest flood-fill performance improvement available without changing the artwork logic.

## Priority 3 — Stop Creating Full-Canvas Temporary Paint Buffers Per Region

`paintRegion()` currently creates a new graphics buffer at full canvas size for each painted region.

It then creates a full-canvas mask image and copies/masks a full-canvas paint image.

This is expensive in allocation, pixel work, and garbage collection.

Better approach:

```text
region bounds
    ->
small local graphics buffer
    ->
small local mask
    ->
composite only that bounding rectangle
```

Add a small padding margin large enough for brush extent.

This should substantially reduce memory churn.

## Priority 4 — Cache Edge Pixels With the Region

`findRegionEdgePixels()` currently rebuilds a `Set` from all region pixels whenever that region is painted.

If regions become cached, calculate edge pixels once:

```js
region.edgePixels = [...];
```

Repeated hits can reuse the result.

## Priority 5 — Reuse Buffers Where Practical

Avoid repeated `createGraphics()`, `createImage()`, and `.get()` calls inside tight generation loops when a reusable buffer can safely be cleared and reused.

Potential reusable resources:

- temporary paint buffer;
- region mask buffer;
- typed visited/region-ID arrays.

## Priority 6 — Resample Visible Boundary Geometry

Chaikin subdivision can create very large point arrays.

The visible brush renderer does not need every computational point.

Use arc-length resampling or simplification for artistic boundary stamping:

```text
high-resolution path for reliable detection
        +
resampled path for visible brush rendering
```

This maintains reliable flood-fill barriers without paying unnecessary brush-stamp cost.

## Priority 7 — Preview vs Export Quality

If needed later, introduce two quality modes:

```text
Preview
- fewer paint marks
- lower-cost boundary stamping
- responsive UI / animation

Final / Export
- full mark count
- full brush quality
- final texture composite
```

Do not add this until profiling shows it is necessary.

---

# Performance Measurement

Before major optimization, add lightweight timing around major phases:

```text
boundary generation
boundary rasterization
region discovery
region painting
boundary brush rendering
final composite
```

Use `performance.now()` and report totals to the console or optional debug UI.

The important metric is not only total generation time. Track which phase dominates so optimization effort goes to the real bottleneck.

---

# Known Cleanup / Technical Debt

As the texture system moved from a generated `textureLayer` to direct uploaded-image compositing, old temporary-layer code should be removed wherever it remains.

General cleanup principle:

> Remove abandoned implementation paths once the replacement is proven, especially when they allocate full-canvas graphics resources.

Also continue keeping UI naming and comments aligned with actual behavior as the project evolves.

---

# Future Boundary Sources

## Uploaded Drawing

The earlier hybrid direction remains valid:

```text
uploaded drawing
    ->
grayscale / threshold
    ->
optional line thickening / gap closing
    ->
detection mask
    ->
same region pipeline
```

This should eventually let handmade doodles and scanned linework become region structures.

## Combined Boundary Sources

The most interesting long-term direction may be combining sources:

```text
Chaikin organic path
    +
rigid rectangles
    +
user drawing
    +
procedural dividers
```

All can contribute to the same authoritative detection mask.

This turns the boundary system into a compositional instrument rather than one specific algorithm.

---

# Suggested Next Milestones

## Milestone 1 — Use the Current Instrument

Generate a meaningful body of work before changing its core behavior.

Observe:

- which settings repeatedly produce strong work;
- which controls are rarely useful;
- where generation feels slow;
- whether repeated visual motifs emerge.

## Milestone 2 — Performance Profiling + Low-Risk Wins

- add phase timing;
- load boundary pixels once per generation;
- remove obsolete texture-layer allocation;
- identify dominant bottlenecks.

## Milestone 3 — Region Cache / Connected Components

- build region-ID map once per boundary;
- cache region pixels, bounds, edge pixels;
- preserve random-seed probability and repeated-hit semantics;
- compare output against current system to verify no aesthetic change.

## Milestone 4 — Boundary Vocabulary v1

- introduce boundary geometry collection;
- retain Chaikin as the primary source;
- add squares/rectangles first;
- route each component to both detection and visible rendering;
- evaluate whether rigid geometry improves the artwork.

## Milestone 5 — Progressive Animation

- precompute region/painting events;
- reveal them over time;
- keep texture overlay independent;
- add pause/resume and speed.

## Milestone 6 — Bounding-Box Paint Buffers

- replace full-canvas per-region temporary layers and masks;
- benchmark generation speed and memory behavior.

## Milestone 7 — Additional Boundary Sources

Only after the first geometry experiment proves useful:

- circles;
- polygons;
- dividers;
- uploaded drawings.

---

# Long-Term Direction

`regionPainter` is best understood as a **boundary-driven generative painting instrument**.

Its strongest identity currently comes from:

```text
unexpected enclosed space
        +
probabilistic attention
        +
repeated translucent pigment
        +
expressive brush line
        +
physical surface texture
```

The project should continue expanding what can create a boundary, how the painting can unfold over time, and how efficiently the system can generate — without losing the accidents and asymmetries that made the current work successful.
