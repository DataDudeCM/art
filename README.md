# Art from Code

This is my playground for making art with code—mostly JavaScript and p5.js, plus some Python.

I've been fascinated by the intersection of code and visual art for a long time—using rules, randomness, geometry, recursion, particles, images, and other systems to create things that aren't entirely predictable.

Some projects are experiments. Some are finished pieces. Some are strange little ideas that went somewhere unexpected. That's part of the point.

## What You'll Find Here

The work spans a pretty wide range of generative and computational art, including:

- generative drawing and painting
- particles and autonomous systems
- recursion and fractals
- image manipulation
- geometric and abstract composition
- procedural textures
- simulations
- sound-driven graphics
- experiments that don't fit neatly into any category

Most of the work is built with **JavaScript and p5.js**. Older Python and pygame experiments live in `python/`.

## How It's Organized

Projects are grouped by the kind of art they explore, not by language or when they were made:

| Folder | What's in it |
|---|---|
| `generative/` | rule-based systems: particles, recursion, substrate, fractals, emergent and autonomous agents |
| `painting/` | painterly rendering: watercolor, brush experiments, region and abstract painters |
| `image-art/` | work that starts from an image: portraits, displacement, image manipulation and collage |
| `geometry/` | geometric and mathematical pieces: Voronoi, math art, Rubik, shape design |
| `text/` | asemic writing and other text-as-mark experiments |
| `sound/` | sound-driven graphics and the Akai MIDI controller sketches |
| `experiments/` | doodles, sets, and new ideas that haven't found a home yet |
| `archive/` | early sketches, kept as they were |
| `python/` | pygame sketches (`python/pygame/`) and tools such as the texture library app (`python/tools/`) |
| `common/` | shared assets and helpers used across projects |

## Running the Sketches

The p5.js sketches are meant to be served from the **repository root** with VS Code's Live Server. Opening `art.code-workspace` or the `art` folder does this.

Shared assets are loaded with root-relative paths, so a project works at any folder depth:

```html
<script src="/common/js/palette.js"></script>
```

```js
loadImage("/common/brushes/Watercolor 1.png");
```

That also means pages opened directly from disk (`file://`) won't find `/common/`. Use Live Server.

Files that belong to a single project (its own `js/` or `assets/` folder) are referenced with ordinary relative paths, so they move with the project.

The Python sketches run locally, not in the browser. Run the pygame scripts from inside `python/pygame/`: they share `coreClasses.py` and `corefuncs.py` and load `images/` and `textures/` relative to that folder.

## The Approach

I'm less interested in making code that produces a perfectly predetermined image than I am in creating **systems that can surprise me**.

A sketch often starts with a simple question:

> What happens if...?

Then I build the rules, run the system, change something, break something, and see what emerges.

More recently I've been exploring ways to make generative work feel less obviously computer-generated—combining algorithmic structure with brush textures, imperfect marks, transparency, painterly color, and ideas borrowed from traditional art.

The algorithm creates the conditions.

The interesting part is what happens inside them.

## Shared Tools

The `common` directory contains reusable pieces that have grown out of these experiments, including tools for:

- color palettes
- image-based brush strokes
- drawing and geometry utilities
- other helpers shared between sketches

Older projects may use `-legacy` versions of some helpers so they continue to work while the newer tools evolve.

Reusable assets (brushes, paper textures, general images, fonts, shared JavaScript) go in `common/`. An asset used by only one project goes in that project's own folder.

`common/js/palette.js` is also served to my ProjectForge app, which expects this repo to sit next to it (`code/art` and `code/ProjectForge`). If you move or rename that file, update ProjectForge too.

## A Working Archive

This repository spans years of experimentation, so don't expect everything to be polished, documented, or even sensible.

That's intentional.

I keep the older experiments because sometimes an idea that wasn't particularly interesting five years ago becomes interesting again when combined with a new technique.

Code is part sketchbook, part laboratory, part art material.

### Revisiting old work

I don't rewrite old sketches just because they're old. When an older project looks interesting again:

1. Keep its underlying generative system intact.
2. Switch from legacy palettes to the new palette system.
3. Try replacing digital primitives—points, pixels, circles, simple lines—with image-based brush marks.
4. Compare the original renderer with the new painterly one.
5. Change the underlying algorithm only if the experiment calls for it.

The goal is to rediscover good systems and give them a richer visual and material language, not to rebuild everything.

If you find something interesting, feel free to explore.