# regionPainter

`regionPainter` is a p5.js generative painting instrument that discovers enclosed spaces in line structures and selectively paints those regions with translucent image brushes.

The original experiment began with a self-intersecting Chaikin-smoothed curve and raster flood fill. It has since grown into a more complete painting system with image-brush fills, expressive brush-rendered boundaries, palettes, presets, a control panel, real user-selected surface textures, and export.

## The Core Idea

```text
Boundary Structure
    ->
Raster Detection Mask
    ->
Region Discovery
    ->
Probabilistic Region Selection
    ->
Layered Painting
    ->
Visible Boundary Rendering
    ->
Texture Overlay
    ->
Final Artwork
```

Flood fill is used to discover regions. It does not decide how those regions look.

That separation is what makes the system extensible.

---

## Why It Works

A self-intersecting line naturally creates accidental spaces.

`regionPainter` does not explicitly design those spaces. Instead it:

1. creates boundary geometry;
2. chooses random points;
3. discovers whatever enclosed region contains each point;
4. paints valid regions with low-opacity brush marks;
5. allows regions to be selected repeatedly.

Repeated selection creates natural visual hierarchy:

```text
few hits  -> pale / quiet
more hits -> richer / stronger
many hits -> dominant
```

Untouched regions remain negative space.

The composition therefore emerges from the interaction between geometry, chance, repetition, palette, brush character, and surface texture.

---

## Current Features

- self-intersecting Chaikin boundary generation;
- separate computational and visible boundary layers;
- 4-neighbor raster flood-fill region detection;
- configurable region-size limits;
- repeated random region selection;
- translucent PNG brush painting;
- region-size-responsive mark count and brush scale;
- exact region masking;
- controlled edge bleed;
- shared palette system from `../common/js/palette.js`;
- shared brush manifest/images from `../common/brushes/`;
- brush-rendered visible boundary with line fallback;
- boundary size, alpha, spacing, and profile controls;
- preset dropdown plus Save / Load workflow;
- user-selected texture overlay through the browser/Windows file picker;
- texture opacity, blend mode, and scale controls;
- auto regeneration;
- PNG export.

---

## Surface Textures

Textures are selected from the local computer at runtime.

```text
Choose Texture
    ->
Windows file picker
    ->
select an image
    ->
regionPainter overlays it on the artwork
```

The selected file does not need to be copied into the repository.

Texture controls currently include:

- opacity;
- blend mode;
- scale/zoom.

Scale `1.0` covers the canvas without exposing edges. Higher values zoom into the texture and make its structure appear coarser.

Because browsers do not retain arbitrary access to local files, a preset can remember texture settings but cannot reliably reopen the exact local texture image later without the user selecting it again.

---

## Boundary Rendering

The hidden flood-fill boundary and the visible artistic boundary are deliberately separate.

```text
same boundary geometry
    |-- detection mask: continuous, reliable
    `-- visible renderer: expressive, brushy, optional
```

This allows the visible line to use textured PNG brushes without risking gaps that would break flood fill.

---

## Boundary Vocabulary — Next Exploration

The system is **not limited to Chaikin curves**.

Flood fill only cares about the final detection mask, so additional geometry can participate in the same painting pipeline.

Planned experiments include:

- squares / rectangles;
- circles / ellipses;
- polygons;
- open divider lines;
- uploaded hand-drawn boundaries.

A first experiment will likely keep the organic Chaikin path and add only a few rigid rectangles or squares. This may introduce an interesting visual tension between organic flow and geometric order.

---

## Animation — Planned

Animation is still a desired direction.

The preferred first approach is **progressive painting** rather than regenerating the entire system every frame.

Possible behavior:

```text
boundary appears
    ->
regions receive pigment gradually
    ->
repeated hits deepen areas over time
    ->
edge bleed follows
    ->
texture remains as a finishing layer
```

This should preserve the current painting logic while making the composition visibly emerge.

Slowly morphing boundary geometry is possible later, but it is more expensive because changing the boundary changes region topology and requires region detection to be rebuilt.

---

## Performance — Planned Focus

Performance work is now important both for faster iteration and for animation.

Highest-value opportunities include:

1. load boundary pixels once per generation rather than once per flood-fill attempt;
2. label/cache all connected regions once per boundary;
3. preserve current random-seed probability and repeated-hit behavior while reusing cached regions;
4. cache region edge pixels;
5. replace full-canvas temporary paint/mask buffers with small buffers based on region bounds;
6. reuse graphics/image buffers where possible;
7. resample the high-resolution Chaikin path before visible brush stamping;
8. profile each generation phase with `performance.now()` before optimizing blindly.

The goal is to improve speed **without changing the visual semantics that make the current output work**.

---

## Shared Repository Assets

### Palettes

```text
../common/js/palette.js
```

The shared palette system is the source of truth for named palettes and semantic color helpers.

### Brushes

```text
../common/brushes/brushes.json
../common/brushes/*.png
```

`regionPainter` loads brushes from the shared manifest rather than maintaining a duplicate list.

---

## Current Project Structure

```text
regionPainter/
|
|-- README.md
|-- DESIGN.md
|-- index.html
|-- css/
|   `-- style.css
|-- presets/
|   `-- ...
`-- js/
    |-- settings.js
    |-- utils.js
    |-- boundary.js
    |-- floodfill.js
    |-- painter.js
    |-- presets.js
    |-- ui.js
    |-- texture.js
    `-- sketch.js
```

---

## Design Philosophy

A few principles are now worth protecting:

- discovered regions are more interesting than explicitly authored regions;
- repeated random hits are a feature, not a bug;
- computational boundaries should be reliable even when visible boundaries are messy;
- physical-looking brush and texture assets are preferable when they produce better artwork than simulated equivalents;
- not every region should be painted;
- performance optimizations should preserve the character of the generator;
- new features should earn their place visually.

---

## Next Milestones

```text
1. Make artwork with the current version
2. Add performance timing / easy cleanup
3. Cache or label regions once per boundary
4. Experiment with a few square/rectangular boundary elements
5. Add progressive painting animation
6. Reduce full-canvas temporary buffer work
7. Explore additional boundary sources only when useful
```

See [`DESIGN.md`](DESIGN.md) for the detailed architecture and roadmap.
