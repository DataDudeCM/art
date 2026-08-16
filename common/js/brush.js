// common/js/brush.js
//
// Reusable image-based brush stroke helpers for p5.js.
//
// Assumptions:
// - Brush images are loaded with loadImage().
// - Brush image should preferably have transparency.
// - p5.js is available globally.
// - Uses p5 random(), so randomSeed() works as expected.
//
// Basic usage:
//
// paintStroke(brushImg, 400, 300, {
//   size: 180,
//   angle: radians(30),
//   color: "#202020",
//   alpha: 90
// });
//
// More expressive:
//
// paintStroke(brushImg, 400, 300, {
//   width: 260,
//   height: 90,
//   angle: radians(-20),
//   color: "#c7352d",
//   alpha: 80,
//   count: 6,
//   spacing: 0.12,
//   spread: 0.04,
//   angleJitter: PI / 40
// });
//
// Draw between two points:
//
// paintStrokeBetween(
//   brushImg,
//   100, 200,
//   600, 450,
//   {
//     height: 70,
//     color: "#222222",
//     alpha: 70
//   }
// );


// --------------------------------------------------
// Default settings
// --------------------------------------------------

const BRUSH_DEFAULTS = {
  // Brush dimensions.
  //
  // If width and height are null, `size` is used as
  // the width and the original brush aspect ratio is preserved.
  size: 150,
  width: null,
  height: null,

  angle: 0,

  color: "#000000",
  alpha: 100,

  // Number of additional impressions after the main stroke.
  count: 4,

  // Distance between impressions as a fraction of brush width.
  spacing: 0.10,

  // Side-to-side variation as a fraction of brush height.
  spread: 0.035,

  // Random rotation variation.
  angleJitter: Math.PI / 40,

  // Variation in brush size between impressions.
  scaleJitter: 0.025,

  // Fade secondary impressions toward this alpha.
  endAlpha: 3,

  // true  = impressions move mostly forward
  // false = impressions distribute around the origin
  forwardOnly: true,

  // Flip brush image if desired.
  flipX: false,
  flipY: false
};


// --------------------------------------------------
// Main brush function
// --------------------------------------------------

function paintStroke(brushImg, x, y, options = {}) {

  if (!brushImg) {
    console.warn("paintStroke(): brushImg is missing.");
    return;
  }

  const opt = {
    ...BRUSH_DEFAULTS,
    ...options
  };

  const dims = getBrushDimensions(brushImg, opt);

  // Main brush impression.
  drawBrushStamp(
    brushImg,
    x,
    y,
    dims.width,
    dims.height,
    opt.angle,
    opt.color,
    opt.alpha,
    opt
  );

  // Additional impressions create physical variation.
  for (let i = 0; i < opt.count; i++) {

    let forwardDist;

    if (opt.forwardOnly) {

      forwardDist =
        (i + 1) *
        random(
          dims.width * opt.spacing * 0.75,
          dims.width * opt.spacing * 1.25
        );

    } else {

      forwardDist = random(
        -dims.width * opt.spacing * opt.count * 0.5,
         dims.width * opt.spacing * opt.count * 0.5
      );
    }

    const sideDist = random(
      -dims.height * opt.spread,
       dims.height * opt.spread
    );

    // Convert local forward/side movement into canvas coordinates.
    const dx =
      cos(opt.angle) * forwardDist -
      sin(opt.angle) * sideDist;

    const dy =
      sin(opt.angle) * forwardDist +
      cos(opt.angle) * sideDist;

    const jitterAngle =
      opt.angle +
      random(-opt.angleJitter, opt.angleJitter);

    const alpha = map(
      i,
      0,
      max(1, opt.count - 1),
      opt.alpha * 0.75,
      opt.endAlpha
    );

    const scaleVariation =
      1 + random(-opt.scaleJitter, opt.scaleJitter);

    drawBrushStamp(
      brushImg,
      x + dx,
      y + dy,
      dims.width * scaleVariation,
      dims.height * scaleVariation,
      jitterAngle,
      opt.color,
      alpha,
      opt
    );
  }
}


// --------------------------------------------------
// Stroke between two points
// --------------------------------------------------

function paintStrokeBetween(
  brushImg,
  x1,
  y1,
  x2,
  y2,
  options = {}
) {

  const dx = x2 - x1;
  const dy = y2 - y1;

  const distance = sqrt(dx * dx + dy * dy);
  const angle = atan2(dy, dx);

  const opt = {
    ...options,
    angle
  };

  /*
   * If width isn't explicitly supplied, stretch the
   * brush along the full distance between the points.
   */
  if (opt.width == null) {
    opt.width = distance;
  }

  /*
   * If neither height nor size is supplied, preserve
   * the brush image's original aspect ratio.
   */
  if (opt.height == null && opt.size == null) {
    opt.height =
      distance *
      (brushImg.height / brushImg.width);
  }

  const centerX = (x1 + x2) * 0.5;
  const centerY = (y1 + y2) * 0.5;

  paintStroke(
    brushImg,
    centerX,
    centerY,
    opt
  );
}


// --------------------------------------------------
// Draw one brush impression
// --------------------------------------------------

function drawBrushStamp(
  brushImg,
  x,
  y,
  brushWidth,
  brushHeight,
  angle,
  brushColor,
  alpha,
  options
) {

  push();

  translate(x, y);
  rotate(angle);

  imageMode(CENTER);

  const sx = options.flipX ? -1 : 1;
  const sy = options.flipY ? -1 : 1;

  scale(sx, sy);

  const c = makeBrushColor(
    brushColor,
    alpha
  );

  tint(c);

  image(
    brushImg,
    0,
    0,
    brushWidth,
    brushHeight
  );

  pop();
}


// --------------------------------------------------
// Determine brush dimensions
// --------------------------------------------------

function getBrushDimensions(brushImg, options) {

  let brushWidth;
  let brushHeight;

  // Explicit width + height.
  if (
    options.width != null &&
    options.height != null
  ) {

    brushWidth = options.width;
    brushHeight = options.height;

  }

  // Explicit width, preserve aspect ratio.
  else if (options.width != null) {

    brushWidth = options.width;

    brushHeight =
      brushWidth *
      (brushImg.height / brushImg.width);

  }

  // Explicit height, preserve aspect ratio.
  else if (options.height != null) {

    brushHeight = options.height;

    brushWidth =
      brushHeight *
      (brushImg.width / brushImg.height);

  }

  // Size represents brush width.
  else {

    brushWidth = options.size;

    brushHeight =
      brushWidth *
      (brushImg.height / brushImg.width);
  }

  return {
    width: brushWidth,
    height: brushHeight
  };
}


// --------------------------------------------------
// Safely create tint color
// --------------------------------------------------

function makeBrushColor(inputColor, alpha) {

  /*
   * color() creates a new p5.Color, preventing us
   * from changing a color object owned by the caller.
   */
  const c = color(inputColor);

  c.setAlpha(alpha);

  return c;
}