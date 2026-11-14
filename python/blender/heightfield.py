"""Heightfield: turn any image into a lit relief.

Brightness becomes height (or darkness, with --invert), so a WFC render from
python/wfc/ stands up off the surface: white pipes on black become raised
pipework, chips become slabs. The script builds its own scene, so it never
touches anything else in the .blend file:

  - a finely divided plate, pushed up by the softened height map
  - a material: "plaster" (one matte colour, so only light and shadow show
    the form) or "color" (the image's own colours)
  - a low, raking key light so every edge casts a shadow, and a camera at a
    slight angle

In Blender: open the Scripting tab, open this file, set IMAGE below, and press
Run Script. Then render with F12.

Headless (renders straight to a file):

    blender --background --python heightfield.py -- --image board.png --out relief.png
    blender --background --python heightfield.py -- --image board.png --invert --look color

Tested with Blender 5.2.
"""

import argparse
import math
import sys

import bpy
import bmesh
import numpy as np

# ── Settings ─────────────────────────────────────────────────────────────────
# Used when running inside Blender; command-line options override them.

IMAGE = r""          # full path to the image (colour and, by default, height)
HEIGHT_IMAGE = r""   # optional separate height map; empty = use IMAGE's brightness
INVERT = False       # True: dark is high (e.g. circuit chips as raised slabs)
DEPTH = 0.02         # relief height in metres; the plate is 1 m wide
SOFTEN = 1.5         # blur of the height map, in pixels of the mesh; 0 = hard edges
LOOK = "plaster"     # "plaster" or "color"
MESH = 900           # vertices along the long side (detail vs. memory)
CAMERA_ANGLE = 28    # degrees from straight down
LIGHT_ANGLE = 14     # degrees above the surface for the key light; low = long shadows
KEY_ENERGY = 260     # watts; raise for a brighter render, lower for deeper contrast
FILL_ENERGY = 8      # soft light that keeps shadows from going fully black

RESOLUTION = 1600
SAMPLES = 96

PLATE_WIDTH = 1.0

# ─────────────────────────────────────────────────────────────────────────────


def main():
    args = parse_args()
    image_path = args.image or IMAGE
    if not image_path:
        raise SystemExit("Set IMAGE at the top of the script, or pass --image.")
    invert = args.invert or INVERT
    depth = args.depth if args.depth is not None else DEPTH
    soften = args.soften if args.soften is not None else SOFTEN
    look = args.look or LOOK
    mesh_res = args.mesh or MESH

    colour = load_image(image_path)
    width, height = colour.size
    plate_h = PLATE_WIDTH * height / width

    old = bpy.data.scenes.get("Heightfield")
    scene = bpy.data.scenes.new("Heightfield (building)")
    if bpy.context.window:
        bpy.context.window.scene = scene
    if old:
        bpy.data.scenes.remove(old)
    scene.name = "Heightfield"

    # Grid size follows the image's shape.
    if width >= height:
        nx, ny = mesh_res, max(2, round(mesh_res * height / width))
    else:
        nx, ny = max(2, round(mesh_res * width / height)), mesh_res

    heights = height_grid(load_image(args.height or HEIGHT_IMAGE or image_path), nx, ny, invert, soften)
    plate = add_object(scene, "Relief", relief_mesh("Relief", PLATE_WIDTH, plate_h, heights * depth))
    plate.data.materials.append(relief_material(colour, look))
    for poly in plate.data.polygons:
        poly.use_smooth = True

    target = bpy.data.objects.new("Look Target", None)
    scene.collection.objects.link(target)

    angle = math.radians(CAMERA_ANGLE)
    distance = 2.6 * max(PLATE_WIDTH, plate_h)
    camera = add_object(scene, "Camera", bpy.data.cameras.new("Camera"))
    camera.location = (0, -distance * math.sin(angle), distance * math.cos(angle))
    camera.data.lens = 85
    look_at(camera, target)
    scene.camera = camera

    la = math.radians(LIGHT_ANGLE)
    key = add_object(scene, "Key Light", bpy.data.lights.new("Key Light", "AREA"))
    key.data.energy = args.key or KEY_ENERGY
    key.data.size = 0.5
    key.location = (-2.2 * math.cos(la), 0.6, 2.2 * math.sin(la))  # low, from the upper left
    look_at(key, target)

    fill = add_object(scene, "Fill Light", bpy.data.lights.new("Fill Light", "AREA"))
    fill.data.energy = FILL_ENERGY
    fill.data.size = 3.0
    fill.location = (1.5, -1.5, 2.0)
    look_at(fill, target)

    world = bpy.data.worlds.new("Heightfield World")
    world.color = (0.01, 0.01, 0.012)
    scene.world = world

    render = scene.render
    render.engine = "CYCLES"
    render.resolution_x = args.resolution or RESOLUTION
    render.resolution_y = round(render.resolution_x * plate_h / PLATE_WIDTH * math.cos(angle) ** 0.3)
    scene.cycles.samples = args.samples or SAMPLES
    scene.cycles.use_denoising = True

    if args.out:
        render.filepath = args.out
        bpy.ops.render.render(write_still=True, scene=scene.name)
        print(f"Rendered {args.out}")
    else:
        print('Scene "Heightfield" is ready. Press F12 to render.')


def parse_args():
    """Options after '--' on the Blender command line."""
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    p = argparse.ArgumentParser(prog="heightfield.py")
    p.add_argument("--image", help="the image (colour, and height unless --height is given)")
    p.add_argument("--height", help="separate height map")
    p.add_argument("--invert", action="store_true", help="dark is high")
    p.add_argument("--depth", type=float, help=f"relief height in metres (plate is 1 m wide; default {DEPTH})")
    p.add_argument("--soften", type=float, help=f"height blur in mesh pixels (default {SOFTEN})")
    p.add_argument("--look", choices=["plaster", "color"], help="material")
    p.add_argument("--mesh", type=int, help=f"vertices along the long side (default {MESH})")
    p.add_argument("--key", type=float, help=f"key light watts (default {KEY_ENERGY})")
    p.add_argument("--out", help="render to this file and exit")
    p.add_argument("--resolution", type=int, help="render width in pixels")
    p.add_argument("--samples", type=int, help="Cycles samples (lower = faster)")
    return p.parse_args(argv)


# ── Height map ───────────────────────────────────────────────────────────────

def height_grid(image, nx, ny, invert, soften):
    """The image's brightness resampled to (ny, nx), 0-1, row 0 at the bottom."""
    w, h = image.size
    px = np.empty(w * h * 4, dtype=np.float32)
    image.pixels.foreach_get(px)  # Blender stores rows bottom-up, RGBA floats
    px = px.reshape(h, w, 4)
    lum = 0.2126 * px[..., 0] + 0.7152 * px[..., 1] + 0.0722 * px[..., 2]
    # Average the pixels that fall in each grid cell.
    ys = (np.arange(ny + 1) * h / ny).astype(int)
    xs = (np.arange(nx + 1) * w / nx).astype(int)
    row = np.add.reduceat(lum, ys[:-1], axis=0) / np.diff(ys)[:, None]
    grid = np.add.reduceat(row, xs[:-1], axis=1) / np.diff(xs)[None, :]
    if invert:
        grid = 1.0 - grid
    if soften > 0:
        grid = blur(grid, soften)
    lo, hi = grid.min(), grid.max()
    return (grid - lo) / (hi - lo) if hi > lo else grid * 0


def blur(a, sigma):
    """Separable Gaussian blur (numpy only)."""
    r = max(1, int(3 * sigma))
    k = np.exp(-0.5 * (np.arange(-r, r + 1) / sigma) ** 2)
    k /= k.sum()
    pad = np.pad(a, r, mode="edge")
    a = np.apply_along_axis(lambda m: np.convolve(m, k, mode="valid"), 0, pad)
    return np.apply_along_axis(lambda m: np.convolve(m, k, mode="valid"), 1, a)


def relief_mesh(name, width, height, z):
    """A grid of vertices raised by z (shape ny, nx), with UVs over the whole image."""
    ny, nx = z.shape
    xs = np.linspace(-width / 2, width / 2, nx)
    ys = np.linspace(-height / 2, height / 2, ny)
    gx, gy = np.meshgrid(xs, ys)
    verts = np.column_stack([gx.ravel(), gy.ravel(), z.ravel()])
    idx = np.arange(nx * ny).reshape(ny, nx)
    quads = np.column_stack([idx[:-1, :-1].ravel(), idx[:-1, 1:].ravel(),
                             idx[1:, 1:].ravel(), idx[1:, :-1].ravel()])
    mesh = bpy.data.meshes.new(name)
    mesh.vertices.add(len(verts))
    mesh.vertices.foreach_set("co", verts.astype(np.float32).ravel())
    mesh.loops.add(quads.size)
    mesh.loops.foreach_set("vertex_index", quads.astype(np.int32).ravel())
    mesh.polygons.add(len(quads))
    mesh.polygons.foreach_set("loop_start", np.arange(0, quads.size, 4, dtype=np.int32))
    mesh.update()
    uv = mesh.uv_layers.new(name="UVMap")
    uvs = np.column_stack([(gx.ravel() / width + 0.5), (gy.ravel() / height + 0.5)])
    uv.data.foreach_set("uv", uvs[quads.ravel()].astype(np.float32).ravel())
    return mesh


# ── Scene helpers ────────────────────────────────────────────────────────────

def load_image(path):
    """Load an image, re-reading it from disk if Blender already has it."""
    image = bpy.data.images.load(path, check_existing=True)
    image.reload()
    return image


def add_object(scene, name, data):
    obj = bpy.data.objects.new(name, data)
    scene.collection.objects.link(obj)
    return obj


def look_at(obj, target):
    track = obj.constraints.new("TRACK_TO")
    track.target = target
    track.track_axis = "TRACK_NEGATIVE_Z"
    track.up_axis = "UP_Y"


def relief_material(image, look):
    mat = bpy.data.materials.new("Relief")
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    nodes.clear()
    shader = nodes.new("ShaderNodeBsdfPrincipled")
    shader.inputs["Roughness"].default_value = 0.85
    if look == "color":
        tex = nodes.new("ShaderNodeTexImage")
        tex.image = image
        links.new(tex.outputs["Color"], shader.inputs["Base Color"])
        shader.inputs["Roughness"].default_value = 0.55
    else:
        shader.inputs["Base Color"].default_value = (0.55, 0.53, 0.50, 1)  # warm plaster
    output = nodes.new("ShaderNodeOutputMaterial")
    links.new(shader.outputs["BSDF"], output.inputs["Surface"])
    for i, node in enumerate(nodes):
        node.location = (i * 300 - 600, 0)
    return mat


if __name__ == "__main__":
    main()
