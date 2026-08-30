const SETTINGS = {

  // ============================================================
  // CANVAS / REGENERATION
  // ============================================================
  canvas: {

    // Background/paper color.
    // This is currently assigned dynamically from the selected palette,
    // so null is intentional here.
    paperColor: null,

    // When true, automatically generate a completely new artwork
    // after regenerateSeconds has elapsed.
    autoRegenerate: true,

    // Number of seconds between automatically generated artworks.
    regenerateSeconds: 2
  },


  // ============================================================
  // BOUNDARY / CHAIKIN CURVE
  // ============================================================
  boundary: {

    // Number of initial random control points used to construct
    // the boundary path.
    //
    // Higher values:
    //   - create more directional changes
    //   - usually create more intersections
    //   - tend to create more enclosed regions
    //
    // Lower values:
    //   - create simpler compositions
    //   - produce fewer potential regions
    pointCount: 30,

    // Number of Chaikin smoothing iterations.
    //
    // Higher values:
    //   - create smoother, rounder curves
    //   - add many intermediate points
    //
    // Lower values:
    //   - retain more angularity
    //   - preserve sharper directional changes
    //
    // NOTE:
    // This is not simply "number of segments."
    // Each Chaikin pass increases the number of curve points.
    subdivisions: 8,

    // Thickness of the raster boundary line used for:
    //   1. flood-fill region detection
    //   2. visible boundary rendering, when visible is true
    //
    // Very thin lines may occasionally be more vulnerable to
    // raster gaps or antialiasing issues during flood fill.
    strokeWeight: 1,

    // Size of the area in which initial control points can appear.
    //
    // 1.0 = approximately canvas-sized
    // >1  = points may extend outside the canvas
    // <1  = points are pulled toward the center
    //
    // Example:
    // 1.2 allows the source curve to extend about 20% beyond
    // the nominal canvas dimensions.
    scale: 1.2,

    // Moves each control point toward the midpoint of its neighbors
    // before Chaikin smoothing.
    //
    // Lower values:
    //   - preserve jagged / angular geometry
    //   - retain stronger random turns
    //
    // Higher values:
    //   - soften sharp turns
    //   - create calmer, more flowing geometry
    //
    // Rough guide:
    // 0.0  = no control-point relaxation
    // 0.1  = fairly angular
    // 0.2  = lightly softened
    // 0.4+ = substantially smoother
    cornerSoftness: 0.20,

    // Number of times the control-point softening operation is applied.
    //
    // Increasing this compounds the effect of cornerSoftness.
    // Usually 1 is enough unless a very flowing curve is desired.
    softeningPasses: 1,

    // Whether the raster boundary line is shown in the final image.
    //
    // IMPORTANT:
    // Even when false, the boundary is still needed internally
    // for flood-fill region detection.
    visible: true
  },


  // ============================================================
  // REGION DISCOVERY / FLOOD FILL
  // ============================================================
  fill: {

    // Number of random seed-point attempts made per artwork.
    //
    // Each attempt:
    //   - picks a random point
    //   - flood-fills the connected region
    //   - paints it if it passes validation
    //
    // Because attempts are independent, the same region may be
    // selected multiple times. This creates additional pigment
    // buildup and darker repeated regions.
    attempts: 40,

    // Reject flood-filled regions smaller than this many pixels.
    //
    // Helps avoid painting tiny slivers or insignificant artifacts.
    minRegionPixels: 500,

    // Reject regions larger than this fraction of the entire canvas.
    //
    // Primarily prevents the huge exterior/background connected
    // region from being treated as a normal paintable region.
    //
    // 0.7 = reject anything larger than 70% of the canvas.
    maxRegionFraction: 0.7
  },


  // ============================================================
  // REGION PAINTING
  // ============================================================
  paint: {

    // Baseline number of paint marks applied to a reference-sized region.
    //
    // Actual mark count is modified by region size using:
    // referenceRegionPixels
    // markAreaExponent
    // minMarkScale
    // maxMarkScale
    marksPerRegion: 1,


    // ------------------------------------------------------------
    // REGION-SIZE RESPONSE
    // ------------------------------------------------------------

    // Region size considered the "normal" reference area.
    //
    // A region near this size receives approximately the baseline
    // marksPerRegion and brush size.
    referenceRegionPixels: 25000,

    // Controls how strongly region area changes the number of marks.
    //
    // Higher values:
    //   - large regions receive substantially more strokes
    //   - small regions receive fewer strokes
    //
    // 0.5 gives approximately square-root scaling.
    markAreaExponent: 0,

    // Controls how strongly region area changes brush size.
    //
    // This is intentionally much lower than markAreaExponent so
    // large regions tend to receive MORE marks rather than merely
    // enormous marks.
    brushAreaExponent: 0,

    // Minimum multiplier that region size may apply to mark count.
    //
    // 0.5 means a small region can receive as little as roughly
    // half of marksPerRegion.
    minMarkScale: 1,

    // Maximum multiplier that region size may apply to mark count.
    //
    // 2.0 means even very large regions are capped at roughly
    // twice the baseline number of marks.
    maxMarkScale: 1,

    // Minimum multiplier applied to brush size for small regions.
    minBrushScale: 1,

    // Maximum multiplier applied to brush size for very large regions.
    //
    // NOTE:
    // 8 is extremely permissive. Combined with brushSizeMax: 400,
    // this theoretically allows very large marks.
    //
    // Clipping prevents the main region paint from spilling outside
    // its detected region, but huge brushes can still change the
    // texture and density considerably.
    maxBrushScale: 1,


    // ------------------------------------------------------------
    // BRUSH TYPE / SIZE
    // ------------------------------------------------------------

    // Current painting mode.
    //
    // "procedural" = generated circular/soft marks
    // "image"      = shared PNG brush assets
    //
    // Image brush support is currently being developed.
    brushMode: "image",

    // Baseline minimum brush diameter/size.
    //
    // The final size is also affected by region-size scaling.
    brushSizeMin: 2000,

    // Baseline maximum brush diameter/size.
    //
    // The final size is also affected by maxBrushScale.
    brushSizeMax: 2000,


    // ------------------------------------------------------------
    // MAIN PAINT OPACITY
    // ------------------------------------------------------------

    // Minimum opacity applied to individual paint marks.
    //
    // Very low values are intentional because many translucent
    // marks accumulate to create watercolor-like pigment buildup.
    alphaMin: 0.25,

    // Maximum opacity applied to individual paint marks.
    //
    // Lower this for lighter, airier painting.
    // Raise it for stronger pigment and darker accumulation.
    alphaMax: 10,


    // ------------------------------------------------------------
    // EDGE BLEED
    // ------------------------------------------------------------

    // Number of extra bleed marks painted around region edges.
    //
    // Higher values:
    //   - create more visible edge activity
    //   - make bleed more continuous
    //
    // Lower values:
    //   - create sparse, occasional bleed
    bleedMarks: 1,

    // Maximum distance that bleed marks may wander away from
    // the detected region edge.
    //
    // Larger values allow paint to travel farther into neighboring
    // regions or surrounding paper.
    bleedPixels: 1,

    // Minimum opacity for bleed marks.
    bleedAlphaMin: 0.5,

    // Maximum opacity for bleed marks.
    bleedAlphaMax: 2,

    // Reserved for future mask-edge feathering.
    //
    // Currently not part of the active exact-mask painting behavior.
    // A future implementation could use this to soften the transition
    // between fully allowed and fully clipped paint.
    maskFeatherSteps: 0
  },


  // ============================================================
  // DEBUGGING
  // ============================================================
  debug: {

    // Intended to show the randomly selected flood-fill seed points.
    // Useful when inspecting why particular regions are selected.
    showSeeds: false,

    // Intended to visualize the flood-filled region directly,
    // rather than only seeing the resulting painter output.
    showDetectedRegion: false
  }
};