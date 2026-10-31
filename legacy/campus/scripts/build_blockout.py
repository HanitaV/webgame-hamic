#!/usr/bin/env python3
"""Build an approximate campus and reusable GLB primitives, using Python stdlib only.

The only layout source is data/campus.layout.json. Positions are game units, not meters.

HUS buildings get real floors (from the HUS directory board), rooms generated along each
corridor, stair halls and links between buildings. USSH buildings are closed blocks.
Outputs: assets/models/*.glb, data/collision.json, data/interiors.json, data/build_report.json.
"""
import argparse
import hashlib
import json
import math
import struct
from collections import deque
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

# 5x7 glyphs. Block letters stay geometry-only so the GLB needs no font file.
FONT = {
    "A": ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
    "B": ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
    "C": ["01111", "10000", "10000", "10000", "10000", "10000", "01111"],
    "E": ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
    "G": ["01111", "10000", "10000", "10111", "10001", "10001", "01111"],
    "H": ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
    "I": ["11111", "00100", "00100", "00100", "00100", "00100", "11111"],
    "N": ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
    "O": ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
    "S": ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
    "T": ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
    "U": ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
    "W": ["10001", "10001", "10001", "10101", "10101", "11011", "10001"],
    "1": ["01100", "00100", "00100", "00100", "00100", "00100", "01110"],
    "2": ["01110", "10001", "00001", "00010", "00100", "01000", "11111"],
    "3": ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
    "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
    "5": ["11111", "10000", "10000", "11110", "00001", "00001", "11110"],
    " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
}

# Faces as quads over the unit-box corners. Indexed: 4 vertices and 6 indices per face.
_CORNERS = [(-.5, -.5, -.5), (.5, -.5, -.5), (.5, .5, -.5), (-.5, .5, -.5),
            (-.5, -.5, .5), (.5, -.5, .5), (.5, .5, .5), (-.5, .5, .5)]
_FACE = {"-z": (0, 3, 2, 1), "+z": (4, 5, 6, 7), "-x": (0, 4, 7, 3), "+x": (1, 2, 6, 5),
         "-y": (0, 1, 5, 4), "+y": (3, 7, 6, 2)}
SHAPES = {
    "box": ["-z", "+z", "-x", "+x", "-y", "+y"],
    "box5": ["-z", "+z", "-x", "+x", "+y"],      # no bottom: walls, furniture
    "panel_z": ["-z", "+z"],                      # windows on a z face
    "panel_x": ["-x", "+x"],
}


def _shape_geometry(shape):
    if shape in SHAPES:
        polys = [[_CORNERS[i] for i in _FACE[f]] for f in SHAPES[shape]]
    elif shape == "roof":
        v = [(-.5, 0, -.5), (.5, 0, -.5), (-.5, 0, .5), (.5, 0, .5), (-.5, 1, 0), (.5, 1, 0)]
        polys = [[v[i] for i in f] for f in [(0, 4, 5, 1), (2, 3, 5, 4), (0, 2, 4), (1, 5, 3), (0, 1, 3, 2)]]
    elif shape == "octa":
        v = [(0, 1, 0), (0, -1, 0), (-1, 0, 0), (1, 0, 0), (0, 0, -1), (0, 0, 1)]
        polys = [[v[i] for i in f] for f in [(0, 4, 2), (0, 3, 4), (0, 5, 3), (0, 2, 5),
                                             (1, 2, 4), (1, 4, 3), (1, 3, 5), (1, 5, 2)]]
    else:
        raise ValueError(shape)
    positions, normals, indices = [], [], []
    for poly in polys:
        a, b, c = poly[0], poly[1], poly[2]
        u = [b[i] - a[i] for i in range(3)]
        w = [c[i] - a[i] for i in range(3)]
        n = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]]
        length = math.sqrt(sum(x * x for x in n)) or 1
        n = [x / length for x in n]
        start = len(positions) // 3
        for p in poly:
            positions.extend(p)
            normals.extend(n)
        for j in range(1, len(poly) - 1):
            indices.extend((start, start + j, start + j + 1))
    return positions, normals, indices


_GEOM = {}


def geometry(shape):
    if shape not in _GEOM:
        _GEOM[shape] = _shape_geometry(shape)
    return _GEOM[shape]


class GLB:
    def __init__(self):
        self.doc = {"asset": {"version": "2.0", "generator": "USSH HUS approximate blockout kit"},
                    "scene": 0, "scenes": [{"nodes": []}], "nodes": [], "meshes": [],
                    "materials": [], "buffers": [], "bufferViews": [], "accessors": []}
        self.binary = bytearray()
        self.mesh_cache = {}
        self.material_cache = {}
        self.merge_groups = {}

    def accessor(self, values, type_name, component_type, target, bounds=False):
        while len(self.binary) % 4:
            self.binary.append(0)
        offset = len(self.binary)
        fmt = "f" if component_type == 5126 else "H"
        packed = struct.pack("<" + fmt * len(values), *values)
        self.binary.extend(packed)
        if bounds and component_type == 5126:
            values = struct.unpack("<" + fmt * len(values), packed)
        view = len(self.doc["bufferViews"])
        self.doc["bufferViews"].append({"buffer": 0, "byteOffset": offset,
                                        "byteLength": len(self.binary) - offset, "target": target})
        width = {"SCALAR": 1, "VEC3": 3}[type_name]
        acc = {"bufferView": view, "componentType": component_type,
               "count": len(values) // width, "type": type_name}
        if bounds:
            acc["min"] = [min(values[i::width]) for i in range(width)]
            acc["max"] = [max(values[i::width]) for i in range(width)]
        self.doc["accessors"].append(acc)
        return len(self.doc["accessors"]) - 1

    def material(self, color):
        if color not in self.material_cache:
            rgba = [int(color[i:i + 2], 16) / 255 for i in (1, 3, 5)] + [1]
            self.material_cache[color] = len(self.doc["materials"])
            # Rooms are seen from inside and from above, so faces draw both sides.
            # extras.pattern tells the web app which world-space surface shader to use.
            mat = {"name": color, "doubleSided": True,
                   "pbrMetallicRoughness": {"baseColorFactor": rgba, "roughnessFactor": .95,
                                            "metallicFactor": 0}}
            if PATTERNS.get(color):
                mat["extras"] = {"pattern": PATTERNS[color]}
            self.doc["materials"].append(mat)
        return self.material_cache[color]

    def mesh(self, shape, color):
        key = (shape, color)
        if key in self.mesh_cache:
            return self.mesh_cache[key]
        positions, normals, indices = geometry(shape)
        p = self.accessor(positions, "VEC3", 5126, 34962, True)
        n = self.accessor(normals, "VEC3", 5126, 34962)
        idx = self.accessor(indices, "SCALAR", 5123, 34963)
        mesh_index = len(self.doc["meshes"])
        self.doc["meshes"].append({"name": shape + color, "primitives": [{
            "attributes": {"POSITION": p, "NORMAL": n}, "indices": idx,
            "material": self.material(color)}]})
        self.mesh_cache[key] = mesh_index
        return mesh_index

    def add(self, name, position, size, color, shape="box", extras=None, rotation=None, merge=None):
        """merge=(group_name, extras) folds this box into one mesh per (group, colour)."""
        if merge is not None:
            group, meta = merge
            bucket = self.merge_groups.setdefault((group, color), {"meta": meta, "items": []})
            bucket["items"].append((shape, tuple(position), tuple(size), rotation))
            return
        node = {"name": name, "mesh": self.mesh(shape, color),
                "translation": list(position), "scale": list(size)}
        if rotation:
            node["rotation"] = rotation
        if extras:
            node["extras"] = extras
        self.doc["scenes"][0]["nodes"].append(len(self.doc["nodes"]))
        self.doc["nodes"].append(node)

    def _flush_merged(self):
        out = []
        for (group, color), bucket in sorted(self.merge_groups.items()):
            chunks = []
            positions, normals, indices = [], [], []
            for shape, translation, scale, rotation in bucket["items"]:
                gp, gn, gi = geometry(shape)
                base = len(positions) // 3
                if base + len(gp) // 3 > 65000:
                    chunks.append((positions, normals, indices))
                    positions, normals, indices = [], [], []
                    base = 0
                for i in range(0, len(gp), 3):
                    local = [gp[i + j] * scale[j] for j in range(3)]
                    normal = [gn[i + j] / scale[j] for j in range(3)]
                    if rotation:
                        local = quat_mul_vec(rotation, local)
                        normal = quat_mul_vec(rotation, normal)
                    length = math.sqrt(sum(x * x for x in normal)) or 1
                    positions.extend(local[j] + translation[j] for j in range(3))
                    normals.extend(x / length for x in normal)
                indices.extend(base + k for k in gi)
            chunks.append((positions, normals, indices))
            safe = color.lstrip("#")
            for part, (positions, normals, indices) in enumerate(chunks):
                if not positions:
                    continue
                p = self.accessor(positions, "VEC3", 5126, 34962, True)
                n = self.accessor(normals, "VEC3", 5126, 34962)
                idx = self.accessor(indices, "SCALAR", 5123, 34963)
                mesh = len(self.doc["meshes"])
                name = f"{group}__{safe}" + ("" if part == 0 else f"_{part}")
                self.doc["meshes"].append({"name": name, "primitives": [{
                    "attributes": {"POSITION": p, "NORMAL": n}, "indices": idx,
                    "material": self.material(color)}]})
                node = {"name": name, "mesh": mesh}
                if bucket["meta"]:
                    node["extras"] = bucket["meta"]
                out.append(node)
        return out

    def write(self, path):
        nodes = self.doc["nodes"] + self._flush_merged()
        self.doc["nodes"] = nodes
        self.doc["scenes"][0]["nodes"] = list(range(len(nodes)))
        while len(self.binary) % 4:
            self.binary.append(0)
        self.doc["buffers"] = [{"byteLength": len(self.binary)}]
        doc = json.dumps(self.doc, ensure_ascii=False, separators=(",", ":")).encode()
        doc += b" " * ((-len(doc)) % 4)
        binary = bytes(self.binary)
        total = 12 + 8 + len(doc) + 8 + len(binary)
        data = (struct.pack("<4sII", b"glTF", 2, total) + struct.pack("<I4s", len(doc), b"JSON") + doc +
                struct.pack("<I4s", len(binary), b"BIN\0") + binary)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)
        return {"path": str(path.relative_to(ROOT)), "bytes": len(data),
                "nodes": len(self.doc["nodes"]), "sha256": hashlib.sha256(data).hexdigest()}


def quat_mul_vec(q, v):
    x, y, z, w = q
    tx = 2 * (y * v[2] - z * v[1])
    ty = 2 * (z * v[0] - x * v[2])
    tz = 2 * (x * v[1] - y * v[0])
    return [v[0] + w * tx + (y * tz - z * ty),
            v[1] + w * ty + (z * tx - x * tz),
            v[2] + w * tz + (x * ty - y * tx)]


YAW90 = [0, math.sin(math.pi / 4), 0, math.cos(math.pi / 4)]


def lit_window(*coords):
    """About 40% of windows glow at night. Deterministic so rebuilds give the same pattern."""
    h = hashlib.md5(("%.1f|" * len(coords) % tuple(coords)).encode()).digest()[0]
    return h < 102


WINDOW_SPACING = 6.5   # one window per bay; was ~3.2, which read as a grid of holes
WINDOW_FRAME = "#FBF8F1"


def window_unit(ctx, merge, axis, face, out, a, y_bottom, w, h, glass, wall, inner=None):
    """A framed window: light frame, pale glass with one mullion and a transom, and a sill.
    Pale glass (sky reflection) instead of dark holes, so a facade does not read as a field of holes."""
    def slab(a0, a1, y0, y1, d0, d1, color, shape):
        lo, hi = sorted((face + out * d0, face + out * d1))
        if axis == "x":
            ctx.box(merge, a0, y0, lo, a1, y1, hi, color, shape=shape)
        else:
            ctx.box(merge, lo, y0, a0, hi, y1, a1, color, shape=shape)

    fr = 0.24
    panel = "panel_z" if axis == "x" else "panel_x"
    slab(a - w / 2 - fr, a + w / 2 + fr, y_bottom - fr, y_bottom + h + fr, 0.0, 0.05, WINDOW_FRAME, panel)
    slab(a - w / 2, a + w / 2, y_bottom, y_bottom + h, 0.05, 0.1, glass, panel)
    slab(a - 0.09, a + 0.09, y_bottom, y_bottom + h, 0.1, 0.15, WINDOW_FRAME, panel)
    slab(a - w / 2, a + w / 2, y_bottom + h * 0.68, y_bottom + h * 0.68 + 0.14, 0.1, 0.15, WINDOW_FRAME, panel)
    slab(a - w / 2 - fr - 0.12, a + w / 2 + fr + 0.12, y_bottom - fr - 0.14, y_bottom - fr, 0.0, 0.22,
         shade(wall, 0.84), "box5")
    if inner is not None:
        lo, hi = sorted((inner - out * 0.06, inner - out * 0.01))
        if axis == "x":
            ctx.box(merge, a - w / 2, y_bottom, lo, a + w / 2, y_bottom + h, hi, WINDOW_IN, shape=panel)
        else:
            ctx.box(merge, lo, y_bottom, a - w / 2, hi, y_bottom + h, a + w / 2, WINDOW_IN, shape=panel)


def shade(color, factor):
    rgb = [int(color[i:i + 2], 16) for i in (1, 3, 5)]
    return "#" + "".join(f"{max(0, min(255, round(c * factor))):02X}" for c in rgb)


# ---------------------------------------------------------------- small props

def tree(g, name, x, z, size=1):
    g.add(name + "_trunk", (x, 2 * size, z), (.8 * size, 4 * size, .8 * size), "#805A3B")
    g.add(name + "_crown", (x, 5.6 * size, z), (3.3 * size, 3.8 * size, 3.3 * size), "#518756", "octa")


def bench(g, name, x, z, merge=None):
    g.add(name + "_seat", (x, 1, z), (3, .3, 1), "#B48F69", merge=merge)
    g.add(name + "_back", (x, 1.6, z + .45), (3, 1, .18), "#B48F69", merge=merge)
    for i, dx in enumerate((-1, 1)):
        g.add(name + "_leg_" + str(i), (x + dx, .45, z), (.2, .9, .7), "#555B58", merge=merge)


def stamp_text(g, group, text, x, y, z, cell, color, face=1, axis="z", meta=None):
    """face +1 is readable from +axis. face -1 is readable from -axis. axis is 'z' or 'x'."""
    glyphs = [FONT[ch] for ch in text]
    gap = cell * 1.15
    letter_w = 5 * cell
    total = len(glyphs) * letter_w + (len(glyphs) - 1) * gap
    cursor = -total / 2
    depth = 0.12
    merge = (group + "_glyphs", meta or {})
    for glyph in glyphs:
        for row, bits in enumerate(glyph):
            for col, bit in enumerate(bits):
                if bit != "1":
                    continue
                ly = (3 - row) * cell
                lx = cursor + (col + 0.5) * cell
                # Seen from +z the reader's right is +x; seen from +x it is -z. Flip so text never mirrors.
                if (face < 0) != (axis == "x"):
                    lx = -lx
                nudge = face * (depth / 2 + 0.02)
                if axis == "x":
                    pos = (x + nudge, y + ly, z + lx)
                    scale = (depth, cell * 0.92, cell * 0.92)
                else:
                    pos = (x + lx, y + ly, z + nudge)
                    scale = (cell * 0.92, cell * 0.92, depth)
                g.add("glyph", pos, scale, color, merge=merge)
        cursor += letter_w + gap


def gate(g, entry, palette):
    x, z = entry["center_xz"]
    accent = palette[entry["accent"]]
    off = entry.get("pillar_offset", 7)
    sign = entry.get("sign_size", [11.4, 2.6, 0.5])
    sy = entry.get("sign_y", 5.5)
    pillar_h = max(5.2, sy + sign[1] / 2 - 0.2)
    for i, dx in enumerate((-off, off)):
        g.add(entry["id"] + "_pillar_" + str(i), (x + dx, pillar_h / 2, z), (1.3, pillar_h, 1.5), "#E4D1A8",
              extras={"kind": "pillar", "collider": True})
    g.add(entry["id"] + "_sign", (x, sy, z), sign, accent,
          extras={"kind": "sign", "label": entry["label"], "collider": False})
    cell = 0.30 if len(entry["label"]) <= 4 else 0.22
    stamp_text(g, entry["id"] + "_front", entry["label"], x, sy, z + sign[2] / 2, cell, palette["letter"], 1)
    stamp_text(g, entry["id"] + "_back", entry["label"], x, sy, z - sign[2] / 2, cell, palette["letter"], -1)
    return pillar_h


def motorbike(g, name, x, z, merge=None):
    g.add(name + "_body", (x, .8, z), (.55, .6, 1.45), "#8C4E45", merge=merge)
    g.add(name + "_seat", (x, 1.17, z - .15), (.62, .15, .75), "#303B40", merge=merge)
    for i, dz in enumerate((-.58, .58)):
        g.add(name + "_wheel_" + str(i), (x, .35, z + dz), (.2, .65, .48), "#303B40", merge=merge)
    g.add(name + "_handle", (x, 1.4, z + .5), (.9, .1, .12), "#555B58", merge=merge)


# ---------------------------------------------------------------- geometry helpers

def footprint_of(b):
    x, z = b["center_xz"]
    w, d = b["size_xz"]
    return (round(x - w / 2, 4), round(z - d / 2, 4), round(x + w / 2, 4), round(z + d / 2, 4))


def inflate(rect, margin):
    return (rect[0] - margin, rect[1] - margin, rect[2] + margin, rect[3] + margin)


def inside(x, z, rect, pad=0.0):
    return rect[0] - pad <= x <= rect[2] + pad and rect[1] - pad <= z <= rect[3] + pad


def intersect(a, b):
    r = (max(a[0], b[0]), max(a[1], b[1]), min(a[2], b[2]), min(a[3], b[3]))
    return r if r[2] > r[0] + 0.02 and r[3] > r[1] + 0.02 else None


def subtract_rects(rect, blockers):
    pieces = [rect]
    for block in blockers:
        nxt = []
        for piece in pieces:
            ax0, az0, ax1, az1 = piece
            bx0, bz0, bx1, bz1 = block
            ix0, iz0 = max(ax0, bx0), max(az0, bz0)
            ix1, iz1 = min(ax1, bx1), min(az1, bz1)
            if ix0 >= ix1 - 0.02 or iz0 >= iz1 - 0.02:
                nxt.append(piece)
                continue
            if ax0 < ix0 - 0.02:
                nxt.append((ax0, az0, ix0, az1))
            if ix1 < ax1 - 0.02:
                nxt.append((ix1, az0, ax1, az1))
            if az0 < iz0 - 0.02:
                nxt.append((ix0, az0, ix1, iz0))
            if iz1 < az1 - 0.02:
                nxt.append((ix0, iz1, ix1, az1))
        pieces = nxt
    return [p for p in pieces if p[2] - p[0] > 0.12 and p[3] - p[1] > 0.12]


def split_gaps(start, end, gaps):
    """gaps are (g0, g1, extra). Returns solid spans between gaps."""
    pieces = [(start, end)]
    for g0, g1, _ in gaps:
        nxt = []
        for a, b in pieces:
            if g1 <= a + 0.02 or g0 >= b - 0.02:
                nxt.append((a, b))
                continue
            if a < g0 - 0.02:
                nxt.append((a, min(b, g0)))
            if g1 < b - 0.02:
                nxt.append((max(a, g1), b))
        pieces = nxt
    return [(a, b) for a, b in pieces if b - a > 0.15]


def subtract_intervals(a0, a1, intervals):
    pieces = [(a0, a1)]
    for i0, i1 in sorted(intervals):
        nxt = []
        for p0, p1 in pieces:
            if i1 <= p0 + 0.02 or i0 >= p1 - 0.02:
                nxt.append((p0, p1))
                continue
            if p0 < i0 - 0.02:
                nxt.append((p0, i0))
            if i1 < p1 - 0.02:
                nxt.append((i1, p1))
        pieces = nxt
    return pieces


def aabb(name, x0, y0, z0, x1, y1, z1):
    r = lambda v: round(v, 3)
    return {"id": name, "min": [r(x0), r(y0), r(z0)], "max": [r(x1), r(y1), r(z1)]}


# ---------------------------------------------------------------- scene context

TYPE_FLOOR = {
    "office": "#E3D2A8", "meeting": "#D9C3A0", "lab": "#D3E0E3", "classroom": "#E9D9B0",
    "lecture": "#D8C397", "library": "#DCCDB0", "server": "#B5C1C8", "lounge": "#E2C9B4",
    "exhibit": "#E0D3BC",
}
TYPE_NAME = {
    "office": "Văn phòng", "meeting": "Phòng họp", "lab": "Phòng thí nghiệm", "classroom": "Phòng học",
    "lecture": "Giảng đường lớn", "library": "Thư viện", "server": "Phòng máy chủ", "lounge": "Phòng khách",
    "exhibit": "Phòng trưng bày",
}
FLOOR_HALL = "#CDB892"
FLOOR_LOBBY = "#E6DCC6"
STAIR_MARK = "#E7B54A"
STAIR_STEP = "#BFB3A0"
DESK = "#8D5A34"
MONITOR = "#2B3238"
CHAIR = "#4A5A66"
CABINET = "#B9A78A"
BOARD = "#243036"
TABLE = "#6E4A30"
BENCH_LAB = "#E6ECEE"
HOOD = "#9DB4BC"
RACK = "#22303A"
LED = "#4FC3F7"
SHELF = "#7A5636"
BOOKS = "#A4473C"
SOFA = "#7D4E57"
CASE = "#8B7B66"
GLASS = "#BFDDE6"
STAGE_WOOD = "#A0703F"
COUNTER = "#C48A5A"
BOUNDARY = "#6F6A62"
WINDOW_IN = "#B4C7CD"
FLOOR_WC = "#B7D0CB"
STALL = "#F2F6F5"
PORCELAIN = "#FBFBF7"
MIRROR = "#A9C4CC"
WC_SIGN = "#16302C"
LAMP_POLE = "#3B4044"
LAMP_BULB = "#FFE6A3"
TYPE_FLOOR["wc"] = FLOOR_WC
TYPE_NAME["wc"] = "Nhà vệ sinh"
WC_WIDTH = 3.6
WC_DOOR = 1.6

# Surface shader per material colour (web app reads material extras). Unlisted colours get plain plaster noise.
PATTERNS = {
    "#A85343": "roof_tiles", "#8C9590": "concrete", "#748E83": "concrete",
    "#B5C39C": "grass", "#6E955D": "grass", "#D3CEBC": "paving", "#E9E1CF": "paving_large",
    "#697578": "asphalt", "#A7A9A2": "asphalt", "#9C4A3C": "brick",
    FLOOR_HALL: "floor_tiles", FLOOR_LOBBY: "paving_large", FLOOR_WC: "floor_small",
    "#E3D2A8": "wood_floor", "#D9C3A0": "wood_floor", "#D8C397": "wood_floor", "#DCCDB0": "wood_floor",
    "#E2C9B4": "wood_floor", "#E0D3BC": "wood_floor", "#D3E0E3": "floor_tiles", "#E9D9B0": "floor_tiles",
    "#B5C1C8": "floor_small",
    DESK: "wood", TABLE: "wood", SHELF: "wood", STAGE_WOOD: "wood", COUNTER: "wood", CABINET: "wood",
    "#B48F69": "wood",
    BOUNDARY: "concrete", STAIR_STEP: "concrete", "#B2B4AC": "concrete", "#C9CCC6": "concrete",
    "#FBF8F1": "concrete", "#518756": "leaves", "#805A3B": "bark",
    "#86A9BC": "glass", "#87AABD": "glass_lit", WINDOW_IN: "glass", LAMP_BULB: "glow", GLASS: "glass",
}


class Ctx:
    def __init__(self, layout):
        self.layout = layout
        self.palette = layout["palette"]
        cfg = layout["interior"]
        self.FH = cfg["floor_height"]
        self.WT = cfg["wall_t"]
        self.PT = cfg["partition_t"]
        self.CW = cfg["corridor_w"]
        self.DOOR = cfg["room_door"]
        self.SD = cfg["stair_depth"]
        self.g = GLB()
        self.solids = []
        self.rooms = []
        self.stairs = []
        self.halls = []
        self.junctions = []
        self.label_groups = []
        self.floor_labels = []
        self.buildings = {b["id"]: b for b in layout["buildings"]}
        self.footprints = {b["id"]: footprint_of(b) for b in layout["buildings"]}

    def key(self, bid, floor):
        b = self.buildings.get(bid)
        campus = b["campus"] if b else "HUS"
        group = b.get("group", bid) if b else bid
        return (f"{bid}__F{floor}", {"kind": "building", "building_id": bid, "group": group,
                                     "campus": campus, "floor": floor})

    def box(self, merge, x0, y0, z0, x1, y1, z1, color, collide=None, shape="box5"):
        sx, sy, sz = x1 - x0, y1 - y0, z1 - z0
        if sx < 0.03 or sy < 0.03 or sz < 0.03:
            return
        self.g.add("part", ((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), (sx, sy, sz), color,
                   shape=shape, merge=merge)
        if collide:
            self.solids.append(aabb(collide, x0, y0, z0, x1, y1, z1))


# ---------------------------------------------------------------- closed blocks (USSH, kiosks)

def closed_block(ctx, b):
    """No door, no interior. Whole footprint collides. Windows, cornices, a shut door and a roof."""
    pal = ctx.palette
    x0, z0, x1, z1 = ctx.footprints[b["id"]]
    h = b["height"]
    wall = pal[b["wall"]]
    merge = ctx.key(b["id"], 0)
    floors = max(1, round(h / ctx.FH))
    fh = h / floors
    ctx.box(merge, x0, 0, z0, x1, h, z1, wall, collide=b["id"], shape="box")
    ctx.box(merge, x0 - 0.08, 0, z0 - 0.08, x1 + 0.08, 0.9, z1 + 0.08, shade(wall, 0.72))
    for f in range(1, floors):
        y = f * fh
        ctx.box(merge, x0 - 0.1, y - 0.12, z0 - 0.1, x1 + 0.1, y + 0.05, z1 + 0.1, shade(wall, 0.88))
    door_side = b.get("door_side")
    for side in ("+z", "-z", "+x", "-x"):
        along_x = side in ("+z", "-z")
        a0, a1 = (x0, x1) if along_x else (z0, z1)
        face = {"+z": z1, "-z": z0, "+x": x1, "-x": x0}[side]
        out = 1 if side[0] == "+" else -1
        length = a1 - a0
        cols = max(1, int(length / WINDOW_SPACING))
        mid = (a0 + a1) / 2
        for f in range(floors):
            y = f * fh + fh * 0.3
            for c in range(cols):
                a = a0 + (c + 0.5) * length / cols
                w = min(2.2, length / cols * 0.42)
                if side == door_side and f == 0 and abs(a - mid) < w / 2 + 2.4:
                    continue
                color = pal["window_lit"] if lit_window(a, y, face) else pal["window"]
                window_unit(ctx, merge, "x" if along_x else "z", face, out, a, y, w, fh * 0.44, color, wall)
        if side == door_side:
            dw = min(3.4, length - 1)
            dh = min(2.8, h - 0.6)
            panel = pal.get("door_closed", "#4A3B30")
            if along_x:
                ctx.box(merge, mid - dw / 2, 0, face + out * 0.02 - 0.06, mid + dw / 2, dh, face + out * 0.06, panel)
                ctx.box(merge, mid - dw / 2 - 0.5, dh + 0.1, min(face, face + out * 1.6), mid + dw / 2 + 0.5, dh + 0.3,
                        max(face, face + out * 1.6), shade(wall, 0.8))
            else:
                ctx.box(merge, face + out * 0.02 - 0.06, 0, mid - dw / 2, face + out * 0.06, dh, mid + dw / 2, panel)
                ctx.box(merge, min(face, face + out * 1.6), dh + 0.1, mid - dw / 2 - 0.5, max(face, face + out * 1.6),
                        dh + 0.3, mid + dw / 2 + 0.5, shade(wall, 0.8))
    roof_color = pal[b["roof_color"]]
    if b.get("roof") == "gable":
        w, d = x1 - x0, z1 - z0
        rise = min(w, d) * 0.3
        if w >= d:
            ctx.g.add("roof", ((x0 + x1) / 2, h, (z0 + z1) / 2), (w + 1.2, rise, d + 1.2), roof_color, "roof", merge=merge)
        else:
            ctx.g.add("roof", ((x0 + x1) / 2, h, (z0 + z1) / 2), (d + 1.2, rise, w + 1.2), roof_color, "roof",
                      rotation=YAW90, merge=merge)
    else:
        ctx.box(merge, x0 - 0.2, h, z0 - 0.2, x1 + 0.2, h + 0.35, z1 + 0.2, roof_color, shape="box")
        ctx.box(merge, x0 - 0.2, h + 0.35, z0 - 0.2, x1 + 0.2, h + 1.0, z0 + 0.15, wall)
        ctx.box(merge, x0 - 0.2, h + 0.35, z1 - 0.15, x1 + 0.2, h + 1.0, z1 + 0.2, wall)
        ctx.box(merge, x0 - 0.2, h + 0.35, z0 + 0.15, x0 + 0.15, h + 1.0, z1 - 0.15, wall)
        ctx.box(merge, x1 - 0.15, h + 0.35, z0 + 0.15, x1 + 0.2, h + 1.0, z1 - 0.15, wall)


def solid_platform(ctx, b):
    pal = ctx.palette
    x0, z0, x1, z1 = ctx.footprints[b["id"]]
    h = b["height"]
    merge = ctx.key(b["id"], 0)
    ctx.box(merge, x0, 0, z0, x1, h, z1, pal[b["wall"]], collide=b["id"], shape="box")
    ctx.box(merge, x0 - 0.25, h, z0 - 0.25, x1 + 0.25, h + 0.4, z1 + 0.25, pal[b["roof_color"]], shape="box")


# ---------------------------------------------------------------- HUS buildings with floors

def siblings_of(ctx, b):
    grp = b.get("group")
    return [ctx.footprints[o["id"]] for o in ctx.layout["buildings"]
            if o["id"] != b["id"] and o.get("group") == grp and o.get("access") == "open"]


def neighbours_of(ctx, b):
    grp = b.get("group")
    return [ctx.footprints[o["id"]] for o in ctx.layout["buildings"]
            if o["id"] != b["id"] and o.get("group") != grp]


def interior(ctx, b):
    x0, z0, x1, z1 = ctx.footprints[b["id"]]
    w = ctx.WT
    return (x0 + w, z0 + w, x1 - w, z1 - w)


def floor_y(ctx, f):
    return (f - 1) * ctx.FH


def floor_top(ctx, f):
    return floor_y(ctx, f) + 0.08


def gaps_for(b, side, f):
    out = []
    for o in b.get("openings", []):
        if o["side"] == side and f in o.get("floors", [1]):
            out.append((o["at"] - o["width"] / 2, o["at"] + o["width"] / 2, o.get("height", 3.0)))
    return out


def emit_walls(ctx, b, f):
    pal = ctx.palette
    bid = b["id"]
    x0, z0, x1, z1 = ctx.footprints[bid]
    WT = ctx.WT
    y0 = floor_y(ctx, f)
    y1 = y0 + ctx.FH
    merge = ctx.key(bid, f)
    wall = pal[b["wall"]]
    sibs = [inflate(r, -0.01) for r in siblings_of(ctx, b)]
    neigh = neighbours_of(ctx, b)
    top_floor = f == b["floors"]
    spans = {
        "+z": ("x", x0, x1, z1 - WT, z1),
        "-z": ("x", x0, x1, z0, z0 + WT),
        "+x": ("z", z0 + WT, z1 - WT, x1 - WT, x1),
        "-x": ("z", z0 + WT, z1 - WT, x0, x0 + WT),
    }
    for side, (axis, a0, a1, b0, b1) in spans.items():
        out = 1 if side[0] == "+" else -1
        gaps = gaps_for(b, side, f)

        def rect_of(s0, s1):
            return (s0, b0, s1, b1) if axis == "x" else (b0, s0, b1, s1)

        for s0, s1 in split_gaps(a0, a1, gaps):
            for piece in subtract_rects(rect_of(s0, s1), sibs):
                px0, pz0, px1, pz1 = piece
                ctx.box(merge, px0, y0, pz0, px1, y1, pz1, wall, collide=f"{bid}_F{f}_wall")
                # Trim only exposed spans. A midpoint probe misses partially shared walls
                # and leaves windows/plinths poking into a neighbouring hall.
                face = {"+z": z1, "-z": z0, "+x": x1, "-x": x0}[side]
                blocks = []
                for r in neigh:
                    normal0, normal1 = (r[1], r[3]) if axis == "x" else (r[0], r[2])
                    if normal0 <= face + out * .05 <= normal1:
                        blocks.append(rect_of(r[0], r[2]) if axis == "x" else rect_of(r[1], r[3]))
                for exposed in subtract_rects(piece, blocks):
                    facade_trim(ctx, b, merge, exposed, axis, side, f, y0, top_floor)
        for g0, g1, gh in gaps:
            g0, g1 = max(g0, a0), min(g1, a1)
            if g1 - g0 < 0.3:
                continue
            for piece in subtract_rects(rect_of(g0, g1), sibs):
                ctx.box(merge, piece[0], y0 + gh, piece[1], piece[2], y1, piece[3], wall, collide=f"{bid}_F{f}_header")
            mid = (g0 + g1) / 2
            probe = (mid, (z1 if side == "+z" else z0) + out * 0.9) if axis == "x" else \
                ((x1 if side == "+x" else x0) + out * 0.9, mid)
            into_neighbour = any(inside(probe[0], probe[1], r) for r in neigh)
            if f == 1 and not into_neighbour:
                # Threshold mat outside each ground-floor door to open ground.
                if axis == "x":
                    zz = (z1, z1 + 1.8) if side == "+z" else (z0 - 1.8, z0)
                    ctx.box(merge, g0, 0.03, zz[0], g1, 0.1, zz[1], "#D7D1C2", shape="box")
                else:
                    xx = (x1, x1 + 1.8) if side == "+x" else (x0 - 1.8, x0)
                    ctx.box(merge, xx[0], 0.03, g0, xx[1], 0.1, g1, "#D7D1C2", shape="box")


def facade_trim(ctx, b, merge, piece, axis, side, f, y0, top_floor):
    pal = ctx.palette
    wall = pal[b["wall"]]
    px0, pz0, px1, pz1 = piece
    out = 1 if side[0] == "+" else -1
    face = {"+z": pz1, "-z": pz0, "+x": px1, "-x": px0}[side]
    inner = {"+z": pz0, "-z": pz1, "+x": px0, "-x": px1}[side]
    a0, a1 = (px0, px1) if axis == "x" else (pz0, pz1)
    length = a1 - a0
    lo, hi = sorted((face - out * 0.02, face + out * 0.1))
    if f == 1 and b.get("plinth"):
        plinth = pal[b["plinth"]]
        if axis == "x":
            ctx.box(merge, px0, 0, lo, px1, 1.05, hi, plinth)
        else:
            ctx.box(merge, lo, 0, pz0, hi, 1.05, pz1, plinth)
    band = shade(wall, 0.86)
    yb = y0 + ctx.FH
    blo, bhi = sorted((face - out * 0.02, face + out * 0.16))
    if axis == "x":
        ctx.box(merge, px0, yb - 0.22, blo, px1, yb, bhi, band)
    else:
        ctx.box(merge, blo, yb - 0.22, pz0, bhi, yb, pz1, band)
    if length < 2.0:
        return
    cols = max(1, int(length / WINDOW_SPACING))
    w = min(2.2, length / cols * 0.42)
    wy0, wy1 = y0 + 0.3 * ctx.FH, y0 + 0.74 * ctx.FH
    logo = ctx.layout.get("logo")
    for c in range(cols):
        a = a0 + (c + 0.5) * length / cols
        if (logo and logo["building"] == b["id"] and logo["side"] == side and
                abs(a - logo["center_along"]) < logo["height"] * logo["aspect"] / 2 + 1.6 and
                wy1 > logo["center_y"] - logo["height"] / 2 - 0.8 and wy0 < logo["center_y"] + logo["height"] / 2 + 0.8):
            continue
        glass = pal["window_lit"] if lit_window(a, y0, face) else pal["window"]
        window_unit(ctx, merge, axis, face, out, a, wy0, w, wy1 - wy0, glass, wall, inner)


def strips_for(ctx, b):
    x0, z0, x1, z1 = interior(ctx, b)
    cw = ctx.CW
    kind = b["corridor"]
    if kind == "center":
        if (x1 - x0) >= (z1 - z0):
            c = (z0 + z1) / 2
            return [dict(axis="x", a=(x0, x1), s=(z0, c - cw / 2), open="+z"),
                    dict(axis="x", a=(x0, x1), s=(c + cw / 2, z1), open="-z")]
        c = (x0 + x1) / 2
        return [dict(axis="z", a=(z0, z1), s=(x0, c - cw / 2), open="+x"),
                dict(axis="z", a=(z0, z1), s=(c + cw / 2, x1), open="-x")]
    if kind == "+z":
        return [dict(axis="x", a=(x0, x1), s=(z0, z1 - cw), open="+z")]
    if kind == "-z":
        return [dict(axis="x", a=(x0, x1), s=(z0 + cw, z1), open="-z")]
    if kind == "+x":
        return [dict(axis="z", a=(z0, z1), s=(x0, x1 - cw), open="+x")]
    return [dict(axis="z", a=(z0, z1), s=(x0 + cw, x1), open="-x")]


def plan_slots(ctx, b):
    """Room slots along each strip, the same on every floor. Halls and sibling overlaps are skipped."""
    I = interior(ctx, b)
    blockers = [tuple(h["rect"]) for h in b.get("halls", [])] + siblings_of(ctx, b)
    wc_points = ctx.layout["programs"].get(b.get("group"), {}).get("wc", [])
    slots = []
    for si, strip in enumerate(strips_for(ctx, b)):
        axis = strip["axis"]
        s0, s1 = strip["s"]
        a0, a1 = strip["a"]
        cuts = []
        for r in blockers:
            lo_s, hi_s = (r[1], r[3]) if axis == "x" else (r[0], r[2])
            if hi_s <= s0 + 0.05 or lo_s >= s1 - 0.05:
                continue
            cuts.append((r[0], r[2]) if axis == "x" else (r[1], r[3]))
        inner_lo = I[0] if axis == "x" else I[1]
        inner_hi = I[2] if axis == "x" else I[3]
        for seg_i, (g0, g1) in enumerate(subtract_intervals(a0, a1, cuts)):
            length = g1 - g0
            if length < 3.0:
                continue
            # Room count comes from the full length so numbering stays put when a WC is slotted in.
            n = max(1, round(length / b["room_module"]))
            wc_end = None
            for wx, wz in wc_points:
                along, across = (wx, wz) if axis == "x" else (wz, wx)
                if s0 <= across <= s1 and g0 <= along <= g1:
                    wc_end = "lo" if along - g0 <= g1 - along else "hi"
            spans = []
            r0, r1 = g0, g1
            if wc_end == "lo":
                spans.append(("wc", g0, g0 + WC_WIDTH))
                r0 = g0 + WC_WIDTH
            elif wc_end == "hi":
                r1 = g1 - WC_WIDTH
            step = (r1 - r0) / n
            spans += [("room", r0 + k * step, r0 + (k + 1) * step) for k in range(n)]
            if wc_end == "hi":
                spans.append(("wc", g1 - WC_WIDTH, g1))
            for k, (kind, p0, p1) in enumerate(spans):
                slots.append({
                    "axis": axis, "open": strip["open"], "s": (s0, s1), "a": (p0, p1), "wc": kind == "wc",
                    "seg": (si, seg_i), "seg_start": k == 0, "seg_end": k == len(spans) - 1,
                    "wall_lo": abs(g0 - inner_lo) < 0.05, "wall_hi": abs(g1 - inner_hi) < 0.05,
                })
    return slots


def group_slots(ctx, group):
    parts = sorted([b for b in ctx.layout["buildings"] if b.get("group") == group and b.get("access") == "open"
                    and b.get("program") != "hall"], key=lambda b: b.get("part_rank", 0))
    out = []
    for b in parts:
        for slot in plan_slots(ctx, b):
            slot["building"] = b["id"]
            out.append(slot)
    return parts, out


def assign_program(ctx, group, f, slots):
    prog = ctx.layout["programs"].get(group, {})
    default = prog.get("default_by_floor", {}).get(str(f)) or prog.get("default", "office")
    rooms = []
    index = 0
    for slot in slots:
        if slot["wc"]:
            rooms.append({**slot, "num": None, "type": "wc", "labels": ["Nhà vệ sinh"], "floor_label": None,
                          "merge": None})
            continue
        index += 1
        rooms.append({**slot, "num": f * 100 + index, "type": default, "labels": [], "floor_label": None,
                      "merge": None})
    entries = prog.get("floors", {}).get(str(f), [])
    for entry in entries:
        lo, hi = entry["nums"]
        hits = [r for r in rooms if r["num"] is not None and lo <= r["num"] <= hi]
        if not hits:
            raise SystemExit(f"{group} floor {f}: no room in {lo}-{hi} for '{entry['label']}' "
                             f"(floor has {len(rooms)} rooms)")
        for r in hits:
            r["type"] = entry["type"]
            if entry.get("floor_wide"):
                r["floor_label"] = entry["label"]
            elif entry["label"] not in r["labels"]:
                r["labels"].append(entry["label"])
            if entry.get("merge"):
                r["merge"] = entry["label"]
    # Merge neighbours in one segment that carry the same merge label.
    merged = []
    for r in rooms:
        prev = merged[-1] if merged else None
        if (prev and r["merge"] and prev["merge"] == r["merge"] and prev["seg"] == r["seg"]
                and prev["building"] == r["building"]):
            prev["a"] = (prev["a"][0], r["a"][1])
            prev["seg_end"] = r["seg_end"]
            prev["wall_hi"] = r["wall_hi"]
            prev["nums"].append(r["num"])
            continue
        r["nums"] = [r["num"]] if r["num"] is not None else []
        merged.append(r)
    return merged, entries


def room_frame(room):
    axis, opening = room["axis"], room["open"]
    a0, a1 = room["a"]
    s0, s1 = room["s"]
    L, D = a1 - a0, s1 - s0

    def world(u0, u1, v0, v1):
        if axis == "x":
            xa, xb = a0 + u0, a0 + u1
            za, zb = (s1 - v1, s1 - v0) if opening == "+z" else (s0 + v0, s0 + v1)
            return xa, za, xb, zb
        za, zb = a0 + u0, a0 + u1
        xa, xb = (s1 - v1, s1 - v0) if opening == "+x" else (s0 + v0, s0 + v1)
        return xa, za, xb, zb

    return L, D, world


def emit_room(ctx, room, f, merge):
    PT = ctx.PT
    y0 = floor_y(ctx, f)
    top = floor_top(ctx, f)
    hgt = ctx.FH - 0.22
    L, D, world = room_frame(room)
    b = ctx.buildings[room["building"]]
    wall = shade(ctx.palette[b["wall"]], 1.04)
    cid = f"{room['building']}_F{f}_part"

    def put(u0, u1, v0, v1, h0, h1, color, collide=None, shape="box5"):
        xa, za, xb, zb = world(u0, u1, v0, v1)
        ctx.box(merge, xa, top + h0, za, xb, top + h1, zb, color, collide=collide, shape=shape)

    # Floor finish by room type.
    put(PT, L, PT, D, 0, 0.04, TYPE_FLOOR[room["type"]], shape="box")
    # End partitions: start of segment (unless exterior wall) and every room end (unless exterior wall).
    if room["seg_start"] and not room["wall_lo"]:
        put(0, PT, 0, D, -0.08, hgt, wall, collide=cid)
    if not (room["seg_end"] and room["wall_hi"]):
        put(L - PT, L, 0, D, -0.08, hgt, wall, collide=cid)
    # Front wall on the corridor edge, with one door (two for long rooms).
    doors = [L / 2] if L < 13 else [L * 0.2, L * 0.8]
    door_w = WC_DOOR if room["type"] == "wc" else ctx.DOOR
    gaps = [(d - door_w / 2, d + door_w / 2, 0) for d in doors]
    for u0, u1 in split_gaps(0, L, gaps):
        put(u0, u1, 0, PT, -0.08, hgt, wall, collide=cid)
    for g0, g1, _ in gaps:
        put(g0, g1, 0, PT, 2.75, hgt, wall, collide=f"{room['building']}_F{f}_header")
    if room["type"] == "wc":
        furnish_wc(L, D, put)
        wc_sign(ctx, room, f, merge)
    else:
        furnish(room["type"], L, D, put)
    xa, za, xb, zb = world(0, L, 0, D)
    room["rect"] = [round(xa, 2), round(za, 2), round(xb, 2), round(zb, 2)]
    room["center"] = [round((xa + xb) / 2, 2), round(y0 + 1.2, 2), round((za + zb) / 2, 2)]
    dx, dz, _, _ = world(doors[0], doors[0], 0.9, 0.9)
    room["door"] = [round(dx, 2), round(dz, 2)]


def furnish_wc(L, D, put):
    """Cubicles along the window wall, a sink counter and mirror by the door. Nothing collides."""
    n = max(1, int((L - 0.4) / 1.25))
    span = (L - 0.4) / n
    depth = min(1.6, D * 0.4)
    for i in range(n):
        u0 = 0.2 + i * span
        put(u0, u0 + 0.06, D - depth, D, 0, 1.95, STALL)
        put(u0 + span / 2 - 0.22, u0 + span / 2 + 0.22, D - 0.75, D - 0.2, 0, 0.45, PORCELAIN)
    put(L - 0.26, L - 0.2, D - depth, D, 0, 1.95, STALL)
    put(0.2, L - 0.2, D - depth - 0.05, D - depth, 0.15, 1.95, STALL)
    put(0.3, 0.85, 0.9, min(D - depth - 0.4, 3.2), 0, 0.85, PORCELAIN)
    put(0.3, 0.34, 0.9, min(D - depth - 0.4, 3.2), 1.2, 2.0, MIRROR)


def wc_sign(ctx, room, f, merge):
    """WC letters on the corridor face of the front wall, above the door."""
    s0, s1 = room["s"]
    a0, a1 = room["a"]
    mid = (a0 + a1) / 2
    y = floor_top(ctx, f) + 2.25
    meta = merge[1]
    group = merge[0] + "_wc"
    if room["axis"] == "x":
        if room["open"] == "+z":
            stamp_text(ctx.g, group, "WC", mid, y, s1 + 0.02, 0.14, WC_SIGN, 1, "z", meta)
        else:
            stamp_text(ctx.g, group, "WC", mid, y, s0 - 0.02, 0.14, WC_SIGN, -1, "z", meta)
    else:
        if room["open"] == "+x":
            stamp_text(ctx.g, group, "WC", s1 + 0.02, y, mid, 0.14, WC_SIGN, 1, "x", meta)
        else:
            stamp_text(ctx.g, group, "WC", s0 - 0.02, y, mid, 0.14, WC_SIGN, -1, "x", meta)


def furnish(kind, L, D, put):
    """Furniture never collides. u runs along the corridor, v from the door wall (0) to the window wall (D)."""
    PT = 0.3
    if kind in ("classroom", "lecture"):
        big = kind == "lecture"
        if big:
            put(PT, 2.4, 0.6, D - 0.4, 0, 0.3, STAGE_WOOD)
        put(PT, PT + 0.08, D * 0.2, D * 0.8, 1.0, 2.3 if big else 2.1, BOARD)
        put(0.9, 1.5, D / 2 - 0.7, D / 2 + 0.7, 0.3 if big else 0, (0.3 if big else 0) + 0.78, DESK)
        u = 3.4 if big else 2.3
        while u < L - 0.6:
            put(u, u + 0.55, 1.2, D / 2 - 0.55, 0, 0.76, DESK)
            put(u, u + 0.55, D / 2 + 0.55, D - 0.5, 0, 0.76, DESK)
            put(u + 0.62, u + 0.82, 1.2, D / 2 - 0.55, 0, 0.45, CHAIR)
            put(u + 0.62, u + 0.82, D / 2 + 0.55, D - 0.5, 0, 0.45, CHAIR)
            u += 1.3 if big else 1.25
    elif kind == "office":
        n = max(1, int((L - 0.8) / 2.2))
        span = L - 0.9
        for i in range(n):
            uc = 0.45 + (i + 0.5) * span / n
            put(uc - 0.75, uc + 0.75, D - 1.15, D - 0.4, 0, 0.76, DESK)
            put(uc - 0.3, uc + 0.3, D - 0.7, D - 0.6, 0.76, 1.15, MONITOR)
            put(uc - 0.25, uc + 0.25, D - 1.8, D - 1.35, 0, 0.5, CHAIR)
            if D > 6.5:
                put(uc - 0.75, uc + 0.75, D / 2 - 0.4, D / 2 + 0.35, 0, 0.76, DESK)
                put(uc - 0.3, uc + 0.3, D / 2 - 0.15, D / 2 - 0.05, 0.76, 1.15, MONITOR)
        put(L - 0.85, L - PT - 0.02, 0.9, min(2.7, D - 1.6), 0, 1.9, CABINET)
    elif kind == "meeting":
        if D >= L:
            put(L / 2 - 0.7, L / 2 + 0.7, 1.3, D - 0.9, 0, 0.76, TABLE)
            v = 1.6
            while v < D - 1.1:
                put(L / 2 - 1.15, L / 2 - 0.8, v, v + 0.4, 0, 0.5, CHAIR)
                put(L / 2 + 0.8, L / 2 + 1.15, v, v + 0.4, 0, 0.5, CHAIR)
                v += 1.0
        else:
            put(0.9, L - 0.9, D / 2 - 0.7, D / 2 + 0.7, 0, 0.76, TABLE)
            u = 1.2
            while u < L - 1.2:
                put(u, u + 0.4, D / 2 - 1.15, D / 2 - 0.8, 0, 0.5, CHAIR)
                put(u, u + 0.4, D / 2 + 0.8, D / 2 + 1.15, 0, 0.5, CHAIR)
                u += 1.0
    elif kind == "lab":
        put(0.45, L - 0.45, D - 0.85, D - 0.05, 0, 0.95, BENCH_LAB)
        put(PT + 0.05, PT + 1.05, D - 2.5, D - 0.95, 0, 2.3, HOOD)
        for i, color in enumerate(("#3E7CB1", "#E2B23C", "#7FB069", "#C65D5D")):
            u = 1.6 + i * (L - 2.4) / 4
            if u < L - 0.6:
                put(u, u + 0.3, D - 0.6, D - 0.3, 0.95, 1.3, color)
        if D > 5.5 and L > 3.2:
            put(1.3, L - 0.9, D / 2 - 0.6, D / 2 + 0.6, 0, 0.95, BENCH_LAB)
            put(L / 2 - 0.3, L / 2 + 0.3, D / 2 - 0.25, D / 2 + 0.25, 0.95, 1.05, "#3A4A52")
    elif kind == "server":
        v = 1.5
        while v < D - 0.9:
            put(0.7, L - 0.7, v, v + 0.7, 0, 2.1, RACK)
            put(0.8, L - 0.8, v - 0.03, v, 1.55, 1.65, LED)
            v += 1.9
    elif kind == "library":
        u = 1.0
        while u < L - 0.8:
            put(u, u + 0.45, 2.2, D - 0.45, 0, 2.0, SHELF)
            put(u - 0.02, u + 0.47, 2.25, D - 0.5, 0.9, 1.2, BOOKS)
            u += 2.0
        put(0.8, L - 0.8, 0.8, 1.5, 0, 0.76, TABLE)
    elif kind == "lounge":
        put(0.6, L - 0.6, D - 1.2, D - 0.4, 0, 0.75, SOFA)
        put(0.6, 1.4, D - 3.6, D - 1.2, 0, 0.75, SOFA)
        put(L / 2 - 0.8, L / 2 + 0.8, D - 2.7, D - 1.9, 0, 0.45, TABLE)
    elif kind == "exhibit":
        u = 0.6
        while u < L - 1.6:
            put(u, u + 1.4, D - 1.0, D - 0.4, 0, 1.0, CASE)
            put(u + 0.05, u + 1.35, D - 0.95, D - 0.45, 1.0, 1.9, GLASS)
            u += 1.8
        put(L / 2 - 0.4, L / 2 + 0.4, D / 2 - 0.4, D / 2 + 0.4, 0, 1.1, CASE)


def emit_stairs(ctx, b, hall, f, merge):
    side = hall.get("stairs")
    if not side:
        return
    I = interior(ctx, b)
    H = intersect(tuple(hall["rect"]), I)
    hx0, hz0, hx1, hz1 = H
    SD = ctx.SD
    top = floor_top(ctx, f)
    y0 = floor_y(ctx, f)
    if side in ("-x", "+x"):
        length = min(7.0, (hz1 - hz0) - 0.8)
        mid = (hz0 + hz1) / 2
        fz0, fz1 = mid - length / 2, mid + length / 2
        fx0, fx1 = (hx0, hx0 + SD) if side == "-x" else (hx1 - SD, hx1)
        zone = (fx1, fz0, fx1 + 3.0, fz1) if side == "-x" else (fx0 - 3.0, fz0, fx0, fz1)
        flight = (fx0, fz0, fx1, fz1)
        along = "z"
    else:
        length = min(7.0, (hx1 - hx0) - 0.8)
        mid = (hx0 + hx1) / 2
        fx0, fx1 = mid - length / 2, mid + length / 2
        fz0, fz1 = (hz0, hz0 + SD) if side == "-z" else (hz1 - SD, hz1)
        zone = (fx0, fz1, fx1, fz1 + 3.0) if side == "-z" else (fx0, fz0 - 3.0, fx1, fz0)
        flight = (fx0, fz0, fx1, fz1)
        along = "x"
    steps = 10
    rise = (ctx.FH - 0.3) / steps
    for i in range(steps):
        if along == "z":
            s0 = flight[1] + i * length / steps
            ctx.box(merge, flight[0], top, s0, flight[2], top + (i + 1) * rise, s0 + length / steps, STAIR_STEP)
        else:
            s0 = flight[0] + i * length / steps
            ctx.box(merge, s0, top, flight[1], s0 + length / steps, top + (i + 1) * rise, flight[3], STAIR_STEP)
    ctx.solids.append(aabb(f"{b['id']}_F{f}_stair", flight[0], y0, flight[1], flight[2], y0 + ctx.FH - 0.2, flight[3]))
    ctx.box(merge, zone[0], top, zone[1], zone[2], top + 0.03, zone[3], STAIR_MARK, shape="box")
    if f == 1:
        ctx.stairs.append({"building": b["id"], "group": b.get("group"), "hall": hall["id"],
                           "floors": [1, b["floors"]], "zone": [round(v, 2) for v in zone],
                           "flight": [round(v, 2) for v in flight]})


def emit_slab(ctx, b, f, merge):
    I = interior(ctx, b)
    sibs = siblings_of(ctx, b)
    y0 = floor_y(ctx, f)
    lo = 0.02 if f == 1 else y0 - 0.14
    for piece in subtract_rects(I, [inflate(r, 0.0) for r in sibs] if b["id"] == "HUS_T1" else []):
        ctx.box(merge, piece[0], lo, piece[1], piece[2], y0 + 0.08, piece[3], FLOOR_HALL, shape="box",
                collide=f"{b['id']}_F{f}_slab" if f > 1 else None)
    for hall in b.get("halls", []):
        H = intersect(tuple(hall["rect"]), I)
        if H and hall.get("label"):
            ctx.box(merge, H[0], y0 + 0.08, H[1], H[2], y0 + 0.1, H[3], FLOOR_LOBBY, shape="box")
    # A slab under the wall line keeps the floor edge visible from outside on upper floors.
    if f > 1:
        x0, z0, x1, z1 = ctx.footprints[b["id"]]
        ctx.box(merge, x0 - 0.06, y0 - 0.16, z0 - 0.06, x1 + 0.06, y0 - 0.02, z1 + 0.06,
                shade(ctx.palette[b["wall"]], 0.8), shape="box")


def emit_hall_junctions(ctx):
    """Finish shared doors as one continuous floor, rather than two facade holes."""
    buildings = [b for b in ctx.layout["buildings"] if b.get("access") == "open"]
    for i, b in enumerate(buildings):
        a = ctx.footprints[b["id"]]
        for q in buildings[i + 1:]:
            c = ctx.footprints[q["id"]]
            candidates = []
            if abs(a[2] - c[0]) < .02: candidates.append(("+x", "-x", "x", a[2]))
            if abs(c[2] - a[0]) < .02: candidates.append(("-x", "+x", "x", a[0]))
            if abs(a[3] - c[1]) < .02: candidates.append(("+z", "-z", "z", a[3]))
            if abs(c[3] - a[1]) < .02: candidates.append(("-z", "+z", "z", a[1]))
            for side, opposite, axis, seam in candidates:
                for f in range(1, min(b["floors"], q["floors"]) + 1):
                    for lo, hi, _ in gaps_for(b, side, f):
                        for qlo, qhi, _ in gaps_for(q, opposite, f):
                            low, high = max(lo, qlo), min(hi, qhi)
                            if high - low < ctx.CW * .75: continue
                            # Both slabs stop at their own inside wall edge. Fill that
                            # exact missing strip, with no threshold step or facade mat.
                            r = [seam - ctx.WT, low, seam + ctx.WT, high] if axis == "x" else [low, seam - ctx.WT, high, seam + ctx.WT]
                            y = floor_y(ctx, f)
                            ctx.box(ctx.key(b["id"], f), r[0], y + .02, r[1], r[2], y + .08, r[3], FLOOR_HALL, shape="box")
                            if f == 1:
                                ctx.junctions.append({"id": b["id"] + "__" + q["id"], "buildings": [b["id"], q["id"]], "groups": [b["group"], q["group"]], "axis": axis, "rect": r, "center": [(r[0]+r[2])/2, (r[1]+r[3])/2]})


def emit_roof(ctx, b):
    pal = ctx.palette
    x0, z0, x1, z1 = ctx.footprints[b["id"]]
    h = b["floors"] * ctx.FH
    merge = ctx.key(b["id"], 99)
    wall = pal[b["wall"]]
    roof = pal[b["roof_color"]]
    # Ceiling slab over the top floor.
    ctx.box(merge, x0, h - 0.02, z0, x1, h + 0.2, z1, shade(wall, 0.8), shape="box", collide=f"{b['id']}_roofslab")
    if b.get("roof") == "gable":
        w, d = x1 - x0, z1 - z0
        rise = min(w, d) * 0.34
        if w >= d:
            ctx.g.add("roof", ((x0 + x1) / 2, h + 0.2, (z0 + z1) / 2), (w + 1.2, rise, d + 1.4), roof, "roof", merge=merge)
        else:
            ctx.g.add("roof", ((x0 + x1) / 2, h + 0.2, (z0 + z1) / 2), (d + 1.2, rise, w + 1.4), roof, "roof",
                      rotation=YAW90, merge=merge)
    else:
        ctx.box(merge, x0, h + 0.2, z0, x1, h + 0.4, z1, roof, shape="box")
        sibs = siblings_of(ctx, b)
        for r in [(x0, z0, x1, z0 + 0.35), (x0, z1 - 0.35, x1, z1), (x0, z0 + 0.35, x0 + 0.35, z1 - 0.35),
                  (x1 - 0.35, z0 + 0.35, x1, z1 - 0.35)]:
            for piece in subtract_rects(r, sibs):
                ctx.box(merge, piece[0], h + 0.2, piece[1], piece[2], h + 1.1, piece[3], wall)
        if b["floors"] >= 5:
            cx, cz = (x0 + x1) / 2, (z0 + z1) / 2
            ctx.box(merge, cx - 1.2, h + 0.4, cz - 1.2, cx + 1.2, h + 2.4, cz + 1.2, "#C9CCC6")


def emit_hall_program(ctx, b):
    """Detailed single-hall interior for HUS Canteen: counters, POS, chillers, dining sets, and colliders.

    Interior meshes are clipped at y = 1.5 in web/src/scene/interiors.ts, so all interior fixtures
    and their collision envelopes stay within y = 0.08 .. 1.48.
    """
    bid = b["id"]
    merge = ctx.key(bid, 1)
    x0, z0, x1, z1 = interior(ctx, b)
    openings = [o for o in b.get("openings", []) if 1 in o.get("floors", [1])]
    door_z = openings[0]["at"] if openings else (z0 + z1) / 2
    door_half = (openings[0]["width"] / 2) if openings else 2.34

    def add_solid(kind, sx0, sy0, sz0, sx1, sy1, sz1):
        box = aabb(f"{bid}_F1_{kind}_{len(ctx.solids)}", sx0, sy0, sz0, sx1, sy1, sz1)
        box["kind"] = kind
        ctx.solids.append(box)

    # 1. Tiled floor, grout grid, central lobby runner, welcome mat, and wooden wall wainscoting.
    ctx.box(merge, x0, 0.02, z0, x1, 0.08, z1, FLOOR_HALL, shape="box")
    gx = x0 + 2.0
    while gx < x1 - 0.4:
        ctx.box(merge, gx - 0.02, 0.081, z0 + 0.15, gx + 0.02, 0.088, z1 - 0.15, FLOOR_LOBBY)
        gx += 2.0
    gz = z0 + 2.0
    while gz < z1 - 0.4:
        ctx.box(merge, x0 + 0.15, 0.081, gz - 0.02, x1 - 0.15, 0.088, gz + 0.02, FLOOR_LOBBY)
        gz += 2.0
    # Highlight main customer flow from +x doorway to cashier and service aisle.
    ctx.box(merge, x0 + 4.15, 0.05, door_z - 2.35, x1 - 0.05, 0.09, door_z + 2.35, FLOOR_LOBBY, shape="box")
    ctx.box(merge, x0 + 4.35, 0.05, z0 + 1.65, x0 + 6.45, 0.089, z1 - 1.65, FLOOR_LOBBY, shape="box")
    ctx.box(merge, x1 - 1.75, 0.055, door_z - 2.05, x1 - 0.06, 0.096, door_z + 2.05, STAIR_MARK, shape="box")

    # Interior perimeter dado / wainscoting (y = 0.08 .. 0.90), skipping the +x entrance gap.
    ctx.box(merge, x0 + 0.01, 0.08, z0 + 0.05, x0 + 0.08, 0.86, z1 - 0.05, COUNTER)
    ctx.box(merge, x0 + 0.01, 0.86, z0 + 0.05, x0 + 0.10, 0.92, z1 - 0.05, DESK)
    ctx.box(merge, x0 + 0.05, 0.08, z0 + 0.01, x1 - 0.05, 0.86, z0 + 0.08, COUNTER)
    ctx.box(merge, x0 + 0.05, 0.86, z0 + 0.01, x1 - 0.05, 0.92, z0 + 0.10, DESK)
    ctx.box(merge, x0 + 0.05, 0.08, z1 - 0.08, x1 - 0.05, 0.86, z1 - 0.01, COUNTER)
    ctx.box(merge, x0 + 0.05, 0.86, z1 - 0.10, x1 - 0.05, 0.92, z1 - 0.01, DESK)
    for seg_z0, seg_z1 in ((z0 + 0.05, door_z - door_half - 0.12), (door_z + door_half + 0.12, z1 - 0.05)):
        if seg_z1 > seg_z0 + 0.2:
            ctx.box(merge, x1 - 0.08, 0.08, seg_z0, x1 - 0.01, 0.86, seg_z1, COUNTER)
            ctx.box(merge, x1 - 0.10, 0.86, seg_z0, x1 - 0.01, 0.92, seg_z1, DESK)

    # 2. North-West Hot Food & Rice Serving Line (z = z0 + 5.46 .. door_z - 3.60).
    hot_z0, hot_z1 = z0 + 5.46, door_z - 3.60
    # Back kitchen prep bench, stockpots, exhaust hood trim, and wall menu boards.
    ctx.box(merge, x0 + 0.08, 0.08, hot_z0, x0 + 1.28, 0.88, hot_z1, CABINET)
    ctx.box(merge, x0 + 0.06, 0.88, hot_z0, x0 + 1.32, 0.95, hot_z1, BENCH_LAB)
    ctx.box(merge, x0 + 0.08, 1.24, hot_z0 + 0.4, x0 + 1.18, 1.46, hot_z1 - 0.4, HOOD)
    for pz in (hot_z0 + 2.4, (hot_z0 + hot_z1) / 2, hot_z1 - 2.4):
        ctx.box(merge, x0 + 0.42, 0.95, pz - 0.45, x0 + 1.02, 1.22, pz + 0.45, MONITOR)
        ctx.box(merge, x0 + 0.38, 1.22, pz - 0.48, x0 + 1.06, 1.26, pz + 0.48, "#C9CCC6")
    for mb_z in (hot_z0 + 3.2, (hot_z0 + hot_z1) / 2, hot_z1 - 3.2):
        ctx.box(merge, x0 + 0.09, 1.00, mb_z - 1.55, x0 + 0.19, 1.45, mb_z + 1.55, BOARD)
        ctx.box(merge, x0 + 0.19, 1.33, mb_z - 1.35, x0 + 0.22, 1.40, mb_z + 1.35, STAIR_MARK)
        ctx.box(merge, x0 + 0.19, 1.12, mb_z - 1.35, x0 + 0.22, 1.25, mb_z + 1.35, PORCELAIN)
    # Front serving counter, closed side wings, stainless tray rail, bain-marie pans & glass sneeze guard.
    ctx.box(merge, x0 + 2.55, 0.08, hot_z0, x0 + 3.85, 0.88, hot_z1, COUNTER)
    ctx.box(merge, x0 + 2.50, 0.88, hot_z0 - 0.04, x0 + 3.92, 0.96, hot_z1 + 0.04, BENCH_LAB)
    for wing_z0, wing_z1 in ((hot_z0, hot_z0 + 0.72), (hot_z1 - 0.72, hot_z1)):
        ctx.box(merge, x0 + 1.28, 0.08, wing_z0, x0 + 2.55, 0.88, wing_z1, COUNTER)
        ctx.box(merge, x0 + 1.28, 0.88, wing_z0, x0 + 2.55, 0.96, wing_z1, BENCH_LAB)
    ctx.box(merge, x0 + 3.92, 0.76, hot_z0 + 0.25, x0 + 4.24, 0.82, hot_z1 - 0.25, "#C9CCC6")
    dish_colors = ("#E7B54A", "#A4473C", "#6E955D", "#D9C3A0", "#C48A5A", "#FBFBF7")
    pan_span = (hot_z1 - hot_z0 - 2.0) / len(dish_colors)
    for idx, dish_col in enumerate(dish_colors):
        pz0 = hot_z0 + 1.0 + idx * pan_span + 0.12
        pz1 = hot_z0 + 1.0 + (idx + 1) * pan_span - 0.12
        ctx.box(merge, x0 + 2.72, 0.96, pz0, x0 + 3.68, 1.02, pz1, HOOD)
        ctx.box(merge, x0 + 2.80, 1.02, pz0 + 0.08, x0 + 3.60, 1.06, pz1 - 0.08, dish_col)
    ctx.box(merge, x0 + 3.74, 0.96, hot_z0 + 0.8, x0 + 3.82, 1.38, hot_z1 - 0.8, GLASS)
    ctx.box(merge, x0 + 2.85, 1.38, hot_z0 + 0.8, x0 + 3.84, 1.43, hot_z1 - 0.8, "#C9CCC6")
    for post_z in (hot_z0 + 0.85, (hot_z0 + hot_z1) / 2, hot_z1 - 0.85):
        ctx.box(merge, x0 + 3.70, 0.96, post_z - 0.05, x0 + 3.82, 1.40, post_z + 0.05, "#C9CCC6")
    add_solid("counter", x0, 0, hot_z0 - 0.05, x0 + 4.25, 1.43, hot_z1 + 0.05)

    # 3. Central Cashier / POS Station (opposite the +x entrance).
    pos_z0, pos_z1 = door_z - 1.55, door_z + 1.55
    ctx.box(merge, x0 + 0.08, 1.00, pos_z0 + 0.15, x0 + 0.20, 1.45, pos_z1 - 0.15, BOARD)
    ctx.box(merge, x0 + 0.20, 1.18, pos_z0 + 0.35, x0 + 0.23, 1.32, pos_z1 - 0.35, LAMP_BULB)
    ctx.box(merge, x0 + 2.35, 0.08, pos_z0, x0 + 3.92, 0.90, pos_z1, COUNTER)
    ctx.box(merge, x0 + 2.28, 0.90, pos_z0 - 0.04, x0 + 3.98, 0.98, pos_z1 + 0.04, DESK)
    for wing_z0, wing_z1 in ((pos_z0, pos_z0 + 0.58), (pos_z1 - 0.58, pos_z1)):
        ctx.box(merge, x0 + 0.10, 0.08, wing_z0, x0 + 2.35, 0.90, wing_z1, COUNTER)
        ctx.box(merge, x0 + 0.10, 0.90, wing_z0, x0 + 2.35, 0.98, wing_z1, DESK)
    for mz in (door_z - 0.68, door_z + 0.68):
        ctx.box(merge, x0 + 3.05, 0.98, mz - 0.08, x0 + 3.22, 1.14, mz + 0.08, MONITOR)
        ctx.box(merge, x0 + 3.00, 1.12, mz - 0.34, x0 + 3.16, 1.38, mz + 0.34, MONITOR)
        ctx.box(merge, x0 + 3.16, 1.15, mz - 0.28, x0 + 3.19, 1.34, mz + 0.28, LED)
        ctx.box(merge, x0 + 3.38, 0.98, mz - 0.18, x0 + 3.66, 1.12, mz + 0.18, PORCELAIN)
    ctx.box(merge, x0 + 1.45, 0.08, door_z - 0.32, x0 + 2.00, 0.52, door_z + 0.32, CHAIR)
    add_solid("counter", x0, 0, pos_z0 - 0.05, x0 + 4.00, 1.40, pos_z1 + 0.05)

    # 4. South-West Beverage, Iced Tea & Chiller Zone (z = door_z + 4.30 .. z1 - 7.40).
    bev_z0, bev_z1 = door_z + 4.30, z1 - 7.40
    for fz in (bev_z0 + 2.1, (bev_z0 + bev_z1) / 2, bev_z1 - 2.1):
        ctx.box(merge, x0 + 0.08, 0.08, fz - 1.15, x0 + 1.16, 1.46, fz + 1.15, RACK)
        ctx.box(merge, x0 + 1.16, 0.18, fz - 1.02, x0 + 1.22, 1.36, fz + 1.02, GLASS)
        ctx.box(merge, x0 + 1.14, 1.37, fz - 1.02, x0 + 1.22, 1.43, fz + 1.02, LED)
        for sy, scol in ((0.38, "#A4473C"), (0.72, "#4FC3F7"), (1.06, "#E7B54A")):
            ctx.box(merge, x0 + 0.35, sy, fz - 0.90, x0 + 1.05, sy + 0.20, fz + 0.90, scol)
    add_solid("fridge", x0, 0, bev_z0 + 0.85, x0 + 1.26, 1.46, bev_z1 - 0.85)
    # Front drink & snack bar with glass pastry case, trà đá dispensers, and stacked cups.
    ctx.box(merge, x0 + 2.45, 0.08, bev_z0, x0 + 3.75, 0.88, bev_z1, COUNTER)
    ctx.box(merge, x0 + 2.40, 0.88, bev_z0 - 0.04, x0 + 3.82, 0.96, bev_z1 + 0.04, BENCH_LAB)
    for wing_z0, wing_z1 in ((bev_z0, bev_z0 + 0.68), (bev_z1 - 0.68, bev_z1)):
        ctx.box(merge, x0 + 1.18, 0.08, wing_z0, x0 + 2.45, 0.88, wing_z1, COUNTER)
        ctx.box(merge, x0 + 1.18, 0.88, wing_z0, x0 + 2.45, 0.96, wing_z1, BENCH_LAB)
    # Glass pastry display case on north half of beverage bar
    ctx.box(merge, x0 + 2.62, 0.96, bev_z0 + 1.1, x0 + 3.68, 1.08, bev_z0 + 4.3, CASE)
    ctx.box(merge, x0 + 2.66, 1.08, bev_z0 + 1.15, x0 + 3.64, 1.38, bev_z0 + 4.25, GLASS)
    ctx.box(merge, x0 + 2.80, 1.10, bev_z0 + 1.4, x0 + 3.50, 1.20, bev_z0 + 4.0, "#E7B54A")
    # Twin stainless iced-tea urns & cup stacks on south half
    for uz in (bev_z1 - 3.6, bev_z1 - 2.3):
        ctx.box(merge, x0 + 2.82, 0.96, uz - 0.32, x0 + 3.46, 1.40, uz + 0.32, "#C9CCC6")
        ctx.box(merge, x0 + 2.78, 1.40, uz - 0.35, x0 + 3.50, 1.45, uz + 0.35, MONITOR)
        ctx.box(merge, x0 + 3.46, 1.06, uz - 0.06, x0 + 3.56, 1.14, uz + 0.06, LED)
    for cz in (bev_z1 - 1.35, bev_z1 - 0.95):
        ctx.box(merge, x0 + 2.95, 0.96, cz - 0.14, x0 + 3.35, 1.22, cz + 0.14, PORCELAIN)
    add_solid("counter", x0, 0, bev_z0 - 0.05, x0 + 3.85, 1.45, bev_z1 + 0.05)

    # 5. North-West Tray Return Rack & Sorting Bins, and South-West Double Handwash Sink.
    ctx.box(merge, x0 + 0.30, 0.08, z0 + 0.12, x0 + 2.75, 1.38, z0 + 1.42, CABINET)
    for sy in (0.45, 0.82, 1.18):
        ctx.box(merge, x0 + 0.36, sy, z0 + 0.18, x0 + 2.68, sy + 0.06, z0 + 1.38, BENCH_LAB)
        ctx.box(merge, x0 + 0.55, sy + 0.06, z0 + 0.30, x0 + 2.45, sy + 0.12, z0 + 1.25, STAIR_MARK)
    ctx.box(merge, x0 + 2.90, 0.08, z0 + 0.18, x0 + 3.48, 0.86, z0 + 1.36, CHAIR)
    ctx.box(merge, x0 + 2.88, 0.86, z0 + 0.16, x0 + 3.50, 0.93, z0 + 1.38, "#6E955D")
    ctx.box(merge, x0 + 3.58, 0.08, z0 + 0.18, x0 + 4.16, 0.86, z0 + 1.36, MONITOR)
    ctx.box(merge, x0 + 3.56, 0.86, z0 + 0.16, x0 + 4.18, 0.93, z0 + 1.38, LED)
    add_solid("rack", x0 + 0.25, 0, z0 + 0.08, x0 + 4.22, 1.40, z0 + 1.50)

    ctx.box(merge, x0 + 0.30, 0.08, z1 - 1.42, x0 + 3.90, 0.78, z1 - 0.12, CABINET)
    ctx.box(merge, x0 + 0.26, 0.78, z1 - 1.46, x0 + 3.94, 0.90, z1 - 0.10, PORCELAIN)
    for sx in (x0 + 1.25, x0 + 2.95):
        ctx.box(merge, sx - 0.55, 0.90, z1 - 1.28, sx + 0.55, 0.96, z1 - 0.30, BENCH_LAB)
        ctx.box(merge, sx - 0.06, 0.90, z1 - 0.32, sx + 0.06, 1.10, z1 - 0.18, "#C9CCC6")
    ctx.box(merge, x0 + 0.55, 1.00, z1 - 0.16, x0 + 3.65, 1.46, z1 - 0.09, WINDOW_FRAME)
    ctx.box(merge, x0 + 0.65, 1.05, z1 - 0.19, x0 + 3.55, 1.42, z1 - 0.15, MIRROR)
    add_solid("sink", x0 + 0.24, 0, z1 - 1.50, x0 + 3.98, 1.42, z1 - 0.08)

    # Corner condiment / utensil consoles on North-East and South-East corners.
    for cz0, cz1 in ((z0 + 0.14, z0 + 1.24), (z1 - 1.24, z1 - 0.14)):
        ctx.box(merge, x1 - 1.45, 0.08, cz0, x1 - 0.14, 0.86, cz1, CABINET)
        ctx.box(merge, x1 - 1.48, 0.86, cz0 - 0.02, x1 - 0.12, 0.93, cz1 + 0.02, DESK)
        ctx.box(merge, x1 - 1.20, 0.93, (cz0 + cz1) / 2 - 0.25, x1 - 0.40, 1.12, (cz0 + cz1) / 2 + 0.25, PORCELAIN)
        add_solid("cabinet", x1 - 1.50, 0, cz0 - 0.04, x1 - 0.10, 1.15, cz1 + 0.04)

    # 6. Student Dining Area: 2 columns x (4 North rows + 4 South rows) = 16 tables, 64 chairs.
    table_cols = (x0 + 8.00, x0 + 12.40)
    north_rows = (z0 + 3.31, z0 + 8.11, z0 + 12.91, z0 + 17.71)
    south_rows = (z1 - 17.62, z1 - 12.82, z1 - 8.02, z1 - 3.22)
    for r_idx, tz in enumerate(north_rows + south_rows):
        for c_idx, tx in enumerate(table_cols):
            # Dining table (2.20 x 1.06) with wood top, apron, 4 metal legs, and tabletop props.
            ctx.box(merge, tx - 1.06, 0.68, tz - 0.49, tx + 1.06, 0.74, tz + 0.49, DESK)
            ctx.box(merge, tx - 1.10, 0.74, tz - 0.53, tx + 1.10, 0.82, tz + 0.53, TABLE)
            for lx in (tx - 0.94, tx + 0.94):
                for lz in (tz - 0.39, tz + 0.39):
                    ctx.box(merge, lx - 0.06, 0.08, lz - 0.06, lx + 0.06, 0.74, lz + 0.06, MONITOR)
            # Condiment caddy on every table; iced-tea tray on alternating tables.
            ctx.box(merge, tx - 0.82, 0.82, tz - 0.14, tx - 0.54, 0.94, tz + 0.14, CABINET)
            ctx.box(merge, tx - 0.78, 0.94, tz - 0.08, tx - 0.68, 1.01, tz + 0.08, BOOKS)
            if (r_idx + c_idx) % 2 == 0:
                ctx.box(merge, tx + 0.25, 0.82, tz - 0.22, tx + 0.78, 0.86, tz + 0.22, STAIR_MARK)
                ctx.box(merge, tx + 0.36, 0.86, tz - 0.12, tx + 0.50, 0.99, tz + 0.02, GLASS)
                ctx.box(merge, tx + 0.56, 0.86, tz - 0.02, tx + 0.70, 0.99, tz + 0.12, GLASS)
            add_solid("table", tx - 1.10, 0, tz - 0.55, tx + 1.10, 0.98, tz + 0.55)

            # 4 chairs per table (2 on -z side, 2 on +z side), flush against the table collider.
            for cx in (tx - 0.58, tx + 0.58):
                for side_dir in (-1, 1):
                    cz = tz + side_dir * 0.90
                    ctx.box(merge, cx - 0.31, 0.43, cz - 0.30, cx + 0.31, 0.50, cz + 0.30, CHAIR)
                    back_z0 = cz - 0.31 if side_dir < 0 else cz + 0.21
                    back_z1 = cz - 0.21 if side_dir < 0 else cz + 0.31
                    ctx.box(merge, cx - 0.31, 0.50, back_z0, cx + 0.31, 0.96, back_z1, CHAIR)
                    for clx in (cx - 0.24, cx + 0.24):
                        for clz in (cz - 0.22, cz + 0.22):
                            ctx.box(merge, clx - 0.04, 0.08, clz - 0.04, clx + 0.04, 0.43, clz + 0.04, MONITOR)
                    col_z0, col_z1 = (tz - 1.22, tz - 0.55) if side_dir < 0 else (tz + 0.55, tz + 1.22)
                    add_solid("chair", cx - 0.34, 0, col_z0, cx + 0.34, 0.96, col_z1)


def open_building(ctx, b, report):
    for f in range(1, b["floors"] + 1):
        merge = ctx.key(b["id"], f)
        emit_slab(ctx, b, f, merge)
        emit_walls(ctx, b, f)
        for hall in b.get("halls", []):
            emit_stairs(ctx, b, hall, f, merge)
    if b.get("program") == "hall":
        emit_hall_program(ctx, b)
    emit_roof(ctx, b)
    for hall in b.get("halls", []):
        H = intersect(tuple(hall["rect"]), interior(ctx, b))
        ctx.halls.append({"building": b["id"], "id": hall["id"], "rect": [round(v, 2) for v in H],
                          "label": hall.get("label"), "stairs": bool(hall.get("stairs"))})


def group_rooms(ctx, group, report):
    parts, slots = group_slots(ctx, group)
    if not parts:
        return
    floors = max(p["floors"] for p in parts)
    prog = ctx.layout["programs"].get(group, {})
    for f in range(1, floors + 1):
        rooms, entries = assign_program(ctx, group, f, slots)
        for room in rooms:
            emit_room(ctx, room, f, ctx.key(room["building"], f))
            ctx.rooms.append({
                "group": group, "building": room["building"], "floor": f,
                "num": "WC" if room["type"] == "wc" else (str(room["num"]) if len(room["nums"]) == 1
                                                           else f"{room['nums'][0]}–{room['nums'][-1]}"),
                "nums": room["nums"], "type": room["type"], "type_name": TYPE_NAME[room["type"]],
                "labels": room["labels"], "floor_label": room["floor_label"],
                "rect": room["rect"], "center": room["center"], "door": room["door"],
            })
        floor_rooms = [r for r in ctx.rooms if r["group"] == group and r["floor"] == f]
        for entry in entries:
            if entry.get("floor_wide"):
                continue
            lo, hi = entry["nums"]
            hits = [r for r in floor_rooms if any(lo <= n <= hi for n in r["nums"])]
            cx = sum(r["center"][0] for r in hits) / len(hits)
            cz = sum(r["center"][2] for r in hits) / len(hits)
            nums = f"P.{lo}" if lo == hi else f"P.{lo}–{hi}"
            ctx.label_groups.append({"group": group, "floor": f, "text": entry["label"], "nums": nums,
                                     "type": entry["type"], "source": entry["source"],
                                     "center": [round(cx, 2), round(floor_y(ctx, f) + 2.6, 2), round(cz, 2)]})
        for r in floor_rooms:
            if r["type"] == "wc":
                ctx.label_groups.append({"group": group, "floor": f, "text": "WC", "nums": "nhà vệ sinh",
                                         "type": "wc", "source": "docs_map_hus_directory",
                                         "center": [r["center"][0], round(floor_y(ctx, f) + 2.6, 2), r["center"][2]]})
        wide = [e["label"] for e in entries if e.get("floor_wide")]
        extra = prog.get("floor_labels", {}).get(str(f))
        if extra:
            wide.append(extra)
        if wide:
            cx = sum(r["center"][0] for r in floor_rooms) / len(floor_rooms)
            cz = sum(r["center"][2] for r in floor_rooms) / len(floor_rooms)
            ctx.floor_labels.append({"group": group, "floor": f, "text": " · ".join(wide),
                                     "center": [round(cx, 2), round(floor_y(ctx, f) + 3.2, 2), round(cz, 2)]})
        report.setdefault(group, {})[str(f)] = len([r for r in rooms if r["type"] != "wc"])
        report.setdefault("wc", {}).setdefault(group, 0)
        report["wc"][group] += len([r for r in rooms if r["type"] == "wc"])


def emit_link(ctx, link):
    pal = ctx.palette
    lid = link["id"]
    x0, z0, x1, z1 = link["rect"]
    wall = pal[link["wall"]]
    can = link.get("canopy")
    if can:
        merge = ctx.key(lid, 1)
        cx0, cz0, cx1, cz1 = can["rect"]
        y = can["y"]
        ctx.box(merge, cx0, y, cz0, cx1, y + 0.25, cz1, shade(wall, 0.92), shape="box", collide=f"{lid}_canopy")
        for i, (px, pz) in enumerate(can["columns"]):
            ctx.box(merge, px - 0.3, 0, pz - 0.3, px + 0.3, y, pz + 0.3, "#E8E2D4", collide=f"{lid}_column_{i}")
    for f in link["floors"]:
        merge = ctx.key(lid, f)
        y0 = floor_y(ctx, f)
        ctx.box(merge, x0, y0 - 0.16, z0, x1, y0 + 0.08, z1, FLOOR_HALL, shape="box", collide=f"{lid}_F{f}_slab")
        for wx0, wx1, out in ((x0, x0 + 0.5, -1), (x1 - 0.5, x1, 1)):
            ctx.box(merge, wx0, y0, z0, wx1, y0 + ctx.FH, z1, wall, collide=f"{lid}_F{f}_wall")
            face = wx1 if out > 0 else wx0
            for k in range(2):
                zc = z0 + (k + 0.5) * (z1 - z0) / 2
                window_unit(ctx, merge, "z", face, out, zc, y0 + 0.3 * ctx.FH, 2.0, 0.44 * ctx.FH, pal["window"], wall)
            ctx.box(merge, (wx0 if out < 0 else wx1) - (0.1 if out < 0 else 0), y0 + ctx.FH - 0.22, z0,
                    (wx0 if out < 0 else wx1) + (0.1 if out > 0 else 0), y0 + ctx.FH, z1, shade(wall, 0.86))
    top = max(link["floors"]) * ctx.FH
    merge = ctx.key(lid, 99)
    ctx.box(merge, x0 - 0.3, top, z0, x1 + 0.3, top + 0.35, z1, pal[link["roof_color"]], shape="box")


def emit_gatehouse(ctx, gh):
    pal = ctx.palette
    gid = gh["id"]
    x0, z0, x1, z1 = gh["rect"]
    l0, l1 = gh["lane"]
    arch = gh["arch_height"]
    top = gh["top"]
    wall = pal[gh["wall"]]
    FH = ctx.FH

    def stacked(rx0, rz0, rx1, rz1, ylo, yhi, color):
        y = ylo
        while y < yhi - 0.01:
            f = int(y // FH) + 1
            nxt = min(yhi, f * FH)
            tag = f if f <= 4 else 99
            ctx.box(ctx.key(gid, tag), rx0, y, rz0, rx1, nxt, rz1, color)
            y = nxt

    for px0, px1 in ((x0, l0), (l1, x1)):
        stacked(px0, z0, px1, z1, 0, top, wall)
        ctx.solids.append(aabb(f"{gid}_pier", px0, 0, z0, px1, top, z1))
    stacked(l0, z0, l1, z1, arch, top, wall)
    # Arch soffit and a red band carrying the HUS letters.
    stacked(l0, z1 - 0.4, l1, z1 + 0.2, arch - 0.5, arch, shade(wall, 0.85))
    merge3 = ctx.key(gid, 3)
    sx = (x0 + x1) / 2
    band_y = 2 * FH + 1.6
    ctx.box(merge3, sx - 7, band_y - 1.1, z1, sx + 7, band_y + 1.1, z1 + 0.2, pal["sign_red"])
    stamp_text(ctx.g, gid + "_facade", "HUS", sx, band_y, z1 + 0.28, 0.32, pal["letter"], 1,
               meta={"kind": "building", "building_id": gid, "group": "T1", "campus": "HUS", "floor": 3})
    for f, y in ((3, 2 * FH + 0.2), (4, 3 * FH + 0.8), (4, 3 * FH + 2.4)):
        for k in range(3):
            wx = l0 + (k + 0.5) * (l1 - l0) / 3
            window_unit(ctx, ctx.key(gid, f), "x", z1, 1, wx, y, 1.6, 1.5, pal["window"], wall)
    for px0, px1 in ((x0, l0), (l1, x1)):
        ctx.box(ctx.key(gid, 1), px0 - 0.1, 0, z0, px1 + 0.1, 1.0, z1 + 0.1, shade(wall, 0.8))
    merge = ctx.key(gid, 99)
    roof = pal[gh["roof_color"]]
    cx, cz = (x0 + x1) / 2, (z0 + z1) / 2
    w, d = x1 - x0, z1 - z0
    ctx.box(merge, x0 - 0.8, top, z0 - 0.8, x1 + 0.8, top + 0.3, z1 + 0.8, shade(wall, 0.85), shape="box")
    ctx.g.add("roof", (cx, top + 0.3, cz), (w + 2.4, 3.2, d + 2.4), roof, "roof", merge=merge)
    ctx.g.add("roof", (cx, top + 0.3, cz), (d + 2.4, 3.2, w * 0.7), roof, "roof", rotation=YAW90, merge=merge)
    ctx.box(merge, cx - 4, top + 2.2, cz - 2.6, cx + 4, top + 3.6, cz + 2.6, wall)
    ctx.g.add("roof", (cx, top + 3.6, cz), (9.6, 2.4, 6.6), roof, "roof", merge=merge)
    ctx.g.add("roof", (cx, top + 3.6, cz), (6.6, 2.4, 6.0), roof, "roof", rotation=YAW90, merge=merge)


def emit_logo_plaque(ctx, logo):
    """Light plaque behind the logo on the T5 court face. The logo image itself is loaded by the web app."""
    b = ctx.buildings[logo["building"]]
    x0, z0, x1, z1 = ctx.footprints[b["id"]]
    h = logo["height"]
    w = h * logo["aspect"]
    pad = logo.get("plaque_pad", 0.9)
    cy = logo["center_y"]
    ca = logo["center_along"]
    merge = ctx.key(b["id"], logo.get("floor_tag", 6))
    face = {"-x": x0, "+x": x1, "-z": z0, "+z": z1}[logo["side"]]
    out = 1 if logo["side"][0] == "+" else -1
    t0, t1 = sorted((face, face + out * 0.18))
    r0, r1 = sorted((face + out * 0.18, face + out * 0.3))
    if logo["side"] in ("-x", "+x"):
        ctx.box(merge, t0, cy - h / 2 - pad, ca - w / 2 - pad, t1, cy + h / 2 + pad, ca + w / 2 + pad,
                ctx.palette["wall_tower"], shape="box")
        ctx.box(merge, r0, cy - h / 2 - pad - 0.25, ca - w / 2 - pad - 0.25, r1, cy - h / 2 - pad + 0.05,
                ca + w / 2 + pad + 0.25, ctx.palette["sign_red"], shape="box")
    else:
        ctx.box(merge, ca - w / 2 - pad, cy - h / 2 - pad, t0, ca + w / 2 + pad, cy + h / 2 + pad, t1,
                ctx.palette["wall_tower"], shape="box")


def emit_lamps(ctx, lamps):
    merge = ("props_lamps", {"kind": "prop"})
    for i, (x, z) in enumerate(lamps):
        ctx.box(merge, x - 0.13, 0, z - 0.13, x + 0.13, 4.2, z + 0.13, LAMP_POLE, collide=f"lamp_{i}")
        ctx.box(merge, x - 0.4, 0, z - 0.4, x + 0.4, 0.35, z + 0.4, LAMP_POLE)
        ctx.box(merge, x - 0.42, 4.2, z - 0.42, x + 0.42, 4.5, z + 0.42, LAMP_POLE, shape="box")
        ctx.box(merge, x - 0.3, 3.85, z - 0.3, x + 0.3, 4.2, z + 0.3, LAMP_BULB, shape="box")


def boundary(ctx):
    bd = ctx.layout.get("boundary", {"x0": -210, "x1": 210, "z0": -260, "z1": 100, "height": 4.5, "thick": 1.4})
    height = bd["height"]
    thick = bd["thick"]
    x0, x1 = bd["x0"], bd["x1"]
    z0, z1 = bd["z0"], bd["z1"]
    walls = [
        ("BOUNDARY_S", (x0, 0, z1 - thick, x1, height, z1)),
        ("BOUNDARY_N", (x0, 0, z0, x1, height, z0 + thick)),
        ("BOUNDARY_E", (x1 - thick, 0, z0 + thick, x1, height, z1 - thick)),
        ("BOUNDARY_W", (x0, 0, z0 + thick, x0 + thick, height, z1 - thick)),
    ]
    for name, (ax0, ay0, az0, ax1, ay1, az1) in walls:
        ctx.g.add(name, ((ax0 + ax1) / 2, (ay0 + ay1) / 2, (az0 + az1) / 2), (ax1 - ax0, ay1 - ay0, az1 - az0),
                  BOUNDARY, extras={"kind": "wall", "collider": True})
        ctx.solids.append(aabb(name, ax0, ay0, az0, ax1, ay1, az1))


# ---------------------------------------------------------------- validation

class Grid:
    """Bucketed colliders for fast walk tests. A body occupies [base+0.2, base+1.7]."""

    def __init__(self, solids, radius, cell=4.0):
        self.cell = cell
        self.radius = radius
        self.buckets = {}
        for s in solids:
            x0, x1 = s["min"][0] - radius, s["max"][0] + radius
            z0, z1 = s["min"][2] - radius, s["max"][2] + radius
            for ix in range(math.floor(x0 / cell), math.floor(x1 / cell) + 1):
                for iz in range(math.floor(z0 / cell), math.floor(z1 / cell) + 1):
                    self.buckets.setdefault((ix, iz), []).append(s)

    def hit(self, x, z, base=0.0):
        r = self.radius
        for s in self.buckets.get((math.floor(x / self.cell), math.floor(z / self.cell)), ()):
            if s["max"][1] <= base + 0.2 or s["min"][1] >= base + 1.7:
                continue
            if s["min"][0] - r <= x <= s["max"][0] + r and s["min"][2] - r <= z <= s["max"][2] + r:
                return s["id"]
        return None


def flood(grid, sources, base, mask, bounds, step):
    x0, z0, x1, z1 = bounds
    nx = int((x1 - x0) / step) + 1
    nz = int((z1 - z0) / step) + 1

    def cell_of(x, z):
        return (round((x - x0) / step), round((z - z0) / step))

    def pos(c):
        return (x0 + c[0] * step, z0 + c[1] * step)

    def ok(c):
        if c[0] < 0 or c[1] < 0 or c[0] >= nx or c[1] >= nz:
            return False
        x, z = pos(c)
        if mask and not mask(x, z):
            return False
        return grid.hit(x, z, base) is None

    seen = set()
    queue = deque()
    for sx, sz in sources:
        c = cell_of(sx, sz)
        if ok(c) and c not in seen:
            seen.add(c)
            queue.append(c)
    while queue:
        cx, cz = queue.popleft()
        for c in ((cx + 1, cz), (cx - 1, cz), (cx, cz + 1), (cx, cz - 1)):
            if c not in seen and ok(c):
                seen.add(c)
                queue.append(c)

    def reach(x, z):
        c = cell_of(x, z)
        for dx in (0, 1, -1):
            for dz in (0, 1, -1):
                if (c[0] + dx, c[1] + dz) in seen:
                    return True
        return False

    return seen, reach


def validate(ctx):
    layout = ctx.layout
    radius = layout["gameplay"]["player_radius"]
    grid = Grid(ctx.solids, radius)
    problems = []
    spawn = layout["gameplay"]["spawn"]
    if grid.hit(spawn[0], spawn[2]):
        raise SystemExit("Spawn is inside a collider")
    step = 0.5
    bd = layout["boundary"]
    # Walkable ground is the pad inside the perimeter wall. The old percentage shrink
    # assumed a large empty apron; the wall now sits just outside the campus.
    inset = bd["thick"] + 0.8
    ground_bounds = (bd["x0"] + inset, bd["z0"] + inset, bd["x1"] - inset, bd["z1"] - inset)
    seen, reach = flood(grid, [(spawn[0], spawn[2])], 0.0, None, ground_bounds, step)
    report = {"ground_cells": len(seen), "grid_step": step, "player_radius": radius}
    for item in layout["gameplay"]["deadlines"]:
        x, _, z = item["position"]
        if not reach(x, z):
            problems.append("deadline unreachable: " + item["id"])
    for gate_entry in layout["gates"]:
        if gate_entry["id"] in layout["gameplay"]["return_gates"]:
            x, z = gate_entry["center_xz"]
            if not reach(x, z):
                problems.append("gate unreachable: " + gate_entry["id"])
    # Wide walkway: gate → T1 lobby → covered walk → T2 hall → lawn.
    axis = layout["gameplay"]["axis_check"]
    z = axis["z_from"]
    while z >= axis["z_to"]:
        for x in axis["x"]:
            hit = grid.hit(x, z)
            if hit:
                problems.append(f"walkway blocked at ({x}, {z:.1f}) by {hit}")
        z -= 0.5
    # Closed USSH blocks: no point inside the footprint is walkable.
    for b in layout["buildings"]:
        if b.get("access") != "closed":
            continue
        x0, z0, x1, z1 = ctx.footprints[b["id"]]
        for px, pz in ((b["center_xz"][0], b["center_xz"][1]), (x0 + 0.6, z0 + 0.6), (x1 - 0.6, z1 - 0.6),
                       ((x0 + x1) / 2, z1 - 0.3), ((x0 + x1) / 2, z0 + 0.3), (x0 + 0.3, (z0 + z1) / 2),
                       (x1 - 0.3, (z0 + z1) / 2)):
            if not grid.hit(px, pz):
                problems.append(f"closed block {b['id']} is open at ({px:.1f}, {pz:.1f})")
    # Ground-floor rooms and stair halls reachable from the street.
    for r in ctx.rooms:
        if r["floor"] == 1 and not reach(r["center"][0], r["center"][2]):
            problems.append(f"room {r['group']} {r['num']} unreachable on floor 1")
    for s in ctx.stairs:
        zx, zz = (s["zone"][0] + s["zone"][2]) / 2, (s["zone"][1] + s["zone"][3]) / 2
        if not reach(zx, zz):
            problems.append(f"stair {s['building']} {s['hall']} unreachable on floor 1")
    # Upper floors: walkable only inside buildings and links that have this floor.
    open_b = [b for b in layout["buildings"] if b.get("access") == "open"]
    top = max(b["floors"] for b in open_b)
    floors_report = {}
    for f in range(2, top + 1):
        areas = [ctx.footprints[b["id"]] for b in open_b if b["floors"] >= f]
        areas += [tuple(l["rect"]) for l in layout.get("links", []) if f in l["floors"]]
        mask = lambda x, z, areas=areas: any(inside(x, z, a) for a in areas)
        sources = []
        for s in ctx.stairs:
            if ctx.buildings[s["building"]]["floors"] >= f:
                sources.append(((s["zone"][0] + s["zone"][2]) / 2, (s["zone"][1] + s["zone"][3]) / 2))
        xs = [a[0] for a in areas] + [a[2] for a in areas]
        zs = [a[1] for a in areas] + [a[3] for a in areas]
        bounds = (math.floor(min(xs)) - 1, math.floor(min(zs)) - 1, math.ceil(max(xs)) + 1, math.ceil(max(zs)) + 1)
        seen_f, reach_f = flood(grid, sources, floor_y(ctx, f), mask, bounds, step)
        floors_report[str(f)] = len(seen_f)
        for r in ctx.rooms:
            if r["floor"] == f and not reach_f(r["center"][0], r["center"][2]):
                problems.append(f"room {r['group']} {r['num']} unreachable on floor {f}")
        for s in ctx.stairs:
            if ctx.buildings[s["building"]]["floors"] >= f:
                zx, zz = (s["zone"][0] + s["zone"][2]) / 2, (s["zone"][1] + s["zone"][3]) / 2
                if grid.hit(zx, zz, floor_y(ctx, f)):
                    problems.append(f"stair zone {s['building']} {s['hall']} blocked on floor {f}")
        # Bridge T1–T2 must connect the two halls on its floors.
        for link in layout.get("links", []):
            if f in link["floors"]:
                lx = (link["rect"][0] + link["rect"][2]) / 2
                for lz in (link["rect"][1] - 3, (link["rect"][1] + link["rect"][3]) / 2, link["rect"][3] + 3):
                    if not reach_f(lx, lz):
                        problems.append(f"link {link['id']} not walkable on floor {f} at z={lz:.1f}")
    report["upper_floor_cells"] = floors_report
    for group, prog in layout["programs"].items():
        want = len(prog.get("wc", []))
        if not want:
            continue
        floors_of = max(b["floors"] for b in layout["buildings"] if b.get("group") == group)
        for f in range(1, floors_of + 1):
            have = len([r for r in ctx.rooms if r["group"] == group and r["floor"] == f and r["type"] == "wc"])
            if have != want:
                problems.append(f"{group} floor {f}: {have} WC, expected {want}")
    # Program rules: T1 and T2 hold no classrooms; every building with WC icons on the map has a WC per floor.
    for r in ctx.rooms:
        if r["group"] in ("T1", "T2") and r["type"] in ("classroom", "lecture"):
            problems.append(f"{r['group']} {r['num']} is a classroom")
    # T5 has exactly the two court doors drawn on the directory sheet; nothing else opens onto the court next to it.
    t5 = ctx.buildings.get("HUS_T5")
    if t5:
        outside = [o for o in t5.get("openings", []) if 1 in o.get("floors", [1]) and o["side"] == "-x"]
        if len(outside) != 2:
            problems.append(f"T5 has {len(outside)} court doors on floor 1, the map shows 2")
        x0, z0, x1, z1 = ctx.footprints["HUS_T5"]
        ex0 = ctx.footprints["HUS_T1_E"][0]
        for z in [z1 + 0.5 + i * 0.5 for i in range(16)]:
            if not grid.hit(ex0 - 0.3, z) and not grid.hit(ex0 + 1.0, z):
                problems.append(f"open doorway beside T5 at z={z:.1f}")
    # Canteen hall: entrance foyer and dining aisles reachable; walls, counters and tables block movement.
    canteen = ctx.buildings.get("HUS_CANTEEN")
    if canteen:
        cx0, cz0, cx1, cz1 = ctx.footprints["HUS_CANTEEN"]
        for px, pz in ((45.5, -167.18), (36.8, -180.0), (36.8, -154.0), (45.9, -180.0), (45.9, -154.0)):
            if not reach(px, pz):
                problems.append(f"canteen walkway unreachable at ({px:.1f}, {pz:.1f})")
        for px, pz in ((cx0 + 0.25, -167.18), (39.2, cz0 + 0.25), (39.2, cz1 - 0.25),
                       (cx1 - 0.25, -180.0), (cx1 - 0.25, -154.0),
                       (33.3, -178.0), (33.3, -167.18), (33.0, -157.0), (39.2, -177.8)):
            if not grid.hit(px, pz):
                problems.append(f"canteen solid missing at ({px:.2f}, {pz:.2f})")
    # The north face of nhà H still stops a walk from the street.
    hx0, hz0, hx1, hz1 = ctx.footprints["USSH_H"]
    hx = (hx0 + hx1) / 2
    z = hz1 + 5.0
    for _ in range(120):
        if grid.hit(hx, z - 0.15):
            break
        z -= 0.15
    if z < hz1 - 0.1:
        problems.append(f"walk crossed nhà H, z={z:.2f}")
    if not grid.hit(bd["x1"] - 0.8, (bd["z0"] + bd["z1"]) / 2) or not grid.hit(0, bd["z1"] - 0.7):
        problems.append("perimeter wall missing")
    if problems:
        raise SystemExit("Validation failed:\n  " + "\n  ".join(problems[:40]))
    report["reachable"] = True
    report["checks"] = ["spawn clear", "deadlines and return gates reachable on floor 1",
                        "18-unit walkway clear from the HUS gate to the lawn",
                        "closed USSH blocks have no walkable point inside",
                        "every HUS room reachable on its own floor", "every stair zone reachable",
                        "T1–T2 bridge walkable on floors 2–3", "WC on every floor where the map shows one; no classrooms in T1/T2",
                        "nhà H stops a northbound walk", "perimeter wall present"]
    return report


# ---------------------------------------------------------------- build

def build_room_templates(layout_path):
    """Larger playable room maps; campus footprints and corridor portals stay authored in the directory layout.

    Visual furniture and collision envelopes are emitted by the same helpers. Room dimensions,
    rows, columns and required accessible destinations live in public/data/room-layouts.json.
    """
    layout = json.loads(layout_path.read_text(encoding="utf-8"))
    source = ROOT.parents[1] / "web/public/data/room-layouts.json"
    specs = json.loads(source.read_text(encoding="utf-8"))
    templates = {}
    folder = ROOT / "assets/models/rooms"
    folder.mkdir(parents=True, exist_ok=True)
    for kind, spec in specs["rooms"].items():
        ctx = Ctx(layout)
        width, depth = spec["width"], spec["depth"]
        w, d = width / 2, depth / 2
        merge = ("room_" + kind, {"kind": "room", "group": kind, "floor": 1})
        furniture = []

        def part(x, z, sx, sz, low, high, color, collider=None):
            ctx.box(merge, x - sx / 2, low, z - sz / 2, x + sx / 2, high, z + sz / 2, color)
            if collider:
                box = aabb(f"{kind}_{collider}_{len(ctx.solids)}", x - sx / 2, low, z - sz / 2,
                           x + sx / 2, high, z + sz / 2)
                box["kind"] = collider
                ctx.solids.append(box)
                if collider != "wall":
                    furniture.append(box)

        def chair(x, z):
            part(x, z, .9, .9, .42, .53, CHAIR)
            part(x, z + .38, .9, .13, .5, 1.1, CHAIR)
            for dx in (-.32, .32):
                for dz in (-.32, .32):
                    part(x + dx, z + dz, .09, .09, .05, .42, MONITOR)
            # Full footprint: players cannot walk beneath the seat or between its legs.
            box = aabb(f"{kind}_chair_{len(ctx.solids)}", x - .45, 0, z - .45, x + .45, 1.1, z + .45)
            box["kind"] = "chair";ctx.solids.append(box);furniture.append(box)

        def desk(x, z, computer=False, sx=2.4):
            part(x, z, sx, 1.05, .73, .84, DESK)
            for dx in (-sx / 2 + .15, sx / 2 - .15):
                for dz in (-.37, .37):
                    part(x + dx, z + dz, .12, .12, .05, .73, MONITOR)
            box = aabb(f"{kind}_desk_{len(ctx.solids)}", x - sx / 2, 0, z - .525, x + sx / 2, 1.4, z + .525)
            box["kind"] = "desk";ctx.solids.append(box);furniture.append(box)
            if computer:
                part(x, z - .2, .12, .12, .84, 1.05, MONITOR)
                part(x, z - .25, 1.15, .13, 1.0, 1.65, MONITOR)
                part(x, z - .17, 1.0, .025, 1.08, 1.55, LED)
                part(x, z + .28, .8, .25, .84, .88, CHAIR)
                part(x + sx / 2 - .3, z, .35, .65, .1, .7, RACK)
            else:
                part(x - .5, z, .45, .55, .84, .87, PORCELAIN)
                part(x + .45, z, .35, .45, .84, .9, BOOKS)
            chair(x, z + 1.25)

        # Floor, repeated tile joints, three continuous walls and a wide entrance gap.
        part(0, 0, width, depth, -.12, .03, TYPE_FLOOR[kind])
        for x in range(-int(w) + 2, int(w), 2):
            part(x, 0, .035, depth - .1, .031, .063, FLOOR_LOBBY)
        for z in range(-int(d) + 2, int(d), 2):
            part(0, z, width - .1, .035, .031, .063, FLOOR_LOBBY)
        part(-w, 0, .3, depth, 0, 3.5, layout["palette"]["wall_cream"], "wall")
        part(w, 0, .3, depth, 0, 3.5, layout["palette"]["wall_cream"], "wall")
        part(0, -d, width, .3, 0, 3.5, layout["palette"]["wall_cream"], "wall")
        door = specs["doorWidth"]
        for side in (-1, 1):
            span = w - door / 2
            part(side * (w + door / 2) / 2, d, span, .3, 0, 3.5, layout["palette"]["wall_cream"], "wall")
        part(0, d - .7, door, .8, .04, .08, STAIR_MARK)
        for x in (-w + .2, w - .2):
            for z in (-d * .55, 0, d * .55):
                part(x, z, .08, 2.3, .9, 2.5, WINDOW_IN)

        if kind in ("classroom", "lecture", "server", "office"):
            computer = kind in ("server", "office")
            for x in spec["columns"]:
                for z in spec["rows"]:
                    desk(x, z, computer)
            if kind in ("classroom", "lecture"):
                part(0, -d + .25, width * .55, .13, .85, 2.8, BOARD)
                desk(-5, -d + 3)
                part(5, -d + 1, 4, 1.1, 0, 1.4, CABINET, "cabinet")
            elif kind == "server":
                for x in (-8, -4, 4, 8):
                    part(x, -d + 2, 2.4, 1.2, 0, 2.4, RACK, "rack")
                    for y in (.4, .7, 1.0, 1.3):
                        part(x, -d + 2.62, 1.9, .06, y, y + .06, LED)
            else:
                part(-w + .7, -d + 2, 1, 3, 0, 1.4, CABINET, "cabinet")
                part(w - .7, -d + 2, 1, 3, 0, 1.4, CABINET, "cabinet")
        elif kind == "lab":
            for x in spec["columns"]:
                for z in spec["rows"]:
                    part(x, z, 5, 1.7, 0, .9, CABINET, "lab-bench")
                    part(x, z, 5, 1.7, .9, 1, BENCH_LAB)
                    for dx in (-1.3, 1.3):
                        part(x + dx, z, .5, .6, 1, 1.1, MONITOR)
                        part(x + dx, z - .15, .16, .16, 1.1, 1.4, GLASS)
                        chair(x + dx, z + 1.7)
            part(-6, -d + 2, 6, 1.6, 0, 1.4, HOOD, "equipment")
            part(6, -d + 2, 6, 1.6, 0, 1.1, CABINET, "cabinet")
            part(6, -d + 2, 1.2, .9, 1.1, 1.15, MONITOR)
        elif kind == "meeting":
            part(0, 0, 5.5, 11, 0, .82, TABLE, "table")
            for z in (-4, -1.4, 1.4, 4):
                chair(-3.6, z);chair(3.6, z)
            part(0, -d + .3, 8, .15, .8, 2.8, BOARD)
        elif kind == "library":
            for x in spec["columns"]:
                for z in (-5, 1):
                    part(x, z, 1.1, 4, 0, 2.2, SHELF, "shelf")
                    for y in (.4, .85, 1.3):
                        part(x + .57, z, .08, 3.6, y, y + .28, BOOKS)
            desk(-5, 7);desk(5, 7)
        elif kind == "lounge":
            part(-6, -2, 2, 7, 0, .9, SOFA, "sofa")
            part(6, -2, 2, 7, 0, .9, SOFA, "sofa")
            part(-3.5, -2, 1.5, 3, 0, .5, TABLE, "table")
            part(3.5, -2, 1.5, 3, 0, .5, TABLE, "table")
        elif kind == "exhibit":
            for x in (-6, 6):
                for z in (-6, 0, 6):
                    part(x, z, 3, 2, 0, 1, CASE, "display")
                    part(x, z, 2.8, 1.8, 1, 1.4, GLASS)
        elif kind == "wc":
            for x in (-4, 0, 4):
                part(x, -d + 2, 2.8, 3.2, 0, 1.4, STALL, "stall")
            part(-w + 1, 1, 1.3, 4, 0, .9, PORCELAIN, "sink")

        ctx.g.write(folder / (kind + ".glb"))
        templates[kind] = {
            "kind": kind, "model": "models/interiors/rooms/" + kind + ".glb",
            "modelSha256": hashlib.sha256((folder / (kind + ".glb")).read_bytes()).hexdigest(),
            "width": width + 4, "depth": depth + 4, "sourceCenter": [0, 0],
            "regions": [[-w, -d, w, d]], "clipRect": [-w, -d, w, d],
            "entry": [0, d - 2.2], "solids": ctx.solids, "furniture": furniture,
            "walkPoints": spec["walkPoints"], "camera": specs["camera"], "verified": False,
        }
        print("Room template", kind, width, depth, len(furniture), "furniture colliders")
    (ROOT / "data/room_templates.json").write_text(json.dumps(templates, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")


def build(layout_path):
    layout = json.loads(layout_path.read_text(encoding="utf-8"))
    ctx = Ctx(layout)
    g = ctx.g
    palette = ctx.palette
    g.doc["asset"]["extras"] = {
        "accuracy": "illustrative_approximate_not_surveyed",
        "units": "game_units_not_verified_meters",
        "source_layout": "data/campus.layout.json",
    }
    for surface in layout["surfaces"]:
        g.add(surface["id"], surface["position"], surface["size"], palette[surface["color"]],
              extras={"kind": "surface", "approximate": True, "collider": False})
    dashes = layout["road_dashes"]
    x = dashes["x_start"]
    while x <= dashes["x_end"]:
        g.add("road_dash", (x, .04, dashes["z"]), (7, .04, .4), "#EEE9D6", merge=("road_dashes", {}))
        x += dashes["step"]
    rail = layout["railway"]
    g.add("railway_deck", rail["deck_center"], rail["deck_size"], palette[rail["color"]],
          extras={"kind": "railway", "collider": False})
    for i, px in enumerate(rail["pillar_xs"]):
        g.add("railway_pillar_" + str(i), (px, rail["pillar_size"][1] / 2, rail["deck_center"][2]),
              rail["pillar_size"], palette[rail["color"]], extras={"kind": "pillar", "collider": True})
        ps = rail["pillar_size"]
        ctx.solids.append(aabb("railway_pillar_" + str(i), px - ps[0] / 2, 0, rail["deck_center"][2] - ps[2] / 2,
                               px + ps[0] / 2, ps[1], rail["deck_center"][2] + ps[2] / 2))

    room_report = {}
    for b in layout["buildings"]:
        access = b.get("access")
        if access == "closed":
            closed_block(ctx, b)
        elif access == "open":
            open_building(ctx, b, room_report)
        else:
            solid_platform(ctx, b)
    groups = []
    for b in layout["buildings"]:
        if b.get("access") == "open" and b.get("program") != "hall" and b["group"] not in groups:
            groups.append(b["group"])
    for group in groups:
        group_rooms(ctx, group, room_report)
    emit_hall_junctions(ctx)
    for link in layout.get("links", []):
        emit_link(ctx, link)
    if layout.get("gatehouse"):
        emit_gatehouse(ctx, layout["gatehouse"])
    if layout.get("logo"):
        emit_logo_plaque(ctx, layout["logo"])
    emit_lamps(ctx, layout.get("lamps", {}).get("positions", []))
    boundary(ctx)

    for i, t in enumerate(layout["trees"]):
        tree(g, "tree_" + str(i), t[0], t[1], t[2])
    for i, p in enumerate(layout["benches"]):
        bench(g, "bench_" + str(i), *p, merge=("props_benches", {"kind": "prop"}))
    for entry in layout["gates"]:
        pillar_h = gate(g, entry, palette)
        x, z = entry["center_xz"]
        off = entry.get("pillar_offset", 7)
        for dx in (-off, off):
            ctx.solids.append(aabb(entry["id"] + "_pillar", x + dx - .65, 0, z - .75, x + dx + .65, pillar_h, z + .75))
    bikes = layout["motorbikes"]
    for i, p in enumerate(bikes["positions"] + bikes.get("hus_positions", [])):
        motorbike(g, "parked_bike_" + str(i), *p, merge=("props_bikes", {"kind": "prop"}))
    for vine in layout["vines"]["items"]:
        g.add(vine["id"], vine["position"], vine["size"], palette[vine["color"]],
              extras={"kind": "vine", "collider": False, "approximate": True})

    reach = validate(ctx)
    collision = {
        "source_layout": "data/campus.layout.json",
        "up": "Y",
        "note": ("Walls per floor, room partitions, stair flights, bridge walls, closed USSH blocks, the perimeter "
                 "wall, gate piers, canopy columns and railway piers. A body blocks only against solids that "
                 "overlap its own floor band. Furniture, trees, benches and signs are not colliders."),
        "player_radius": layout["gameplay"]["player_radius"],
        "solids": ctx.solids,
        "reachability": reach,
    }
    (ROOT / "data" / "collision.json").write_text(json.dumps(collision, separators=(",", ":")), encoding="utf-8")

    interiors = {
        "source_layout": "data/campus.layout.json",
        "floor_height": ctx.FH,
        "note": ("Floors and which offices sit on which floor follow the HUS directory board (docs/map/hus_directory.png) "
                 "plus a 2014 VNU lab list. Room order along a floor is generated: the number tells the floor, "
                 "not the exact spot."),
        "buildings": [{"id": b["id"], "group": b.get("group", b["id"]), "campus": b["campus"],
                       "floors": b.get("floors", 0), "access": b.get("access", "solid"),
                       "name": b.get("display_name") or (f"Nhà {b['verified_name']}" if b.get("verified_name") else b["id"]),
                       "footprint": list(ctx.footprints[b["id"]])} for b in layout["buildings"]],
        "links": [{"id": l["id"], "rect": l["rect"], "floors": l["floors"]} for l in layout.get("links", [])],
        "logo": layout.get("logo"),
        "lamps": layout.get("lamps", {}).get("positions", []),
        "stairs": ctx.stairs,
        "halls": ctx.halls,
        "junctions": ctx.junctions,
        "rooms": ctx.rooms,
        "label_groups": ctx.label_groups,
        "floor_labels": ctx.floor_labels,
    }
    (ROOT / "data" / "interiors.json").write_text(json.dumps(interiors, ensure_ascii=False, separators=(",", ":")),
                                                  encoding="utf-8")

    outputs = [g.write(ROOT / "assets/models/campus_blockout.glb")]
    generators = {
        "unit_block": lambda s: s.add("unit_block", (0, .5, 0), (1, 1, 1), palette["wall_yellow"]),
        "gable_roof": lambda s: s.add("gable_roof", (0, 0, 0), (1, 1, 1), palette["roof_red"], "roof"),
        "tree_lowpoly": lambda s: tree(s, "tree", 0, 0),
        "bench": lambda s: bench(s, "bench", 0, 0),
        "gate_placeholder": lambda s: gate(s, {"id": "gate", "label": "USSH", "center_xz": [0, 0],
                                               "accent": "sign_red"}, palette),
        "motorbike_toy": lambda s: motorbike(s, "motorbike", 0, 0),
    }
    for name, fn in generators.items():
        item = GLB()
        fn(item)
        outputs.append(item.write(ROOT / "assets/models" / (name + ".glb")))
    types = {}
    for r in ctx.rooms:
        types[r["type"]] = types.get(r["type"], 0) + 1
    report = {"status": "generated", "accuracy": "floors_and_offices_from_hus_directory; positions_and_sizes_estimated",
              "reachability": reach, "rooms_per_group_floor": room_report, "room_types": types,
              "named_groups": len(ctx.label_groups), "stairs": len(ctx.stairs), "solids": len(ctx.solids),
              "outputs": outputs}
    (ROOT / "data" / "build_report.json").write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
    print(json.dumps({k: v for k, v in report.items() if k != "reachability"} |
                     {"reachability": {k: v for k, v in reach.items() if k != "checks"}}, indent=2, ensure_ascii=False))
    build_room_templates(layout_path)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--layout", type=Path, default=ROOT / "data/campus.layout.json")
    parser.add_argument("--rooms-only", action="store_true", help="Rebuild standalone playable room maps only")
    args = parser.parse_args()
    if args.rooms_only:
        build_room_templates(args.layout)
    else:
        build(args.layout)
