# regionPainter - Design / Architecture

## Project Intent

`regionPainter` is a reusable p5.js painting engine that discovers enclosed regions from a boundary source and paints those regions using one or more rendering styles.

The core idea is intentionally independent of watercolor. Watercolor is the first painter because translucent layering, edge pooling, pigment buildup, repeated passes, and controlled bleed fit the system especially well, but region detection should remain independent of any one medium.

The project should support both:

1. **generated boundary sources** - initially a self-intersecting Chaikin curve built from random control points; and
2. **human-created boundary sources** - eventually an uploaded black-ink doodle, sketch, or other high-contrast image.

The core abstraction is:

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
    ->
Visual Boundary / Ink Rendering
    ->
Composite / Export
```

The system does not need to know the regions in advance. A region is discovered when a seed point is selected and flood fill explores the connected area until it reaches a computational boundary.

---

# Core Design Principles

1. **Boundary generation and painting remain independent.**
2. **Flood fill discovers geometry; it does not render the artwork.**
3. **Painters consume a detected region and decide how to render it.**
4. **Repeated selection of the same region is allowed and desirable.**
5. **Low-opacity layering should create natural pigment/value buildup.**
6. **Randomness should eventually be reproducible through a seed.**
7. **Uploaded hand-drawn boundaries are a first-class future source.**
8. **Actual brush images must be supported as painting stamps.**
9. **Painter implementations must not assume watercolor-only behavior.**
10. **The computational boundary and the visible artistic boundary are separate concerns.**
11. **`SETTINGS` remains the canonical state; UI controls and presets read/write that state rather than creating a second configuration system.**
12. **The engine should eventually be able to render into an arbitrary rectangular viewport or graphics buffer, not only the full canvas.** This supports grid studies and reuse inside larger systems such as `emergentArtist` and `abstractArtist`.

---

# High-Level Architecture

```text
regionPainter
|
|-- Boundary Sources
|   |-- GeneratedCurveBoundarySource
|   |   `-- random points -> Chaikin smoothing -> rasterized boundary
|   |
|   `-- ImageBoundarySource                     [future]
|       `-- uploaded image -> threshold -> cleanup -> boundary mask
|
|-- Boundary Mask
|   `-- authoritative raster blocking pixels used by flood fill
|
|-- Region Detector
|   `-- flood fill from a seed point
|
|-- Region Selector
|   |-- uniform random seeds
|   |-- clustered / focal-point seeds           [future]
|   `-- intentional revisit strategies          [future]
|
|-- Painters
|   |-- WatercolorRegionPainter
|   |   |-- procedural soft marks
|   |   |-- image brush stamps                  [remaining]
|   |   |-- opacity buildup
|   |   `-- edge bleed / pooling
|   |
|   |-- InkRegionPainter                        [future]
|   |-- DryBrushRegionPainter                   [future]
|   |-- StippleRegionPainter                    [future]
|   `-- TextureRegionPainter                    [future]
|
|-- Visible Boundary Renderer
|   |-- simple vector/raster line               [current]
|   `-- brush-stamped ink path                  [remaining]
|
|-- UI / Presets                                [planned]
|   |-- sliders / toggles mapped to SETTINGS
|   |-- palette selection
|   |-- fill brush selection
|   |-- ink brush selection
|   |-- named presets
|   `-- generation / save controls
|
`-- Composite / Export
    |-- paper/background
    |-- paint layer
    |-- visible ink boundary
    `-- PNG + matching preset/settings JSON
```

---

# Current Working State

The current implementation has already proven the core artistic idea and is producing compelling results.

Working pieces include:

- full-canvas p5.js generation;
- random control-point generation;
- Chaikin smoothing and self-intersecting closed boundaries;
- raster `boundaryLayer` used as the authoritative flood-fill barrier;
- 4-neighbor flood-fill region detection;
- repeated region selection by design;
- translucent procedural painting with region-size-responsive mark and brush scaling;
- exact region masking before compositing;
- a separate finite edge-bleed pass based on detected region-edge pixels;
- shared palette selection through `../common/js/palette.js`;
- shared brush manifest/image loading from `../common/brushes/`;
- timed auto-regeneration;
- PNG saving;
- settings/preset JSON saving, including palette identity.

Important implementation rule discovered during development:

> **Do not replace the simple `fill.attempts` generation model unless there is a compelling artistic reason.** Repeated hits on the same region are part of the visual hierarchy and should remain allowed.

Another important implementation rule:

> **Do not implement bleed by expanding every region pixel through a neighborhood radius.** That approach is prohibitively expensive. The current edge-pixel strategy is the correct direction.

---

# Rendering Layers

Current primary graphics buffers:

```js
let boundaryLayer;
let paintLayer;
```

Optional later:

```js
let paperLayer;
let inkLayer;
let debugLayer;
```

Recommended final composite order:

```text
background / paper
        ->
paintLayer
        ->
inkLayer / visible boundary (optional)
        ->
debug overlay (development only)
```

The hidden computational boundary remains authoritative for flood fill even when the final visible boundary is hidden or rendered using a completely different brush technique.

---

# Boundary Source - Generated Curve

The generated source uses random control points because large jumps between points encourage self-intersection and irregular enclosed spaces.

Pipeline:

```text
random control points
        ->
optional control-point softening
        ->
close path
        ->
Chaikin subdivision
        ->
rasterize to boundaryLayer
```

The current engine exposes artistic controls such as:

- point count;
- subdivision count;
- boundary stroke weight;
- curve scale relative to canvas;
- corner softness;
- softening passes;
- visible boundary toggle.

The rasterized line must remain continuous enough to prevent flood-fill leakage.

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

The downstream region detection and painter pipeline should remain identical regardless of the boundary source.

When an uploaded boundary image is used, the proposed grid mode remains fixed at `1 x 1` unless a later design explicitly supports image tiling.

---

# Region Detection

Flood fill answers:

> "Which connected region contains this seed point?"

It does **not** paint the region.

For the current implementation use **4-neighbor connectivity**:

```text
up
down
left
right
```

A detected region contains approximately:

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

Reject regions when:

- the seed lies on the boundary;
- the region is smaller than `minRegionPixels`;
- the region is larger than `maxRegionFraction` of the canvas and is likely the exterior.

Do not maintain an "already painted" set by default.

---

# Region Selection

## Current Strategy

Select seed points uniformly at random, detect the region, and paint valid results.

Repeated selection is intentional:

```text
one hit     -> pale
two hits    -> richer
many hits   -> dominant
```

That accidental hierarchy is part of the aesthetic and should not be optimized away.

## Future Selection Strategies

Potential future selectors include:

- Gaussian cluster around a focal point;
- user-selected focal point and radius;
- gradient-based probability field;
- edge-biased or center-biased sampling;
- avoid-painted mode;
- deliberately revisit-painted mode;
- composition-aware region weighting.

The first selector worth exploring after the current painter/UI work is **focal-point clustering**, because it could create stronger compositional emphasis without replacing the underlying region logic.

---

# Painter Architecture

A region painter receives a detected region and paints marks based on that region.

Current conceptual interface:

```js
paintRegion(region, graphics, color)
```

Longer-term:

```js
class RegionPainter {
  paint(region, graphics, context) {}
}
```

Painters may interpret the same region differently:

- scatter brush marks;
- hatch through it;
- stipple it;
- smear pigment;
- sample an image;
- use texture fragments;
- combine controlled interior marks with deliberate edge behavior.

---

# Watercolor Painter

The current painter uses many translucent marks rather than a flat fill. Region size affects both mark count and brush scale.

Current conceptual pipeline:

```text
detected region
        ->
choose region-relative mark count and brush scale
        ->
paint freely to temporary layer
        ->
clip temporary layer to exact region mask
        ->
composite onto paint layer
        ->
add separate controlled edge bleed
```

This separation is important:

- **interior paint** is strictly masked;
- **bleed** is intentionally allowed outside the mask.

---

# Brush System

`regionPainter` must support **both procedural brushes and actual shared brush images**.

Shared brush source of truth:

```text
../common/brushes/brushes.json
../common/brushes/*.png
```

Do not maintain a duplicate brush filename list inside `regionPainter`.

## Current Brush Status

The manifest and PNGs are loaded by the sketch, but the active `stampBrush()` implementation is still procedural. The existing `SETTINGS.paint.brushMode = "image"` setting therefore does **not yet mean that image brushes are actually being stamped**.

This is remaining work and should not be lost.

## Remaining Fill Brush Work

Implement a real image-stamp path that can use one selected brush or a controlled brush family.

Required behavior:

- choose brush from the shared manifest;
- tint with the current region color;
- vary opacity;
- vary scale;
- vary rotation;
- optionally vary aspect ratio and position jitter;
- render onto the temporary layer;
- continue using the existing exact region mask for containment;
- preserve the current separate bleed pass so brush texture can intentionally escape the region only through bleed behavior.

The UI should eventually expose:

```text
Fill Brush: [Procedural | Acrylic Basic | Creamy | Gouache | Splatter | Watercolor 1 ...]
```

A future option may allow `Random within selected family`, but explicit brush selection should come first so presets remain understandable.

---

# Visible Boundary / Ink Brush - Remaining Work

The computational raster boundary must **not** be replaced with an artistic PNG brush path. Gaps or transparency in an artistic brush could cause flood-fill leaks.

Instead maintain two representations:

```text
Chaikin geometry
   |-- raster boundary -> flood fill / computation
   `-- artistic ink path -> final visible rendering
```

The visible ink path should eventually be painted by stamping a selected brush along the stored Chaikin curve after the region fills are complete.

Desired behavior:

- thin marks through smooth sections;
- thicker / heavier marks around sharper directional changes;
- optional jitter and opacity variation;
- selected **Ink Brush** independent from the **Fill Brush**;
- brush sampling by approximate arc length rather than stamping at every Chaikin point.

The current subdivision count can generate thousands of Chaikin points, so directly stamping once per point would be unnecessarily expensive. The visible boundary renderer should resample the curve at a practical spacing.

Curvature can be estimated from the turn angle between nearby samples and mapped to line/brush thickness.

UI target:

```text
Ink Brush:  [Simple Line | Acrylic Basic | Creamy | ...]
Ink Weight: [slider]
Curvature Response: [slider]
Ink Opacity: [slider]
```

The simple current p5 line remains a useful fallback/debug mode.

---

# Edge Pooling and Bleed

The current implementation already has a useful controlled bleed mechanism based on region-edge pixels and a finite number of marks.

Future refinements may distinguish:

```text
interior pigment
boundary pigment
outside bleed
```

Possible controls:

```js
watercolor: {
  pooling: 0.4,
  bleed: 0.15,
  edgeBandWidth: 8
}
```

A true fluid simulation is not required unless a later experiment demonstrates a clear artistic benefit.

---

# Palette System

`regionPainter` uses the repository's shared palette system:

```text
../common/js/palette.js
```

The shared palette system is the source of truth for:

- named palettes;
- semantic color roles;
- tags;
- random palette selection;
- palette selection by tag;
- helpers such as `getPalette()`, `randomColor()`, `getDarkColor()`, `getLightColor()`, and `getAccentColor()`.

The palette system remains independent of painter behavior. A painter may alter opacity or pigment buildup but should not invent unrelated RGB colors outside the selected palette context.

The UI should support both explicit palette selection and random palette selection.

---

# Presets and Reproducibility

## Current Save Behavior

Artwork saving should create a PNG and a matching JSON sidecar containing the current settings and palette identity.

A preset should carry its identity inside the file rather than relying only on the filename.

Recommended preset shape:

```json
{
  "presetName": "Storm Glass",
  "timestamp": "20260830-160210",
  "paletteKey": "industrialSun",
  "paletteName": "Industrial Sun",
  "settings": {}
}
```

`paletteKey` is the machine-restorable identifier. `paletteName` is the human-readable label.

## Named Presets - Planned UI Behavior

Do not spend more time building a temporary keyboard/file-picker preset workflow. The full preset experience belongs in the UI.

Planned controls:

```text
Preset: [dropdown]
[Save Preset] [Load/Import Preset]
```

Loading a preset should conceptually do:

```js
applyPreset(preset);
syncUIFromSettings();
generateArtwork();
```

The UI must not become a second source of configuration truth.

## Seeded Randomness - Deferred Carefully

Exact seeded reproduction remains desirable, but it should be reintroduced only after the current generation semantics remain stable.

Important complication: the shared palette helpers currently use `Math.random()`, while p5's `randomSeed()` controls p5's RNG. Therefore `randomSeed()` alone will not reproduce palette choice or every color choice.

When seed support returns, either:

1. introduce a unified seeded RNG used by palette + painter + geometry; or
2. save explicit resolved choices such as palette key and brush selections in the preset, while using a seed for the p5-driven geometry/painting sequence.

Do not change the current `fill.attempts` model merely to implement seed support.

---

# Planned UI

The current keyboard-first controls are sufficient while developing the engine, but the mature sketch should have a compact control panel.

## UI Design Rule

`SETTINGS` is canonical state.

```text
SETTINGS
   <-> UI controls
   <-> preset save/load
```

Sliders and selectors should read from and write to `SETTINGS`. Loading a preset updates `SETTINGS`, then the UI synchronizes from it.

## Recommended UI Sections

### Generation / Composition

- Generate / Next Artwork button;
- auto-regenerate toggle;
- regeneration interval;
- point count;
- curve scale;
- subdivisions;
- corner softness;
- softening passes;
- fill attempts;
- minimum region size;
- maximum region fraction.

### Paint

- marks per region;
- region-size mark response;
- brush-size response;
- min/max brush size;
- min/max alpha;
- bleed mark count;
- bleed distance;
- bleed alpha range.

### Brushes

- **Fill Brush** selector;
- **Ink Brush** selector;
- procedural/image mode where useful;
- eventual brush-family/randomization options.

### Ink / Boundary

- visible boundary toggle;
- simple-line vs brush-rendered ink;
- ink weight;
- opacity;
- curvature-to-thickness response.

### Color

- named palette selector;
- random palette option;
- current palette name display.

### Presets

- named preset selector;
- Save Preset;
- Load/Import Preset;
- preset name;
- current preset indicator.

### Output

- Save Artwork;
- save matching JSON settings/preset sidecar;
- eventually display current seed once deterministic seed support is ready.

## Interaction Recommendation

Palette and Preset selectors should be prominent near the top because they are likely to be the fastest way to explore meaningful visual families. Detailed sliders can appear below in collapsible or grouped sections.

A practical exploration workflow should be:

```text
choose/randomize palette
        ->
generate
        ->
adjust a few settings
        ->
choose fill/ink brushes
        ->
save interesting result + JSON
        ->
optionally save as a named preset
```

---

# Grid / Evolution Study Mode - Future

A proposed future mode can create an entire piece as a grid of independent `regionPainter` cells.

Possible grid range:

```text
1 x 1 through 10 x 10
```

Controls:

- outer margin: `0%` to `10%` of canvas width;
- cell spacing: `0` to `100` pixels;
- independent generated control points per cell;
- default `1 x 1`, no border, matching current behavior.

Each cell should run the same region-painting pipeline but with its own boundary geometry and cell-local dimensions.

If an uploaded starting image/boundary is selected, grid mode remains `1 x 1` initially.

## Parameter Evolution Across Cells

A particularly strong extension is to vary one selected parameter across the cells to create an evolutionary/contact-sheet style series.

Examples:

```text
left -> right: pointCount 8 ... 50
top -> bottom: bleedPixels 0 ... 20
all cells: same palette + brush
```

Optional labels under cells can show the varied parameter and value, with labels toggled on/off.

### Architectural implication

This does **not** need to be implemented immediately, but it does affect the long-term engine design. The painter currently relies heavily on global `width` and `height`. Grid mode will be much cleaner if the core engine eventually accepts a rendering context such as:

```js
renderRegionPainting({
  graphics,
  x,
  y,
  width,
  height,
  settings,
  palette,
  rng
});
```

or renders into an offscreen `p5.Graphics` buffer per cell and composites the result into the main canvas.

This same change also enables reuse as a primitive in other projects.

---

# Reusable Primitive / Integration With Other Art Systems

`regionPainter` has strong potential to become a reusable primitive inside projects such as `emergentArtist` and `abstractArtist`.

The desirable long-term abstraction is not "call the current full-screen sketch." It is:

```text
RegionPainterEngine
    inputs:
      boundary source
      viewport / graphics target
      settings
      palette
      brush choices
      selection strategy
      RNG / seed context

    output:
      rendered graphics + optional metadata
```

Possible uses:

- an `emergentArtist` agent could place a region-painted patch in a chosen area;
- `abstractArtist` could use regionPainter as one compositional element among lines, arcs, shapes, and texture;
- grid/evolution studies could invoke the same engine many times with controlled parameter variation;
- a human-drawn boundary could become a reusable texture/composition source.

This is architecturally important, but **no refactor is required immediately**. For now, avoid adding new full-canvas assumptions where possible and keep boundary, region detection, and painting separated.

---

# Development Milestones / Remaining Work

## Completed / Proven

- generated Chaikin boundary;
- reliable flood fill;
- repeated region selection;
- procedural translucent painter;
- exact region mask clipping;
- efficient edge-based bleed;
- shared palettes;
- auto-regeneration;
- PNG + JSON save path;
- strong artistic output.

## Next: Brush Completion

1. Implement actual shared PNG brush stamping for **Fill Brush**.
2. Preserve mask clipping and current bleed behavior.
3. Add a separate **Ink Brush** renderer for the visible Chaikin path.
4. Resample the Chaikin path by arc length for efficient stamping.
5. Add curvature-based ink thickness.

## Then: UI / Presets

1. Build compact UI around canonical `SETTINGS`.
2. Add palette selector.
3. Add Fill Brush selector.
4. Add Ink Brush selector.
5. Add named preset save/load/import.
6. Add grouped sliders/toggles for current settings.
7. Keep Generate / Auto-Regenerate / Save controls obvious.

## Then: Artistic Expansion

- focal-point / clustered region selection;
- uploaded boundary images;
- additional painter types;
- richer edge pooling;
- seed/reproducibility system using a unified RNG or explicitly saved resolved choices.

## Later: Structural Expansion

- arbitrary viewport / offscreen rendering context;
- grid mode;
- one-parameter evolution/contact-sheet studies;
- reusable `RegionPainterEngine` primitive for other art systems.

---

# Review of Additional Ideas

## 1. Grid of independent regionPainter cells

**Verdict: strong idea, but not immediate.**

It is likely to create genuinely different artwork rather than merely more controls. A grid turns the engine into a visual vocabulary and creates relationships between independent generative events.

Do not implement it before the fill/ink brush work and UI are stable. Otherwise it multiplies complexity while those core behaviors are still moving.

## 2. Vary one parameter across the grid

**Verdict: especially strong; preserve it.**

This is more interesting than a generic grid because it creates an intentional visual experiment/evolution. It could become both an artwork mode and a powerful way to discover good parameter ranges.

It belongs after grid support, not now.

## 3. Print the parameter value beneath each grid cell

**Verdict: useful and inexpensive once grid mode exists.**

Make it optional. It is excellent for experiment/contact-sheet mode but may be undesirable in finished artwork.

## 4. Use regionPainter as a primitive in other sketches

**Verdict: strategically important.**

This is the only additional idea that should influence architecture now. It does **not** require an immediate refactor, but future code should avoid deepening reliance on full-canvas global state. The eventual move toward an explicit rendering context / `p5.Graphics` target should support both grid mode and integration into `emergentArtist` / `abstractArtist`.

---

# Near-Term Priority

The engine is already creating strong artwork. The priority now should be to deepen the **quality and controllability of the existing output**, not expand the feature surface too quickly.

Recommended sequence:

```text
1. Preserve current working generation behavior
2. Complete real Fill Brush stamping
3. Complete artistic Ink Brush boundary rendering
4. Build the SETTINGS-driven UI
5. Add named preset loading/management inside that UI
6. Add focal-point selection experiments
7. Add uploaded boundary source
8. Refactor toward arbitrary viewport / reusable primitive
9. Add grid + parameter-evolution mode
```

---

# Long-Term Direction

`regionPainter` can stand on its own as an artwork generator and also become a reusable primitive inside larger systems.

Its strongest long-term capability remains the combination of:

```text
human-made or generated line structure
        +
algorithmic region discovery
        +
probabilistic attention
        +
physical-feeling painting
```

The human or higher-level system can define the boundary language and compositional context while `regionPainter` decides which spaces receive attention, how often they are revisited, and how the selected medium accumulates inside them.

The engine should preserve that division of labor rather than attempting to make every artistic decision itself.
