# Texture Library Manager

A Streamlit app for building, analyzing, and organizing a personal texture image library for use in Photoshop composite work.

---

## Setup

```bash
cd texture_library_app
pip install -r requirements.txt
streamlit run app.py
```

### Optional: CLIP-based auto-tagging
For smarter tag suggestions (organic, geometric, rough, wood grain, etc.), install the CLIP packages:
```bash
pip install open-clip-torch torch torchvision
```
The app detects CLIP automatically. Without it, heuristic tags are used (still useful).

---

## Library Folder Structure

Point the app at any folder on your machine. It will create:

```
your_library_root/
  originals/         ← drop your texture images here
  cache/             ← auto-generated square thumbs (analysis + UI only)
  organized/         ← full-res copies sorted into folders for Photoshop
  manifest.json      ← the data contract between Assess and Organize
```

---

## Workflow

### 1. Assess
- Drop images into `/originals/`
- Set your brightness thresholds (Shadow / Midtone / Highlight split points)
- Click **Analyze** — new images only are processed by default
- Review auto-assigned tone zones and tags in the grid
- Edit tags and override zones manually as needed

### 2. Organize
- Choose which folder schemes to generate:
  - `by_brightness` — shadow / midtone / highlight with range labels
  - `by_contrast` — flat / mid / rich
  - `by_tone_zone` — combined (e.g. `shadow_rich`, `midtone_flat`)
  - `by_frequency` — fine / medium / coarse grain
  - `by_orientation` — horizontal / vertical / chaotic
- Click **Organize Files** — full-res originals are copied (not moved)
- Open `/organized/` in Photoshop's File Browser for visual browsing

### 3. Browse
- Filter by brightness zone, contrast, frequency, orientation
- Search by tag
- Sort by brightness or contrast
- Visual grid of your full library

---

## Manifest Schema

Each texture entry in `manifest.json`:

```json
{
  "id": "abc123456789",
  "filename": "cracked_mud_01.jpg",
  "path": "/absolute/path/to/originals/cracked_mud_01.jpg",
  "cache_path": "/absolute/path/to/cache/cracked_mud_01_thumb.jpg",
  "orig_width": 4032,
  "orig_height": 3024,
  "brightness": 87.3,
  "contrast_rms": 41.2,
  "dominant_frequency": "coarse",
  "orientation": "chaotic",
  "brightness_zone": "midtone",
  "contrast_zone": "mid",
  "tone_zone": "midtone_mid",
  "tags": ["organic", "coarse", "chaotic"],
  "user_tags": ["earth", "shadow-material"],
  "excluded": false
}
```

---

## Brightness Thresholds

Default splits (adjustable per-run in the Assess tab):

| Zone      | Range    |
|-----------|----------|
| Shadow    | 0 – 85   |
| Midtone   | 85 – 170 |
| Highlight | 170 – 255|

---

## Tips for Photoshop Use

- `/organized/by_tone_zone/` is the most useful for luminosity mask work — it gives you both brightness and contrast/visual weight in one folder
- `/organized/by_brightness/` with range labels (e.g. `shadow_0-85`) lets you grab specific tonal ranges quickly
- All organized files are full-resolution originals — ready to paste as Smart Objects
