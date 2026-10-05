"""Forza Horizon 4 "Data Out" packet format and adapter.

FH4 sends 324-byte "Dash" packets over UDP (Settings > HUD and Gameplay >
Data Out). The layout is Forza Motorsport 7's Dash format with 12 extra
bytes inserted after the Sled section. All values are little-endian.

The adapter turns packets into records in the common telemetry format
(see docs/game-telemetry.md): one "sample" per packet, plus "event"
records for things it detects, such as impacts.
"""

import math
import struct

SOURCE = "forza"
DEFAULT_PORT = 5300

# (name, struct code), in packet order.
_SLED = [
    ("is_race_on", "i"),
    ("timestamp_ms", "I"),
    ("engine_max_rpm", "f"),
    ("engine_idle_rpm", "f"),
    ("current_engine_rpm", "f"),
    # Acceleration and velocity are in car-local axes:
    # X = right, Y = up, Z = forward.
    ("accel_x", "f"), ("accel_y", "f"), ("accel_z", "f"),
    ("vel_x", "f"), ("vel_y", "f"), ("vel_z", "f"),
    ("ang_vel_x", "f"), ("ang_vel_y", "f"), ("ang_vel_z", "f"),
    ("yaw", "f"), ("pitch", "f"), ("roll", "f"),
    ("susp_norm_fl", "f"), ("susp_norm_fr", "f"), ("susp_norm_rl", "f"), ("susp_norm_rr", "f"),
    ("tire_slip_ratio_fl", "f"), ("tire_slip_ratio_fr", "f"), ("tire_slip_ratio_rl", "f"), ("tire_slip_ratio_rr", "f"),
    ("wheel_rot_fl", "f"), ("wheel_rot_fr", "f"), ("wheel_rot_rl", "f"), ("wheel_rot_rr", "f"),
    ("rumble_fl", "i"), ("rumble_fr", "i"), ("rumble_rl", "i"), ("rumble_rr", "i"),
    ("puddle_fl", "f"), ("puddle_fr", "f"), ("puddle_rl", "f"), ("puddle_rr", "f"),
    ("surface_rumble_fl", "f"), ("surface_rumble_fr", "f"), ("surface_rumble_rl", "f"), ("surface_rumble_rr", "f"),
    ("tire_slip_angle_fl", "f"), ("tire_slip_angle_fr", "f"), ("tire_slip_angle_rl", "f"), ("tire_slip_angle_rr", "f"),
    ("tire_combined_slip_fl", "f"), ("tire_combined_slip_fr", "f"), ("tire_combined_slip_rl", "f"), ("tire_combined_slip_rr", "f"),
    ("susp_m_fl", "f"), ("susp_m_fr", "f"), ("susp_m_rl", "f"), ("susp_m_rr", "f"),
    ("car_ordinal", "i"),
    ("car_class", "i"),
    ("car_performance_index", "i"),
    ("drivetrain_type", "i"),
    ("num_cylinders", "i"),
]

_HORIZON_EXTRA = [("horizon_unknown", "12s")]

_DASH = [
    ("pos_x", "f"), ("pos_y", "f"), ("pos_z", "f"),  # world position, metres; Y is up
    ("speed", "f"),  # m/s
    ("power", "f"),  # watts
    ("torque", "f"),  # newton-metres
    ("tire_temp_fl", "f"), ("tire_temp_fr", "f"), ("tire_temp_rl", "f"), ("tire_temp_rr", "f"),
    ("boost", "f"),
    ("fuel", "f"),
    ("distance_traveled", "f"),
    ("best_lap", "f"),
    ("last_lap", "f"),
    ("current_lap", "f"),
    ("current_race_time", "f"),
    ("lap_number", "H"),
    ("race_position", "B"),
    ("accel", "B"),  # throttle, 0-255
    ("brake", "B"),  # 0-255
    ("clutch", "B"),
    ("handbrake", "B"),
    ("gear", "B"),
    ("steer", "b"),  # -127 (left) to 127 (right)
    ("driving_line", "b"),
    ("ai_brake_difference", "b"),
]

_FIELDS = _SLED + _HORIZON_EXTRA + _DASH
FIELD_NAMES = [name for name, _ in _FIELDS]
_STRUCT = struct.Struct("<" + "".join(code for _, code in _FIELDS) + "x")  # 1 pad byte
PACKET_SIZE = _STRUCT.size  # 324

assert PACKET_SIZE == 324, PACKET_SIZE


def parse(data: bytes) -> dict | None:
    """Parse one packet into a dict of named fields, or None if it isn't FH4 Dash."""
    if len(data) != PACKET_SIZE:
        return None
    return dict(zip(FIELD_NAMES, _STRUCT.unpack(data)))


def pack(fields: dict) -> bytes:
    """Build a packet from named fields. Missing fields default to zero.

    Used by the fake sender; the real game builds its own packets.
    """
    values = []
    for name, code in _FIELDS:
        default = b"" if code.endswith("s") else 0
        values.append(fields.get(name, default))
    return _STRUCT.pack(*values)


class ForzaAdapter:
    """Converts parsed Forza packets into common-format records."""

    # Total acceleration above this (m/s^2, ~3 g) counts as an impact.
    IMPACT_THRESHOLD = 30.0
    # Ignore further impacts for this long after one, so a single crash
    # isn't reported many times.
    IMPACT_COOLDOWN = 1.0

    def __init__(self):
        self._first_ms = None
        self._last_impact_t = -math.inf

    def to_records(self, packet: dict) -> list[dict]:
        if not packet["is_race_on"]:
            return []  # paused, in menus, or loading

        if self._first_ms is None:
            self._first_ms = packet["timestamp_ms"]
        t = round((packet["timestamp_ms"] - self._first_ms) / 1000.0, 3)

        accel = [packet["accel_x"], packet["accel_y"], packet["accel_z"]]
        records = [{
            "t": t,
            "src": SOURCE,
            "kind": "sample",
            "pos": _round([packet["pos_x"], packet["pos_y"], packet["pos_z"]]),
            # Car-local axes (X right, Y up, Z forward), as Forza sends them.
            "vel_local": _round([packet["vel_x"], packet["vel_y"], packet["vel_z"]]),
            "accel_local": _round(accel),
            "speed": round(packet["speed"], 2),
            "yaw": round(packet["yaw"], 4),
            "rpm": round(packet["current_engine_rpm"]),
            "gear": packet["gear"],
            "throttle": round(packet["accel"] / 255, 3),
            "brake": round(packet["brake"] / 255, 3),
            "steer": round(packet["steer"] / 127, 3),
        }]

        # Impacts: a spike in total acceleration.
        g = math.sqrt(sum(a * a for a in accel))
        if g > self.IMPACT_THRESHOLD and t - self._last_impact_t > self.IMPACT_COOLDOWN:
            self._last_impact_t = t
            records.append({
                "t": t,
                "src": SOURCE,
                "kind": "event",
                "type": "impact",
                "intensity": round(min(g / 200.0, 1.0), 3),  # 1.0 at ~20 g
                "pos": records[0]["pos"],
            })

        return records


def _round(values, digits=2):
    return [round(v, digits) for v in values]
