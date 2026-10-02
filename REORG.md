# Art Repo Reorganization

## Goal

Make this the single home for all of my art code — JavaScript (p5.js)
and Python — organized by the kind of art being explored rather than by
language or by when it was made.

The artwork itself should not change. Only locations, paths, and
repository structure change.

## Decisions

1. **One repo for all art.** `artfromcode` (Python) merges into this repo
   under `python/`, keeping its git history. The `artfromcode` repo is then
   archived on GitHub.
2. **Root-relative paths for shared assets.** All references to `common/`
   use `/common/...` instead of `../common/...`, so a project works at any
   folder depth and can move without path edits.
3. **Projects grouped by kind of art,** in a shallow structure (category →
   project).
4. **Python work stays together under `python/`.** Not because of language,
   but because those scripts run locally (not in the browser), share their
   own helper modules, and use paths relative to the folder they are run
   from.
5. **`common/` is the source of truth for shared web assets,** including
   `palette.js`. The old `MyCode/shared/` folder is retired.

## Target Structure

```text
art/                              ← repo root and Live Server root
├── common/                       shared web assets (unchanged)
│   ├── js/                       palette.js, brush.js, legacy helpers, ...
│   ├── images/
│   ├── brushes/
│   ├── fonts/
│   ├── artifacts/
│   └── json/
│
├── generative/
├── painting/
├── image-art/
├── geometry/
├── sound/
├── text/
├── experiments/
├── archive/
│
├── python/                       former artfromcode repo
│   ├── pygame/                   moved as one unit (see Python notes)
│   └── tools/
│       └── texture_library_app/
│
├── favicon.ico
├── README.md
├── .gitignore
└── art.code-workspace
```

## Project Mapping

| Current folder | New location | Notes |
|---|---|---|
| `generative/particles` | `generative/particles` | already in place |
| `generative/recursion` | `generative/recursion` | empty folder; `recursion` moves into it |
| `recursion` | `generative/recursion` |  |
| `substrate` | `generative/substrate` | |
| `voronoi` | `geometry/voronoi` | |
| `temporarlFractal` | `generative/temporalFractal` | fix spelling while moving |
| `emergentArtist` | `generative/emergentArtist` | |
| `systemBecomingArt` | `generative/systemBecomingArt` | |
| `evidenceOfEncounter` | `generative/evidenceOfEncounter` | |
| `thespark` | `generative/thespark` | |
| `painting` | `painting` | stays; other painting projects move in as subfolders |
| `watercolor` | `painting/watercolor` | |
| `regionPainter` | `painting/regionPainter` | |
| `abstractArtist` | `painting/abstractArtist` | |
| `portraitArt` | `image-art/portraitArt` | |
| `akai` | `sound` | merge (no file name clashes) |
| `imagemanipulation` | `image-art/imagemanipulation` | 16 pages — could split into `collage/`, `pixel/` later |
| `displacement` | `image-art/displacement` | |
| `fracture` | `generative/fracture` | |
| `mathart` | `geometry/mathart` | |
| `rubik` | `geometry/rubik` | |
| `shapedesigner` | `geometry/shapedesigner` | |
| `asemic` | `text/asemic` | new text category |
| `sound` | `sound/` | category and project are the same for now |
| `newideas` | `experiments/newideas` | |
| `doodles` | `experiments/doodles` | |
| `set1` | `experiments/set1` | |
| `ocean` | `experiments/ocean` | |
| `archive` | `archive/` | unchanged |

## Paths

### Rule

Shared assets are always referenced root-relative:

```html
<script src="/common/js/palette.js"></script>
<link rel="icon" type="image/x-icon" href="/favicon.ico?v=2">
```

```js
loadImage("/common/brushes/Watercolor 1.png");
```

Paths inside a project (its own `js/`, `assets/`, etc.) stay relative, so
they move with the project.

### Why

About 57 references currently use `../common/`, which only works when a
project is exactly one level below the repo root. Moving projects into
categories would break every one of them. Root-relative paths work from
any depth.

### Requirements and caveats

- Live Server must serve from the repo root (`art/`). This is already the
  case when the `art` folder or `art.code-workspace` is opened in VS Code.
- Pages opened directly from disk (`file://`) won't find `/common/`.
  Always use Live Server.
- If the repo is ever published as a GitHub Pages *project* site
  (`username.github.io/art/`), root-relative paths would need a different
  approach.

## Python Notes

- `pygame/` moves **as one unit**. Its scripts share `coreClasses.py` and
  `corefuncs.py` and use paths such as `textures/...` and `images/...`
  relative to the folder they're run from. Run them from inside
  `python/pygame/`.
- Clean up while merging:
  - stop tracking all `__pycache__/` / `.pyc` files (67 tracked today)
  - delete `pygame/get-pip.py`
  - `artfromcode.code-workspace` — delete, or keep under `python/` if useful
- `python/` is not served by Live Server and doesn't use `/common/`.
  Python scripts can still use `common/` assets via paths relative to
  their own file if needed.
- **Later (optional):** turn the duplicated `coreClasses.py` /
  `corefuncs.py` (in `pygame/`, `imageh/`, `pixels/`, `tileart/`) into one
  small shared package. That would also allow Python projects to be grouped
  by theme alongside the JS projects.

## Shared Assets

**Reusable asset → `common/`**

- brush images
- paper and surface textures
- general-purpose images
- fonts
- shared JavaScript utilities

**Project-specific asset → that project's folder**

```text
painting/abstractArtist/
└── assets/
    └── project-specific-texture.jpg
```

## Shared JavaScript

Current helpers in `common/js/`:

- `palette.js` — current palette system (also served to ProjectForge)
- `brush.js` — current image-based brush system

Backward-compatible versions:

- `palette-legacy.js`
- `brush-legacy.js`

Existing sketches keep using the legacy helpers until they are
intentionally modernized.

## Known Issues (unrelated to the reorg)

- About 10 pages in `archive/` load `../p5/p5.js` and `../addons/...`,
  which don't exist in the repo. They're already broken; switch them to the
  CDN when convenient.
- `substrate/js/substratePaint.js` loads `/common/brushes/Acrylic Glaze.png`,
  which was deleted in commit `13ae041`. Pick a replacement brush.
- `sound/js/songViz.js` line 23 has `../common/testmusic.mp3` pasted after
  `createCanvas(800, 800);` — a syntax error. Left as-is in phase 1.
- `akai/akaiTemplate.html` loads `p5.dom.min.js` from the p5 1.11.2
  `addons/` path, which doesn't exist (p5.dom is part of core now).

## Checklist

### 0. Prep
- [x] Delete merged branches `regionPainter-animation`, `regionPainter-grid`,
      `shader-preview` (local and GitHub)
- [x] Confirm the project mapping above

### 1. Root-relative paths (no files move)
- [x] Replace `../common/` with `/common/` in HTML and JS
- [x] Also fix stale `../images/`, `../brushes/` and `images/` paths
- [x] Test a sample of pages in Live Server, checking the console for 404s
- [x] Commit

### 2. Merge artfromcode
- [ ] Add `.gitignore` (`__pycache__/`, `*.py[cod]`, `.venv/`, ...)
- [ ] `git subtree add --prefix=python https://github.com/DataDudeCM/artfromcode.git main`
- [ ] Move `python/texture_library_app` to `python/tools/texture_library_app`
- [ ] Remove tracked `.pyc` files and `get-pip.py`
- [ ] Run a pygame script from `python/pygame/` to confirm it works
- [ ] Commit and push

### 3. Move JS projects into categories
- [ ] Use `git mv` so file history follows each project
- [ ] One commit per category
- [ ] Test the moved projects in Live Server after each category

### 4. Retire duplicates
- [ ] Compare `common/js/palette.js` with `MyCode/shared/js/palette.js`
      and make sure the `common/` version has everything ProjectForge uses
- [ ] Point ProjectForge (`app/web.py`, `SHARED_PALETTE_FILE`) at
      `art/common/js/palette.js`, test, and push
- [ ] Delete `MyCode/shared/`
- [ ] Archive `artfromcode` on GitHub; delete the local `artfromcode` folder

### 5. Finish
- [ ] Update `README.md` to describe the new structure
- [ ] Move the repo out of OneDrive (clone fresh into the new location)
- [ ] Delete this file

## Future Modernization

Don't rewrite old sketches simply because they are old.

When an older project looks interesting:

1. Keep its underlying generative system intact.
2. Switch from legacy palettes to the new palette system.
3. Experiment with replacing digital primitives such as points,
   pixels, circles, and simple lines with image-based brush marks.
4. Compare the original renderer with the new painterly renderer.
5. Only change the underlying algorithm if the experiment warrants it.

The goal is to rediscover good systems and give them a richer
visual/material language rather than rebuilding everything.
