# Rain Worn

What happens if a painting is left out in the rain?

The painting is made in two acts. First, a brush lays down a composition, using the shared brush PNGs and a palette from `palette.js`. Then it rains on it, and the rain finishes the painting.

Each raindrop is a droplet from hydraulic-erosion terrain simulation. Here the terrain is the paper and what erodes is the paint:

- The paper has fine **tooth** and large **cockle**, the buckles wet paper makes. Together with the board **tilt**, they decide which way water runs.
- A fast drop with spare capacity **lifts** pigment. A slow or overloaded one **sets it down**, preferring the pits in the tooth, which gives granulation.
- A drop that runs out of water dries as a **ring**, leaving a tide-line edge like a watercolour backrun.
- A drop that runs off the page takes its pigment with it.
- Wet paper gives pigment up more easily, so channels deepen into streaks.

Pigments are stored as densities, not RGB, and rendered as transparent glazes (`paper * exp(-density * absorbance)`). That way overlapping washes mix the way watercolour does. Each pigment also gets a random lift value, so some stain and some wash away.

## Running

Open `index.html` with Live Server rooted at `art/`. Add `?seed=12345` to the URL to reproduce a painting.

## Controls

| Key | |
|---|---|
| drag | paint wet pigment into the painting |
| 1–9 | choose pigment (swatches in the panel) |
| arrows | tilt the board; Shift for steeper, 0 to level it |
| space | pause or resume the rain; when the storm is over, start another |
| hold B | see the painting as it was before the rain |
| C | same seed, next composition (horizon, gesture, blocks, blooms) |
| R | new painting |
| S | save PNG |
| H | hide the panel |

## Files

- `js/paper.js` builds the paper heightfield and samples it with the tilt applied
- `js/pigment.js` maps the palette to pigment layers and renders the glazes
- `js/composition.js` paints act one with the brush images (the alpha channel becomes density)
- `js/rain.js` simulates the droplets: lift, deposit, tide rings, wetness
- `js/sketch.js` holds the tuning constants, the loop, the controls and the status panel

The constants at the top of `sketch.js` (`PAPER`, `DROP`, `RAIN`, `RENDER`) are the knobs to play with. `DROP.erode`, `DROP.granulation`, `PAPER.cockleRelief` and `RAIN.stormLength` change the character the most.

## Ideas for later

- Paint act one with a different system from the repo, such as substrate cracks or Evidence of Encounter marks, and let the rain wear that.
- Let the rain lower the paper as well, so heavy storms carve permanent channels.
- Stream the finished painting column by column to lightWand.
