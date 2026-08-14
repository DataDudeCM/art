# abstractArtist

## Project Intent

Build a reusable p5.js generative painting engine that creates abstract, Kandinsky-inspired compositions with convincing watercolor, ink, and paper texture.

This is not intended to reproduce a specific Kandinsky painting. The goal is to develop a visual grammar based on:

- geometric abstraction
- strong visual hierarchy
- asymmetrical balance
- controlled overlap
- rhythmic repetition
- expressive line work
- curated color relationships
- controlled randomness
- watercolor and paper texture

The engine should remain modular enough that the same composition could later be rendered with different aesthetics such as ink, charcoal, clean vector geometry, or other painterly styles.

---

# Design Invariants

These rules protect the architecture and should not be violated casually.

1. **Composition decides WHY an element exists.**
2. **Geometry decides WHERE an element exists.**
3. **Renderers decide HOW an element looks.**
4. **Elements do not draw themselves.**
5. **Randomness must be seeded.**
6. **Randomness should normally be weighted, biased, clustered, or constrained rather than purely uniform.**
7. **Negative space is intentionally generated.**
8. **Watercolor, ink, paper, and texture remain separate rendering layers.**
9. **Visual hierarchy is explicit: anchor → secondary → medium → accent.**
10. **New features must fit an existing subsystem or justify a new one.**
11. **Composition logic must remain independent of rendering style.**
12. **No artistic parameter should be buried as a magic number if it may reasonably need tuning later.**

Core principle:

> **Geometry decides where. Watercolor decides how. Composition decides why.**

---

# High-Level Architecture

```text
Sketch
│
├── Composition Engine
│   ├── chooses layout
│   ├── creates focal areas
│   ├── balances visual weight
│   └── generates shape instructions
│
├── Shape Vocabulary
│   ├── circles / rings
│   ├── polygons
│   ├── lines
│   ├── arcs
│   ├── bars
│   └── accent marks
│
├── Relationship Engine
│   ├── attraction
│   ├── alignment
│   ├── intersection
│   ├── orbit
│   └── opposition
│
├── Watercolor Renderer
│   ├── layered washes
│   ├── edge wobble
│   ├── pigment variation
│   └── pooling / bloom
│
├── Ink Renderer
│   ├── sketchy lines
│   ├── heavy structural marks
│   └── dry-brush accents
│
└── Surface System
    ├── paper texture
    ├── grain
    ├── stains
    └── splatter
```

The composition engine produces intent. The rendering systems interpret that intent visually.

Example:

```js
// Composition intent:
"Put a large red circular anchor here."

// Rendering decision:
"Render it as 35 translucent irregular watercolor passes,
// with pigment pooling along portions of the edge."
```

---

# Core Data Model

Every generated element should be represented as a logical object containing geometry, compositional role, and appearance metadata.

Example:

```js
{
  type: "circle",

  position: {
    x: 640,
    y: 370
  },

  geometry: {
    radius: 140,
    rotation: 0
  },

  composition: {
    role: "anchor",
    importance: 0.9,
    cluster: 1
  },

  appearance: {
    paletteIndex: 2,
    watercolorStrength: 0.8,
    inkStrength: 0.2,
    opacity: 0.65
  }
}
```

The element describes itself, but **does not render itself**.

Renderers consume these objects and decide how they appear.

---

# Composition Engine

The composition engine is the most important system.

It should not scatter random shapes uniformly across the canvas. It should generate a composition map with meaningful zones, roles, balance, tension, and negative space.

## Primary Composition Roles

### Anchor

The dominant visual mass.

Typical forms:

- one large circle or ring
- overlapping shape cluster
- heavy black structural form
- concentrated watercolor mass

Typical count:

```text
1–2
```

### Secondary Cluster

Supports or challenges the anchor.

Typical forms:

- smaller circles
- polygons
- arcs
- repeated marks
- partial washes

Typical count:

```text
3–6 large secondary elements
```

### Counterweight

A visual mass placed away from the anchor to balance the page without creating symmetry.

### Rhythm Field

Repeated smaller marks that establish visual tempo.

Examples:

- dots
- short lines
- repeated rings
- small polygons
- rhythmic dashes

### Gesture

One or more large directional marks crossing significant portions of the composition.

Examples:

- sweeping lines
- long arcs
- diagonals
- structural ink strokes

---

# Composition Templates

The engine should eventually support multiple composition strategies.

```js
const COMPOSITION_TYPES = [
  "diagonal",
  "orbit",
  "cluster",
  "split",
  "spiral",
  "scatter"
];
```

## Diagonal

Major elements follow a broad directional axis.

```text
●
   ◯
       △
          ─────
               ●
```

Purpose:

- movement
- tension
- directional flow

## Cluster

Visual activity concentrates strongly in one part of the canvas.

```text
        ◯△●
       ─╱●◯


                    ●
```

Purpose:

- generous negative space
- watercolor-friendly breathing room
- asymmetric balance

## Orbit

A dominant form becomes a center of gravity.

Smaller elements:

- orbit it
- echo it
- intersect it
- connect to it

## Split

Two opposing visual masses create tension.

```text
LEFT FORCE            RIGHT FORCE

●●●                       △△
◯                          ╱
────                       ◯
```

## Spiral

Elements loosely follow a rotational path rather than a literal geometric spiral.

## Scatter

The loosest composition type.

Scatter still obeys:

- hierarchy
- exclusion zones
- clustering
- visual weighting

It must never mean "uniform random placement."

---

# Composition Field

The engine may use an invisible compositional field to influence placement.

Possible field components:

```js
class CompositionField {
  constructor() {
    this.attractors = [];
    this.repellers = [];
    this.axes = [];
    this.exclusionZones = [];
  }
}
```

Elements may respond to:

```text
distanceFromAnchor
angleToMainAxis
localDensity
desiredNegativeSpace
clusterMembership
repulsionFromEdges
relationshipTargets
```

Example behaviors:

- triangles prefer intersections
- circles prefer anchors or orbital zones
- long lines connect major clusters
- accent marks populate low-density transition zones
- large elements avoid protected negative-space regions

---

# Shape Vocabulary

Initial vocabulary:

```text
CircleElement
RingElement
LineElement
ArcElement
PolygonElement
AccentElement
```

Six types are enough for the first complete engine.

---

# Circle Element

Possible roles:

- anchor
- secondary mass
- orbital object
- transparent wash
- accent

Properties may include:

```text
radius
eccentricity
rotation
edgeJitter
fillStrength
outlineStrength
watercolorStrength
inkStrength
```

---

# Ring Element

Useful for layered circular structures and spatial rhythm.

Possible appearances:

```text
◉
◎
◌
```

Rings should remain imperfect when rendered.

Potential behaviors:

- nested rings
- partial rings
- displaced concentric rings
- broken ink rings
- watercolor halos

---

# Line Element

Lines are relationships, gestures, and structural forces—not filler.

Possible roles:

```text
connector
gesture
separator
axis
burst
```

Example:

```js
line.role = "connector";
line.from = elementA;
line.to = elementB;
```

Lines may:

- connect elements
- cross shapes intentionally
- establish direction
- define visual tension
- create rhythm

---

# Polygon Element

Initial polygons:

- triangles
- quadrilaterals
- irregular 4–7 sided forms

Potential behaviors:

- intersect circles
- echo line angles
- act as counterweights
- become translucent watercolor fields

---

# Arc Element

Arcs soften the rigidity of the geometric system.

Uses:

- sweeping gestures
- partial circles
- orbital fragments
- directional motion
- broken circular echoes

---

# Accent Element

Small visual punctuation.

Examples:

```text
.
..
///
+
×
|
```

Possible media:

- ink
- watercolor
- dry brush
- splatter
- graphite-like marks

Typical count:

```text
20–50
```

---

# Relationship Engine

Elements should frequently exist because of relationships with other elements.

Possible relationship types:

```text
connect
intersect
orbit
echo
oppose
align
contain
```

## Connect

Creates a visual link between two elements.

## Intersect

Places one element deliberately through another.

## Orbit

Creates small related elements around a dominant form.

## Echo

Repeats one or more traits from another element:

- scale
- angle
- color
- form
- orientation

The echo should normally vary enough to avoid literal duplication.

## Oppose

Creates a visual counterweight elsewhere in the composition.

## Align

Shares a directional axis with another element.

## Contain

Places one visual structure inside another.

---

# Visual Hierarchy

Hierarchy should be explicitly generated.

Suggested starting ranges:

```text
anchors:          1–2
large secondary:  3–6
medium elements:  8–15
small accents:    20–50
```

Scale should usually follow weighted distributions rather than uniform randomness.

Example:

```js
let size = randomGaussian(60, 25);
```

This naturally creates a dominant scale with occasional outliers.

---

# Negative Space

Negative space must be intentionally protected.

Possible implementation:

```js
composition.exclusionZones = [
  {
    x: 0.65,
    y: 0.15,
    radius: 0.22
  }
];
```

Large and medium elements should be restricted from protected areas.

Small accents may occasionally enter them depending on the composition.

Negative space prevents generative abstraction from becoming visual mush.

---

# Controlled Overlap

Overlap is desirable, but total occlusion is not.

Starting parameter:

```js
maxOverlap = 0.4;
```

Exact polygon collision detection is not required initially.

Approximate bounding-circle or bounding-box checks are acceptable for early versions.

---

# Palette Architecture

Do not generate arbitrary RGB colors.

Use curated palettes.

Example:

```js
const palettes = [
  {
    name: "earth-primary",

    paper: "#eee4d2",

    colors: [
      "#d6a620",
      "#b8322b",
      "#294f75",
      "#5b7d4b",
      "#d67c32"
    ],

    ink: "#25221e"
  }
];
```

Target:

- 4–6 chromatic colors
- one dark ink color
- one paper tone

Watercolor rendering may alter apparent saturation and value naturally through opacity and layering.

---

# Watercolor Renderer

Watercolor must be treated as a renderer rather than simply transparent fill.

Suggested interface:

```js
class WatercolorRenderer {
  drawCircle(element) {}
  drawPolygon(element) {}
  drawWash(element) {}
  drawBloom(element) {}
}
```

---

# Watercolor Construction

A watercolor circle should **not** be:

```js
ellipse(x, y, diameter);
```

Instead it should be composed from multiple translucent irregular passes.

Conceptually:

```js
for (let i = 0; i < washLayers; i++) {
  drawIrregularCircle(...);
}
```

Each pass may vary:

```js
x += random(-jitter, jitter);
y += random(-jitter, jitter);

radius *= random(0.97, 1.03);

alpha = random(3, 12);
```

Important:

Random variation should eventually become correlated with noise so the result looks like pigment behavior rather than vibrating geometry.

---

# Irregular Geometry

Create reusable geometry generators rather than relying on perfect p5 primitives.

Example:

```js
makeWobblyRing(x, y, radius, points, jitter)
```

Concept:

```js
for (let a = 0; a < TWO_PI; a += step) {
  let r2 = radius + noise(...) * jitter;

  vertex(
    x + cos(a) * r2,
    y + sin(a) * r2
  );
}
```

Useful for:

- circles
- rings
- watercolor blooms
- stains
- polygon edge disturbance
- soft boundaries

---

# Pigment Granulation

Texture should exist inside painted regions, not only on top of the finished image.

Possible method:

```js
addPigmentSpeckles(mask);
```

Granulation may use:

- noise-driven density
- tiny low-opacity pigment dots
- clustered pigment deposits
- irregular transparency variation

Example concept:

```js
if (noise(x * scale, y * scale) > threshold) {
  point(x, y);
}
```

---

# Pigment Pooling

Watercolor often darkens around portions of edges.

Simulate this using:

1. a faint darker irregular contour
2. partial contour emphasis
3. uneven alpha
4. noise-controlled pooling regions

Example:

```js
if (noise(angle * 2) > 0.55) {
  drawEdgeSection();
}
```

Avoid uniform outlines.

---

# Blooms and Bleeds

Later watercolor refinements may include:

- soft bloom rings
- outward pigment displacement
- partial edge diffusion
- pigment accumulation
- pale interior water spots
- overlapping wash interactions

These belong inside `WatercolorRenderer`, not individual element classes.

---

# Paper Surface System

Paper should be rendered once into its own graphics layer.

```js
paperLayer = createGraphics(width, height);
```

Possible components:

## Grain

Thousands of extremely subtle tonal variations.

## Large-Scale Tonal Variation

Use low-frequency noise for natural unevenness.

## Fibers

Sparse short lines with very low opacity.

## Stains

3–10 large, faint, irregular tonal patches.

Potential interface:

```js
paperRenderer.render(paperLayer);
```

---

# Ink Renderer

Watercolor alone may become too soft.

Ink provides structure and contrast.

```js
inkLayer = createGraphics(width, height);
```

Potential functions:

```js
drawSketchLine()
drawDryBrushLine()
drawBrokenLine()
drawDotCluster()
drawSketchArc()
```

Ink should often use multiple imperfect passes rather than a single digitally perfect stroke.

---

# Rendering Layers

Initial p5 graphics buffers:

```js
let paperLayer;
let washLayer;
let inkLayer;
let textureLayer;
```

Composite order:

```js
image(paperLayer, 0, 0);
image(washLayer, 0, 0);
image(textureLayer, 0, 0);
image(inkLayer, 0, 0);
```

Potential watercolor blending:

```js
washLayer.blendMode(MULTIPLY);
```

Blend modes should be tested visually rather than assumed to be physically accurate.

---

# Render Order

Recommended painting order:

```text
paper
↓
large pale washes
↓
major shapes
↓
secondary shapes
↓
lines and arcs
↓
dark accents
↓
pigment artifacts
↓
final surface texture
```

This order should create depth while preserving structural clarity.

---

# Generation Workflow

Generation should occur in explicit phases.

```js
function generateArtwork() {
  clearArtwork();

  createComposition();

  createAnchorElements();
  createSecondaryElements();
  createRelationships();
  createAccentMarks();

  renderWatercolor();
  renderInk();
  renderTexture();
}
```

Composition happens before rendering.

This is an important architectural rule.

---

# Seeded Randomness

Every generated composition must be reproducible.

Example:

```js
let seed = floor(random(999999));

randomSeed(seed);
noiseSeed(seed);

console.log(`Seed: ${seed}`);
```

Saved artwork should include the seed in the filename.

Example:

```js
saveCanvas(
  `watercolor-abstract-${seed}`,
  "png"
);
```

---

# Art-Directed Randomness

Avoid using raw `random()` everywhere.

Prefer reusable helpers such as:

```js
weightedChoice()
biasedRandom()
clusteredRandom()
gaussianRandom()
randomAround()
chance()
```

Examples:

```js
const shape = weightedChoice([
  ["circle", 0.30],
  ["ring", 0.18],
  ["polygon", 0.20],
  ["arc", 0.15],
  ["line", 0.17]
]);
```

Randomness should create variation **inside a design system**, not replace design.

---

# Global Settings

Centralize artistic parameters.

```js
const SETTINGS = {

  composition: {
    density: 0.55,
    asymmetry: 0.8,
    chaos: 0.4,
    negativeSpace: 0.35,
    maxOverlap: 0.4
  },

  watercolor: {
    layers: 35,
    jitter: 4,
    bleed: 0.6,
    granulation: 0.5,
    pooling: 0.4
  },

  ink: {
    amount: 0.45,
    roughness: 2.5,
    thickness: 1.2
  },

  paper: {
    grain: 0.25,
    stain: 0.12
  }
};
```

Do not scatter tunable constants throughout implementation files.

---

# Presets

Once the engine becomes stable, define style presets instead of changing core algorithms.

Potential presets:

```js
PRESETS.quiet
PRESETS.explosive
PRESETS.geometric
PRESETS.gestural
PRESETS.washedOut
PRESETS.inkHeavy
```

A preset changes parameters.

It should not duplicate the engine.

---

# Keyboard Controls

Initial controls:

```text
R = regenerate composition
S = save image
P = change palette
I = toggle ink
T = toggle texture
W = toggle watercolor
```

Additional controls can be introduced later only if they remain useful.

---

# Proposed Project Structure

```text
abstractArtist/
│
├── DESIGN.md
├── CHANGELOG.md
├── index.html
│
└── js/
    ├── sketch.js
    ├── settings.js
    ├── palettes.js
    │
    ├── composition/
    │   ├── Composition.js
    │   └── relationships.js
    │
    ├── elements/
    │   ├── ArtElement.js
    │   ├── CircleElement.js
    │   ├── LineElement.js
    │   └── PolygonElement.js
    │
    ├── renderers/
    │   ├── WatercolorRenderer.js
    │   ├── InkRenderer.js
    │   └── PaperRenderer.js
    │
    └── utilities/
        ├── random.js
        └── geometry.js
```

This structure may evolve, but the architectural boundaries should remain.

---

# Build Strategy

Build vertically while preserving the target architecture.

Prototype code should go into its eventual subsystem rather than accumulating inside `sketch.js`.

Do not create temporary implementations that bypass the design unless there is a compelling reason.

---

# Milestones

## v0.1 — Surface

Goal:

- working p5.js project
- graphics layers
- convincing paper background
- paper grain
- subtle tonal variation

Definition of done:

> The empty canvas already looks like a plausible physical watercolor surface.

---

## v0.2 — Paint Primitives

Goal:

- watercolor circle
- watercolor polygon
- wobbly geometry utility
- layered wash behavior

Definition of done:

> A circle and polygon look painted rather than like transparent vector shapes.

---

## v0.3 — Ink Primitives

Goal:

- sketchy line
- broken line
- imperfect arc
- basic accent marks

Definition of done:

> Ink marks contrast effectively with the watercolor while still appearing handmade.

---

## v0.4 — Elements

Goal:

- logical `ArtElement`
- circle
- ring
- line
- polygon
- arc
- accent metadata

Definition of done:

> The system can describe a composition without rendering it.

---

## v0.5 — Composition

Goal:

- anchor
- secondary cluster
- counterweight
- rhythm
- gesture
- at least two composition templates
- protected negative space

Definition of done:

> Generated layouts read as compositions rather than collections of random shapes.

---

## v0.6 — Relationships

Goal:

Implement:

```text
connect
intersect
orbit
echo
oppose
align
contain
```

Definition of done:

> Many elements visibly exist because of their relationships with other elements.

---

## v0.7 — Art Direction

Goal:

- weighted randomness
- visual hierarchy
- controlled overlap
- clustering
- distribution control
- asymmetrical balance

Definition of done:

> Multiple seeds feel related stylistically while still producing genuinely different compositions.

---

## v0.8 — Texture Polish

Goal:

- pigment granulation
- pooling
- blooms
- stains
- splatter
- dry-brush artifacts

Definition of done:

> Surface behavior contributes materially to the artwork instead of functioning as decorative noise.

---

## v0.9 — Controls

Goal:

- palette switching
- chaos
- density
- negative space
- watercolor strength
- ink strength
- texture strength
- presets

Definition of done:

> Artistic character can be changed without editing implementation code.

---

## v1.0 — Generative Painting Engine

Goal:

- complete architecture
- stable seeded output
- reliable save behavior
- reusable palette system
- multiple composition families
- polished watercolor/ink rendering
- coherent settings and presets

Definition of done:

> The project functions as a reusable abstract painting system rather than a single p5.js sketch.

---

# Git Strategy

Create a meaningful commit at every stable milestone.

Suggested tags or commit labels:

```text
v0.1-surface
v0.2-watercolor-primitives
v0.3-ink-primitives
v0.4-elements
v0.5-composition
v0.6-relationships
v0.7-art-direction
v0.8-texture-polish
v0.9-controls
v1.0-engine
```

Do not move to the next milestone while the current one is unstable unless experimentation is happening on a separate branch.

---

# CHANGELOG.md Strategy

`CHANGELOG.md` should behave like an artistic laboratory notebook, not a formal software release log.

Record:

- visual discoveries
- failed experiments worth remembering
- parameter ranges that work
- parameter ranges that fail
- rendering performance observations
- accidental effects worth preserving
- unresolved artistic questions

Example:

```text
v0.2

- Added layered watercolor circles.
- Increased edge jitter.
- Pigment still looks too uniformly digital.
- Multiple faint passes look better than fewer dark passes.
- Next: try noise-correlated contour variation.
```

This helps preserve discoveries that may otherwise disappear during experimentation.

---

# Development Rule for Future Changes

Before adding a feature, ask:

```text
1. Does it affect WHY something exists?
   → Composition or Relationship Engine

2. Does it affect WHAT the element is?
   → Shape Vocabulary / Element Model

3. Does it affect WHERE something goes?
   → Composition / Geometry

4. Does it affect HOW it looks?
   → Renderer

5. Does it affect the physical surface?
   → Surface System

6. Is it a tunable artistic choice?
   → settings.js

7. Is it a reusable probability/distribution behavior?
   → utilities/random.js
```

If the feature does not clearly belong anywhere, determine whether:

- the architecture needs a new subsystem, or
- the feature does not belong in the project.

---

# Immediate Next Step

Begin **v0.1 — Surface**.

Build only:

1. p5.js project shell
2. rendering buffers
3. warm paper base
4. low-frequency tonal variation
5. subtle grain
6. sparse fiber texture
7. faint stains

Do **not** begin composition generation yet.

Once the paper surface is convincing, proceed to **v0.2 — Paint Primitives**.

---

# Project Philosophy

The engine should create art through constrained possibility.

The goal is not maximum randomness and not perfect order.

The goal is a productive tension between:

```text
geometry        ↔ gesture
structure       ↔ spontaneity
clarity         ↔ ambiguity
ink             ↔ watercolor
order           ↔ chaos
system          ↔ accident
```

The code creates the conditions.

The artwork emerges from the interaction of those conditions.
