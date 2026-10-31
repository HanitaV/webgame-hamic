"""Import the campus GLB, place cameras, save a .blend, and render one still.

Run from the kit root, only if Blender is installed:

    blender --background --python scripts/blender_scene.py

glTF is Y-up. Blender's importer turns that into Z-up, so a layout point
(x, y, z) becomes Blender (x, -z, y). Cameras in this file start from the
same data/campus.layout.json bookmarks and are converted here. Do not copy
Three.js camera numbers straight into Blender.

The flythrough is a 12 second camera animation inside the .blend. This script
renders one still, not an MP4. If Blender is absent, skip this file; the web
demo does not need it.
"""
import json
import math
from pathlib import Path

import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output"
OUT.mkdir(exist_ok=True)
MODEL = ROOT / "assets/models/campus_blockout.glb"
LAYOUT = json.loads((ROOT / "data/campus.layout.json").read_text(encoding="utf-8"))

if not MODEL.is_file():
    raise FileNotFoundError("Run python scripts/build_blockout.py first")


def to_blender(position):
    x, y, z = position
    return Vector((x, -z, y))


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)


def aim(camera, target):
    direction = to_blender(target) - camera.location
    camera.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


def add_camera(name, position, target, lens):
    bpy.ops.object.camera_add(location=to_blender(position))
    camera = bpy.context.object
    camera.name = name
    camera.data.lens = lens
    camera.data.clip_end = 2000
    aim(camera, target)
    return camera


clear_scene()
bpy.ops.import_scene.gltf(filepath=str(MODEL))

scene = bpy.context.scene
world = scene.world or bpy.data.worlds.new("World")
scene.world = world
world.use_nodes = True
background = world.node_tree.nodes.get("Background")
if background:
    background.inputs[0].default_value = (0.84, 0.90, 0.94, 1)
    background.inputs[1].default_value = 1.0

for engine in ("BLENDER_EEVEE_NEXT", "BLENDER_EEVEE", "CYCLES"):
    try:
        scene.render.engine = engine
        break
    except TypeError:
        continue
if scene.render.engine == "CYCLES":
    scene.cycles.samples = 24
scene.render.resolution_x = 1280
scene.render.resolution_y = 720
scene.render.resolution_percentage = 100
scene.render.fps = 24

bpy.ops.object.light_add(type="SUN", location=(80, -40, 120))
sun = bpy.context.object
sun.name = "SUN_soft"
sun.data.energy = 3
sun.rotation_euler = (math.radians(48), math.radians(8), math.radians(-28))

bookmarks = {item["id"]: item for item in LAYOUT["camera_bookmarks"]}
overview = add_camera("CAM_overview", bookmarks["overview"]["position"], bookmarks["overview"]["target"], 28)
add_camera("CAM_ussh_gate", bookmarks["ussh"]["position"], bookmarks["ussh"]["target"], 32)
add_camera("CAM_hus_court", bookmarks["hus"]["position"], bookmarks["hus"]["target"], 32)

points = LAYOUT["gameplay"]["cinematic"]["points"]
fly = add_camera("CAM_flythrough", points[0]["position"], points[0]["look"], 32)
scene.frame_start = 1
scene.frame_end = 12 * 24
for index, point in enumerate(points):
    frame = 1 + round(index / (len(points) - 1) * (scene.frame_end - 1))
    scene.frame_set(frame)
    fly.location = to_blender(point["position"])
    aim(fly, point["look"])
    fly.keyframe_insert(data_path="location", frame=frame)
    fly.keyframe_insert(data_path="rotation_euler", frame=frame)
if fly.animation_data and fly.animation_data.action:
    for curve in fly.animation_data.action.fcurves:
        for key in curve.keyframe_points:
            key.interpolation = "BEZIER"

scene.camera = overview
scene.frame_set(1)
still = OUT / "overview_blender.png"
blend = OUT / "campus_blockout.blend"
scene.render.filepath = str(still)
bpy.ops.wm.save_as_mainfile(filepath=str(blend))
bpy.ops.render.render(write_still=True)
print("Saved", blend)
print("Rendered still", still)
print("Cameras: CAM_overview, CAM_ussh_gate, CAM_hus_court, CAM_flythrough (12s, not exported as video)")
