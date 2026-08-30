The outstanding brush additions are:

use your shared PNG brushes for region painting instead of the procedural circles
keep brush selection flexible/random from common/brushes/brushes.json
add brush-based boundary rendering after the painting is finished
vary boundary brush size by curvature: thinner on smooth segments, thicker at sharper turns
keep the original raster boundary for flood-fill logic, but decouple that from the visible painted boundary

So the likely order is:

make image brushes work for region painting
evaluate aesthetics/performance
reuse that brush stamping system for the visible Chaikin boundary
add curvature-driven boundary thickness

We can safely do the settings/preset utility first without losing that thread.