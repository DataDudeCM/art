# Art Repo Reorganization

## Goal

Make the repository easier to explore and maintain without changing
the underlying artwork.

Keep the folder structure relatively shallow and organize projects by
the kind of art/system being explored rather than by when they were made.

## Proposed Structure

art/
├── common/
│   ├── js/
│   ├── images/
│   ├── brushes/
│   └── fonts/
│
├── generative/
│   ├── particles/
│   ├── recursion/
│   └── systems/
│
├── painting/
│   ├── brush/
│   └── watercolor/
│
├── image-art/
│   ├── collage/
│   └── pixel/
│
├── geometry/
├── sound-interactive/
├── experiments/
├── archive/
│
├── favicon.ico
└── README.md


## Shared Assets

Use this rule when deciding where assets belong:

**Reusable asset → `common/`**

Examples:
- brush images
- watercolor paper textures
- general-purpose images
- fonts
- shared JavaScript utilities

**Project-specific asset → project folder**

Example:

abstractArtist/
└── assets/
    └── project-specific-texture.jpg


## Shared JavaScript

Current shared helpers should live under:

common/js/

Use:

- `palette.js` — current palette system
- `brush.js` — current image-based brush system

Backward-compatible versions:

- `palette-legacy.js`
- `brush-legacy.js`

Existing sketches should continue using the legacy helpers until they
are intentionally modernized.


## Favicon

Keep the shared favicon at the repository/server root:

favicon.ico

Pages can reference it with:

<link rel="icon" type="image/x-icon" href="/favicon.ico?v=2">

Because this is root-relative, HTML files can move between folders
without changing the favicon path.


## Reorganization Checklist

- [ ] Decide final top-level project categories
- [ ] Move projects into their new folders
- [ ] Move reusable brush images to `common/brushes/`
- [ ] Move reusable images/textures to `common/images/`
- [ ] Leave project-specific assets with their projects
- [ ] Update relative references to `common/js/`
- [ ] Update relative references to shared images and brushes
- [ ] Verify legacy palette references
- [ ] Verify legacy brush references
- [ ] Test moved sketches in the browser
- [ ] Check browser console for missing files / 404s
- [ ] Commit completed repository reorganization
- [ ] Remove this file when cleanup is complete


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