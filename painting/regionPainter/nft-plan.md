# Plan: regionPainter → long-form generative

Background and reasoning are in [nft-notes.md](nft-notes.md).

**Goal:** one integer seed recreates one regionPainter artwork exactly, on any machine. Then find out whether 100 seeds make a body of work.

**Rule for every phase:** don't change the visual character. Compare before and after renders of the same seeds.

**Status:** not started. Each phase gets reviewed and approved before code changes begin.

---

## Phase 1: Same seed, same image, any screen

**Why:** the canvas size currently comes from the browser window, and flood fill uses pixel-count thresholds (see nft-notes §5.1). So the same seed gives different regions on different screens.

### Steps

1. **Pick a canonical internal resolution** for long-form mode.
   - Candidate: 2000×2000, which matches the existing presets.
   - The square-vs-portrait aspect ratio is an artistic decision for you.
2. **Add a long-form mode flag** that forces `SETTINGS.canvas.width/height` to the canonical size.
   - It ignores `getDefaultCanvasSize()` and any preset canvas size.
   - Display uses the existing CSS zoom (`applyCanvasZoom` / `fitCanvasToWindow`) only.
   - Normal "lab" mode keeps working as it does today.
3. **Audit the pixel-unit settings:** `minRegionPixels`, brush sizes, `thinBrushSize`, boundary spacing and so on.
   - At a fixed resolution they're fine as they are.
   - Just record which settings are resolution-bound, for the later high-res print export.
4. **Write a determinism check (Playwright, through the diamond-age venv):**
   - Render seeds 1–10 twice in one session, then once more in a fresh browser.
   - Hash the canvas pixels and confirm all hashes match.
   - Repeat at two different window sizes and confirm the hashes still match.
5. **Find and remove any leftover randomness:**
   - `Math.random()` (it's fine where it only picks a new seed for auto-regenerate);
   - `millis()` in generation paths;
   - UI-dependent branches;
   - async brush or texture loads racing with generation.

**Done when:** the hashes match across runs and window sizes on this machine. Testing other browsers and GPUs can wait until Phase 4.

---

## Phase 2: Seed → traits

1. **Write `traits(seed)`.** It's a pure function that returns a settings object. It uses its own seeded PRNG, so changing the painting code doesn't shift the trait choices.
2. **Draw the families from existing presets** (Watercolor-Big-Brush, StainedGlass, Broken-Glass, Pastel-Wash, Calligraphic, ...).
   - Each family is a weighted choice with curated parameter ranges.
   - Use ranges, not exact preset values.
3. **Split the settings into the three buckets** (fixed / trait / display) and write the split down.
4. **Show the trait readout in the UI** (family, palette, density, ...) so it's easy to see why a seed looks the way it does.

**Done when:** loading `?seed=N` shows the same artwork and traits every time, with no manual settings.

---

## Phase 3: RP-100 contact sheet

1. **Add a batch render script** (Playwright) that saves seeds 1–100 as thumbnails and full-size PNGs, plus a `traits.json`.
2. **Build a simple gallery page:** a grid of thumbnails, click one to open it full size, filter by family.
3. **Do a curation pass:**
   - mark each seed as keep, fine or dud;
   - adjust trait ranges and weights;
   - re-render the same 100 seeds.
4. **Repeat until the dud rate is low** and the sheet reads as one body of work.

**Done when:** you look at the sheet and think "this is a body of work."

---

## Phase 4: Self-contained (only if pursuing on-chain)

1. **Prototype procedural brushes** that imitate 2–3 of the current PNG brushes. Compare them against the PNG versions on the same seeds.
2. **Replace the file-picker texture** with a procedural paper/surface layer.
3. **Bundle everything into one script** with p5.js as the only dependency, and track its size.
4. **Test determinism across browsers and GPUs:** Chrome, Firefox and Edge, on the integrated and dedicated GPUs.
5. **Profile the render time.** Apply the README's region-caching and buffer optimizations as needed.

**Decision point:** if the procedural brushes clearly lose to the PNG ones, choose between a smaller embedded brush set, a different platform, or no chain at all.

---

## Phase 5: Platform

Pick between Art Blocks Studio, self-publishing and no chain at all, based on the Phase 3 contact sheet and the Phase 4 results.
