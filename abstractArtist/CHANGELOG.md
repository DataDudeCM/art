# abstractArtist — Change Log

## v0.3a — Continuous Ink Paths

### Changed
- straight ink gestures now draw each uninterrupted run as one continuous p5 polyline rather than many separate `line()` calls
- arcs use the same continuous-path approach
- intentional breaks are preserved by ending and restarting the path
- removes the darker alpha buildup that could appear as dots at segment junctions
- segment spacing, jitter, multiple passes, and seeded randomness remain unchanged

### Current visual question

> Do ink lines still feel irregular and handmade while losing the visible dots at their internal segment joints?

## v0.3 — Lines and Arcs

### Added
- logical `line` and `arc` composition elements
- dedicated `InkRenderer` on the existing `inkLayer`
- multi-pass imperfect ink lines with slight jitter and occasional broken segments
- multi-pass imperfect partial arcs
- centralized ink tuning parameters in `settings.js`

### Intent-specific use
- `restlessSolitude`: long directional gesture plus an incomplete echo arc around the anchor
- `fragileOrder`: a small family of near-parallel structural axes
- `controlledConflict`: a strong line deliberately intersects the opposing masses
- `quietCuriosity`: one or two partial orbital arcs around the anchor
- `breakingStructure`: structural lines begin aligned and progressively fracture
- `searching`: a directional gesture and partial path arc extend outward from the origin

### Preserved
- all existing anchor-zone, negative-space, hierarchy, and relationship behavior
- seeded reproducibility
- watercolor and paper rendering
- renderer/composition separation

### Current artistic question

> Do lines and arcs make the intent and compositional forces easier to read without overwhelming the protected negative space or turning the work into a diagram?

## v0.2f — Simple Relationship Behaviors

### Added
- first-pass relationship behaviors expressed through composition rather than rendering
- small `echo`, `align`, and `orbit` accents that make some elements visibly respond to other elements
- relationship metadata on logical elements for future debugging and renderer use
- console output now reports relationship type per element

### Applied as light compositional behaviors
- `restlessSolitude`: a small echo near the anchor
- `fragileOrder`: aligned echoes reinforcing the structured sequence
- `controlledConflict`: pressure-point accents near the collision zone
- `quietCuriosity`: a small orbital cluster around the anchor
- `breakingStructure`: an echoed polygon that repeats and destabilizes the anchor form
- `searching`: early step echoes near the beginning of the outward path

### Intentionally unchanged
- watercolor, paper, pigment, and surface rendering remain untouched
- no explicit line connectors yet
- relationships remain simple and compositional rather than fully generalized

### Current artistic question

> Do the compositions now feel more like elements are speaking to one another rather than merely being placed near one another?

## v0.2e — Protected Negative Space

### Added
- seeded protected negative-space zones for the higher-isolation composition families
- zone size responds to the intent-derived `negativeSpace` bias
- major secondary forms are pushed out of protected regions rather than being allowed to fill every available area
- protected-zone metadata is logged to the console for inspection without drawing debug graphics into the artwork

### Applied first to
- `restlessSolitude`
- `quietCuriosity`
- `searching`

### Intentionally unchanged
- `controlledConflict` remains dense around its collision area
- watercolor, paper, pigment, and rendering behavior are untouched
- seeded randomness and same-seed intent comparison remain intact

### Current artistic question

> Does the empty area now feel intentionally composed rather than merely leftover, while still varying enough from seed to seed?

# CHANGELOG

## v0.2d — Anchor-Responsive Composition

- Added weighted anchor-zone variation to all six named intents.
- Added reusable weighted zone selection while preserving seeded randomness.
- Major secondary forms now respond to the anchor's location instead of relying only on fixed canvas coordinates.
- Added open-space direction and relative-offset helpers for composition placement.
- `restlessSolitude`, `fragileOrder`, `quietCuriosity`, `breakingStructure`, and `searching` now adapt their flow to the chosen anchor region.
- `controlledConflict` can shift its opposing pair vertically and slightly horizontally while preserving its collision structure.
- Watercolor and paper rendering are unchanged.

**Visual question:** Does moving the anchor now cause the whole composition to reorganize naturally without making each intent lose its identity?

# abstractArtist CHANGELOG

## v0.1 — Surface

### Added
- p5.js project shell
- separate paper, wash, texture, and ink graphics buffers
- seeded paper generation
- warm paper base
- low-frequency tonal variation
- fine grain
- sparse paper fibers
- faint organic stains
- `R` to regenerate paper
- `S` to save the current paper surface

### Current artistic questions
- Is the grain visible enough at normal viewing size without becoming digital noise?
- Do the stains feel like natural paper variation or obvious translucent ellipses?
- Are the fibers subtle enough?
- Is the base paper too yellow, too gray, or about right?
- Does the surface read as watercolor paper before any paint is added?

### Next
Do not add composition yet.

Once the paper surface feels convincing, move to **v0.2 — Paint Primitives**:
- watercolor circle
- watercolor polygon
- reusable wobbly geometry
- layered wash behavior

## v0.2b — Intent Plumbing

### Added
- named artistic intents in `js/intent/intents.js`
- `IntentEngine` for seeded intent selection
- `TestComposition` as an upstream logical composition layer
- logical element descriptors containing geometry, composition role, appearance, and `dynamics` metadata
- intent-aware spatial separation and directional bias in the current test composition
- console logging of seed, intent, and element dynamics
- intent name in saved artwork filenames

### Refactored
- `WatercolorRenderer` now consumes logical element descriptors instead of inventing the test composition itself
- geometry for test polygons is now created by the composition layer rather than the renderer

### Intentionally deferred
- Formal Dynamics behavior is metadata only for now; no `FormalDynamics`, `PlaneField`, or `RhythmPattern` implementation yet
- full composition templates, relationships, protected negative space, and palette semantics remain later milestones

## v0.2c — Intent Becomes Visible

### Added
- intent-to-composition bias profile generated by `IntentEngine`
- six visibly distinct composition strategies tied to the existing named intent movement qualities
- same-seed intent comparison with `[` and `]`
- `R` now generates a new seed while preserving the current intent
- `N` generates a new seed and randomly selects an intent
- small on-screen status display for current intent and seed
- centralized composition palette and intent-mapping ranges in `settings.js`

### Intent behavior now visible through composition
- `restlessSolitude`: separated masses, diagonal displacement, protected emptiness
- `fragileOrder`: near-alignment with small structural slippage
- `controlledConflict`: opposing dominant masses and intentional collision pressure
- `quietCuriosity`: smaller drifting forms and generous breathing room
- `breakingStructure`: repeated quadrilateral structure that progressively fractures
- `searching`: forms step outward from an origin as an implied visual path

### Preserved
- seeded reproducibility
- watercolor rendering behavior
- hybrid / image / procedural paper rendering
- renderer independence from composition logic

### Current artistic question
The immediate test is no longer "does the intent data exist?" but:

> With the same seed, can you identify a meaningful compositional difference when cycling through the six intents without reading the intent name?

If not, strengthen the compositional mappings before adding relationships or new rendering effects.