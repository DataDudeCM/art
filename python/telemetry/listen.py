"""Listen for Forza Horizon 4 telemetry and print it in the common format.

Works with the real game (Data Out on, IP 127.0.0.1, port 5300) or with
fake_forza.py. Prints a status line a few times a second, and events
(such as impacts) as they happen.

    python listen.py            # status lines and events
    python listen.py --json     # every record as one JSON line
"""

import argparse
import json
import socket
import time

import forza

STATUS_INTERVAL = 0.25  # seconds between status lines


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--port", type=int, default=forza.DEFAULT_PORT)
    parser.add_argument("--json", action="store_true", help="print every record as JSON")
    args = parser.parse_args()

    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.bind(("0.0.0.0", args.port))
    sock.settimeout(1.0)  # wake up regularly so Ctrl+C works on Windows
    adapter = forza.ForzaAdapter()
    print(f"Listening for Forza telemetry on UDP port {args.port}. Ctrl+C to stop.")

    packets = skipped = 0
    last_status = 0.0
    try:
        while True:
            try:
                data, _ = sock.recvfrom(1024)
            except socket.timeout:
                continue

            packet = forza.parse(data)
            if packet is None:
                skipped += 1
                if skipped == 1:
                    print(f"Ignoring {len(data)}-byte packet: expected {forza.PACKET_SIZE} "
                          "(is the game set to the Dash format?)")
                continue
            packets += 1

            for record in adapter.to_records(packet):
                if args.json:
                    print(json.dumps(record))
                elif record["kind"] == "event":
                    print(f"  ** {record['type']} at t={record['t']:.2f}s, "
                          f"intensity {record['intensity']:.2f}")
                elif time.monotonic() - last_status >= STATUS_INTERVAL:
                    last_status = time.monotonic()
                    print(status_line(record))
    except KeyboardInterrupt:
        pass
    print(f"\nReceived {packets} packets" + (f", ignored {skipped}" if skipped else "") + ".")


def status_line(sample):
    x, y, z = sample["pos"]
    return (f"t={sample['t']:7.2f}s  {sample['speed'] * 3.6:6.1f} km/h  gear {sample['gear']}  "
            f"{sample['rpm']:5d} rpm  thr {sample['throttle']:.2f}  brk {sample['brake']:.2f}  "
            f"steer {sample['steer']:+.2f}  pos ({x:8.1f}, {y:6.1f}, {z:8.1f})")


if __name__ == "__main__":
    main()
