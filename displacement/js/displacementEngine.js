function renderDisplacementField(getOffset) {
  if (!sourceImg) {
    return;
  }

  sourceImg.loadPixels();

  displacedImg = createImage(
    sourceImg.width,
    sourceImg.height
  );

  displacedImg.loadPixels();

  for (let y = 0; y < sourceImg.height; y++) {
    for (let x = 0; x < sourceImg.width; x++) {

      const destinationIndex =
        4 * (x + y * sourceImg.width);

      const offset = getOffset(
        x,
        y,
        destinationIndex
      );

      copySourcePixel(
        x,
        y,
        offset.dx,
        offset.dy,
        destinationIndex
      );
    }
  }

  displacedImg.updatePixels();
}

function copySourcePixel(
  x,
  y,
  dx,
  dy,
  destinationIndex
) {
  let sx =
    floor(x + dx);

  let sy =
    floor(y + dy);

  sx = constrain(
    sx,
    0,
    sourceImg.width - 1
  );

  sy = constrain(
    sy,
    0,
    sourceImg.height - 1
  );

  const sourceIndex =
    4 * (sx + sy * sourceImg.width);

  displacedImg.pixels[destinationIndex] =
    sourceImg.pixels[sourceIndex];

  displacedImg.pixels[destinationIndex + 1] =
    sourceImg.pixels[sourceIndex + 1];

  displacedImg.pixels[destinationIndex + 2] =
    sourceImg.pixels[sourceIndex + 2];

  displacedImg.pixels[destinationIndex + 3] =
    sourceImg.pixels[sourceIndex + 3];
}