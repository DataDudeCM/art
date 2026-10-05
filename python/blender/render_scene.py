'''
Create a 3D scene in Blender with a spiral of cubes, a sphere, a ground plane, lighting, and a camera. The scene is saved as a .blend file, rendered to an image, and exported to a JSON file containing scene data.
run in the background and output blend, image and json files to the specified output directory.

to run: 
"C:\Program Files\Blender Foundation\Blender 5.2\blender.exe" --background --python render_scene.py
'''
import bpy
import math
import json
import os
from mathutils import Vector

# --------------------------------------------------
# CONFIG
# --------------------------------------------------
OUTPUT_DIR = r"C:\Users\ca0ma\Desktop\blender_test"
BLEND_FILE = os.path.join(OUTPUT_DIR, "generated_scene.blend")
RENDER_FILE = os.path.join(OUTPUT_DIR, "generated_render.png")
JSON_FILE = os.path.join(OUTPUT_DIR, "scene_data.json")

# --------------------------------------------------
# SETUP OUTPUT DIRECTORY
# --------------------------------------------------
os.makedirs(OUTPUT_DIR, exist_ok=True)

# --------------------------------------------------
# CLEAR DEFAULT SCENE
# --------------------------------------------------
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

# Also remove orphan data blocks if desired
for block in bpy.data.meshes:
    if block.users == 0:
        bpy.data.meshes.remove(block)
for block in bpy.data.materials:
    if block.users == 0:
        bpy.data.materials.remove(block)
for block in bpy.data.cameras:
    if block.users == 0:
        bpy.data.cameras.remove(block)
for block in bpy.data.lights:
    if block.users == 0:
        bpy.data.lights.remove(block)

# --------------------------------------------------
# CREATE ABSTRACT OBJECT GROUP
# --------------------------------------------------
created_objects = []

for i in range(12):
    angle = i * 0.6
    radius = 0.7 + i * 0.22
    x = math.cos(angle) * radius
    y = math.sin(angle) * radius
    z = i * 0.22

    bpy.ops.mesh.primitive_cube_add(location=(x, y, z))
    obj = bpy.context.object
    obj.name = f"SpiralCube_{i:02d}"

    obj.scale = (
        0.35 + i * 0.02,
        0.28 + (i % 3) * 0.03,
        0.30 + i * 0.015
    )

    obj.rotation_euler = (
        angle * 0.25,
        angle * 0.15,
        angle
    )

    created_objects.append(obj)

# Add a sphere near the center for variation
bpy.ops.mesh.primitive_uv_sphere_add(location=(0, 0, 1.2), radius=0.55)
sphere = bpy.context.object
sphere.name = "CenterSphere"
created_objects.append(sphere)

# Add a ground plane
bpy.ops.mesh.primitive_plane_add(size=20, location=(0, 0, -0.6))
ground = bpy.context.object
ground.name = "Ground"

# --------------------------------------------------
# MATERIALS
# --------------------------------------------------
def make_material(name, base_color, roughness=0.45, metallic=0.0):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = base_color
        bsdf.inputs["Roughness"].default_value = roughness
        bsdf.inputs["Metallic"].default_value = metallic
    return mat

mat_cube = make_material(
    "CubeMaterial",
    (0.18, 0.45, 0.75, 1.0),
    roughness=0.35,
    metallic=0.1
)

mat_sphere = make_material(
    "SphereMaterial",
    (0.85, 0.35, 0.22, 1.0),
    roughness=0.25,
    metallic=0.0
)

mat_ground = make_material(
    "GroundMaterial",
    (0.12, 0.12, 0.12, 1.0),
    roughness=0.85,
    metallic=0.0
)

for obj in created_objects:
    if obj.name.startswith("SpiralCube_"):
        if obj.data.materials:
            obj.data.materials[0] = mat_cube
        else:
            obj.data.materials.append(mat_cube)

if sphere.data.materials:
    sphere.data.materials[0] = mat_sphere
else:
    sphere.data.materials.append(mat_sphere)

if ground.data.materials:
    ground.data.materials[0] = mat_ground
else:
    ground.data.materials.append(mat_ground)

# --------------------------------------------------
# LIGHTING
# --------------------------------------------------
bpy.ops.object.light_add(type='SUN', location=(6, -6, 10))
sun = bpy.context.object
sun.name = "SunLight"
sun.data.energy = 2.5

bpy.ops.object.light_add(type='AREA', location=(4, 4, 6))
area = bpy.context.object
area.name = "AreaLight"
area.data.energy = 2500
area.data.shape = 'RECTANGLE'
area.data.size = 5
area.data.size_y = 5

# Aim area light roughly toward the center
direction = Vector((0, 0, 1.5)) - area.location
area.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()

# --------------------------------------------------
# CAMERA
# --------------------------------------------------
bpy.ops.object.camera_add(location=(8, -8, 5.5))
camera = bpy.context.object
camera.name = "MainCamera"
bpy.context.scene.camera = camera

target = Vector((0, 0, 1.5))
direction = target - camera.location
camera.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()

# --------------------------------------------------
# RENDER SETTINGS
# --------------------------------------------------
scene = bpy.context.scene
scene.render.engine = 'CYCLES'   # You can change to 'BLENDER_EEVEE' if preferred
scene.cycles.samples = 64

scene.render.resolution_x = 1024
scene.render.resolution_y = 1024
scene.render.resolution_percentage = 100

scene.render.image_settings.file_format = 'PNG'
scene.render.filepath = RENDER_FILE

# Optional transparent background:
# scene.render.film_transparent = True

# --------------------------------------------------
# SAVE .BLEND FILE
# --------------------------------------------------
bpy.ops.wm.save_as_mainfile(filepath=BLEND_FILE)

# --------------------------------------------------
# RENDER IMAGE
# --------------------------------------------------
bpy.ops.render.render(write_still=True)

# --------------------------------------------------
# EXPORT SCENE DATA TO JSON
# --------------------------------------------------
scene_data = {
    "blend_file": BLEND_FILE,
    "render_file": RENDER_FILE,
    "objects": []
}

for obj in bpy.data.objects:
    obj_info = {
        "name": obj.name,
        "type": obj.type,
        "location": [round(v, 4) for v in obj.location],
        "rotation_euler": [round(v, 4) for v in obj.rotation_euler],
        "scale": [round(v, 4) for v in obj.scale],
    }

    if obj.type == 'MESH' and obj.data:
        obj_info["vertex_count"] = len(obj.data.vertices)
        obj_info["polygon_count"] = len(obj.data.polygons)
        obj_info["materials"] = [mat.name for mat in obj.data.materials if mat]

    if obj.type == 'LIGHT':
        obj_info["light_type"] = obj.data.type
        obj_info["energy"] = obj.data.energy

    if obj.type == 'CAMERA':
        obj_info["lens"] = obj.data.lens

    scene_data["objects"].append(obj_info)

with open(JSON_FILE, "w", encoding="utf-8") as f:
    json.dump(scene_data, f, indent=2)

print("Done.")
print(f"Saved blend file: {BLEND_FILE}")
print(f"Saved render:     {RENDER_FILE}")
print(f"Saved scene JSON: {JSON_FILE}")