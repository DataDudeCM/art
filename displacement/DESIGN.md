# Displacement Mapper

## Project Intent

Displacement Mapper is a p5.js creative image-transformation tool for experimenting with both traditional image-based displacement and code-generated displacement fields.

The project began with the goal of reproducing Photoshop-style displacement mapping, but its broader purpose is to become a flexible visual laboratory where different systems can determine both:

1. **how image samples move**, and
2. **how those displaced samples are rendered**.

The tool should support faithful image distortion when desired, but also encourage generative, painterly, and experimental results that go beyond conventional image-editing filters.

---

## Core Creative Model

Displacement Mapper has two independent creative systems:

### 1. Displacement

Displacement determines **motion**.

A displacement mode answers:

> For a sample at `(x, y)`, how should its position be redirected?

Each displacement mode returns:

```js
{
  dx: horizontal displacement,
  dy: vertical displacement
}
```

The displacement engine should not care how those values were created.

### 2. Rendering

Rendering determines **mark-making**.

A render mode answers:

> Once the displacement has been calculated, how should the result be visually represented?

The core principle is:

> **Displacement determines motion. Rendering determines mark-making.**

This separation is fundamental to the architecture.

---

## Conceptual Pipeline

```text
Source Image
    ↓
Displacement Field
    ↓
Displaced Samples
    ↓
Renderer
    ├── Pixel Renderer
    ├── Brush Renderer
    └── future renderers
    ↓
Output Image
```

A displacement mode should never need to know whether its output will be rendered as pixels, brush marks, lines, blocks, or another future visual primitive.

---

## Current Architecture

```text
Sketch / App State
│
├── Source / Preview State
│   ├── full-resolution source image
│   ├── preview source image
│   ├── displacement map
│   └── current rendered preview
│
├── UI
│   ├── source image
│   ├── displacement mode selection
│   ├── mode-specific controls
│   ├── before / after
│   ├── randomize where relevant
│   ├── save output
│   └── future render-mode controls
│
├── Displacement Engine
│   ├── iterates through working samples
│   ├── requests dx / dy
│   ├── samples the source image
│   └── produces rendered output
│
├── Displacement Modes
│   ├── Image Map
│   ├── Flow Field
│   ├── Radial Field
│   └── future modes
│
└── Render Modes
    ├── Pixel Renderer
    ├── Brush Renderer (planned)
    └── future renderers
```

The current implementation is CPU-based, but the architecture should remain conceptually compatible with future GPU / shader rendering.

---

## File Structure

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

Possible future renderer-specific files may be introduced only when actual code separation justifies them, for example:

```text
js/
├── renderers/
│   ├── pixelRenderer.js
│   └── brushRenderer.js
```

Avoid creating additional abstractions prematurely.

---

# Displacement System

## Image Map

Uses a user-supplied image as the displacement source.

Current behavior:

- red channel controls horizontal displacement
- green channel controls vertical displacement
- 128 is approximately neutral
- the displacement map is resized to match the active working image
- the original displacement map remains unchanged

Controls:

- horizontal strength
- vertical strength

This mode is intentionally close to traditional Photoshop-style displacement.

---

## Flow Field

Generates displacement procedurally using Perlin noise.

Controls:

- strength
- noise scale
- angle multiplier
- seed / randomize

Conceptually:

```js
const n = noise(
  x * noiseScale,
  y * noiseScale
);

const angle =
  n * TWO_PI * angleMultiplier;

return {
  dx: cos(angle) * strength,
  dy: sin(angle) * strength
};
```

Flow Field is one of the strongest candidates for future animation and GPU rendering.

---

## Radial Field

Creates a push / pull displacement around a selected center.

Controls:

- strength
- radius
- falloff

Interaction:

- the radial center can be placed by clicking directly on the image
- the center is stored in normalized coordinates rather than raw pixels
- normalized coordinates allow the same center to work correctly at preview and full resolution

Conceptually:

```text
center
  ↓
strong displacement
  ↓
progressively weaker
  ↓
zero at radius boundary
```

Positive and negative strength produce opposite directional behavior.

---

# Preview and Full-Resolution Rendering

Interactive performance and final output quality are separate concerns.

The application maintains:

```text
sourceImg
    ├── full resolution
    │       ↓
    │   final render / save
    │
    └── preview copy
            ↓
        interactive editing
```

## Preview Strategy

Large source images are copied and resized to a maximum working dimension for interaction.

Current target:

```text
PREVIEW_MAX_DIMENSION = 1200
```

This value is a performance / quality dial and may be adjusted later.

Example:

```text
6000 × 4000 source
        ↓
1200 × 800 preview
```

This reduces a 24-million-pixel source to approximately 960,000 preview pixels.

The preview should be used for:

- slider interaction
- displacement mode changes
- Flow Field randomization
- radial-center placement
- before / after display

---

## Full-Resolution Output

Saving should deliberately render from the original full-resolution source.

```text
Full-resolution source
        ↓
same displacement settings
        ↓
full-resolution render
        ↓
PNG
```

The saved image must never be a screenshot of the scaled canvas.

The expensive render is acceptable when saving; routine editing should remain responsive.

---

## Resolution Scaling

Displacement parameters expressed in pixels must scale between preview and full-resolution renders.

For a working image:

```js
renderScale =
  workingSource.width /
  sourceImg.width;
```

Pixel-based strengths should scale proportionally:

```js
scaledStrength =
  strength *
  renderScale;
```

This keeps preview and final displacement visually consistent.

### Flow Field Noise Scale

Flow Field requires an additional adjustment.

Because its noise structure depends on image-space coordinates, preview rendering should compensate for resolution changes:

```js
scaledNoiseScale =
  noiseScale /
  renderScale;
```

This preserves approximately the same large-scale flow structures between preview and full-resolution output.

---

# Rendering Architecture

## Render Modes

Render modes control how displaced samples are drawn.

Initial and planned render modes:

- **Pixel**
- **Brush** (planned)

Possible later renderers:

- Dab
- Line Stroke
- Tile / Block
- Ink / Hatch
- Textured Stroke
- GPU procedural painterly renderer

Render modes are optional visual interpretations layered on top of the displacement system.

---

## Sample Abstraction

The rendering layer should be designed conceptually around displaced **samples**, not only destination pixels.

A sample may be thought of as:

```js
{
  x,        // destination position
  y,

  sx,       // sampled source position
  sy,

  dx,       // displacement vector
  dy,

  color     // sampled source color
}
```

Different renderers may interpret the same sample differently.

This does not require that every implementation literally allocate sample objects; it is a conceptual contract for keeping displacement and rendering independent.

---

## Pixel Renderer

The Pixel Renderer is the current default renderer.

Characteristics:

- faithful
- deterministic
- appropriate for traditional distortion
- suitable for full-resolution still output
- appropriate as the baseline reference renderer

Its behavior is conceptually:

```text
calculate displacement
→ determine source sample coordinate
→ read RGBA
→ write RGBA to destination
```

Pixel rendering should remain available even after experimental render modes are introduced.

---

## Brush Renderer

The Brush Renderer is a planned optional render mode.

It is **not** a displacement mode.

### Intent

Instead of representing each displaced sample as one output pixel, the Brush Renderer interprets selected samples as painterly marks.

This shifts Displacement Mapper from purely distorting images toward visually interpreting them.

A first version should:

- sample the image on a coarse grid
- use the displacement vector to determine stroke direction
- use the sampled source color for the stroke
- draw short directional marks
- remain optional
- avoid dramatic performance degradation

---

## Initial Brush Controls

The first Brush Renderer should stay deliberately small.

Controls:

- **Spacing**
- **Length**
- **Thickness**
- **Opacity**

Possible later controls:

- angle jitter
- length jitter
- position jitter
- color variation
- displacement-magnitude-driven length
- textured stamps
- curved strokes
- alternate direction sources

Do not add these secondary controls until the basic renderer proves artistically worthwhile.

---

## Brush Performance

A Brush Renderer should not draw one mark for every source pixel.

Instead, it should use a sampling step:

```js
for (
  let y = 0;
  y < height;
  y += spacing
) {
  for (
    let x = 0;
    x < width;
    x += spacing
  ) {
    // create mark
  }
}
```

For a 1200 × 800 preview:

```text
Spacing 1  → 960,000 samples
Spacing 4  →  60,000 samples
Spacing 6  → ~26,700 samples
Spacing 8  →  15,000 samples
```

Reduced sampling density is both:

1. a performance strategy, and
2. part of the painterly aesthetic.

The Brush Renderer should be designed so that reasonable settings are not dramatically slower than Pixel mode.

---

## Brush Direction

The simplest first approach is to orient each mark using the displacement vector:

```js
angle =
  atan2(dy, dx);
```

This visually connects mark-making directly to the displacement field.

Later possibilities include:

- fixed direction
- image-gradient direction
- edge direction
- noise-driven variation
- combinations of displacement direction and image structure

---

# CPU Rendering Strategy

The current renderer is CPU-based.

CPU rendering is appropriate for:

- still images
- high-resolution export
- understanding displacement behavior
- debugging new displacement modes
- developing the first Brush Renderer
- testing visual ideas before introducing GPU complexity

The CPU implementation should remain simple enough to inspect and reason about.

---

# GPU / Shader Strategy

GPU rendering is a future milestone, not an immediate replacement for the CPU renderer.

Shaders become worthwhile when the project needs:

- real-time animation
- high-performance interactive displacement
- animated Flow Fields
- animated Vortex / Wave / Ripple effects
- procedural real-time painterly rendering

The architecture should support GPU rendering conceptually without forcing CPU and GPU implementations to share identical code.

---

## CPU / GPU Contract

CPU and GPU renderers should share **meaning**, not necessarily implementation.

For example:

```text
CPU Pixel
GPU Pixel
```

may reasonably aim for close visual equivalence.

But:

```text
CPU Brush
GPU Brush
```

do not need exact visual parity.

Brush rendering is interpretive and should not be constrained by an unnecessary requirement for identical output.

---

## Possible GPU Brush Strategies

### 1. Procedural Brush-Look Fragment Shader

Generate painterly directional texture directly in the shader.

Possible ingredients:

- displaced UV coordinates
- directional sampling
- anisotropic filtering
- noise
- elongated sampling kernels
- stroke-like modulation

This may be the fastest route for real-time painterly animation.

### 2. Instanced Brush Geometry

Represent each brush mark as a small GPU primitive.

For example:

```text
20,000 brush marks
    ↓
instanced GPU drawing
```

The GPU can determine:

- position
- rotation
- length
- thickness
- brush texture

This is more complex but gives true discrete marks.

### 3. Accumulation / Render-to-Texture

Allow brush marks to persist across frames.

This could support:

```text
animated flow field
+
persistent marks
=
painting that evolves over time
```

This is a larger future direction and should only be pursued after simpler GPU rendering has proven valuable.

---

# Animation Strategy

Animation remains a worthwhile future feature, especially for:

- Flow Field
- Vortex
- Wave
- Ripple
- particle-driven fields
- attractor systems

The current CPU renderer should not be expanded into a temporary high-frequency animation system if the intended long-term solution is GPU / shader based.

Flow Field is the likely first shader animation candidate.

Possible animated Flow Field behavior:

```js
noise(
  x * scale,
  y * scale,
  time
);
```

or other temporal evolution of the field.

Animation should be pursued as an intentional GPU milestone rather than layered onto the CPU renderer as disposable infrastructure.

---

# UI Direction

The intended layout is:

- image workspace on the left
- control panel on the right
- source image selector
- displacement mode selector
- mode-specific controls
- before / after control
- randomize where relevant
- save output
- future render-mode selector
- future render-specific controls

The image should scale to fit the available workspace while preserving aspect ratio.

Mode-specific controls should appear only when relevant.

Render-specific controls should also appear only when the selected renderer requires them.

The UI should remain visually restrained and function like a serious creative tool rather than a themed web page.

---

## Visual Palette

The UI uses the shared `Industrial Sun` palette.

Roles:

```text
Dark      #272727
Warm      #fed766
Cool      #009fb7
Neutral   #696773
Light     #eff1f3
```

Usage intent:

- dark: workspace and panel background
- light: primary text
- neutral: secondary text, borders, inactive elements
- warm: primary action / important accent
- cool: secondary action / hover / alternate accent

Color should remain functional rather than decorative.

---

# Saving

Saving is part of the core feature set.

Requirements:

- save processed output, not the browser canvas
- use original source dimensions
- re-render full resolution using current settings
- preserve the active displacement mode
- preserve active mode settings
- eventually preserve active render mode and render settings

Saving may take noticeably longer than preview interaction.

That is acceptable.

---

# Design Rules

1. **Displacement modes define motion, not mark style.**
2. **Render modes define mark style, not motion.**
3. Displacement modes should calculate displacement only.
4. New displacement modes should plug into the existing engine rather than duplicate it.
5. Pixel rendering remains the baseline reference renderer.
6. Brush rendering remains optional.
7. New renderers should not require changes to displacement-mode logic.
8. The engine owns common iteration, sampling, and rendering coordination.
9. UI logic should remain separate from displacement logic.
10. Mode-specific controls should appear only when relevant.
11. Render-specific controls should appear only when relevant.
12. Full-resolution source images should remain intact.
13. Working preview copies may be resized for performance.
14. Interactive editing should favor preview performance.
15. Final saved output should favor image quality.
16. Pixel-based displacement values must scale appropriately between preview and full resolution.
17. Brush rendering should use reduced sampling density to protect performance.
18. CPU and GPU implementations may differ as long as they preserve the same conceptual behavior.
19. Avoid unnecessary class hierarchies or abstractions until real duplication justifies them.
20. Do not add GPU complexity until an artistic or performance requirement earns it.

---

# Completed Milestones

## Combined Displacement Tool

Completed:

- local source image loading
- before / after toggle
- Image Map mode
- Flow Field mode
- mode switching without reloading source image
- Image Map X / Y strength controls
- Flow Field strength, noise scale, angle multiplier
- Flow Field randomization
- full-resolution save output

## UI Pass

Completed:

- dedicated image workspace
- right-side control panel
- Industrial Sun palette
- mode-specific controls
- visible before / after action
- dedicated save action

## Radial Field

Completed:

- radial displacement
- strength
- radius
- falloff
- click directly on image to establish radial center
- visual radial-center marker

## Preview / Full-Resolution Pipeline

Completed:

- full-resolution source retained
- reduced preview source
- interactive preview rendering
- render-scale compensation
- full-resolution final render when saving

---

# Near-Term Rendering Milestone

## Render Mode v1

Planned:

- add Render Mode selector
  - Pixel
  - Brush
- keep Pixel as default
- implement first Brush Renderer
- coarse sampling grid
- stroke direction from displacement vector
- sampled source color
- controls:
  - spacing
  - length
  - thickness
  - opacity
- confirm that Brush mode does not dramatically degrade preview performance
- preserve full-resolution saving where practical

The first Brush implementation should be treated as an experiment to determine whether render-mode variation is a fertile creative direction.

Do not overbuild it before evaluating the visual results.

---

# Future Displacement Modes

These are possibilities, not requirements.

## Strong Candidates

### Vortex / Twist

Rotate samples around a selected center with radius and falloff.

Likely controls:

- twist
- radius
- falloff

This is a strong candidate because it introduces rotational force rather than another variation of push / pull displacement.

---

### Edge Field

Detect image edges and use them to influence displacement.

This is especially interesting because the image itself begins generating the force field.

---

### Wave Field

Sinusoidal horizontal / vertical or directional displacement.

Possible controls:

- wavelength
- amplitude
- angle
- phase

---

### Curl Noise

A more fluid, circulation-oriented relative of the current Flow Field.

Potentially useful for smoke, currents, painterly motion, and later animation.

---

### Multiple Attractors

Several points pull or repel samples simultaneously.

This generalizes the current single radial field and may produce organic interacting structures.

---

## Additional Candidates

- **Ripple** — concentric oscillating displacement around a selected center.
- **Directional Smear** — push samples along a fixed direction, optionally influenced by noise or luminance.
- **Self-Map** — use the source image itself as the displacement map.
- **RGB Split** — independently displace red, green, and blue channels.
- **Bands / Stripes** — displacement varies by horizontal, vertical, or angled bands.
- **Attractor Field** — generalized point attraction / repulsion.
- **Multiple Radial Fields** — multiple push / pull centers.
- **Vector Noise** — independent noise functions determine X and Y displacement.
- **Grid Warp** — distort space according to a warped lattice.
- **Perspective / Funnel** — displacement increases toward a vanishing point or line.
- **Shear Field** — progressively shift rows or columns.
- **Fold / Crease** — distort around a line as though bending a sheet.
- **Lens / Bulge / Pinch** — nonlinear spatial remapping related to radial distortion.
- **Spiral Ripple** — combine rotational and concentric wave behavior.
- **Particle Field** — invisible particles create local displacement forces.
- **Drawing Field** — user-drawn strokes become directional displacement forces.
- **Recursive Field** — recursively subdivide image space and apply structured displacement.
- **Image Gradient Field** — use luminance gradients to redirect samples.
- **Color Field** — selected colors attract, repel, or redirect samples.
- **Threshold / Region Field** — limit displacement to brightness or color ranges.
- **Pixel Sort / Displacement Hybrid** — combine displacement with non-spatial pixel reordering.

---

# More Experimental Field Systems

Possible longer-term explorations:

- gravity wells
- magnetic dipoles
- reaction-diffusion fields
- Voronoi / cellular fields
- strange attractors
- pendulum-driven fields
- agent-generated fields

These should remain exploratory and should not dictate the architecture prematurely.

---

# Current Shortlist for Future Displacement Work

If narrowing future displacement development to five high-value modes:

1. **Vortex**
2. **Edge Field**
3. **Wave Field**
4. **Curl Noise**
5. **Multiple Attractors**

The intent is to prioritize meaningfully different visual behaviors rather than accumulate minor variations of the same distortion.

---

# Long-Term Direction

Displacement Mapper should remain a focused creative tool rather than become a generic image editor.

Its strongest identity is likely to emerge from the combination of:

```text
interesting displacement systems
+
optional mark-making renderers
+
fast interactive preview
+
high-quality still output
+
selective GPU animation
```

The project should continue to favor experimental visual potential over feature count.

New features should earn their place by adding one of three things:

1. a meaningfully different spatial transformation,
2. a meaningfully different way of rendering marks, or
3. a genuinely useful improvement to creative exploration.
