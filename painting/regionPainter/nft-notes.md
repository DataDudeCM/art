# regionPainter as a long-form generative project

Notes on whether NFT / on-chain generative art is worth pursuing, and what regionPainter would need to become a long-form piece.

The concrete step-by-step plan is in [nft-plan.md](nft-plan.md).

_Last updated 2026-10-14. Sources: an earlier ChatGPT conversation (kept in the appendix) and a Claude review of the code._

---

## 1. Is NFT art still a thing? (as of Oct 2026)

Yes, but it's much smaller and more selective than during the 2021–22 boom.

- **The speculative "mint and flip" market has mostly gone away.** Nifty Gateway shut down in Feb 2026.
- **fxhash closed on Aug 17, 2026**, according to Right Click Save. That was the cheap, open place for creative coders to experiment.
- **Art Blocks is still running.** It has moved toward a curated, gallery-style store where collectors browse rather than trade. Studio applications are reviewed on a rolling basis, with roughly 10% accepted. It takes 10% of primary sales and 2.5% of secondary sales. Newer projects can store the script and its libraries fully on Ethereum.
- **What survives is code-as-art:** work where the algorithm is the point. Generative work has also been showing up at traditional venues like Art Basel. That one isn't independently verified.

What this means: the low-barrier option is gone, and what's left rewards a strong, coherent body of work. Treat the blockchain as a distribution and ownership mechanism, not as the reason the work exists.

Sources:
- [Right Click Save: Farewell to fxhash](https://www.rightclicksave.com/article/farewell-to-fxhash-a-heartbreaking-moment-in-the-history-of-digital-art)
- [Nifty Gateway shutdown (Yahoo Finance)](https://finance.yahoo.com/news/one-oldest-nft-trading-platform-160245421.html)
- [Art Blocks shifts to browsable art store (Sacra)](https://sacra.com/chat/h/f9828de8-0872-4247-b89c-4aa445bc946b/)
- [Art Blocks: True on-chain art](https://www.artblocks.io/articles/true-onchain-art)

---

## 2. Framing

Not: "I made some generative NFTs."

Instead:

> **regionPainter**: a generative painting system that discovers the accidental spaces in a self-intersecting line and paints them through repeated, translucent marks.

regionPainter has a real artistic idea behind the algorithm:

```text
boundary geometry -> discovered regions -> probabilistic selection
  -> repeated layered painting -> visible boundary -> surface
```

## 3. The real experiment: can it survive 100 seeds?

Long-form means **one algorithm, N outputs (e.g. 256), each defined by its seed**. Collectors get whatever their mint's seed produces. You can't run it 500 times and keep the 20 good ones.

So the test is:

> Can I design regionPainter so almost every seed makes something I'd sign?

That's worth doing even if nothing is ever minted. Questions to ask of a 100-seed contact sheet:

- Do they feel related, like one body of work?
- Are there recognizable families, and some surprises?
- Are there catastrophic duds? How often?
- Can I describe what the algorithm explores in two paragraphs, without talking about technology?

## 4. Seed model

**The artist defines the universe; the seed explores within it.**

```text
seed -> traits/settings -> composition -> final image
```

Split the parameters into three buckets:

| Bucket | Examples | Who controls it |
|---|---|---|
| **Fixed rules**: what regionPainter *is* | Chaikin boundary + flood fill, repeated hits, untouched negative space, edge bleed behavior | Hard-coded |
| **Seed-driven traits** | palette, boundary point count/scale, region size limits, hit count, brush family, mark scale, boundary visibility, bleed amount, mixing in rectangles | Chosen by the seed within curated ranges |
| **Display only** | zoom, debug overlays, save button | Viewer. Must not change the artwork |

- **The sliders and presets stay.** They become the lab where you find good ranges. The existing presets (Watercolor-Big-Brush, StainedGlass, Broken-Glass, Pastel-Wash, ...) are natural starting points for trait families.
- **Give seeds personalities rather than smooth randomness.** For example: 35% dense, 20% sparse, 10% boundary-dominant, a rare "oversized marks" family. Weighted families read as a body of work. Uniform random ranges tend to average out to mush.

## 5. Technical problems specific to this code

These came out of reading the code. The original ChatGPT notes didn't cover them.

### 5.1 The output depends on canvas size (fix first)

- If a preset doesn't set `SETTINGS.canvas.width/height`, `getDefaultCanvasSize()` sizes the canvas from the browser's `#canvas-container` width.
- Flood fill works on raster pixels, and thresholds like `minRegionPixels: 2500` are absolute pixel counts.
- So **the same seed gives different regions on different screens.** That breaks "one seed = one artwork."
- Fix: generate at one fixed internal resolution and only scale for display. The CSS zoom in `applyCanvasZoom()` already does that part.

### 5.2 External image assets

- Brushes are 15 PNGs (about 1.6 MB) loaded from `/common/brushes/`.
- The texture comes from a file picker, and there's an image-based boundary source.
- A long-form piece has to be self-contained. On Art Blocks that means the script and its libraries live on Ethereum, which rules out megabytes of PNGs.
- Options:
  - **Procedural brushes:** stamp masks generated from noise to imitate the PNG brushes.
  - **A few tiny brushes** embedded as small base64 strings.
  - **Procedural paper/surface texture** in place of the file picker.
  - **Drop image-based boundaries** for the long-form version.
- **This is the biggest artistic risk.** The README says real-looking brushes and textures beat simulated ones. Test this early, because it decides whether on-chain is feasible at all.

### 5.3 Determinism

- The seed is applied with `randomSeed`/`noiseSeed` at generation start, and per grid cell through `getCellSeed()`. Good.
- Make sure nothing else consumes randomness in a variable order: `Math.random()`, `millis()`, UI-dependent branches, async loads.
- Make sure the same seed gives the same regions in Chrome, Firefox and Safari, and on different GPUs. The README already warns about hybrid-GPU problems in Chrome.

### 5.4 Performance

Collectors render the piece live in their browsers. The region caching and smaller buffers already on the README's performance list matter more now.

### 5.5 Open design questions

- **Grid layouts** (2x2, triptych): a rare trait, or out of scope?
- **Animation:** progressive painting could be a strong live-view feature. It must still end in the same final image for a given seed.

---

## 6. Platform options (decide last)

- **Art Blocks Studio:** curated, selective, fully on-chain, Ethereum. The serious target if the RP-100 contact sheet holds up.
- **Self-published:** your own site plus a simple contract, or a smaller curated platform. Less prestige, more control.
- **No chain at all:** prints and a seed-addressable web gallery. Completely valid if the main goal is the body of work.

---

<details>
<summary>Appendix: original ChatGPT conversation (pre-2026-10-14 notes)</summary>


Yeah, Chris — **it’s still a thing, but it’s a very different thing than it was during the NFT frenzy.** And I actually think Region Painter is a pretty good candidate for testing it.

Art Blocks is actively releasing work right now. Its current site has multiple live generative projects, and its Studio program is still accepting artists; Art Blocks says Studio applications are reviewed on a rolling basis and roughly **10% are accepted**. [Art Blocks](https://www.artblocks.io/?utm_source=chatgpt.com) Just this month, Art Blocks has been releasing projects with The Generative Art Museum, including interactive and animated long-form generative works. [Art Blocks](https://www.artblocks.io/collection/idoni-by-anna-carreras?utm_source=chatgpt.com)

What has changed is the emphasis. The speculative “mint something, flip it tomorrow” NFT culture is dramatically diminished. What seems to have survived is **code-as-art**, particularly work where the algorithm itself is central to the concept. Art Blocks has actually pushed harder in that direction: its newer infrastructure can store the artwork's scripts and dependencies fully on-chain so the work can theoretically be reconstructed from Ethereum without relying on Art Blocks servers. [Art Blocks](https://www.artblocks.io/articles/true-onchain-art?utm_source=chatgpt.com)

And interestingly, there are signs that digital/generative art is reconnecting with the traditional art world. At Art Basel in 2026, digital work had a much larger presence; Art Basel reported sales of generative pieces ranging from a few thousand dollars upward, and Art Blocks sold out its William Mapan presentation. Their reporting characterized the current phase as being more about **digital technology as an artistic medium** than about NFTs themselves. [Art Basel](https://www.artbasel.com/stories/art-basel-2026-digital-art-collectors-zero-10?lang=en\&utm_source=chatgpt.com)

There has also been some consolidation. fxhash — which would once have been the obvious low-barrier place for you to experiment — **shut down on August 17, 2026**. That loss is significant because fxhash had been the more open, inexpensive creative-coding counterpart to Art Blocks. [Right Click Save](https://rightclicksave.beehiiv.com/p/right-click-news-farewell-to-fxhash-maya-man-trevor-paglen-and-ben-frost-at-onx-relay-kate-crawford?utm_source=chatgpt.com)

### Where Region Painter gets interesting

I would **not** approach it as:

> “I made some generative NFTs.”

That framing feels dated.

I would approach it as:

> **Region Painter — a generative painting system that interprets the boundaries and structure of an image and reconstructs them through algorithmic marks.**

That is much closer to where Art Blocks seems to be now.

And Region Painter has an advantage over a lot of random generative projects: **there is an actual artistic idea behind the algorithm.** You're not just choosing random colors and shapes.

You've got:

**source → regions → boundaries → primitive placement → painting system → unique interpretation**

That provides fertile ground for a long-form collection.

Imagine one algorithm generating **256 works**, where each mint gets its own seed controlling things like:

- source geometry
- region segmentation behavior
- boundary sensitivity
- primitive family
- brush density
- mark scale
- palette
- amount of boundary violation
- layering behavior
- negative space
- controlled “mistakes”

You'd want every output to clearly look like it came from **Region Painter**, while no two compositions are the same.

That's basically the core challenge of long-form generative art.

And one thing you've already been doing becomes extremely important here: **curating the algorithm rather than curating individual outputs.**

You can't simply run it 500 times and keep the 20 good ones.

The interesting test becomes:

> *Can I design Region Painter so that almost every seed creates something I would be willing to sign?*

That is a fantastic creative challenge for you even if you **never sell a single NFT**.

### I wouldn't start by applying to Art Blocks

I'd spend almost no effort on blockchain initially.

Instead I'd make a **Region Painter 100** experiment.

Generate 100 deterministic seeds:

`RP-0001`  
`RP-0002`  
`...`  
`RP-0100`

Build a little web gallery where you can click each one and regenerate it exactly from its seed.

Then evaluate the collection as though you were an Art Blocks curator.

Do they feel related?

Are there surprises?

Are there recognizable families?

Are some substantially stronger than others?

Are there catastrophic dud seeds?

Can you describe what the algorithm is *exploring* in two paragraphs without talking about technology?

If you get to the point where you look at the contact sheet of 100 and think:

**“Damn. This actually looks like a body of work.”**

*Then* I'd look seriously at Art Blocks Studio.

And there's another reason I think this could fit your current trajectory unusually well: you've moved from simply making generative images to building systems like Region Painter, Abstract Artist, Emergent Artist, and Displacement Mapper where the interesting part is increasingly **the behavior of the system itself**. Region Painter may be the cleanest one yet to turn into a genuine long-form generative project. 

I wouldn't make **selling NFTs** the experiment.

I'd make **“Can Region Painter survive 100 seeds?”** the experiment.

If it can, the NFT/on-chain piece becomes a distribution and ownership mechanism rather than the reason the artwork exists. And that seems much more aligned with where serious generative art has ended up in 2026.

Yes — **for a true long-form generative collection, that would need to change.**

Right now, if your seed only affects the random sequence inside Region Painter but your sliders/settings remain manually chosen, then the seed does **not fully define the artwork**. Two runs with the same seed but different settings could produce different results.

For an Art Blocks-style system, you'd want something closer to:

`seed → settings → composition → final image`

That means the seed would deterministically choose at least some of the parameters you currently control manually: palette, primitive type, density, size range, boundary behavior, stroke weight, rotation, region thresholds, maybe source treatment.

You don’t necessarily want the seed controlling *everything*, though. A stronger model is:

**Artist defines the universe. Seed explores within it.**

So you might hard-code the overall artistic constraints, then let the seed choose values inside carefully designed ranges. For example, instead of letting primitive size be arbitrary from 1–500, you might decide the work only looks good between 18–90 pixels and let the seed choose within that band.

Something like:

```js
randomSeed(seed);

settings = {
  primitiveType: random(["circle", "square", "triangle"]),
  density: random(0.25, 0.70),
  primitiveScale: random(20, 80),
  boundaryInfluence: random(0.4, 0.9),
  strokeWeight: random(1, 6),
  palette: random(palettes)
};
```

Then every time you run seed `58321`, you get the **same parameter set and same artwork**.

Where it gets much more interesting is avoiding purely continuous randomness. You can give seeds *personalities*. Maybe 20% of seeds become sparse, 35% become dense, 10% heavily emphasize boundaries, 15% introduce oversized primitives, etc. That creates recognizable families and rare behaviors rather than everything clustering around average-looking output.

For Region Painter, I'd probably separate parameters into three buckets:

- **Fixed artistic rules:** things that define what Region Painter *is*.
- **Seed-driven traits:** composition, mark behavior, palette, density, scale, etc.
- **Interactive/display controls:** zoom, debug boundaries, save button, UI stuff that doesn't alter the artwork.

And I wouldn't throw away your sliders. They'd still be extremely useful as the **laboratory** where you discover which ranges produce good work. Then you convert those discoveries into seed-driven rules.

That transition is actually a pretty interesting milestone for the project: you're moving from **"a generative painting tool"** toward **"a generative artist."**

And before NFTs even enter the picture, the first technical goal I'd set is very concrete:

**One integer seed should completely recreate one Region Painter output from scratch.**

Once that's true, we can start designing the trait system.

</details>
