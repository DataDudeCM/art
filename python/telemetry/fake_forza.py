"""Fake Forza Horizon 4: sends made-up Data Out packets for testing.

A car drives a figure-eight, slowing for the turns, with an occasional
crash (a sudden loss of speed). Packets use the real FH4 format, so
anything that works with this should work with the game.

    python fake_forza.py                 # 60 packets/s to 127.0.0.1:5300
    python fake_forza.py --seconds 30    # stop after 30 seconds
"""

import argparse
import math
import random
import socket
import time

import forza

TRACK_SIZE = 300.0  # metres from the centre to the end of a lobe
TOP_SPEED = 45.0  # m/s on straights (~160 km/h)
TURN_SPEED = 15.0  # m/s minimum, even in the tightest turns
MAX_LATERAL_ACCEL = 9.0  # m/s^2 of cornering grip (~0.9 g)
IDLE_RPM = 900.0
MAX_RPM = 7500.0
GEAR_TOP_SPEEDS = [12, 22, 32, 42, 55, 70]  # m/s at redline in gears 1-6


def track_point(theta):
    """Figure-eight (lemniscate of Gerono) in the X/Z plane; Y is up."""
    return (TRACK_SIZE * math.sin(theta), TRACK_SIZE * math.sin(theta) * math.cos(theta))


def track_tangent(theta):
    return (TRACK_SIZE * math.cos(theta), TRACK_SIZE * math.cos(2 * theta))


def corner_speed(theta):
    """Fastest speed the car can take this point of the track at."""
    dx, dz = track_tangent(theta)
    ddx, ddz = -TRACK_SIZE * math.sin(theta), -2 * TRACK_SIZE * math.sin(2 * theta)
    curvature = abs(dx * ddz - dz * ddx) / max(math.hypot(dx, dz) ** 3, 1e-9)
    radius = 1.0 / max(curvature, 1e-9)
    return max(TURN_SPEED, min(TOP_SPEED, math.sqrt(MAX_LATERAL_ACCEL * radius)))


class FakeCar:
    def __init__(self, rate):
        self.dt = 1.0 / rate
        self.theta = 0.0
        self.speed = TURN_SPEED
        # Start already moving along the track, so the first packet
        # doesn't show a huge jump in velocity or heading.
        tx, tz = track_tangent(self.theta)
        tangent_len = math.hypot(tx, tz)
        self.vel = (self.speed * tx / tangent_len, 0.0, self.speed * tz / tangent_len)
        self.yaw = math.atan2(self.vel[0], self.vel[2])
        self.steps = 0
        self.next_crash = random.uniform(8, 15)
        self.crash_steps = 0
        self.crash_decel = 0.0

    def step(self):
        t = self.steps * self.dt

        # Brake for corners a little before reaching them.
        target = min(corner_speed(self.theta), corner_speed(self.theta + 0.15))
        tx, tz = track_tangent(self.theta)
        tangent_len = math.hypot(tx, tz)

        # Crash: lose 20-70% of the speed over a tenth of a second.
        if t >= self.next_crash:
            self.next_crash = t + random.uniform(8, 15)
            self.crash_steps = max(1, round(0.1 / self.dt))
            self.crash_decel = self.speed * random.uniform(0.2, 0.7) / 0.1

        if self.crash_steps > 0:
            self.crash_steps -= 1
            self.speed = max(0.0, self.speed - self.crash_decel * self.dt)
            throttle, brake = 0, 0
        elif self.speed < target:
            self.speed = min(target, self.speed + 6.0 * self.dt)
            throttle, brake = 255, 0
        else:
            self.speed = max(target, self.speed - 10.0 * self.dt)
            throttle, brake = 0, 200

        # Advance along the track.
        self.theta += self.speed * self.dt / max(tangent_len, 1e-6)
        x, z = track_point(self.theta)
        tx, tz = track_tangent(self.theta)
        tangent_len = math.hypot(tx, tz)
        new_vel = (self.speed * tx / tangent_len, 0.0, self.speed * tz / tangent_len)

        # World acceleration, then rotate into car-local axes
        # (X = right, Z = forward), as Forza reports it.
        ax, az = ((new_vel[0] - self.vel[0]) / self.dt, (new_vel[2] - self.vel[2]) / self.dt)
        new_yaw = math.atan2(new_vel[0], new_vel[2])
        yaw_rate = _angle_diff(new_yaw, self.yaw) / self.dt
        fx, fz = math.sin(new_yaw), math.cos(new_yaw)  # forward
        rx, rz = fz, -fx  # right
        local_accel_x = ax * rx + az * rz
        local_accel_z = ax * fx + az * fz
        self.vel, self.yaw = new_vel, new_yaw

        gear = next((i + 1 for i, top in enumerate(GEAR_TOP_SPEEDS) if self.speed < top),
                    len(GEAR_TOP_SPEEDS))
        low = GEAR_TOP_SPEEDS[gear - 2] * 0.6 if gear > 1 else 0.0
        top = GEAR_TOP_SPEEDS[gear - 1]
        rpm = IDLE_RPM + (MAX_RPM - IDLE_RPM) * max(0.0, (self.speed - low) / (top - low))

        packet = forza.pack({
            "is_race_on": 1,
            "timestamp_ms": round(t * 1000),
            "engine_max_rpm": MAX_RPM,
            "engine_idle_rpm": IDLE_RPM,
            "current_engine_rpm": rpm,
            "accel_x": local_accel_x,
            "accel_y": 0.0,
            "accel_z": local_accel_z,
            # Velocity is car-local too: all of it is forward.
            "vel_z": self.speed,
            "ang_vel_y": yaw_rate,
            "yaw": self.yaw,
            "pos_x": x,
            "pos_y": 0.0,
            "pos_z": z,
            "speed": self.speed,
            "accel": throttle,
            "brake": brake,
            "gear": gear,
            "steer": max(-127, min(127, round(yaw_rate * 150))),
        })
        self.steps += 1
        return packet


def _angle_diff(a, b):
    return (a - b + math.pi) % (2 * math.pi) - math.pi


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=forza.DEFAULT_PORT)
    parser.add_argument("--rate", type=int, default=60, help="packets per second")
    parser.add_argument("--seconds", type=float, help="stop after this many seconds")
    args = parser.parse_args()

    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    car = FakeCar(args.rate)
    print(f"Sending fake FH4 telemetry to {args.host}:{args.port} at {args.rate}/s. Ctrl+C to stop.")

    start = time.perf_counter()
    sent = 0
    try:
        while args.seconds is None or sent < args.seconds * args.rate:
            sock.sendto(car.step(), (args.host, args.port))
            sent += 1
            # Pace against the clock so the rate doesn't drift.
            delay = start + sent / args.rate - time.perf_counter()
            if delay > 0:
                time.sleep(delay)
    except KeyboardInterrupt:
        pass
    print(f"Sent {sent} packets.")


if __name__ == "__main__":
    main()
