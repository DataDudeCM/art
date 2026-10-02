#!/usr/bin/env python3
"""
carbon_silicon_tilegen.py
=========================
Carbon vs Silicon -- a dual-material WFC tileset generator.

Two tile families share one substrate and a near-identical ink tone.
What separates them is line QUALITY:
  * CARBON  -- organic vessels: wobble, taper, stipple shading
  * SILICON -- machined traces: straight runs, 45-degree miters, hatch ticks
The families use different edge letters (C / S) and can only connect
through INTERFACE tiles (electrode nodes), so every material transition
is a deliberate compositional event.

EDGE ENCODING
-------------
Each side is split into 3 sections, each tagged with a letter:
  B = blank substrate, C = carbon lane, S = silicon lane
Edges are written CLOCKWISE around the tile:
  top: left->right, right: top->bottom, bottom: right->left, left: bottom->top
Matching rule assumed (per your tile.py): myEdge == neighborEdge[::-1]
All v1 edge strings are palindromes (BCB, CBC, BSB, SBS, BBB), so the
read direction / reversal question is moot. If you add asymmetric edges
in v2, the convention above is the one baked into the demo solver here.

LANE WIDTH CONTRACT (important if you extend the set)
-----------------------------------------------------
A letter in a given section must always be drawn at the same width and
exact lane-center position AT THE TILE BOUNDARY. Interior wobble/taper
is free -- the edge envelope forces clean geometry at t=0 and t=1.
  middle-lane C  -> CARBON_W      middle-lane S -> SILICON_W
  outer-lane  C  -> CAPILLARY_W   outer-lane  S -> BUS_W

OUTPUT
------
  tiles/*.png      one PNG per canonical tile (your program rotates)
  manifest.json    filename, edges [top,right,bottom,left], weight, set
  contact_sheet.png
  demo_grid.png    a quick built-in WFC collapse so you can sanity-check
                   adjacency before wiring into your own solver

Usage:  python3 carbon_silicon_tilegen.py [outdir]
Everything tweakable lives in CFG below. Seeded -> reproducible.
"""

import json, math, os, random, sys
import numpy as np
from PIL import Image, ImageDraw

# ----------------------------------------------------------------------
# CONFIG -- the knobs
# ----------------------------------------------------------------------
CFG = {
    "tile_px":      512,          # final tile resolution
    "ss":           2,            # supersample factor (antialiasing)
    "seed":         20260610,     # master seed (reproducible wobble/stipple)

    # palette: tonal-similar -- texture does the differentiating
    "substrate":    (215, 212, 205),
    "carbon_ink":   (88, 83, 78),     # a hair warm
    "silicon_ink":  (80, 83, 88),     # a hair cool
    "stipple_ink":  (62, 57, 52),
    "hatch_tone":   (176, 174, 168),  # light ticks across traces
    "grain_sigma":  3.0,              # substrate noise (post-downscale)

    # line widths at FINAL resolution (edge contract -- see docstring)
    "carbon_w":     27,
    "capillary_w":  14,
    "silicon_w":    21,
    "bus_w":        13,

    # texture behavior
    "wobble_amp":   9.0,    # carbon perpendicular wobble (final px)
    "width_var":    0.16,   # carbon width variation fraction
    "edge_ramp":    0.16,   # fraction of path over which wobble fades to 0
    "hatch_step":   11,     # px between silicon hatch ticks
    "miter":        62,     # silicon 45-degree chamfer size

    # solver weights (also written to manifest)
    "weights": {
        "blank": 160,
        "carbon_straight": 100, "carbon_corner": 80, "carbon_tee": 45,
        "carbon_end": 35, "carbon_double": 18, "carbon_merge": 25,
        "silicon_straight": 100, "silicon_corner": 80, "silicon_tee": 45,
        "silicon_cross": 20, "silicon_end": 35, "silicon_double": 18,
        "silicon_merge": 25,
        "iface_straight": 15, "iface_corner": 15,
    },

    "demo_dim": 14,        # demo grid is demo_dim x demo_dim
    "demo_cell": 96,       # px per cell in demo render
}

# ----------------------------------------------------------------------
# geometry helpers
# ----------------------------------------------------------------------
def lerp(a, b, t): return a + (b - a) * t

def line_pts(p0, p1, n=140):
    return [(lerp(p0[0], p1[0], i / (n - 1)), lerp(p0[1], p1[1], i / (n - 1)))
            for i in range(n)]

def bezier_pts(p0, p1, p2, p3, n=160):
    pts = []
    for i in range(n):
        t = i / (n - 1); u = 1 - t
        x = u*u*u*p0[0] + 3*u*u*t*p1[0] + 3*u*t*t*p2[0] + t*t*t*p3[0]
        y = u*u*u*p0[1] + 3*u*u*t*p1[1] + 3*u*t*t*p2[1] + t*t*t*p3[1]
        pts.append((x, y))
    return pts

def normals(pts):
    """unit normals per point along a polyline"""
    out = []
    for i in range(len(pts)):
        a = pts[max(0, i - 1)]; b = pts[min(len(pts) - 1, i + 1)]
        dx, dy = b[0] - a[0], b[1] - a[1]
        m = math.hypot(dx, dy) or 1.0
        out.append((-dy / m, dx / m))
    return out

def edge_envelope(t, ramp):
    """0 at path endpoints, 1 in the interior; keeps tile boundaries exact"""
    e = min(t, 1.0 - t) / ramp
    e = max(0.0, min(1.0, e))
    return e * e * (3 - 2 * e)   # smoothstep

def smooth_noise_fn(rng, n_waves=3, fmin=1.5, fmax=4.5):
    """sum-of-sines 1D noise in [-1,1], smooth, seeded"""
    waves = [(rng.uniform(fmin, fmax), rng.uniform(0, math.tau),
              rng.uniform(0.5, 1.0)) for _ in range(n_waves)]
    norm = sum(w[2] for w in waves)
    def f(t):
        return sum(a * math.sin(math.tau * fr * t + ph)
                   for fr, ph, a in waves) / norm
    return f

# ----------------------------------------------------------------------
# stroke renderers (all coords in SUPERSAMPLED space)
# ----------------------------------------------------------------------
def organic_stroke(draw, pts, base_w, rng, cfg, taper_to=None):
    """
    Carbon vessel: circle-stamped path with perpendicular wobble and
    width variation, both enveloped to zero at endpoints so the edge
    crossing is geometrically exact. taper_to: optional end width.
    """
    ss = cfg["ss"]
    wob = smooth_noise_fn(rng)
    wvar = smooth_noise_fn(rng)
    nrm = normals(pts)
    amp = cfg["wobble_amp"] * ss
    n = len(pts)
    out_pts = []
    for i, (x, y) in enumerate(pts):
        t = i / (n - 1)
        env = edge_envelope(t, cfg["edge_ramp"])
        off = amp * env * wob(t)
        px, py = x + nrm[i][0] * off, y + nrm[i][1] * off
        w = base_w * ss
        if taper_to is not None:
            w = lerp(base_w, taper_to, t) * ss
        w *= (1 + cfg["width_var"] * env * wvar(t))
        r = w / 2
        draw.ellipse([px - r, py - r, px + r, py + r], fill=cfg["carbon_ink"])
        out_pts.append((px, py, w))
    return out_pts

def stipple_along(draw, stroked, rng, cfg, density=0.5):
    """darker dots scattered inside a stamped vessel -- tissue shading"""
    ss = cfg["ss"]
    for (x, y, w) in stroked:
        if rng.random() < density:
            j = (w / 2) * 0.55
            dx, dy = rng.uniform(-j, j), rng.uniform(-j, j)
            r = rng.uniform(0.8, 2.2) * ss
            draw.ellipse([x + dx - r, y + dy - r, x + dx + r, y + dy + r],
                         fill=cfg["stipple_ink"])

def crisp_polyline(draw, pts, w_final, cfg):
    """Silicon trace: clean constant-width polyline"""
    ss = cfg["ss"]
    draw.line([(x, y) for x, y in pts], fill=cfg["silicon_ink"],
              width=int(w_final * ss), joint="curve")

def hatch_polyline(draw, pts, w_final, cfg):
    """light perpendicular ticks along a trace -- machined texture"""
    ss = cfg["ss"]
    step = cfg["hatch_step"] * ss
    half = (w_final * ss) * 0.30
    tickw = max(1, int(1.6 * ss))
    # walk the polyline at fixed arc-length intervals
    dist_acc, prev = 0.0, pts[0]
    for cur in pts[1:]:
        seg = math.hypot(cur[0] - prev[0], cur[1] - prev[1])
        d = step - dist_acc
        while d < seg:
            t = d / seg
            x, y = lerp(prev[0], cur[0], t), lerp(prev[1], cur[1], t)
            dx, dy = cur[0] - prev[0], cur[1] - prev[1]
            m = math.hypot(dx, dy) or 1
            nx, ny = -dy / m, dx / m
            draw.line([(x - nx * half, y - ny * half),
                       (x + nx * half, y + ny * half)],
                      fill=cfg["hatch_tone"], width=tickw)
            d += step
        dist_acc = (dist_acc + seg) % step
        prev = cur

def via_ring(draw, cx, cy, cfg, r_out=24, ring=8):
    ss = cfg["ss"]
    ro, ri = r_out * ss, (r_out - ring) * ss
    draw.ellipse([cx - ro, cy - ro, cx + ro, cy + ro], fill=cfg["silicon_ink"])
    draw.ellipse([cx - ri, cy - ri, cx + ri, cy + ri], fill=cfg["substrate"])
    rd = 6 * ss
    draw.ellipse([cx - rd, cy - rd, cx + rd, cy + rd], fill=cfg["silicon_ink"])

def electrode_node(draw, cx, cy, cfg):
    """the interface motif: a machined socket that tissue plugs into"""
    ss = cfg["ss"]
    ro = 46 * ss
    draw.ellipse([cx - ro, cy - ro, cx + ro, cy + ro], fill=cfg["silicon_ink"])
    ri = 34 * ss
    draw.ellipse([cx - ri, cy - ri, cx + ri, cy + ri], fill=cfg["substrate"])
    rc = 16 * ss
    draw.ellipse([cx - rc, cy - rc, cx + rc, cy + rc], fill=cfg["carbon_ink"])
    # four screw dots on the ring, diagonals
    for ang in (45, 135, 225, 315):
        a = math.radians(ang)
        px, py = cx + math.cos(a) * 40 * ss, cy + math.sin(a) * 40 * ss
        rs = 4.5 * ss
        draw.ellipse([px - rs, py - rs, px + rs, py + rs], fill=cfg["substrate"])

# ----------------------------------------------------------------------
# tile scaffolding
# ----------------------------------------------------------------------
def new_canvas(cfg):
    big = cfg["tile_px"] * cfg["ss"]
    img = Image.new("RGB", (big, big), cfg["substrate"])
    return img, ImageDraw.Draw(img)

def finish(img, cfg, rng_np):
    img = img.resize((cfg["tile_px"], cfg["tile_px"]), Image.LANCZOS)
    if cfg["grain_sigma"] > 0:
        arr = np.asarray(img).astype(np.float32)
        arr += rng_np.normal(0, cfg["grain_sigma"], arr.shape)
        img = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
    return img

def lanes(cfg):
    """supersampled lane centers: [outer0, middle, outer2] and size"""
    big = cfg["tile_px"] * cfg["ss"]
    return [big / 6, big / 2, big * 5 / 6], big

# ----------------------------------------------------------------------
# tile builders -- each returns (image, edges[top,right,bottom,left])
# ----------------------------------------------------------------------
def t_blank(cfg, rng, rnp):
    img, _ = new_canvas(cfg)
    return finish(img, cfg, rnp), ["BBB"] * 4

def t_carbon_straight(cfg, rng, rnp):
    img, d = new_canvas(cfg)
    (_, c, _), big = lanes(cfg)
    s = organic_stroke(d, line_pts((0, c), (big, c)), cfg["carbon_w"], rng, cfg)
    stipple_along(d, s, rng, cfg)
    return finish(img, cfg, rnp), ["BBB", "BCB", "BBB", "BCB"]

def t_carbon_corner(cfg, rng, rnp):
    img, d = new_canvas(cfg)
    (_, c, _), big = lanes(cfg)
    k = 0.55 * c
    pts = bezier_pts((0, c), (k, c), (c, big - k), (c, big))
    s = organic_stroke(d, pts, cfg["carbon_w"], rng, cfg)
    stipple_along(d, s, rng, cfg)
    return finish(img, cfg, rnp), ["BBB", "BBB", "BCB", "BCB"]

def t_carbon_tee(cfg, rng, rnp):
    img, d = new_canvas(cfg)
    (_, c, _), big = lanes(cfg)
    s1 = organic_stroke(d, line_pts((0, c), (big, c)), cfg["carbon_w"], rng, cfg)
    # branch peels off the trunk just before center, bends to bottom
    pts = bezier_pts((c * 0.72, c), (c, c), (c, c + 0.5 * (big - c)), (c, big))
    s2 = organic_stroke(d, pts, cfg["carbon_w"], rng, cfg)
    stipple_along(d, s1 + s2, rng, cfg, density=0.4)
    return finish(img, cfg, rnp), ["BBB", "BCB", "BCB", "BCB"]

def t_carbon_end(cfg, rng, rnp):
    img, d = new_canvas(cfg)
    (_, c, _), big = lanes(cfg)
    end = (c * 1.15, c)
    s = organic_stroke(d, line_pts((0, c), end), cfg["carbon_w"], rng, cfg,
                       taper_to=cfg["carbon_w"] * 0.35)
    stipple_along(d, s, rng, cfg)
    # capillary bloom: stipple burst with radial falloff
    ss = cfg["ss"]
    for _ in range(420):
        a = rng.uniform(0, math.tau)
        r = abs(rng.gauss(0, 60 * ss))
        if r > 150 * ss: continue
        fade = 1 - r / (150 * ss)
        if rng.random() > fade: continue
        x, y = end[0] + math.cos(a) * r, end[1] + math.sin(a) * r * 0.8
        dr = rng.uniform(0.8, 3.2) * ss * (0.4 + 0.6 * fade)
        ink = cfg["carbon_ink"] if rng.random() < 0.7 else cfg["stipple_ink"]
        d.ellipse([x - dr, y - dr, x + dr, y + dr], fill=ink)
    return finish(img, cfg, rnp), ["BBB", "BBB", "BBB", "BCB"]

def t_carbon_double(cfg, rng, rnp):
    img, d = new_canvas(cfg)
    (l0, _, l2), big = lanes(cfg)
    for ly in (l0, l2):
        s = organic_stroke(d, line_pts((0, ly), (big, ly)),
                           cfg["capillary_w"], rng, cfg)
        stipple_along(d, s, rng, cfg, density=0.3)
    return finish(img, cfg, rnp), ["BBB", "CBC", "BBB", "CBC"]

def t_carbon_merge(cfg, rng, rnp):
    img, d = new_canvas(cfg)
    (l0, c, l2), big = lanes(cfg)
    # two capillaries converge into one vessel
    for ly in (l0, l2):
        pts = bezier_pts((0, ly), (c * 0.7, ly), (c * 0.7, c), (c, c))
        s = organic_stroke(d, pts, cfg["capillary_w"], rng, cfg,
                           taper_to=cfg["capillary_w"] * 1.3)
        stipple_along(d, s, rng, cfg, density=0.3)
    s = organic_stroke(d, line_pts((c * 0.95, c), (big, c)),
                       cfg["carbon_w"], rng, cfg)
    stipple_along(d, s, rng, cfg)
    return finish(img, cfg, rnp), ["BBB", "BCB", "BBB", "CBC"]

def t_silicon_straight(cfg, rng, rnp):
    img, d = new_canvas(cfg)
    (_, c, _), big = lanes(cfg)
    pts = [(0, c), (big, c)]
    crisp_polyline(d, pts, cfg["silicon_w"], cfg)
    hatch_polyline(d, pts, cfg["silicon_w"], cfg)
    return finish(img, cfg, rnp), ["BBB", "BSB", "BBB", "BSB"]

def t_silicon_corner(cfg, rng, rnp):
    img, d = new_canvas(cfg)
    (_, c, _), big = lanes(cfg)
    m = cfg["miter"] * cfg["ss"]
    pts = [(0, c), (c - m, c), (c, c + m), (c, big)]
    crisp_polyline(d, pts, cfg["silicon_w"], cfg)
    hatch_polyline(d, pts, cfg["silicon_w"], cfg)
    return finish(img, cfg, rnp), ["BBB", "BBB", "BSB", "BSB"]

def t_silicon_tee(cfg, rng, rnp):
    img, d = new_canvas(cfg)
    (_, c, _), big = lanes(cfg)
    h = [(0, c), (big, c)]; v = [(c, c), (c, big)]
    crisp_polyline(d, h, cfg["silicon_w"], cfg)
    crisp_polyline(d, v, cfg["silicon_w"], cfg)
    hatch_polyline(d, h, cfg["silicon_w"], cfg)
    hatch_polyline(d, v, cfg["silicon_w"], cfg)
    via_ring(d, c, c, cfg)
    return finish(img, cfg, rnp), ["BBB", "BSB", "BSB", "BSB"]

def t_silicon_cross(cfg, rng, rnp):
    img, d = new_canvas(cfg)
    (_, c, _), big = lanes(cfg)
    ss = cfg["ss"]; g = 36 * ss
    h = [(0, c), (big, c)]
    crisp_polyline(d, h, cfg["silicon_w"], cfg)
    hatch_polyline(d, h, cfg["silicon_w"], cfg)
    # vertical trace hops the horizontal one
    v1 = [(c, 0), (c, c - g)]; v2 = [(c, c + g), (c, big)]
    crisp_polyline(d, v1, cfg["silicon_w"], cfg)
    crisp_polyline(d, v2, cfg["silicon_w"], cfg)
    hatch_polyline(d, v1, cfg["silicon_w"], cfg)
    hatch_polyline(d, v2, cfg["silicon_w"], cfg)
    d.arc([c - g, c - g, c + g, c + g], 270, 90,
          fill=cfg["silicon_ink"], width=int(cfg["silicon_w"] * ss * 0.8))
    return finish(img, cfg, rnp), ["BSB", "BSB", "BSB", "BSB"]

def t_silicon_end(cfg, rng, rnp):
    img, d = new_canvas(cfg)
    (_, c, _), big = lanes(cfg)
    pts = [(0, c), (c, c)]
    crisp_polyline(d, pts, cfg["silicon_w"], cfg)
    hatch_polyline(d, pts, cfg["silicon_w"], cfg)
    ss = cfg["ss"]; half = 34 * ss
    d.rounded_rectangle([c - half, c - half, c + half, c + half],
                        radius=10 * ss, fill=cfg["silicon_ink"])
    ri = 15 * ss
    d.ellipse([c - ri, c - ri, c + ri, c + ri], fill=cfg["substrate"])
    rd = 6 * ss
    d.ellipse([c - rd, c - rd, c + rd, c + rd], fill=cfg["silicon_ink"])
    return finish(img, cfg, rnp), ["BBB", "BBB", "BBB", "BSB"]

def t_silicon_double(cfg, rng, rnp):
    img, d = new_canvas(cfg)
    (l0, _, l2), big = lanes(cfg)
    for ly in (l0, l2):
        pts = [(0, ly), (big, ly)]
        crisp_polyline(d, pts, cfg["bus_w"], cfg)
        hatch_polyline(d, pts, cfg["bus_w"], cfg)
    return finish(img, cfg, rnp), ["BBB", "SBS", "BBB", "SBS"]

def t_silicon_merge(cfg, rng, rnp):
    img, d = new_canvas(cfg)
    (l0, c, l2), big = lanes(cfg)
    for ly in (l0, l2):
        dy = abs(c - ly)
        pts = [(0, ly), (c - dy, ly), (c, c)]
        crisp_polyline(d, pts, cfg["bus_w"], cfg)
        hatch_polyline(d, pts, cfg["bus_w"], cfg)
    pts = [(c, c), (big, c)]
    crisp_polyline(d, pts, cfg["silicon_w"], cfg)
    hatch_polyline(d, pts, cfg["silicon_w"], cfg)
    via_ring(d, c, c, cfg, r_out=20, ring=7)
    return finish(img, cfg, rnp), ["BBB", "BSB", "BBB", "SBS"]

def t_iface_straight(cfg, rng, rnp):
    img, d = new_canvas(cfg)
    (_, c, _), big = lanes(cfg)
    ss = cfg["ss"]
    s = organic_stroke(d, line_pts((0, c), (c - 30 * ss, c)),
                       cfg["carbon_w"], rng, cfg)
    stipple_along(d, s, rng, cfg)
    pts = [(c + 30 * ss, c), (big, c)]
    crisp_polyline(d, pts, cfg["silicon_w"], cfg)
    hatch_polyline(d, pts, cfg["silicon_w"], cfg)
    electrode_node(d, c, c, cfg)
    return finish(img, cfg, rnp), ["BBB", "BSB", "BBB", "BCB"]

def t_iface_corner(cfg, rng, rnp):
    img, d = new_canvas(cfg)
    (_, c, _), big = lanes(cfg)
    ss = cfg["ss"]
    s = organic_stroke(d, line_pts((0, c), (c - 30 * ss, c)),
                       cfg["carbon_w"], rng, cfg)
    stipple_along(d, s, rng, cfg)
    pts = [(c, c + 30 * ss), (c, big)]
    crisp_polyline(d, pts, cfg["silicon_w"], cfg)
    hatch_polyline(d, pts, cfg["silicon_w"], cfg)
    electrode_node(d, c, c, cfg)
    return finish(img, cfg, rnp), ["BBB", "BBB", "BSB", "BCB"]

TILES = [
    ("blank",            t_blank,            "shared"),
    ("carbon_straight",  t_carbon_straight,  "carbon"),
    ("carbon_corner",    t_carbon_corner,    "carbon"),
    ("carbon_tee",       t_carbon_tee,       "carbon"),
    ("carbon_end",       t_carbon_end,       "carbon"),
    ("carbon_double",    t_carbon_double,    "carbon"),
    ("carbon_merge",     t_carbon_merge,     "carbon"),
    ("silicon_straight", t_silicon_straight, "silicon"),
    ("silicon_corner",   t_silicon_corner,   "silicon"),
    ("silicon_tee",      t_silicon_tee,      "silicon"),
    ("silicon_cross",    t_silicon_cross,    "silicon"),
    ("silicon_end",      t_silicon_end,      "silicon"),
    ("silicon_double",   t_silicon_double,   "silicon"),
    ("silicon_merge",    t_silicon_merge,    "silicon"),
    ("iface_straight",   t_iface_straight,   "interface"),
    ("iface_corner",     t_iface_corner,     "interface"),
]

# ----------------------------------------------------------------------
# contact sheet
# ----------------------------------------------------------------------
def contact_sheet(records, outdir, cfg):
    from PIL import ImageFont
    thumb = 220; pad = 18; label_h = 44; cols = 4
    rows = math.ceil(len(records) / cols)
    W = cols * (thumb + pad) + pad
    H = rows * (thumb + label_h + pad) + pad
    sheet = Image.new("RGB", (W, H), (242, 240, 235))
    d = ImageDraw.Draw(sheet)
    try:
        font = ImageFont.truetype(
            "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf", 14)
    except Exception:
        font = ImageFont.load_default()
    for i, rec in enumerate(records):
        r, ccol = divmod(i, cols)
        x = pad + ccol * (thumb + pad)
        y = pad + r * (thumb + label_h + pad)
        img = Image.open(os.path.join(outdir, "tiles", rec["filename"]))
        sheet.paste(img.resize((thumb, thumb), Image.LANCZOS), (x, y))
        d.rectangle([x, y, x + thumb, y + thumb], outline=(180, 178, 172))
        name = rec["filename"].replace(".png", "")
        e = rec["edges"]
        d.text((x, y + thumb + 5), name, fill=(60, 58, 54), font=font)
        d.text((x, y + thumb + 23),
               f"T:{e[0]} R:{e[1]} B:{e[2]} L:{e[3]}",
               fill=(120, 118, 112), font=font)
    sheet.save(os.path.join(outdir, "contact_sheet.png"))

# ----------------------------------------------------------------------
# minimal WFC demo -- sanity check, not your production solver
# ----------------------------------------------------------------------
def rotate_edges(edges, k):
    """rotate tile 90deg clockwise k times: [T,R,B,L] -> [L,T,R,B]"""
    e = list(edges)
    for _ in range(k):
        e = [e[3], e[0], e[1], e[2]]
    return e

def demo_wfc(records, outdir, cfg):
    """thin wrapper: self-test solve on the freshly generated tileset"""
    solve(outdir, cfg["demo_dim"], cfg["demo_cell"], cfg["seed"] + 99,
          os.path.join(outdir, "demo_grid.png"))

def solve(tileset_dir, dim, cell, seed, out_path, attempts=30):
    """
    Standalone WFC render for ANY tileset in this manifest format:
      tileset_dir/manifest.json   tiles: {filename, edges[T,R,B,L], weight}
      tileset_dir/tiles/*.png
    Assumes clockwise edge strings and match rule: a == b[::-1].
    Rotations are expanded automatically (deduped by edge signature).
    """
    with open(os.path.join(tileset_dir, "manifest.json")) as f:
        records = json.load(f)["tiles"]
    rng = random.Random(seed)
    variants = []
    for rec in records:
        seen = set()
        base = Image.open(
            os.path.join(tileset_dir, "tiles", rec["filename"])).convert("RGB")
        for k in range(4):
            e = tuple(rotate_edges(rec["edges"], k))
            if e in seen:
                continue
            seen.add(e)
            variants.append({"img": base.rotate(-90 * k, expand=False),
                             "edges": e, "w": rec.get("weight", 100)})
    OPP = {0: 2, 1: 3, 2: 0, 3: 1}
    n = len(variants)
    comp = [[set() for _ in range(4)] for _ in range(n)]
    for i in range(n):
        for j in range(n):
            for dd in range(4):
                if variants[i]["edges"][dd] == variants[j]["edges"][OPP[dd]][::-1]:
                    comp[i][dd].add(j)
    DIRS = [(0, -1, 0), (1, 0, 1), (0, 1, 2), (-1, 0, 3)]  # dx, dy, edge idx
    for attempt in range(attempts):
        grid = [[set(range(n)) for _ in range(dim)] for _ in range(dim)]

        def propagate(stack):
            while stack:
                x, y = stack.pop()
                for dx, dy, dd in DIRS:
                    nx, ny = x + dx, y + dy
                    if not (0 <= nx < dim and 0 <= ny < dim):
                        continue
                    allowed = set()
                    for i in grid[y][x]:
                        allowed |= comp[i][dd]
                    new = grid[ny][nx] & allowed
                    if new != grid[ny][nx]:
                        grid[ny][nx] = new
                        if not new:
                            return False
                        stack.append((nx, ny))
            return True

        ok = True
        while ok:
            cells = [(len(grid[y][x]), x, y) for y in range(dim)
                     for x in range(dim) if len(grid[y][x]) > 1]
            if not cells:
                break
            _, x, y = min(cells, key=lambda c: (c[0], rng.random()))
            opts = list(grid[y][x])
            pick = rng.choices(opts, weights=[variants[i]["w"] for i in opts])[0]
            grid[y][x] = {pick}
            ok = propagate([(x, y)])
        if ok and all(len(grid[y][x]) == 1
                      for y in range(dim) for x in range(dim)):
            bg = variants[0]["img"].getpixel((2, 2))
            out = Image.new("RGB", (dim * cell, dim * cell), bg)
            cache = {}  # resize each variant once, not per cell
            for y in range(dim):
                for x in range(dim):
                    i = next(iter(grid[y][x]))
                    if i not in cache:
                        cache[i] = variants[i]["img"].resize(
                            (cell, cell), Image.LANCZOS)
                    out.paste(cache[i], (x * cell, y * cell))
            out.save(out_path)
            print(f"solved (attempt {attempt + 1}, seed {seed}) -> {out_path}")
            return True
    print(f"no convergence in {attempts} attempts (seed {seed})")
    return False

# ----------------------------------------------------------------------
def generate(outdir):
    os.makedirs(os.path.join(outdir, "tiles"), exist_ok=True)
    cfg = CFG
    rnp = np.random.default_rng(cfg["seed"])
    records = []
    for name, fn, family in TILES:
        rng = random.Random(f'{cfg["seed"]}:{name}')  # per-tile, reproducible
        img, edges = fn(cfg, rng, rnp)
        fname = f"{name}.png"
        img.save(os.path.join(outdir, "tiles", fname))
        records.append({"filename": fname, "edges": edges,
                        "weight": cfg["weights"][name], "set": family})
        print(f"  {fname:24s} T:{edges[0]} R:{edges[1]} "
              f"B:{edges[2]} L:{edges[3]}")
    manifest = {
        "tileset": "carbon_vs_silicon_v1",
        "tile_px": cfg["tile_px"],
        "edge_convention": ("3 sections per side; letters B/C/S; strings read "
                            "clockwise (top L>R, right T>B, bottom R>L, left "
                            "B>T); all v1 strings are palindromes; match "
                            "rule: myEdge == neighborEdge[::-1]"),
        "seed": cfg["seed"],
        "tiles": records,
    }
    with open(os.path.join(outdir, "manifest.json"), "w") as f:
        json.dump(manifest, f, indent=2)
    contact_sheet(records, outdir, cfg)
    demo_wfc(records, outdir, cfg)
    print(f"done -> {outdir}/")

def main():
    import argparse
    argv = sys.argv[1:]
    if not argv or argv[0] not in ("gen", "solve"):
        argv = ["gen"] + argv   # backward compatible: bare outdir still works
    ap = argparse.ArgumentParser(
        description="Carbon vs Silicon -- WFC tileset generator + solver")
    sub = ap.add_subparsers(dest="cmd", required=True)
    g = sub.add_parser("gen", help="generate the tileset")
    g.add_argument("outdir", nargs="?", default="carbon_silicon_out")
    s = sub.add_parser("solve",
                       help="WFC-render any manifest-format tileset dir")
    s.add_argument("tileset_dir",
                   help="dir containing manifest.json and tiles/")
    s.add_argument("--dim", type=int, default=20, help="grid is dim x dim")
    s.add_argument("--cell", type=int, default=96,
                   help="px per cell (dim*cell = output size)")
    s.add_argument("--seed", type=int, default=None,
                   help="solver seed; omit for random (printed for reuse)")
    s.add_argument("--out", default=None, help="output PNG path")
    s.add_argument("--attempts", type=int, default=30)
    args = ap.parse_args(argv)
    if args.cmd == "gen":
        generate(args.outdir)
    else:
        seed = args.seed if args.seed is not None else random.randrange(10**6)
        out = args.out or os.path.join(
            args.tileset_dir, f"wfc_{seed}_{args.dim}x{args.dim}.png")
        solve(args.tileset_dir, args.dim, args.cell, seed, out, args.attempts)

if __name__ == "__main__":
    main()
