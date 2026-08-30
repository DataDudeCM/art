# regionPainter - Design / Architecture

## Project Intent

`regionPainter` is a reusable p5.js experiment and eventual painting engine that discovers enclosed regions from a boundary source and paints those regions using one or more rendering styles.

The core idea is intentionally independent of watercolor. Watercolor is the first painter because translucent layering, edge pooling, pigment buildup, and repeated passes are especially well suited to the system, but the region logic should support other media later.

The project should also support both:

1. **generated boundary sources** - initially a self-intersecting Chaikin curve built from random control points; and
2. **human-created boundary sources** - eventually an uploaded black-ink doodle, sketch, or other high-contrast image.

The important abstraction is:

```text
Boundary Source
    ->
Boundary Mask
    ->
Region Detection
    ->
Region Selection
    ->
Region Painter
```

The system does not need to know the regions in advance. A region is discovered only when a seed point is selected and flood fill explores the connected area until it reaches a boundary.

---

# Core Design Principles

1. **Boundary generation and painting remain independent.**
2. **Flood fill discovers geometry; it does not render the artwork.**
3. **Painters consume a detected region and decide how to render it.**
4. **Repeated selection of the same region is allowed and desirable.**
5. **Low-opacity layering should create natural pigment/value buildup.**
6. **Randomness should be reproducible through a seed.**
7. **The first version should remain small enough to evaluate the artistic idea quickly.**
8. **Uploaded hand-drawn boundaries are a first-class future source, not a bolt-on feature.**
9. **Actual brush images must be supported as painting stamps.**
10. **Painter implementations should not assume watercolor-only behavior.**

---

# High-Level Architecture

```text
regionPainter
|
|-- Boundary Sources
|   |-- GeneratedCurveBoundarySource
|   |   `-- random points -> Chaikin smoothing -> rasterized boundary
|   |
|   `-- ImageBoundarySource                 [future]
|       `-- uploaded image -> threshold -> cleanup -> boundary mask
|
|-- Boundary Mask
|   `-- binary/raster representation of blocking pixels
|
|-- Region Detector
|   `-- flood fill from a seed point
|
|-- Region Selector
|   |-- uniform random seeds
|   |-- clustered / biased seeds           [future]
|   `-- intentional revisit strategies     [future]
|
|-- Painters
|   |-- WatercolorRegionPainter
|   |   |-- procedural soft marks
|   |   |-- image brush stamps
|   |   |-- opacity buildup
|   |   `-- edge pooling / bleed            [later]
|   |
|   |-- InkRegionPainter                    [future]
|   |-- DryBrushRegionPainter               [future]
|   |-- StippleRegionPainter                [future]
|   `-- TextureRegionPainter                [future]
|
`-- Composite / Export
    |-- optional visible boundary
    `-- saved artwork
```

---

# V0.1 Goal

Prove the complete loop:

```text
generate self-intersecting boundary
        ->
choose random seed point
        ->
flood fill to discover region
        ->
paint region with translucent marks
        ->
repeat
```

V0.1 is successful when:

- the generated boundary produces interesting enclosed areas;
- flood fill reliably finds individual regions;
- some regions are painted while others remain untouched;
- repeated hits deepen a region naturally;
- translucent marks feel more painted than vector-filled;
- the code remains simple enough to tune quickly.

---

# V0.1 Scope

## Included

- p5.js canvas
- paper/background color
- generated random control points
- Chaikin curve smoothing
- self-intersecting boundary
- hidden boundary graphics buffer
- optional visible boundary
- pixel flood fill
- region pixel list / mask
- random seed selection
- repeated region selection
- simple watercolor-style translucent painter
- procedural brush marks
- **image-based brush stamps loaded from `../common/brushes/`**
- regenerate
- save image
- debug visualization

## Not Included Yet

- uploaded boundary images
- automatic gap closing
- line dilation / erosion controls
- sophisticated UI
- true fluid simulation
- real-time animation
- region graph / vector face extraction
- advanced region caching
- sophisticated brush dynamics
- multiple simultaneous painter styles
- full edge-bleed simulation

---

# Proposed Project Structure

```text
regionPainter/
|
|-- README.md
|-- DESIGN.md
|-- index.html
|
`-- js/
    |-- sketch.js
    |-- settings.js
    |-- boundary.js
    |-- floodfill.js
    |-- painter.js
    `-- utils.js
```

This is intentionally small. If painter types expand, `painter.js` can later become:

```text
js/
`-- painters/
    |-- RegionPainter.js
    |-- WatercolorRegionPainter.js
    |-- InkRegionPainter.js
    `-- ...
```

---


# Shared Palette System

`regionPainter` should use the repository's existing shared palette system:

```text
../common/js/palette.js
```

Do not create a duplicate local palette library unless the shared system proves inadequate.

The current shared palette system provides:

- named palettes;
- semantic color roles;
- tags;
- random palette selection;
- palette selection by tag;
- helpers such as `getPalette()`, `randomColor()`, `getDarkColor()`, `getLightColor()`, and `getAccentColor()`.

Recommended use in `index.html`:

```html
<script src="../common/js/palette.js"></script>
```

Then `regionPainter` can use the shared helpers directly:

```js
let palette = getPalette("earthMagenta");

let paperColor = getLightColor(palette);
let inkColor = getDarkColor(palette);
let paintColor = randomColor(palette);
```

For generative runs, palette choice may also use:

```js
let palette = randomPalette();
```

or:

```js
let palette = randomPaletteByTag("muted");
```

## Palette Design Rule

The palette system should remain separate from painter behavior.

A painter receives a color or palette context and decides how that color is physically rendered. For example, the watercolor painter may lower opacity, vary saturation, or build pigment through repeated marks, but it should not invent unrelated arbitrary RGB colors.

The live repository version of `common/js/palette.js` is the source of truth for available palettes, roles, tags, and helpers.

---

# Rendering Layers

Recommended initial graphics buffers:

```js
let boundaryLayer;
let paintLayer;
```

Optional later:

```js
let paperLayer;
let debugLayer;
```

Composite order:

```text
background / paper
        ->
paintLayer
        ->
boundaryLayer (only when visible)
        ->
debug overlay (development only)
```

The hidden `boundaryLayer` remains authoritative for flood fill even when the boundary is not rendered in the final artwork.

---

# Boundary Source - V0.1

## Generated Curve

Generate approximately 10-20 random control points across the usable canvas area.

The point sequence should remain substantially random because large jumps between points encourage the final smoothed path to cross itself. Perlin-noise placement is intentionally not the default because excessive spatial correlation may make the path too orderly and reduce self-intersection.

Pipeline:

```text
random control points
        ->
close path
        ->
Chaikin subdivision 3-5 times
        ->
draw to boundaryLayer
```

The boundary should be rasterized with enough width to prevent flood-fill leaks.

Example starting values:

```js
boundary: {
  pointCount: 14,
  subdivisions: 4,
  strokeWeight: 3,
  margin: 60
}
```

The exact values are artistic controls and should remain tunable.

---

# Future Boundary Source - Uploaded Image

A later version should accept an uploaded image such as:

- black ink doodle on white paper;
- scanned line drawing;
- abstract contour drawing;
- digitally drawn black-line image.

Proposed pipeline:

```text
uploaded image
        ->
fit / scale to canvas
        ->
grayscale
        ->
threshold
        ->
optional line thickening
        ->
optional small-gap closing
        ->
boundary mask
```

The downstream region detection and painting logic should be identical regardless of whether the boundary came from generated geometry or an uploaded image.

This is a major reason boundary sources must remain separate from region detection.

---

# Region Detection

## Flood Fill Purpose

Flood fill answers:

> "Which connected region contains this seed point?"

It does **not** paint the region.

The flood fill begins at a selected pixel and expands through neighboring non-boundary pixels until no valid pixels remain.

For V0.1 use **4-neighbor connectivity**:

```text
up
down
left
right
```

This is easier to reason about than 8-neighbor connectivity and reduces accidental diagonal leakage.

## Suggested Output

```js
{
  pixels: [...],
  bounds: {
    minX,
    minY,
    maxX,
    maxY
  },
  pixelCount
}
```

The region pixel list is then passed to a painter.

## Region Validation

Reject regions when:

- the seed is on a boundary;
- the region is below a minimum area;
- the region is implausibly large and likely represents the exterior of the drawing.

Example:

```js
fill: {
  attempts: 30,
  minRegionPixels: 500,
  maxRegionFraction: 0.70
}
```

`maxRegionFraction` is preferable to a fixed pixel count because it scales with canvas size.

---

# Region Selection

## V0.1

Select seeds uniformly at random.

```text
pick seed
   ->
detect region
   ->
if valid, paint it
   ->
repeat
```

Do **not** track "already painted" regions initially.

Repeated hits are desirable because transparent painting passes accumulate naturally:

```text
one hit     -> pale
two hits    -> richer
many hits   -> dominant
```

This accidental hierarchy is part of the aesthetic.

## Future Selection Strategies

Later selectors may include:

- Gaussian cluster around a focal point;
- user-selected focal point and radius;
- gradient-based probability field;
- edge-biased or center-biased sampling;
- avoid-painted mode;
- deliberately revisit-painted mode;
- composition-aware region weighting.

Selection strategy should not change flood-fill logic.

---

# Painter Architecture

A region painter receives a detected region and paints marks based on that region.

Conceptual interface:

```js
paintRegion(region, graphics, options)
```

Later:

```js
class RegionPainter {
  paint(region, graphics, context) {}
}
```

Painters are free to interpret the region differently.

Examples:

- scatter brush marks inside it;
- hatch through it;
- stipple it;
- smear pigment across it;
- sample an image;
- use texture fragments.

---

# Watercolor Painter - V0.1

The first painter should use many translucent marks rather than a flat fill.

Basic process:

```text
detected region
        ->
sample random pixels from region
        ->
choose brush size / alpha
        ->
stamp brush
        ->
repeat
```

Repeated stamps overlap and create natural variation in density.

Example starting settings:

```js
paint: {
  marksPerRegion: 300,
  brushSizeMin: 12,
  brushSizeMax: 40,
  alphaMin: 4,
  alphaMax: 14
}
```

These are starting points only.

---

# Brush System

`regionPainter` must support **both procedural brushes and actual brush images**.

The existing shared brush artwork is located at:

```text
../common/brushes/
```

assuming `regionPainter` is a sibling of `common` within the art repository.

## Brush Types

### 1. Procedural Brush

Useful for a zero-dependency first test.

Possible implementation:

- several overlapping low-alpha circles;
- irregular p5 shape;
- noise-disturbed blob.

### 2. Image Brush

Preferred for richer physical texture.

A transparent PNG brush image can be tinted and stamped into the region.

Conceptually:

```js
imageMode(CENTER);
tint(r, g, b, alpha);

image(
  brushImage,
  x,
  y,
  brushWidth,
  brushHeight
);

noTint();
```

Individual stamps may vary:

- scale;
- rotation;
- opacity;
- x/y jitter;
- aspect ratio;
- selected brush image.

## Brush Manifest / Loading

The live art repository already provides a shared brush manifest:

```text
../common/brushes/brushes.json
```

`regionPainter` should treat this manifest as the source of truth for available shared brush images rather than duplicating filenames locally.

Current manifest structure:

```json
{
  "brushes": [
    "Acrylic Basic.png",
    "Creamy.png",
    "Guache.png",
    "Random.png",
    "Splatter.png",
    "Splatter 2.png",
    "Watercolor 1.png",
    "Watercolor 2.png",
    "Watercolor 3.png",
    "Watercolor 4.png",
    "Watercolor 5.png",
    "Watercolor 6.png"
  ]
}
```

Recommended loading flow:

```text
load ../common/brushes/brushes.json
        ->
read brushes[]
        ->
prepend ../common/brushes/
        ->
load each referenced PNG
        ->
store loaded p5.Image objects in the brush library
```

Conceptually:

```js
let brushManifest;
let brushes = [];

function preload() {
  brushManifest = loadJSON("../common/brushes/brushes.json");
}

function loadBrushImages() {
  brushes = brushManifest.brushes.map(filename =>
    loadImage(`../common/brushes/${filename}`)
  );
}
```

The exact p5 loading pattern can be adjusted during implementation, but the important design rule is:

> **Do not maintain a separate `regionPainter` brush list when `common/brushes/brushes.json` already defines the shared library.**

The live GitHub repository should remain the reference point for the current brush library and any shared-code conventions.

## Mask Safety

A brush image may extend beyond the detected region.

V0.1 can use one of two approaches:

### Conservative approach

Only stamp when the brush center lies within the region.

This is simple but allows brush edges to cross boundaries.

### Better approach

Render the brush stamp to a temporary layer and mask it by the region before compositing.

This gives strict containment and provides the foundation for deliberate bleed behavior later.

The architecture should favor the second approach once the basic painter works.

---

# Edge Pooling and Bleed - Later

Watercolor often accumulates pigment near boundaries. `regionPainter` should eventually distinguish:

```text
interior pigment
boundary pigment
overflow / bleed
```

A useful future pipeline:

```text
region mask
    ->
distance-to-boundary estimate
    ->
increase pigment probability near edge
    ->
optionally expand mask slightly
    ->
paint low-alpha bleed outside region
```

This permits controls such as:

```js
watercolor: {
  pooling: 0.4,
  bleed: 0.15,
  edgeBandWidth: 8
}
```

When neighboring regions are painted, their small bleed zones can overlap and naturally create darker seams.

No fluid simulation is required for the initial effect.

---

# Seeded Randomness

Every generated result should eventually be reproducible.

```js
randomSeed(seed);
noiseSeed(seed);
```

The seed should control:

- control-point generation;
- seed-point selection;
- color choices;
- brush-image choices;
- stamp rotation;
- scale;
- opacity;
- jitter.

Saved images should include the seed in the filename.

---

# Suggested Settings Object

```js
const SETTINGS = {
  canvas: {
    paperColor: "#f3ecdf"
  },

  boundary: {
    pointCount: 14,
    subdivisions: 4,
    strokeWeight: 3,
    margin: 60,
    visible: true
  },

  fill: {
    attempts: 30,
    minRegionPixels: 500,
    maxRegionFraction: 0.70
  },

  paint: {
    marksPerRegion: 300,
    brushMode: "image",       // "image" or "procedural"
    brushSizeMin: 12,
    brushSizeMax: 40,
    alphaMin: 4,
    alphaMax: 14
  },

  debug: {
    showSeeds: false,
    showDetectedRegion: false
  }
};
```

---

# Initial Controls

```text
R = regenerate
S = save image
B = toggle visible boundary
D = toggle debug visualization
```

Keep controls minimal until the core system proves itself.

---

# Development Milestones

## Milestone 1 - Boundary

Goal:

- generate random control points;
- smooth using Chaikin subdivision;
- rasterize a self-intersecting boundary.

Definition of done:

> The line creates multiple visually interesting enclosed spaces.

---

## Milestone 2 - Flood Fill

Goal:

- choose a seed;
- detect its connected region;
- debug-render that region as a flat color.

Definition of done:

> A seed point reliably identifies exactly one bounded region.

---

## Milestone 3 - Multiple Region Selection

Goal:

- run many seed attempts;
- accept valid regions;
- allow duplicate/repeated regions.

Definition of done:

> A random subset of regions is selected, with some naturally receiving repeated hits.

---

## Milestone 4 - Procedural Paint

Goal:

- replace flat fills with translucent procedural brush marks.

Definition of done:

> Regions feel layered rather than digitally filled.

---

## Milestone 5 - Image Brushes

Goal:

- load one or more transparent brush images from `../common/brushes/`;
- stamp them with variable scale, angle, alpha, and color.

Definition of done:

> Painted regions visibly inherit physical texture from the brush artwork.

---

## Milestone 6 - Better Region Masking

Goal:

- clip complete brush stamps to the region mask.

Definition of done:

> Painter behavior can remain strictly inside a region unless bleed is intentionally enabled.

---

## Milestone 7 - Watercolor Edge Behavior

Goal:

- experiment with pigment pooling near boundaries;
- optionally allow small controlled overflow.

Definition of done:

> Region edges show adjustable accumulation and neighboring fills can create darker overlapping seams.

---

## Milestone 8 - Uploaded Boundary Images

Goal:

- load a black-line doodle or sketch;
- convert it into a usable boundary mask;
- reuse the existing region detection and painter pipeline.

Definition of done:

> A hand-drawn doodle can replace the generated Chaikin boundary without changing the downstream painting system.

---

# First Build Order

Implement in this order:

```text
1. Canvas and graphics buffers
2. Chaikin boundary
3. Boundary debug display
4. Flood fill
5. Flat debug region
6. Multiple random seeds
7. Procedural translucent brush
8. Image brush loading/stamping
9. Tune until visually interesting
10. Only then investigate pooling / bleed
```

Do not build sophisticated watercolor behavior before region detection is dependable.

---

# Long-Term Direction

`regionPainter` may eventually become useful as a standalone artwork generator and as a reusable primitive inside larger systems such as abstract or emergent artists.

Its strongest long-term capability is likely the combination of:

```text
human-made line structure
        +
algorithmic region discovery
        +
probabilistic painting
```

The human can define the doodle or boundary language while the system decides which spaces receive attention, how often they are revisited, and how the selected medium accumulates inside them.

The engine should preserve that division of labor rather than attempting to generate every artistic decision itself.

## Additional Ideas
- Create the entire piece within a grid of rectangles such that I can define the grid as being anywhere from 1x1 to 10x10 with outer margin (border) from 0 to 10% canvas width and grid cell margins of 0 to 100 pixels. Then, we would draw the chaikin art in each grid cell. the default is just 1 with no border, similar to the current version. 
 - note that each grid cell would get its own set of points. if uplaod a starting image is chosen, the grid stays fixed at 1x1
- when using the grid, add the option to vary one of the parameters over the number of cells. this could create a nice evolutionary series. it should also print the parameter value under each grid cell (toggle these on/off)
- Could this become a "primitive" for any of my other sketches? emergentArtist, abstractArtist, etc
- 

