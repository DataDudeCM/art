"""Build gallery thumbnails and the README gallery section from docs/gallery.csv.

Run from anywhere with the repo's .venv (needs Pillow):
    python docs/build_gallery.py

Rows with an empty `image` column are skipped. `image` may be a full path or a
file name inside GENART_ROOT/<image_folder>. Thumbnails are center-cropped to a
square and written to docs/gallery/. Only the README text between the gallery
markers is replaced.
"""

import csv
import re
import sys
from pathlib import Path
from urllib.parse import quote

from PIL import Image

GENART_ROOT = Path(r"C:\Users\ca0ma\OneDrive\Artwork\MyArt\GenArt")
THUMB_SIZE = 400
JPEG_QUALITY = 85
COLUMNS = 4

REPO = Path(__file__).resolve().parent.parent
CSV_PATH = REPO / "docs" / "gallery.csv"
THUMB_DIR = REPO / "docs" / "gallery"
README = REPO / "README.md"
START, END = "<!-- gallery:start -->", "<!-- gallery:end -->"


def slug(text):
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def image_path(row):
    p = Path(row["image"].strip())
    return p if p.is_absolute() else GENART_ROOT / row["image_folder"].strip() / p


def make_thumb(src, dest):
    im = Image.open(src).convert("RGB")
    side = min(im.size)
    left, top = (im.width - side) // 2, (im.height - side) // 2
    im = im.crop((left, top, left + side, top + side))
    im = im.resize((THUMB_SIZE, THUMB_SIZE), Image.LANCZOS)
    im.save(dest, "JPEG", quality=JPEG_QUALITY, optimize=True)


def cell(item):
    img = f'<img src="docs/gallery/{item["thumb"]}" width="180" alt="{item["title"]}">'
    if item["sketch"]:
        img = f'<a href="{quote(item["sketch"])}">{img}</a>'
    text = f"{img}<br>{item['title']}"
    if item["description"]:
        text += f"<br><sub>{item['description']}</sub>"
    return text


def gallery_markdown(items):
    lines = ["## Gallery", ""]
    categories = list(dict.fromkeys(i["category"] for i in items))
    for cat in categories:
        group = [i for i in items if i["category"] == cat]
        lines += [f"### {cat}", "", "<table>"]
        for n in range(0, len(group), COLUMNS):
            row = "".join(f'<td align="center">{cell(i)}</td>' for i in group[n:n + COLUMNS])
            lines.append(f"<tr>{row}</tr>")
        lines += ["</table>", ""]
    return "\n".join(lines)


def main():
    THUMB_DIR.mkdir(exist_ok=True)
    items, problems = [], []

    with open(CSV_PATH, newline="", encoding="utf-8-sig") as f:
        for row in csv.DictReader(f):
            if not row["image"].strip():
                continue
            src = image_path(row)
            if not src.exists():
                problems.append(f"missing image for {row['title']}: {src}")
                continue
            sketch = row["sketch"].strip()
            if sketch and not (REPO / sketch).exists():
                problems.append(f"sketch path not found for {row['title']}: {sketch}")
            thumb = slug(row["title"]) + ".jpg"
            make_thumb(src, THUMB_DIR / thumb)
            items.append({
                "title": row["title"].strip(),
                "category": row["category"].strip() or "other",
                "sketch": sketch,
                "thumb": thumb,
                "description": (row.get("description") or "").strip(),
            })
            print(f"ok  {thumb}")

    text = README.read_text(encoding="utf-8")
    if START not in text or END not in text:
        sys.exit(f"README is missing the {START} / {END} markers")
    before, rest = text.split(START, 1)
    _, after = rest.split(END, 1)
    README.write_text(f"{before}{START}\n{gallery_markdown(items)}\n{END}{after}", encoding="utf-8")

    print(f"\n{len(items)} thumbnails written, README gallery updated")
    for p in problems:
        print(f"WARNING: {p}")


if __name__ == "__main__":
    main()
