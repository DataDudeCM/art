function renderPixelField(
  source,
  getOffset
) {
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

      copyPixelSample(
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

function copyPixelSample(
  source,
  result,
  x,
  y,
  dx,
  dy,
  destinationIndex
) {
  const sx = constrain(
    floor(x + dx),
    0,
    source.width - 1
  );

  const sy = constrain(
    floor(y + dy),
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

function renderBrushField(
  source,
  getOffset,
  settings
) {
  source.loadPixels();

  const result =
    createGraphics(
      source.width,
      source.height
    );

  result.pixelDensity(1);
  result.clear();

  result.strokeCap(ROUND);

  const spacing = max(
    1,
    round(settings.spacing)
  );

  const brushType =
    settings.type || "line";

  const tipImage =
    settings.tipImage || null;

  const baseLength = max(
    1,
    settings.length
  );

  const magnitudeResponse = max(
    0,
    settings.magnitudeResponse || 0
  );

  const thickness = max(
    0.5,
    settings.thickness
  );

  const opacity = constrain(
    settings.opacity,
    0,
    255
  );

  result.strokeWeight(thickness);

  for (
    let y = floor(spacing / 2);
    y < source.height;
    y += spacing
  ) {
    for (
      let x = floor(spacing / 2);
      x < source.width;
      x += spacing
    ) {
      const index =
        4 * (x + y * source.width);

      const offset = getOffset(
        x,
        y,
        index
      );

      const magnitude = sqrt(
        offset.dx * offset.dx +
        offset.dy * offset.dy
      );

      const dynamicLength = constrain(
        baseLength +
          magnitude *
          magnitudeResponse,
        1,
        baseLength * 4
      );

      const halfLength =
        dynamicLength / 2;

      const sx = constrain(
        floor(x + offset.dx),
        0,
        source.width - 1
      );

      const sy = constrain(
        floor(y + offset.dy),
        0,
        source.height - 1
      );

      const sourceIndex =
        4 * (
          sx +
          sy * source.width
        );

      const r =
        source.pixels[sourceIndex];

      const g =
        source.pixels[sourceIndex + 1];

      const b =
        source.pixels[sourceIndex + 2];

      const angle =
        atan2(
          offset.dy,
          offset.dx
        );

      const vx =
        cos(angle) *
        halfLength;

      const vy =
        sin(angle) *
        halfLength;

      if (
        brushType === "stamp" &&
        tipImage
      ) {
        const stampHeight = max(
          1,
          thickness * 2
        );

        result.push();
        result.translate(x, y);
        result.rotate(angle);
        result.imageMode(CENTER);
        result.tint(r, g, b, opacity);

        result.image(
          tipImage,
          0,
          0,
          dynamicLength,
          stampHeight
        );

        result.noTint();
        result.pop();
      } else {
        const vx =
          cos(angle) * halfLength;

        const vy =
          sin(angle) * halfLength;

        result.stroke(
          r,
          g,
          b,
          opacity
        );

        result.line(
          x - vx,
          y - vy,
          x + vx,
          y + vy
        );
      }
    }
  }

  const imageResult =
    result.get();

  result.remove();

  return imageResult;
}