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
assets/
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
      "file": "scrap01.png",
      "weight": 1
    },
    {
      "file": "scrap02.png",
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

# Deferred Boundary Import

Uploaded raster, SVG, or externally prepared boundary sources are deferred.

Current drawn/stylus input already provides a direct way to create intentional handmade boundary structures.

If future use shows a strong need to import external boundary geometry, revisit that separately.

Do not build image tracing, thresholding, SVG import, or raster-to-vector conversion into the current roadmap.

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
