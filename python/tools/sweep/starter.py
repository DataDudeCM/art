"""
Starters: sketches adapted so the sweep can set their parameters and seed.

A starter is a folder named `starter/` inside a sketch's own folder, e.g.
generative/substrate/starter/, holding:

  sketch.js    PARAMS between /*PARAMS*/ ... /*END PARAMS*/ and the seed
               between /*SEED*/ ... /*END SEED*/; sets window.studioDone
               when the image is finished.
  params.yaml  per parameter: default, min, max, optional integer: true,
               optional scale: log, and a one-line about.

A starter's name is its sketch's folder name ("substrate"). The marker
format matches diamond-age-studio's starter_tool.py, so both tools can
read the same starters.
"""

import json
import re
from pathlib import Path

import yaml

ART_DIR = Path(__file__).resolve().parents[3]

PARAMS_BLOCK = re.compile(r"/\*PARAMS\*/.*?/\*END PARAMS\*/", re.S)
SEED_BLOCK = re.compile(r"/\*SEED\*/.*?/\*END SEED\*/", re.S)


def all_starters() -> dict[str, Path]:
    """Every starter in the art repo, by name."""

    return {
        params.parent.parent.name: params.parent
        for params in sorted(ART_DIR.glob("*/*/starter/params.yaml"))
    }


def find_starter(name_or_path: str) -> Path:
    """A starter folder, from its name or a path to it."""

    path = Path(name_or_path)
    if (path / "params.yaml").exists():
        return path.resolve()

    starters = all_starters()
    if name_or_path not in starters:
        known = ", ".join(starters) or "none found"
        raise SystemExit(f"Unknown starter '{name_or_path}'. Starters: {known}")

    return starters[name_or_path]


def load_starter(folder: Path) -> tuple[str, dict]:
    """A starter's sketch.js text and its params.yaml."""

    sketch = (folder / "sketch.js").read_text(encoding="utf-8")
    spec = yaml.safe_load((folder / "params.yaml").read_text(encoding="utf-8"))

    if not PARAMS_BLOCK.search(sketch) or not SEED_BLOCK.search(sketch):
        raise SystemExit(f"{folder / 'sketch.js'} is missing its PARAMS or SEED markers.")

    return sketch, spec


def defaults(spec: dict) -> dict:
    return {key: p["default"] for key, p in spec["params"].items()}


def build_sketch(sketch: str, params: dict, seed: int) -> str:
    """Put the params and the seed between the starter's markers."""

    block = json.dumps(params, indent=2)
    sketch = PARAMS_BLOCK.sub(lambda _: f"/*PARAMS*/ {block} /*END PARAMS*/", sketch, count=1)
    return SEED_BLOCK.sub(lambda _: f"/*SEED*/ {seed} /*END SEED*/", sketch, count=1)
