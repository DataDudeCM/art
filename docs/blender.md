# Blender as a Renderer

Which of my sketches gain from Blender, and how to connect them.

Status: first experiment (cracked glass) working, 2026-10-06. The rest are ideas.

Blender adds real depth, physically accurate light and materials, physics, and output I can 3D-print. The sketches that gain most are the ones whose system is already a **surface**, a **path** or a **physical process**. For those, depth and material change what the piece is, not just add a dimension.

This doc is about Blender scripts I write myself, which belong in art. An *agent* driving Blender belongs in ProjectForge or diamond-age-studio. See the "Project Forge vs. Diamond Age" section of the Blender note in `OneDrive\MyCode\ideas\`.

---

## Approach

p5.js stays the **generator**; Blender is a **renderer**.

```text
p5 sketch ──export──► data file ──► Blender Python script ──► render / 3D-printable model
```

Each sketch exports its data in one of two simple forms:
- **Paths:** JSON lists of points, optionally with time, width or colour per point.
- **Fields:** grayscale PNGs (height, pigment density, etc.), at full canvas resolution.

A small Blender Python script builds the geometry from that file. This means:
- no algorithms get ported into Blender;
- one Blender script serves every sketch that exports the same kind of data;
- it matches the telemetry design, where renderers don't care where the data came from (see [game-telemetry.md](game-telemetry.md)).

Blender scripts live in `python/blender/`. Export code goes inside each sketch, behind a key or button.

`.blend` files are binary and can be large, so commit the scripts that generate scenes. Keep `.blend` files only for finished pieces, or out of git entirely; decide before the first one lands.

---

## Strongest candidates

### 1. rainWorn: paper as terrain (start here)

`experiments/rainWorn` is already a hydraulic-erosion simulation on a heightfield: paper tooth, cockle and board tilt steer the water, and the drops carve channels. In p5 that height data stays invisible.

- **Export:** paper height, plus pigment density per pigment, as PNG fields.
- **Blender:** paper as a displaced surface under low raking light, so cockles, tide lines and granulation cast real shadows. Pigment densities drive the material.
- **Physical:** the heightmap as a printed relief, or a lithophane (a thin print whose image shows when lit from behind).

### 2. Agent and walker paths: time becomes height

substrate, temporalFractal, evidenceOfEncounter and emergentArtist all leave trails over time.

- **Export:** each trail as a path with time per point.
- **Blender:** trails become curves with thickness, with **z = time**. A run becomes a sculpture of its own history, the earliest marks at the bottom.
  - substrate's cracks could become carved grooves instead.
  - evidenceOfEncounter's meetings become knots where two paths touch.
- **Shared with telemetry:** a game session is also a trail, so one "paths → sculpture" script serves both.

### 3. Image to relief

`image-art/displacement` and `experiments/newideas/portraitLandscape` (already a WEBGL height grid from a portrait).

- **Export:** the displacement or height field as a PNG.
- **Blender:** a displacement modifier plus a material gives a bas-relief or layered relief.
- The easiest first win.

### 4. regionPainter as layered relief

`painting/regionPainter` already produces well-defined regions.

- **Export:** each region as a mask (or outline), with its colour.
- **Blender:** regions stacked at different heights, like layered cut paper. The layers can also be exported for laser-cutting or printing.

---

## Worth trying later

- **fracture:** my crack patterns driving Blender's fracture and rigid-body physics, with real refracting glass. Blender already shatters objects well, so what's mine is the pattern.
- **Voronoi sketches:** 3D cells, lamp shades, printable objects.
- **pygame tileart:** carbon/silicon tiles extruded as relief (organic vessels versus machined traces). Those tiles may already export SVG.
- **sound/waveTable3Db:** Blender can drive animation from an audio file. It works, but it isn't Blender's strength.

## Poor fits

- **Painterly brush work** (watercolor, abstractArtist, the brushes): its character comes from 2D brush marks, which is p5's strength. rainWorn is the exception, because its paint behaves like terrain.
- **ocean/wave:** Blender's built-in ocean simulation already does this better.
- **rubik:** already 3D, so Blender only adds polish.
- **asemic:** stays 2D in spirit.

---

## Experiment: cracked glass (working)

`python/blender/cracked_glass.py` turns any white-on-black crack image (from fracture or eclipse) into a pane of cracked glass. It uses approach 1 below: the image as a crack map, not real geometry.

- **The pane:** a thin glass pane. Its material uses the image as a mask: cracks get an inverted bump (grooves) and a partly frosted, reflective glass, so they glint and bend the light like real cracks.
- **The background:** a procedural ember glow, or any image (`--background`). Use one of my own pieces to see it through the glass.
- **The light and camera:** a low, grazing key light and an 18° camera angle.
- **It's safe to run anywhere:** it builds its own "Cracked Glass" scene, so existing work in the .blend file is untouched.

**Run it in Blender:** open the Scripting tab, open the script, set `CRACK_IMAGE` at the top, click Run Script, then press F12.

**Run it headless:**
```
"C:\Program Files\Blender Foundation\Blender 5.2\blender.exe" --background --python cracked_glass.py -- --image cracks.png --out render.png --samples 64
```

First test (2026-10-06): an eclipse image rendered at 800 px with 48 samples in about 11 seconds.

**Settings to adjust** (at the top of the script):

| Setting | What it changes |
|---|---|
| `BUMP_STRENGTH` | How deep the grooves look |
| `CRACK_FROST` | Clear, refracting cracks (0) versus white frosted lines (1) |
| `CAMERA_ANGLE` | How far off-axis the camera sits |
| background colours | Blue and ember; set in `backdrop_material()` |

**Next to try:**
- **Higher-resolution crack images,** 4000 px or more. At 1200 px the cracks read as rounded tubes rather than sharp breaks. eclipse.js sizes its canvas to the window, so it needs a pixel-density option for big saves.
- **fracture's Glass mode,** for straighter, more realistic cracks.
- **My own artwork as the background** (`--background`).
- **Approach 2: real shards.** Export crack paths, cut the pane, and tilt the pieces. This only works where cracks fully enclose a region.

---

## First experiment

1. Add an export key to rainWorn that saves its paper height and pigment density fields as PNGs.
2. Write `python/blender/heightfield.py`: plane, subdivision, displacement from the PNG, a paper material, raking light, camera.
3. Render. Compare with the p5 output.
4. If it works, try the same script on portraitLandscape's height field (candidate 3). That checks the script is general.

## Open questions

- Run Blender scripts from inside Blender (Scripting tab), or headless from the command line (`blender --background --python ...`)? Headless suits batch renders; the UI suits exploring.
- The export resolution needed for a convincing displaced surface, versus file size.
- Which material model gives a convincing watercolor glaze over displaced paper.
