# regionPainter

`regionPainter` is a p5.js creative-coding experiment that discovers enclosed regions in a line drawing and paints those regions using translucent, layered marks.

The first version generates a self-intersecting **Chaikin-smoothed curve**, chooses random seed points, flood-fills the region surrounding each seed, and then paints the detected region.

The longer-term goal is broader: the boundary can eventually come from a hand-drawn doodle or uploaded black-ink image, while the painter can use watercolor, ink, dry brush, stippling, texture, or other rendering styles.

## Core Idea

```text
Boundary Source
    ->
Boundary Mask
    ->
Flood-Fill Region Detection
    ->
Region Selection
    ->
Region Painter
```

Flood fill is used only to **discover** a region. Painting is handled separately.

That separation lets the same detected region be rendered in many different ways.

---

## Why This Exists

A self-intersecting line naturally creates accidental enclosed spaces.

Rather than explicitly designing those shapes, `regionPainter`:

1. creates or receives a boundary drawing;
2. randomly chooses points;
3. discovers whatever regions those points happen to occupy;
4. paints those regions;
5. allows the same region to be selected repeatedly.

Because the paint is translucent, repeated hits naturally create richer and darker areas while untouched regions remain as negative space.

The resulting composition emerges from the interaction between the boundary, probability, and the painter.

---

## V0.1

The first version focuses on proving the smallest complete system:

- generate random control points;
- smooth them using Chaikin subdivision;
- rasterize the resulting self-intersecting line;
- choose random seed points;
- flood fill to identify enclosed regions;
- paint valid regions with low-opacity brush marks;
- allow repeated regions;
- optionally show/hide the boundary;
- save the result.

Watercolor-style rendering is the first painter, but the project is intentionally **not watercolor-specific**.

---


## Shared Palettes

`regionPainter` should use the existing shared palette library:

```text
../common/js/palette.js
```

The shared library already provides named palettes, semantic color roles, tags, and helpers including:

```js
getPalette()
randomPalette()
randomPaletteByTag()
randomColor()
getDarkColor()
getLightColor()
getAccentColor()
```

A typical setup might be:

```html
<script src="../common/js/palette.js"></script>
```

```js
let palette = getPalette("earthMagenta");

let paperColor = getLightColor(palette);
let boundaryColor = getDarkColor(palette);
let regionColor = randomColor(palette);
```

`regionPainter` should not maintain a separate palette list. The live repository version of `common/js/palette.js` remains the source of truth.

---

## Brush Images

`regionPainter` should support actual transparent brush images in addition to procedural brush marks.

The shared brushes are expected to live at:

```text
../common/brushes/
```

from the `regionPainter` project folder.

The shared art repository already contains:

```text
../common/brushes/brushes.json
```

That manifest should be used as the source of truth for available brushes. `regionPainter` should load the manifest and then load the referenced PNG files from the same folder rather than maintaining its own duplicate brush list.

The current shared manifest includes acrylic, creamy, gouache, random, splatter, and six watercolor brush images.

Brush stamps can vary in:

- scale;
- rotation;
- opacity;
- color/tint;
- aspect ratio;
- selected brush image.

Because browsers cannot reliably enumerate an arbitrary folder, `regionPainter` should load the existing `../common/brushes/brushes.json` manifest from the repository.

---

## Future Boundary Input

The generated Chaikin curve is only the first boundary source.

A later version should allow an uploaded black-line doodle or sketch:

```text
uploaded drawing
    ->
grayscale / threshold
    ->
optional line thickening and gap closing
    ->
boundary mask
    ->
same flood-fill and painting pipeline
```

This allows a hand-drawn abstract doodle to provide the structure while the code decides which regions to paint and how strongly to paint them.

---

## Suggested Project Structure

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

The structure can become more formal later if multiple painter types are added.

---

## Initial Controls

```text
R = regenerate
S = save image
B = toggle boundary visibility
D = toggle debug visualization
```

---

## Development Order

```text
1. Generate Chaikin boundary
2. Verify self-intersections
3. Implement flood fill
4. Debug-display detected region
5. Select multiple random regions
6. Add procedural translucent brush
7. Add image brushes from common/brushes
8. Tune the visual behavior
9. Add edge pooling / bleed
10. Add uploaded doodle boundaries
```

The emphasis is deliberately on getting an interesting image quickly rather than overengineering the first version.

---

## Longer-Term Possibilities

Possible painter types:

- watercolor;
- ink hatching;
- dry brush;
- charcoal-like smudge;
- stippling;
- patterned texture;
- image-derived color;
- collage fragments.

Possible selection behaviors:

- uniform random;
- clustered around a focal point;
- Gaussian probability fields;
- intentional revisiting;
- avoid previously painted areas;
- composition-directed emphasis.

Possible watercolor refinements:

- pigment pooling near boundaries;
- granulation;
- edge blooms;
- controlled bleed beyond a region;
- darker seams where neighboring bleeds overlap.

---

## Design Document

See [`DESIGN.md`](DESIGN.md) for the architecture, milestones, region detection approach, brush-image design, and future uploaded-image pipeline.
