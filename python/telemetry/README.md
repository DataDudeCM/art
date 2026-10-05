# telemetry

Game telemetry → art. The design and plan are in [docs/game-telemetry.md](../../docs/game-telemetry.md).

Standard library only, so Miniconda's base Python is enough. Run everything from this folder.

| File | What it does |
|---|---|
| `forza.py` | Forza Horizon 4 packet format (324-byte "Dash") and the adapter that converts packets to the common format |
| `fake_forza.py` | Fake game: sends FH4-format packets of a car driving a figure-eight, with occasional crashes |
| `listen.py` | Receives FH4 packets and prints them as common-format records |

## Try it without the game

Use two terminals:

```
python listen.py
python fake_forza.py
```

`python listen.py --json` prints every record as one JSON line instead of status lines.

## With the real game

In Forza Horizon 4, go to Settings → HUD and Gameplay and set:
- **Data Out:** On
- **Data Out IP Address:** 127.0.0.1
- **Data Out IP Port:** 5300

Then run `python listen.py` and drive. Nothing is sent while the game is paused or in menus.
