''' Generate a spiral of cubes with a camera and ground plane 
using blender. to run this script, open blender, go to the scripting tab, create a new text file, paste this code in and click run script.
to run from the command line, use the following command:
blender --background --python blender_test_1.py'''

import bpy
import math

# Clear the scene
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

# Create a ground plane
bpy.ops.mesh.primitive_plane_add(size=10, enter_editmode=False, location=(0, 0, 0))
ground_plane = bpy.context.object
ground_plane.name = "GroundPlane"

# Create a camera
bpy.ops.object.camera_add(location=(0, 0, 10), rotation=(math.pi / 4, 0, math.pi / 4))
camera = bpy.context.object
camera.name = "Camera"

# Create 12 cubes in a spiral
num_cubes = 12
radius = 5
for i in range(num_cubes):
    angle = 2 * math.pi * i / num_cubes
    x = radius * math.cos(angle)
    y = radius * math.sin(angle)
    z = 2 * i / num_cubes

    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, y, z))
    cube = bpy.context.object
    cube.name = f"Cube{i+1}"

    # Vary scale and rotation
    cube.scale = (0.5 + 0.5 * math.sin(angle), 0.5 + 0.5 * math.cos(angle), 1)
    cube.rotation_euler = (math.pi / 4, angle, 0)

# Select all cubes
cube_objs = [obj for obj in bpy.context.scene.objects if obj.name.startswith("Cube")]
cube_objs.extend([ground_plane, camera])
bpy.context.view_layer.objects.active = cube_objs[0]
for obj in cube_objs[1:]:
    obj.select_set(True)

# Deselect the ground plane and camera
ground_plane.select_set(False)
camera.select_set(False)

bpy.ops.mesh.primitive_uv_sphere_add(location=(0, 0, 0))

bpy.ops.wm.save_as_mainfile(
    filepath=r"C:\Users\Chris\Desktop\generated_object.blend"
)