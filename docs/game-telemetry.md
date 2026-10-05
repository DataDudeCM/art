# Game Telemetry → Art

A system that turns how I play games into artwork. It works with any game: each game gets a small adapter, and everything after the adapter is shared.

The concept and artistic philosophy are in [skyrim-gameplay-art.md](skyrim-gameplay-art.md): the player is the agent, gameplay acts as forces on a composition, and there are no literal "sword swing = red line" mappings. This note covers the general architecture, which games to use, and the first prototype.

Status: prototype starting (2026-10-05). Notes moved here from OneDrive ideas; code goes in `python/telemetry/` and `experiments/telemetry/`.

---

## Architecture

```text
GAME ADAPTERS                    HUB (Python)                OUTPUTS
                                 
Forza Horizon 4 ─ UDP ─┐                              ┌─► JSONL recording
Wreckfest ─ teleport ──┤                              │
DiRT Rally ─ UDP ──────┼──► normalize to common ──────┼─► WebSocket ─► p5.js sketches
GTA V ─ C# script ─────┤    format                    │
Skyrim / Fallout ──────┘                              └─► UDP ─► ESP32 lightWand
                                 ▲
             replay: feed a JSONL recording back through the hub
```

### Layers

1. **Adapters.** One per game. Each one only reads that game's data and converts it to the common format. Nothing else is game-specific.
2. **Hub.** A small Python program. It receives from adapters, records every session, and sends data out to renderers. It also replays recordings.
3. **Translation.** Turns raw values into artistic signals: tension, energy, transition and so on (see the Skyrim note). Keep this separate from both the hub and the renderers.
4. **Renderers.** p5.js sketches (abstractArtist, regionPainter, new ones), lightWand, and maybe Blender later. A renderer never needs to know which game the data came from.

### Common format: samples and events

Two kinds of record, one JSON object per line:

```json
{"t": 124.52, "src": "forza", "kind": "sample", "pos": [243.1, 88.7, 14.2], "vel": [12.0, 0.4, 28.9], "speed": 31.8}
{"t": 125.10, "src": "forza", "kind": "event", "type": "impact", "intensity": 0.9}
```

- **Samples:** continuous state at a fixed rate, such as position, velocity, speed and orientation.
- **Events:** discrete moments with a type, a time and any details, such as impact, combat started, location changed or death.

Start with a few fields only. Each adapter fills what its game provides and leaves the rest out.

### Why recording comes first

Every session is saved as a `.jsonl` file. You play once, then replay that session through any renderer as many times as you like. That makes iterating on a sketch fast, and each recording becomes source material, which is what makes this a body of work.

### Browser constraint

p5.js in a browser can't receive UDP, so the hub sends to sketches over a WebSocket.

lightWand already receives UDP frames, so the hub can send to it directly.

---

## Games I own, by access

| Game | How to get data | Data | Effort |
|---|---|---|---|
| **Forza Horizon 4** | Built-in "Data Out" UDP (HUD settings), ~60 Hz | Position, velocity, rotation, RPM, throttle, steering, suspension, tire slip | Easiest: no extra software |
| **Wreckfest** | [wreckfest-teleport](https://github.com/t-hovestadt/wreckfest-teleport) reads the car from game memory and sends Codemasters/DiRT Rally 2.0-format UDP on port 20777 | Position, orientation, velocity, g-forces, rotation rates, **impact magnitude**. No RPM, throttle or gear | Easy. Same reader as DiRT Rally |
| **DiRT Rally** | Built-in UDP (`extradata` in `hardware_settings_config.xml`), Codemasters format | Position, speed, gear, RPM, suspension | Easy |
| **GTA V Legacy** | Script Hook V + Script Hook V .NET; a small C# script sends UDP to the hub | Position, speed, health, wanted level, vehicle RPM and damage, weather, time, district, behavior | Medium: C#, Visual Studio, story mode only (anti-cheat off in the Rockstar launcher), breaks on game patches |
| **Fallout: New Vegas** | xNVSE plugin | Position, health, combat, quests, kills, locations | Medium |
| **Fallout 4 / Skyrim SE** | F4SE / SKSE plugin | Same family as New Vegas | Medium |
| **Baldur's Gate 3** | BG3 Script Extender (Lua, Osiris events) | Mostly events: dialogue, combat, spells, deaths, locations | Medium |
| **Cities: Skylines** | Mod | Simulation data: traffic, population, economy | Medium |
| **Half-Life 2 / Portal / CS:Source** | Source demo files (`.dem`), parsed afterwards | Player position and view angles every tick | Medium. Not live |
| **Age of Empires II DE** | `.aoe2record` replays plus a Python parser (e.g. mgz) | Every action: units, buildings, territory | Medium. Not live |
| **Opus Magnum** | Solution files plus community parsers | Hex-grid machine geometry | Medium. Good fit for geometry |

Sources that work with any game:
- **Steam achievement unlock times** via the existing Steam tool: a timeline across the whole library.
- **Palettes extracted from screen captures,** written in palette.js format. Strong-art-style games suit this: GRIS, Ori, INSIDE, Hollow Knight, Planet of Lana.
- **Captured game audio,** fed to the sound/ sketches.

Each kind of game gives a different signature from the same engine:
- racing (Forza, Wreckfest): physics
- open world (Skyrim, Fallout): exploration
- GTA: behavior and chaos
- BG3: story events

---

## First prototype

Keep it small, but build it in the general shape from the start.

1. **Listen.** A Python script receives Forza Horizon 4 Data Out (or Wreckfest via teleport) and prints a few values.
   - Check the packet layout. FH4's differs slightly from Forza Motorsport 7's.
2. **Adapter and recording.** Convert packets to the common format and write `session_<date>.jsonl`.
3. **Look at it.** Plot the recorded trajectory offline. Look for speed, dwell, clusters and impacts. (This is the Skyrim note's "record, plot, find patterns" step.)
4. **Replay plus WebSocket.** The hub replays a `.jsonl` file and sends it to a simple p5.js sketch: a trail whose stroke follows speed and bursts on impact.
5. **Second adapter.** Add the other racing game. If the sketch works unchanged, the design is truly general.
6. **Live.** Play while the sketch draws.
7. **lightWand.** Map recent samples to 100-pixel frames.

After that: GTA V as the first richer adapter, then Skyrim, Fallout or BG3 for event-driven play.

---

## Open questions

- **Where the code lives (decided 2026-10-05): in art for now.**
  - The hub and adapters go in `art/python/telemetry/`. They're local Python, like the other tools.
  - The sketches start in `art/experiments/telemetry/`.
  - Split into its own repo only if lightWand or other projects come to depend on it.
  - The Steam tool stays in `art/python/tools/steam-tools`.
- **Hub library.** For WebSockets, the `websockets` package is probably enough.
- **Coordinate normalization.** Each game uses different units and map sizes. Normalize in the adapter, or in translation?
- **Translation design.** Signals such as tension and energy computed over a rolling time window, versus per sample.
- **Persistent artwork.** The Skyrim note's "character-life" artwork, built up across sessions. GTA's fixed map makes this natural: layer all sessions onto one canvas.
