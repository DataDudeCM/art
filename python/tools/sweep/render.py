"""
Headless rendering of starter sketches with Playwright.

One browser renders many sketches, a few pages at a time. Files are served
from memory with page.route, so no temporary HTML is written and nothing
loads from file:// URLs.
"""

import asyncio
import time
from dataclasses import dataclass, field
from pathlib import Path

from PIL import Image, ImageStat
from playwright.async_api import TimeoutError as PlaywrightTimeout
from playwright.async_api import async_playwright

from starter import ART_DIR

P5_JS = Path(__file__).parent / "assets" / "p5.min.js"
PALETTE_JS = ART_DIR / "common" / "js" / "palette.js"

ORIGIN = "http://sweep.local"
VIEWPORT = 1000

# A render whose largest per-channel standard deviation is below this is
# blank (the same test as diamond-age-studio's is_blank).
BLANK_STDDEV = 2.0

INDEX_HTML = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<script src="p5.min.js"></script>
<script src="palette.js"></script>
<style>
html, body { margin: 0; padding: 0; overflow: hidden; background: #111; }
canvas { display: block; }
</style>
</head>
<body>
<script src="sketch.js"></script>
</body>
</html>
"""


@dataclass
class Job:
    sketch: str          # the full sketch.js text, params and seed filled in
    out_path: Path       # where to save the PNG


@dataclass
class Result:
    # "ok", "timeout" (saved as it was), "blank", "error" or "no_canvas"
    status: str
    ms: int
    coverage: float | None = None   # fraction of pixels unlike the background
    errors: list[str] = field(default_factory=list)


def image_stats(path: Path) -> tuple[bool, float]:
    """(is_blank, coverage). The background is the most common colour."""

    with Image.open(path) as image:
        rgb = image.convert("RGB")
        blank = max(ImageStat.Stat(rgb).stddev) < BLANK_STDDEV

        small = rgb.resize((200, 200), Image.Resampling.BOX)
        pixels = list(small.getdata())

    background = max(set(pixels), key=pixels.count)
    differs = sum(
        1 for px in pixels
        if max(abs(a - b) for a, b in zip(px, background)) > 13
    )
    return blank, differs / len(pixels)


async def _render_one(browser, job: Job, timeout_ms: int) -> Result:
    started = time.perf_counter()
    errors: list[str] = []
    static = {
        "/": (INDEX_HTML, "text/html"),
        "/index.html": (INDEX_HTML, "text/html"),
        "/sketch.js": (job.sketch, "text/javascript"),
        "/p5.min.js": (P5_JS.read_text(encoding="utf-8"), "text/javascript"),
        "/palette.js": (
            PALETTE_JS.read_text(encoding="utf-8") if PALETTE_JS.exists() else "",
            "text/javascript",
        ),
    }

    async def serve(route):
        path = "/" + route.request.url.removeprefix(ORIGIN).lstrip("/").split("?")[0]
        if path in static:
            body, kind = static[path]
            await route.fulfill(status=200, body=body, content_type=kind)
        else:
            await route.fulfill(status=404, body="")

    page = await browser.new_page(viewport={"width": VIEWPORT, "height": VIEWPORT})
    page.on("pageerror", lambda exc: errors.append(str(exc)))
    status = "ok"

    try:
        await page.route(f"{ORIGIN}/**", serve)
        await page.goto(f"{ORIGIN}/index.html", wait_until="load")

        try:
            await page.wait_for_function("window.studioDone === true", timeout=timeout_ms)
        except PlaywrightTimeout:
            status = "timeout"

        canvas = page.locator("canvas").first

        if errors:
            status = "error"
        elif await canvas.count() == 0:
            status = "no_canvas"
        else:
            job.out_path.parent.mkdir(parents=True, exist_ok=True)
            await canvas.screenshot(path=str(job.out_path))

    except Exception as exc:  # a crashed page is a result, not a stop
        errors.append(str(exc))
        status = "error"

    finally:
        await page.close()

    coverage = None
    if job.out_path.exists() and status in ("ok", "timeout"):
        blank, coverage = image_stats(job.out_path)
        if blank:
            status = "blank"

    ms = int((time.perf_counter() - started) * 1000)
    return Result(status=status, ms=ms, coverage=coverage, errors=errors)


async def _render_all(jobs, workers, timeout_ms, on_done):
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        gate = asyncio.Semaphore(workers)

        async def run(index, job):
            async with gate:
                result = await _render_one(browser, job, timeout_ms)
            on_done(index, job, result)
            return result

        try:
            return await asyncio.gather(*(run(i, j) for i, j in enumerate(jobs)))
        finally:
            await browser.close()


def render_all(jobs: list[Job], workers: int = 4, timeout_ms: int = 20000,
               on_done=lambda index, job, result: None) -> list[Result]:
    """Render every job; results come back in the same order as the jobs."""

    return asyncio.run(_render_all(jobs, workers, timeout_ms, on_done))
