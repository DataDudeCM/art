"""
app.py — Texture Library Manager
Streamlit UI with darkroom aesthetic.
Three modes: Assess → Organize → Browse
"""

import base64
import io
import os
import time
from pathlib import Path

import streamlit as st
from PIL import Image
from compositor import composite, ZONES_5

from analyzer import (
    analyze_image,
    load_manifest,
    save_manifest,
    file_hash,
    _CLIP_AVAILABLE,
    BRIGHTNESS_BINS,
    CONTRAST_BINS,
)
from organizer import organize, clean_organized, ORGANIZE_SCHEMES

# ── PAGE CONFIG ───────────────────────────────────────────────────────────────
st.set_page_config(
    page_title="Texture Library",
    page_icon="🎞",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ── DARKROOM CSS ──────────────────────────────────────────────────────────────
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Space+Mono:wght@400;700&display=swap');

/* ── base ── */
html, body, [data-testid="stAppViewContainer"] {
    background-color: #0f0f0f !important;
    color: #d4c5a9 !important;
    font-family: 'Space Mono', monospace;
}
[data-testid="stSidebar"] {
    background-color: #141414 !important;
    border-right: 1px solid #2a2a2a;
}
[data-testid="stSidebar"] * { color: #d4c5a9 !important; }

/* ── headings ── */
h1, h2, h3 { font-family: 'Playfair Display', serif !important; }
h1 { color: #e8a230 !important; letter-spacing: 0.04em; }
h2 { color: #c9913a !important; }
h3 { color: #d4c5a9 !important; }

/* ── buttons ── */
.stButton > button {
    background: #1c1c1c !important;
    color: #e8a230 !important;
    border: 1px solid #e8a230 !important;
    border-radius: 2px !important;
    font-family: 'Space Mono', monospace !important;
    font-size: 0.78rem !important;
    letter-spacing: 0.08em !important;
    padding: 0.4rem 1rem !important;
    transition: all 0.15s ease !important;
}
.stButton > button:hover {
    background: #e8a230 !important;
    color: #0f0f0f !important;
}

/* ── inputs / selects ── */
.stTextInput input, .stSelectbox select, .stMultiSelect [data-baseweb="select"] {
    background-color: #1c1c1c !important;
    color: #d4c5a9 !important;
    border: 1px solid #2e2e2e !important;
    font-family: 'Space Mono', monospace !important;
    border-radius: 2px !important;
}
.stTextInput input:focus { border-color: #e8a230 !important; }
.stCheckbox label { color: #d4c5a9 !important; font-family: 'Space Mono', monospace !important; }
.stRadio label  { color: #d4c5a9 !important; }

/* ── progress ── */
.stProgress > div > div { background-color: #e8a230 !important; }

/* ── metric cards ── */
[data-testid="stMetric"] {
    background: #1a1a1a;
    border: 1px solid #2a2a2a;
    padding: 0.6rem 1rem;
    border-radius: 2px;
}
[data-testid="stMetricValue"] { color: #e8a230 !important; font-family: 'Space Mono', monospace !important; }
[data-testid="stMetricLabel"] { color: #7a6f5e !important; font-size: 0.7rem !important; }

/* ── expander ── */
.streamlit-expanderHeader {
    background: #1a1a1a !important;
    border: 1px solid #2a2a2a !important;
    color: #d4c5a9 !important;
    font-family: 'Space Mono', monospace !important;
    font-size: 0.78rem !important;
}

/* ── divider ── */
hr { border-color: #2a2a2a !important; }

/* ── tag pills ── */
.tag-pill {
    display: inline-block;
    background: #1e1e1e;
    border: 1px solid #3a3a2a;
    color: #c9913a;
    font-family: 'Space Mono', monospace;
    font-size: 0.65rem;
    padding: 2px 8px;
    border-radius: 2px;
    margin: 2px;
    letter-spacing: 0.06em;
}

/* ── texture card ── */
.texture-card {
    background: #161616;
    border: 1px solid #252525;
    border-radius: 3px;
    padding: 8px;
    transition: border-color 0.15s;
}
.texture-card:hover { border-color: #e8a230; }

/* ── zone badge ── */
.zone-badge {
    display: inline-block;
    background: #2a1f0a;
    border: 1px solid #e8a230;
    color: #e8a230;
    font-family: 'Space Mono', monospace;
    font-size: 0.6rem;
    padding: 1px 6px;
    border-radius: 1px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
}

/* scrollbar */
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: #0f0f0f; }
::-webkit-scrollbar-thumb { background: #3a3a3a; border-radius: 2px; }
</style>
""", unsafe_allow_html=True)


# ── SESSION STATE ─────────────────────────────────────────────────────────────
def _init_state():
    defaults = {
        "library_root": "",
        "manifest":     {"textures": {}},
        "mode":         "Assess",
    }
    for k, v in defaults.items():
        if k not in st.session_state:
            st.session_state[k] = v

_init_state()


# ── HELPERS ───────────────────────────────────────────────────────────────────
def _library_paths(root: str) -> dict:
    r = Path(root)
    return {
        "originals":  r / "originals",
        "cache":      r / "cache",
        "organized":  r / "organized",
        "manifest":   r / "manifest.json",
    }

def _ensure_dirs(paths: dict):
    for k in ("originals", "cache", "organized"):
        paths[k].mkdir(parents=True, exist_ok=True)

def _img_to_b64(path: str, max_px: int = 300) -> str:
    try:
        img = Image.open(path)
        img.thumbnail((max_px, max_px))
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=80)
        return base64.b64encode(buf.getvalue()).decode()
    except Exception:
        return ""

def _tag_html(tags: list) -> str:
    return " ".join(f'<span class="tag-pill">{t}</span>' for t in tags)

def _reload_manifest(paths: dict):
    st.session_state["manifest"] = load_manifest(str(paths["manifest"]))


# ── SIDEBAR ───────────────────────────────────────────────────────────────────
with st.sidebar:
    st.markdown("# 🎞 Texture Library")
    st.markdown("---")

    root = st.text_input(
        "Library root folder",
        value=st.session_state["library_root"],
        placeholder="/Users/chris/texture_library",
        help="All subfolders (originals, cache, organized) live here.",
    )
    if root != st.session_state["library_root"]:
        st.session_state["library_root"] = root

    if root and Path(root).exists():
        paths = _library_paths(root)
        _ensure_dirs(paths)
        _reload_manifest(paths)
        n = len(st.session_state["manifest"]["textures"])
        st.markdown(f'<span class="zone-badge">{n} textures indexed</span>', unsafe_allow_html=True)
    else:
        paths = None
        if root:
            st.warning("Path not found.")

    st.markdown("---")
    mode = st.radio("Mode", ["Assess", "Organize", "Browse", "Composite"], index=["Assess","Organize","Browse","Composite"].index(st.session_state["mode"]))
    st.session_state["mode"] = mode

    st.markdown("---")
    clip_status = "✓ CLIP available" if _CLIP_AVAILABLE else "✗ CLIP not installed\n(heuristic tagging)"
    clip_color  = "#6dbf6d" if _CLIP_AVAILABLE else "#bf6d6d"
    st.markdown(f'<span style="font-size:0.7rem;color:{clip_color};font-family:Space Mono">{clip_status}</span>', unsafe_allow_html=True)


# ── GUARD ─────────────────────────────────────────────────────────────────────
if not paths:
    st.markdown("## Set your library root folder in the sidebar to begin.")
    st.stop()


# ══════════════════════════════════════════════════════════════════════════════
# MODE: ASSESS
# ══════════════════════════════════════════════════════════════════════════════
if mode == "Assess":
    st.markdown("## Assess & Index")

    originals_dir = paths["originals"]
    image_exts    = {".jpg", ".jpeg", ".png", ".tif", ".tiff", ".webp"}

    all_files = sorted([
        f for f in originals_dir.iterdir()
        if f.suffix.lower() in image_exts
    ])

    manifest    = st.session_state["manifest"]
    indexed_ids = {t["filename"]: t["id"] for t in manifest["textures"].values()}
    new_files   = [f for f in all_files if f.name not in indexed_ids]
    known_files = [f for f in all_files if f.name in indexed_ids]

    col1, col2, col3 = st.columns(3)
    col1.metric("Total images", len(all_files))
    col2.metric("Already indexed", len(known_files))
    col3.metric("New / unindexed", len(new_files))

    st.markdown("---")

    # ── scan options ──────────────────────────────────────────────────────────
    c1, c2 = st.columns(2)
    with c1:
        use_clip   = st.checkbox("Use CLIP for tags", value=_CLIP_AVAILABLE, disabled=not _CLIP_AVAILABLE)
        force_all  = st.checkbox("Re-analyze all (ignore existing)", value=False)
    with c2:
        drop_shadow = st.number_input("Shadow / Midtone split", 0, 255, 85)
        drop_high   = st.number_input("Midtone / Highlight split", 0, 255, 170)

    # Apply custom thresholds to analyzer module
    import analyzer as _an
    _an.BRIGHTNESS_BINS["shadow"]    = (0, drop_shadow)
    _an.BRIGHTNESS_BINS["midtone"]   = (drop_shadow, drop_high)
    _an.BRIGHTNESS_BINS["highlight"] = (drop_high, 256)

    to_process = all_files if force_all else new_files

    if st.button(f"▶  Analyze {len(to_process)} image(s)"):
        if not to_process:
            st.info("Nothing new to analyze.")
        else:
            progress  = st.progress(0)
            status    = st.empty()
            errors    = []

            for i, f in enumerate(to_process):
                status.markdown(f'`analyzing → {f.name}`')
                try:
                    result = analyze_image(str(f), str(paths["cache"]), use_clip=use_clip)
                    manifest["textures"][result["id"]] = result
                except Exception as e:
                    errors.append(f"{f.name}: {e}")
                progress.progress((i + 1) / len(to_process))

            save_manifest(manifest, str(paths["manifest"]))
            st.session_state["manifest"] = manifest
            status.markdown(f'`✓ Done. {len(to_process)} analyzed.`')
            if errors:
                st.error("\n".join(errors))

    st.markdown("---")

    # ── review / edit tags ────────────────────────────────────────────────────
    if manifest["textures"]:
        st.markdown("### Review & Edit")

        filter_zone = st.selectbox("Filter by tone zone", ["all"] + [
            f"{b}_{c}" for b in BRIGHTNESS_BINS for c in CONTRAST_BINS
        ])

        textures = list(manifest["textures"].values())
        if filter_zone != "all":
            textures = [t for t in textures if t.get("tone_zone") == filter_zone]

        textures = sorted(textures, key=lambda t: t["brightness"])

        cols_per_row = 4
        for row_start in range(0, len(textures), cols_per_row):
            cols = st.columns(cols_per_row)
            for col, texture in zip(cols, textures[row_start:row_start+cols_per_row]):
                with col:
                    # Thumbnail
                    cache_p = texture.get("cache_path", "")
                    if cache_p and os.path.exists(cache_p):
                        b64 = _img_to_b64(cache_p, 220)
                        if b64:
                            st.markdown(
                                f'<div class="texture-card"><img src="data:image/jpeg;base64,{b64}" style="width:100%;border-radius:2px"/></div>',
                                unsafe_allow_html=True
                            )
                    else:
                        st.markdown('<div class="texture-card" style="height:120px;display:flex;align-items:center;justify-content:center;color:#555">no preview</div>', unsafe_allow_html=True)

                    st.markdown(f'`{texture["filename"]}`')
                    st.markdown(
                        f'<span class="zone-badge">{texture["tone_zone"]}</span> '
                        f'<span style="font-size:0.65rem;color:#7a6f5e"> ☀ {texture["brightness"]:.0f} '
                        f'  ◎ {texture["contrast_rms"]:.0f}</span>',
                        unsafe_allow_html=True
                    )

                    all_tags = texture.get("tags", []) + texture.get("user_tags", [])
                    st.markdown(_tag_html(all_tags), unsafe_allow_html=True)

                    with st.expander("edit", expanded=False):
                        tid = texture["id"]
                        new_user_tags = st.text_input(
                            "Add tags (comma separated)",
                            value=", ".join(texture.get("user_tags", [])),
                            key=f"utags_{tid}"
                        )
                        new_zone = st.selectbox(
                            "Override tone zone",
                            options=["(auto)"] + [
                                f"{b}_{c}" for b in BRIGHTNESS_BINS for c in CONTRAST_BINS
                            ],
                            index=0,
                            key=f"zone_{tid}"
                        )
                        excluded = st.checkbox("Exclude from library", value=texture.get("excluded", False), key=f"excl_{tid}")

                        if st.button("Save", key=f"save_{tid}"):
                            texture["user_tags"] = [t.strip() for t in new_user_tags.split(",") if t.strip()]
                            texture["excluded"]  = excluded
                            if new_zone != "(auto)":
                                texture["tone_zone"] = new_zone
                            manifest["textures"][tid] = texture
                            save_manifest(manifest, str(paths["manifest"]))
                            st.session_state["manifest"] = manifest
                            st.success("Saved")


# ══════════════════════════════════════════════════════════════════════════════
# MODE: ORGANIZE
# ══════════════════════════════════════════════════════════════════════════════
elif mode == "Organize":
    st.markdown("## Organize into Folders")

    manifest = st.session_state["manifest"]
    active   = [t for t in manifest["textures"].values() if not t.get("excluded", False)]

    st.metric("Textures to organize", len(active))
    st.markdown("---")

    schemes = st.multiselect(
        "Folder schemes to generate",
        options=list(ORGANIZE_SCHEMES.keys()),
        default=["by_brightness", "by_tone_zone"],
        help="Each scheme creates its own subfolder tree under /organized/"
    )

    c1, c2 = st.columns(2)
    with c1:
        overwrite = st.checkbox("Overwrite existing copies", value=False)
    with c2:
        clean_first = st.checkbox("Clean /organized/ before rebuild", value=False)

    if st.button("▶  Organize Files"):
        if not schemes:
            st.warning("Select at least one scheme.")
        elif not active:
            st.warning("No textures in manifest yet. Run Assess first.")
        else:
            if clean_first:
                clean_organized(str(paths["organized"]))
                st.info("/organized/ cleared.")

            progress = st.progress(0)
            status   = st.empty()

            def _cb(done, total, msg):
                progress.progress(done / total)
                status.markdown(f'`{msg}`')

            summary = organize(
                manifest_path=str(paths["manifest"]),
                organized_dir=str(paths["organized"]),
                schemes=schemes,
                overwrite=overwrite,
                progress_cb=_cb,
            )

            status.markdown("`✓ Organization complete.`")
            st.markdown("---")
            st.markdown("### Folder Summary")

            for scheme, folders in summary.items():
                st.markdown(f"**{scheme}**")
                for folder, files in sorted(folders.items()):
                    st.markdown(f"&nbsp;&nbsp;&nbsp;`{folder}/` — {len(files)} file(s)")

    # ── show existing structure ───────────────────────────────────────────────
    st.markdown("---")
    st.markdown("### Current /organized/ Structure")
    org = paths["organized"]
    if org.exists():
        for scheme_dir in sorted(org.iterdir()):
            if scheme_dir.is_dir():
                with st.expander(f"📁 {scheme_dir.name}"):
                    for sub in sorted(scheme_dir.iterdir()):
                        if sub.is_dir():
                            count = len(list(sub.glob("*.*")))
                            st.markdown(f"&nbsp;&nbsp;`{sub.name}/` — {count} files")
    else:
        st.info("No organized folders yet.")


# ══════════════════════════════════════════════════════════════════════════════
# MODE: BROWSE
# ══════════════════════════════════════════════════════════════════════════════
elif mode == "Browse":
    st.markdown("## Browse Library")

    manifest = st.session_state["manifest"]
    textures = [t for t in manifest["textures"].values() if not t.get("excluded", False)]

    if not textures:
        st.info("No textures indexed yet. Run Assess first.")
        st.stop()

    # ── filters ───────────────────────────────────────────────────────────────
    fc1, fc2, fc3, fc4 = st.columns(4)
    with fc1:
        f_brightness = st.selectbox("Brightness", ["all", "shadow", "midtone", "highlight"])
    with fc2:
        f_contrast   = st.selectbox("Contrast",   ["all", "flat", "mid", "rich"])
    with fc3:
        f_freq       = st.selectbox("Frequency",  ["all", "fine", "medium", "coarse"])
    with fc4:
        f_orient     = st.selectbox("Orientation",["all", "horizontal", "vertical", "chaotic"])

    tag_search = st.text_input("Tag search", placeholder="e.g. organic, dark")

    # ── apply filters ─────────────────────────────────────────────────────────
    filtered = textures
    if f_brightness != "all":
        filtered = [t for t in filtered if t.get("brightness_zone") == f_brightness]
    if f_contrast != "all":
        filtered = [t for t in filtered if t.get("contrast_zone") == f_contrast]
    if f_freq != "all":
        filtered = [t for t in filtered if t.get("dominant_frequency") == f_freq]
    if f_orient != "all":
        filtered = [t for t in filtered if t.get("orientation") == f_orient]
    if tag_search.strip():
        search_terms = [s.strip().lower() for s in tag_search.split(",") if s.strip()]
        def _has_tags(t):
            all_t = [x.lower() for x in t.get("tags", []) + t.get("user_tags", [])]
            return any(term in " ".join(all_t) for term in search_terms)
        filtered = [t for t in filtered if _has_tags(t)]

    # ── sort ──────────────────────────────────────────────────────────────────
    sc1, sc2 = st.columns([2,1])
    with sc1:
        sort_by = st.selectbox("Sort by", ["brightness ↑", "brightness ↓", "contrast ↑", "contrast ↓", "filename"])
    with sc2:
        grid_cols = st.slider("Columns", 2, 6, 4)

    sort_map = {
        "brightness ↑": lambda t: t["brightness"],
        "brightness ↓": lambda t: -t["brightness"],
        "contrast ↑":   lambda t: t["contrast_rms"],
        "contrast ↓":   lambda t: -t["contrast_rms"],
        "filename":     lambda t: t["filename"],
    }
    filtered = sorted(filtered, key=sort_map[sort_by])

    st.markdown(f'<span class="zone-badge">{len(filtered)} / {len(textures)} shown</span>', unsafe_allow_html=True)
    st.markdown("---")

    # ── grid ──────────────────────────────────────────────────────────────────
    for row_start in range(0, len(filtered), grid_cols):
        cols = st.columns(grid_cols)
        for col, texture in zip(cols, filtered[row_start:row_start+grid_cols]):
            with col:
                cache_p = texture.get("cache_path", "")
                if cache_p and os.path.exists(cache_p):
                    b64 = _img_to_b64(cache_p, 280)
                    if b64:
                        st.markdown(
                            f'<div class="texture-card"><img src="data:image/jpeg;base64,{b64}" style="width:100%;border-radius:2px"/></div>',
                            unsafe_allow_html=True
                        )

                st.markdown(
                    f'<div style="font-size:0.6rem;color:#7a6f5e;margin-top:4px">{texture["filename"]}</div>',
                    unsafe_allow_html=True
                )
                all_tags = texture.get("tags", []) + texture.get("user_tags", [])
                st.markdown(_tag_html(all_tags), unsafe_allow_html=True)
                st.markdown(
                    f'<span class="zone-badge">{texture["tone_zone"]}</span> '
                    f'<span style="font-size:0.6rem;color:#7a6f5e"> '
                    f'☀{texture["brightness"]:.0f} ◎{texture["contrast_rms"]:.0f} '
                    f'{texture["dominant_frequency"]} {texture["orientation"]}</span>',
                    unsafe_allow_html=True
                )


# ══════════════════════════════════════════════════════════════════════════════
# MODE: COMPOSITE
# ══════════════════════════════════════════════════════════════════════════════
elif mode == "Composite":
    st.markdown("## Composite Portrait")
    st.markdown(
        '<p style="font-size:0.8rem;color:#7a6f5e;font-family:Space Mono">'
        'Replaces portrait tonal zones with matched textures from your library. '
        'Outputs a layered PSD with luminosity masks intact.</p>',
        unsafe_allow_html=True
    )

    manifest = st.session_state["manifest"]
    active_textures = [t for t in manifest["textures"].values() if not t.get("excluded", False)]

    if not active_textures:
        st.warning("No textures in manifest yet. Run Assess first.")
        st.stop()

    st.markdown("---")

    # ── Portrait input ────────────────────────────────────────────────────────
    st.markdown("### Source Portrait")
    portrait_path = st.text_input(
        "Portrait image path",
        placeholder="/Users/chris/portraits/subject_01.jpg",
        help="Full path to any JPEG, PNG, or TIFF portrait.",
    ).strip()

    portrait_preview = st.empty()

    if portrait_path and os.path.exists(portrait_path):
        b64 = _img_to_b64(portrait_path, 400)
        if b64:
            portrait_preview.markdown(
                f'<div style="max-width:340px">'
                f'<div class="texture-card"><img src="data:image/jpeg;base64,{b64}" style="width:100%;border-radius:2px"/></div>'
                f'</div>',
                unsafe_allow_html=True
            )
    elif portrait_path:
        st.warning("Portrait not found at that path.")

    st.markdown("---")

    # ── Output path ───────────────────────────────────────────────────────────
    st.markdown("### Output")
    default_out = str(paths["organized"].parent / "composites") if paths else ""
    output_dir = st.text_input(
        "Output folder",
        value=default_out,
        help="PSD will be saved here as <portrait_name>_composite.psd",
    ).strip()

    # ── Zone preview ──────────────────────────────────────────────────────────
    st.markdown("---")
    st.markdown("### Zone → Texture Mapping Preview")
    st.markdown(
        '<p style="font-size:0.75rem;color:#7a6f5e;font-family:Space Mono">'
        'Best-match textures that will be assigned to each zone. '
        'To change a match, adjust tags or exclusions in Assess.</p>',
        unsafe_allow_html=True
    )

    import math as _math

    zone_cols = st.columns(5)
    for col, (zone_name, zone_label, lo, hi) in zip(zone_cols, ZONES_5):
        mid = (lo + hi) / 2.0
        best = min(
            [t for t in active_textures if os.path.exists(t.get("cache_path",""))],
            key=lambda t: abs(t["brightness"] - mid),
            default=None
        )
        with col:
            st.markdown(f'<div style="font-size:0.65rem;color:#e8a230;font-family:Space Mono;margin-bottom:4px">{zone_label}</div>', unsafe_allow_html=True)
            st.markdown(f'<div style="font-size:0.58rem;color:#555;font-family:Space Mono">luma {lo}–{hi}</div>', unsafe_allow_html=True)
            if best:
                b64 = _img_to_b64(best["cache_path"], 160)
                if b64:
                    st.markdown(
                        f'<div class="texture-card"><img src="data:image/jpeg;base64,{b64}" style="width:100%;border-radius:2px"/></div>',
                        unsafe_allow_html=True
                    )
                st.markdown(
                    f'<div style="font-size:0.55rem;color:#7a6f5e;font-family:Space Mono;margin-top:3px">'
                    f'{best["filename"]}<br>☀ {best["brightness"]:.0f}</div>',
                    unsafe_allow_html=True
                )
            else:
                st.markdown('<div style="font-size:0.65rem;color:#bf6d6d">no match</div>', unsafe_allow_html=True)

    st.markdown("---")

    # ── Run button ────────────────────────────────────────────────────────────
    can_run = (
        portrait_path
        and os.path.exists(portrait_path)
        and output_dir
        and len(active_textures) >= 1
    )

    if not can_run:
        st.info("Set a valid portrait path and output folder to enable compositing.")

    if st.button("▶  Build PSD Composite", disabled=not can_run):
        portrait_stem = Path(portrait_path).stem
        out_path = str(Path(output_dir) / f"{portrait_stem}_composite.psd")
        Path(output_dir).mkdir(parents=True, exist_ok=True)

        progress = st.progress(0)
        status   = st.empty()

        def _cb(done, total, msg):
            progress.progress(done / max(total, 1))
            status.markdown(f'`{msg}`')

        try:
            results = composite(
                portrait_path=portrait_path,
                manifest_path=str(paths["manifest"]),
                output_path=out_path,
                progress_cb=_cb,
            )

            status.markdown(f'`✓ Saved → {out_path}`')
            progress.progress(1.0)

            st.markdown("---")
            st.markdown("### Zone Results")

            for r in results:
                if r.get("warning"):
                    st.markdown(
                        f'<span style="color:#bf6d6d;font-family:Space Mono;font-size:0.75rem">'
                        f'⚠ {r["zone"]}: {r["warning"]}</span>',
                        unsafe_allow_html=True
                    )
                else:
                    st.markdown(
                        f'<span class="zone-badge">{r["zone"]}</span> '
                        f'<span style="font-size:0.72rem;font-family:Space Mono;color:#d4c5a9"> '
                        f'← {r["texture_file"]} '
                        f'<span style="color:#7a6f5e">'
                        f'☀{r["brightness"]:.0f} · {r["coverage_pct"]}% coverage'
                        f'</span></span>',
                        unsafe_allow_html=True
                    )

            st.markdown(
                f'<p style="margin-top:1rem;font-size:0.75rem;font-family:Space Mono;color:#7a6f5e">'
                f'Open in Photoshop → each zone is a separate layer with its luminosity mask. '
                f'Swap textures by replacing layer contents. Adjust mask feathering as needed.</p>',
                unsafe_allow_html=True
            )

        except Exception as e:
            status.markdown(f'`✗ Error: {e}`')
            st.error(str(e))
