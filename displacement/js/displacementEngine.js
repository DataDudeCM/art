function renderDisplacementField(
  source,
  getOffset
) {
  if (!source) {
    return null;
  }

  source.loadPixels();

  const result = createImage(
    source.width,
    source.height
  );

  result.loadPixels();

  for (let y = 0; y < source.height; y++) {
    for (let x = 0; x < source.width; x++) {

      const destinationIndex =
        4 * (x + y * source.width);

      const offset = getOffset(
        x,
        y,
        destinationIndex
      );

      copySourcePixel(
        source,
        result,
        x,
        y,
        offset.dx,
        offset.dy,
        destinationIndex
      );
    }
  }

  result.updatePixels();

  return result;
}

function copySourcePixel(
  source,
  result,
  x,
  y,
  dx,
  dy,
  destinationIndex
) {
  let sx = floor(x + dx);
  let sy = floor(y + dy);

  sx = constrain(
    sx,
    0,
    source.width - 1
  );

  sy = constrain(
    sy,
    0,
    source.height - 1
  );

  const sourceIndex =
    4 * (sx + sy * source.width);

  result.pixels[destinationIndex] =
    source.pixels[sourceIndex];

  result.pixels[destinationIndex + 1] =
    source.pixels[sourceIndex + 1];

  result.pixels[destinationIndex + 2] =
    source.pixels[sourceIndex + 2];

  result.pixels[destinationIndex + 3] =
    source.pixels[sourceIndex + 3];
}