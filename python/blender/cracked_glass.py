"""Cracked glass: turn a crack image into a pane of cracked glass.

The crack image is white cracks on black (e.g. a PNG saved from the
fracture or eclipse sketches). The script builds a new scene, so it
never touches anything else in the .blend file:

  - a thin glass pane whose material uses the image as a crack mask:
    cracks get a small surface break (bump) and turn frosty and
    reflective, the way real cracks catch light
  - a background behind the glass, so you can see it bend through
    the cracks (a procedural glow, or any image you choose)
  - a grazing key light so the cracks glint, a camera at a slight angle

In Blender: open the Scripting tab, open this file, set CRACK_IMAGE
below, and press Run Script. Then render with F12.

Headless (renders straight to a file):

    blender --background --python cracked_glass.py -- --image cracks.png --out render.png

Tested with Blender 5.2.
"""

import argparse
import math
import sys

import bpy

# ── Settings ─────────────────────────────────────────────────────────────────
# Used when running inside Blender; command-line options override them.

CRACK_IMAGE = r""  # full path to a white-on-black crack PNG
BACKGROUND_IMAGE = r""  # optional: an image to see through the glass

PANE_WIDTH = 1.0  # metres; height follows the crack image's aspect ratio
PANE_THICKNESS = 0.006
BUMP_STRENGTH = 1.0  # how deep the cracks look
CRACK_FROST = 0.5  # 0 = cracks only bend light, 1 = fully frosted lines
CAMERA_ANGLE = 18  # degrees off-axis; 0 looks straight at the pane

RESOLUTION = 1600
SAMPLES = 128

# ─────────────────────────────────────────────────────────────────────────────


def main():
    args = parse_args()
    image_path = args.image or CRACK_IMAGE
    if not image_path:
        raise SystemExit("Set CRACK_IMAGE at the top of the script, or pass --image.")

    crack = bpy.data.images.load(image_path, check_existing=True)
    crack.colorspace_settings.name = "Non-Color"
    width, height = crack.size
    pane_height = PANE_WIDTH * height / width

    scene = bpy.data.scenes.new("Cracked Glass")
    if bpy.context.window:
        bpy.context.window.scene = scene

    pane = add_object(scene, "Glass Pane", plane_mesh("Glass Pane", PANE_WIDTH, pane_height))
    pane.rotation_euler = (math.radians(90), 0, 0)  # stand it up, facing -Y
    solidify = pane.modifiers.new("Thickness", "SOLIDIFY")
    solidify.thickness = PANE_THICKNESS
    solidify.offset = 0
    pane.data.materials.append(glass_material(crack))

    background_image = args.background or BACKGROUND_IMAGE
    size = max(PANE_WIDTH, pane_height) * 3
    backdrop = add_object(scene, "Backdrop", plane_mesh("Backdrop", size, size))
    backdrop.rotation_euler = (math.radians(90), 0, 0)
    backdrop.location = (0, 0.5, 0)
    backdrop.data.materials.append(backdrop_material(background_image))

    target = bpy.data.objects.new("Look Target", None)
    scene.collection.objects.link(target)

    angle = math.radians(CAMERA_ANGLE)
    distance = 2.4 * max(PANE_WIDTH, pane_height)
    camera = add_object(scene, "Camera", bpy.data.cameras.new("Camera"))
    camera.location = (distance * math.sin(angle), -distance * math.cos(angle), 0.08)
    camera.data.lens = 85
    look_at(camera, target)
    scene.camera = camera

    key = add_object(scene, "Key Light", bpy.data.lights.new("Key Light", "AREA"))
    key.data.energy = 250
    key.data.size = 0.6
    key.location = (-1.6, -0.5, 0.9)  # low and to the side, so cracks glint
    look_at(key, target)

    fill = add_object(scene, "Fill Light", bpy.data.lights.new("Fill Light", "AREA"))
    fill.data.energy = 40
    fill.data.size = 2.0
    fill.location = (1.5, -1.5, -0.3)
    look_at(fill, target)

    world = bpy.data.worlds.new("Cracked Glass World")
    world.color = (0.02, 0.02, 0.025)
    scene.world = world

    render = scene.render
    render.engine = "CYCLES"
    render.resolution_x = args.resolution or RESOLUTION
    render.resolution_y = round(render.resolution_x * height / width)
    scene.cycles.samples = args.samples or SAMPLES
    scene.cycles.use_denoising = True

    if args.out:
        render.filepath = args.out
        bpy.ops.render.render(write_still=True, scene=scene.name)
        print(f"Rendered {args.out}")
    else:
        print('Scene "Cracked Glass" is ready. Press F12 to render.')


def parse_args():
    """Options after '--' on the Blender command line."""
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    parser = argparse.ArgumentParser(prog="cracked_glass.py")
    parser.add_argument("--image", help="white-on-black crack image")
    parser.add_argument("--background", help="image to show through the glass")
    parser.add_argument("--out", help="render to this file and exit")
    parser.add_argument("--resolution", type=int, help="render width in pixels")
    parser.add_argument("--samples", type=int, help="Cycles samples (lower = faster)")
    return parser.parse_args(argv)


# ── Scene helpers ────────────────────────────────────────────────────────────

def plane_mesh(name, width, height):
    """A flat rectangle in the XY plane with UVs covering the whole image."""
    mesh = bpy.data.meshes.new(name)
    w, h = width / 2, height / 2
    mesh.from_pydata([(-w, -h, 0), (w, -h, 0), (w, h, 0), (-w, h, 0)], [], [(0, 1, 2, 3)])
    uv = mesh.uv_layers.new(name="UVMap")
    for loop in mesh.loops:
        x, y, _ = mesh.vertices[loop.vertex_index].co
        uv.data[loop.index].uv = (x / width + 0.5, y / height + 0.5)
    return mesh


def add_object(scene, name, data):
    obj = bpy.data.objects.new(name, data)
    scene.collection.objects.link(obj)
    return obj


def look_at(obj, target):
    track = obj.constraints.new("TRACK_TO")
    track.target = target
    track.track_axis = "TRACK_NEGATIVE_Z"
    track.up_axis = "UP_Y"


# ── Materials ────────────────────────────────────────────────────────────────

def glass_material(crack_image):
    mat = bpy.data.materials.new("Cracked Glass")
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    nodes.clear()

    coords = nodes.new("ShaderNodeTexCoord")
    mask = nodes.new("ShaderNodeTexImage")
    mask.image = crack_image
    mask.interpolation = "Cubic"
    links.new(coords.outputs["UV"], mask.inputs["Vector"])

    # Cracks are grooves: invert the bump so white sinks into the glass.
    bump = nodes.new("ShaderNodeBump")
    bump.invert = True
    bump.inputs["Strength"].default_value = BUMP_STRENGTH
    bump.inputs["Distance"].default_value = 0.002
    links.new(mask.outputs["Color"], bump.inputs["Height"])

    clear = principled(nodes, color=(1, 1, 1), roughness=0.02, transmission=1.0)
    frosted = principled(nodes, color=(0.92, 0.96, 1.0), roughness=0.15, transmission=0.8)
    for shader in (clear, frosted):
        links.new(bump.outputs["Normal"], shader.inputs["Normal"])

    frost = nodes.new("ShaderNodeMath")
    frost.operation = "MULTIPLY"
    frost.inputs[1].default_value = CRACK_FROST
    links.new(mask.outputs["Color"], frost.inputs[0])

    mix = nodes.new("ShaderNodeMixShader")
    links.new(frost.outputs["Value"], mix.inputs["Fac"])
    links.new(clear.outputs["BSDF"], mix.inputs[1])
    links.new(frosted.outputs["BSDF"], mix.inputs[2])

    output = nodes.new("ShaderNodeOutputMaterial")
    links.new(mix.outputs["Shader"], output.inputs["Surface"])
    arrange(nodes)
    return mat


def principled(nodes, color, roughness, transmission):
    shader = nodes.new("ShaderNodeBsdfPrincipled")
    shader.inputs["Base Color"].default_value = (*color, 1.0)
    shader.inputs["Roughness"].default_value = roughness
    shader.inputs["IOR"].default_value = 1.5
    shader.inputs["Transmission Weight"].default_value = transmission
    return shader


def backdrop_material(image_path):
    """Something to see through the glass: an image, or a soft procedural glow."""
    mat = bpy.data.materials.new("Backdrop")
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    nodes.clear()

    emission = nodes.new("ShaderNodeEmission")
    emission.inputs["Strength"].default_value = 0.7

    if image_path:
        coords = nodes.new("ShaderNodeTexCoord")
        image = nodes.new("ShaderNodeTexImage")
        image.image = bpy.data.images.load(image_path, check_existing=True)
        links.new(coords.outputs["UV"], image.inputs["Vector"])
        links.new(image.outputs["Color"], emission.inputs["Color"])
    else:
        coords = nodes.new("ShaderNodeTexCoord")
        noise = nodes.new("ShaderNodeTexNoise")
        noise.inputs["Scale"].default_value = 3.0
        noise.inputs["Detail"].default_value = 6.0
        links.new(coords.outputs["Object"], noise.inputs["Vector"])
        ramp = nodes.new("ShaderNodeValToRGB")
        ramp.color_ramp.elements[0].color = (0.01, 0.02, 0.06, 1)  # deep blue
        ramp.color_ramp.elements[1].color = (0.9, 0.45, 0.12, 1)  # ember orange
        ramp.color_ramp.elements[0].position = 0.5
        ramp.color_ramp.elements[1].position = 0.85
        links.new(noise.outputs["Fac"], ramp.inputs["Fac"])
        links.new(ramp.outputs["Color"], emission.inputs["Color"])

    output = nodes.new("ShaderNodeOutputMaterial")
    links.new(emission.outputs["Emission"], output.inputs["Surface"])
    arrange(nodes)
    return mat


def arrange(nodes):
    """Spread nodes left to right so the graph is readable in the editor."""
    for i, node in enumerate(nodes):
        node.location = (i * 260 - 900, (i % 2) * -220)


if __name__ == "__main__":
    main()
