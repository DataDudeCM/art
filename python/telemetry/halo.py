
import ctypes
from ctypes import wintypes
import struct
import psutil

# Requires 64-bit Python on 64-bit Windows.
if struct.calcsize("P") != 8:
    raise RuntimeError("Please use 64-bit Python.")

PROCESS_QUERY_INFORMATION = 0x0400
PROCESS_VM_READ = 0x0010
MEM_COMMIT = 0x1000
PAGE_GUARD = 0x100
PAGE_NOACCESS = 0x01

READABLE = {0x02, 0x04, 0x08, 0x20, 0x40, 0x80}

class MEMORY_BASIC_INFORMATION(ctypes.Structure):
    _fields_ = [
        ("BaseAddress", ctypes.c_void_p),
        ("AllocationBase", ctypes.c_void_p),
        ("AllocationProtect", wintypes.DWORD),
        ("PartitionId", wintypes.WORD),
        ("RegionSize", ctypes.c_size_t),
        ("State", wintypes.DWORD),
        ("Protect", wintypes.DWORD),
        ("Type", wintypes.DWORD),
    ]

kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)

kernel32.OpenProcess.argtypes = [
    wintypes.DWORD, wintypes.BOOL, wintypes.DWORD
]
kernel32.OpenProcess.restype = wintypes.HANDLE

kernel32.VirtualQueryEx.argtypes = [
    wintypes.HANDLE,
    ctypes.c_void_p,
    ctypes.POINTER(MEMORY_BASIC_INFORMATION),
    ctypes.c_size_t,
]
kernel32.VirtualQueryEx.restype = ctypes.c_size_t

kernel32.CloseHandle.argtypes = [wintypes.HANDLE]
kernel32.CloseHandle.restype = wintypes.BOOL

# Find Halo MCC
matches = []

for proc in psutil.process_iter(["pid", "name"]):
    name = (proc.info["name"] or "").lower()
    if "mcc" in name or "halo2" in name:
        matches.append(proc.info)

if not matches:
    print("Halo MCC process not found.")
    raise SystemExit

for proc in matches:
    print(f"Found: {proc['name']} | PID: {proc['pid']}")

target = matches[0]

handle = kernel32.OpenProcess(
    PROCESS_QUERY_INFORMATION | PROCESS_VM_READ,
    False,
    target["pid"]
)

if not handle:
    error = ctypes.get_last_error()
    raise OSError(error, "Could not open Halo process")

print("\nSearching for readable memory regions...")

try:
    address = 0
    count = 0
    total_bytes = 0
    first_region = None

    while address < 0x00007FFFFFFFFFFF:
        info = MEMORY_BASIC_INFORMATION()

        result = kernel32.VirtualQueryEx(
            handle,
            ctypes.c_void_p(address),
            ctypes.byref(info),
            ctypes.sizeof(info)
        )

        if not result:
            break

        if (
            info.State == MEM_COMMIT
            and not (info.Protect & PAGE_GUARD)
            and not (info.Protect & PAGE_NOACCESS)
            and (info.Protect & 0xFF) in READABLE
        ):
            count += 1
            total_bytes += info.RegionSize

            if first_region is None:
              first_region = info.BaseAddress

            if count <= 8:
                print(
                    f"Region {count}: "
                    f"0x{info.BaseAddress:016X} "
                    f"Size: {info.RegionSize:,} bytes"
                )

        next_address = (
            (info.BaseAddress or address) + info.RegionSize
        )
        if next_address <= address:
            break
        address = next_address

    print(f"\nReadable regions: {count}")
    print(f"Total readable memory: {total_bytes / 1048576:.1f} MB")


    # Read a small sample from process memory
    kernel32.ReadProcessMemory.argtypes = [
        wintypes.HANDLE,
        ctypes.c_void_p,
        ctypes.c_void_p,
        ctypes.c_size_t,
        ctypes.POINTER(ctypes.c_size_t),
    ]
    kernel32.ReadProcessMemory.restype = wintypes.BOOL

    if first_region is not None:
        buffer = ctypes.create_string_buffer(64)
        bytes_read = ctypes.c_size_t(0)

        success = kernel32.ReadProcessMemory(
            handle,
            ctypes.c_void_p(first_region),
            buffer,
            len(buffer),
            ctypes.byref(bytes_read)
        )

        if success:
            print("\nMemory read successful!")
            print(f"Address: 0x{first_region:016X}")
            print(f"Bytes read: {bytes_read.value}")
            print("Data:", buffer.raw[:bytes_read.value].hex(" "))
        else:
            print("Memory read failed:", ctypes.get_last_error())


    # Find a changing 32-bit integer in writable game memory.
    import struct

    starting_ammo = int(input(
        "\nCurrent magazine ammunition count: "
    ))

    target_bytes = struct.pack("<i", starting_ammo)
    candidates = []
    address = 0
    scanned = 0
    max_scan = 512 * 1024 * 1024  # 512 MB for initial test
    max_candidates = 50000

    print("\nSearching memory for ammunition count...")

    while address < 0x00007FFFFFFFFFFF and scanned < max_scan:
        info = MEMORY_BASIC_INFORMATION()

        if not kernel32.VirtualQueryEx(
            handle, ctypes.c_void_p(address),
            ctypes.byref(info), ctypes.sizeof(info)
        ):
            break

        base = info.BaseAddress or address
        size = info.RegionSize
        address = base + size

        # Scan writable, committed memory only.
        if (
            info.State != MEM_COMMIT
            or info.Protect & (PAGE_GUARD | PAGE_NOACCESS)
            or (info.Protect & 0xFF) not in
               (0x04, 0x08, 0x40, 0x80)
        ):
            continue

        offset = 0

        while offset < size and scanned < max_scan:
            chunk_size = min(1024 * 1024, size - offset)
            buffer = ctypes.create_string_buffer(chunk_size)
            count_read = ctypes.c_size_t()

            ok = kernel32.ReadProcessMemory(
                handle, ctypes.c_void_p(base + offset),
                buffer, chunk_size, ctypes.byref(count_read)
            )

            if ok and count_read.value:
                data = buffer.raw[:count_read.value]
                pos = data.find(target_bytes)

                while pos != -1:
                    candidate = base + offset + pos

                    if candidate % 4 == 0:
                        candidates.append(candidate)

                    if len(candidates) >= max_candidates:
                        break

                    pos = data.find(target_bytes, pos + 1)

                scanned += count_read.value

            offset += chunk_size

            if len(candidates) >= max_candidates:
                break

        if len(candidates) >= max_candidates:
            break

    print(f"Found {len(candidates):,} possible addresses.")
    print(f"Scanned {scanned / 1048576:.1f} MB.")

    input(
        "\nReturn to Halo, fire exactly 3 shots, "
        "then come back and press Enter..."
    )

    expected = starting_ammo - 3
    matches = []

    for candidate in candidates:
        buffer = ctypes.create_string_buffer(4)
        count_read = ctypes.c_size_t()

        ok = kernel32.ReadProcessMemory(
            handle, ctypes.c_void_p(candidate),
            buffer, 4, ctypes.byref(count_read)
        )

        if ok and count_read.value == 4:
            value = struct.unpack("<i", buffer.raw)[0]

            if value == expected:
                matches.append(candidate)

    print(f"\nPossible ammunition addresses: {len(matches)}")

    for candidate in matches[:30]:
        print(f"0x{candidate:016X}")

    if len(candidates) >= max_candidates:
        print("Candidate limit reached; results may be incomplete.")

    if not matches:
        print("No matches. We may need to expand the scan.")


finally:
    kernel32.CloseHandle(handle)
