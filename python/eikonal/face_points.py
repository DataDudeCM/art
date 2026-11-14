"""Find named face features in a photo with MediaPipe's face landmarker.

Same model and landmark numbers as image-art/facetPortrait/js/face.js.
"left" and "right" mean the left and right side of the picture.
The model (about 4 MB) downloads once into models/ next to this file.
"""

import contextlib
import os
import sys
import urllib.request
from pathlib import Path

MODEL_URL = (
    "https://storage.googleapis.com/mediapipe-models/face_landmarker/"
    "face_landmarker/float16/1/face_landmarker.task"
)
MODEL_PATH = Path(__file__).parent / "models" / "face_landmarker.task"

# Each feature is the average of these landmarks.
FEATURES = {
    "left-eye": [33, 159, 133, 145],
    "right-eye": [362, 386, 263, 374],
    "nose": [4],
    "mouth": [61, 0, 291, 17],
    "chin": [152],
    "brow": [9],
}
FACE_SET = ["left-eye", "right-eye", "nose", "mouth"]  # what --face seeds


def _model():
    if not MODEL_PATH.exists():
        MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
        print("downloading face model (one time) ...")
        urllib.request.urlretrieve(MODEL_URL, MODEL_PATH)
    return str(MODEL_PATH)


@contextlib.contextmanager
def _quiet_stderr():
    """MediaPipe's C++ side logs straight to the stderr file descriptor."""
    sys.stderr.flush()
    saved = os.dup(2)
    with open(os.devnull, "w") as null:
        os.dup2(null.fileno(), 2)
        try:
            yield
        finally:
            os.dup2(saved, 2)
            os.close(saved)


def find_features(image_path):
    """Return {feature name: (x, y)} as fractions of the image, or None if no face.
    Features outside the frame (a cropped chin, say) are clamped to its edge."""
    model = _model()
    with _quiet_stderr():
        lm = _detect(image_path, model)
    if lm is None:
        return None
    clamp = lambda v: min(1.0, max(0.0, v))
    return {
        name: (clamp(sum(lm[i].x for i in ids) / len(ids)), clamp(sum(lm[i].y for i in ids) / len(ids)))
        for name, ids in FEATURES.items()
    }


# MediaPipe's face outline, clockwise from the top of the forehead.
FACE_OVAL = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378,
             400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21,
             54, 103, 67, 109]


def face_outline(image_path):
    """The face outline as [(x, y), ...] fractions of the image, or None if no face.
    It runs from hairline to chin; hair and ears are outside it."""
    model = _model()
    with _quiet_stderr():
        lm = _detect(image_path, model)
    if lm is None:
        return None
    return [(lm[i].x, lm[i].y) for i in FACE_OVAL]


def _detect(image_path, model):
    try:
        import mediapipe as mp
        from mediapipe.tasks.python import BaseOptions, vision
    except ImportError:
        raise SystemExit("named seeds need mediapipe: python -m pip install mediapipe")

    import numpy as np
    from PIL import Image, ImageOps

    # Load through Pillow so EXIF rotation matches what the solver sees.
    rgb = np.ascontiguousarray(ImageOps.exif_transpose(Image.open(image_path)).convert("RGB"))
    options = vision.FaceLandmarkerOptions(
        base_options=BaseOptions(model_asset_path=model),
        running_mode=vision.RunningMode.IMAGE,
        num_faces=1,
        min_face_detection_confidence=0.25,
        min_face_presence_confidence=0.25,
    )
    with vision.FaceLandmarker.create_from_options(options) as landmarker:
        result = landmarker.detect(mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb))
    return result.face_landmarks[0] if result.face_landmarks else None
