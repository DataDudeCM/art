function getImageMapOffset(
  x,
  y,
  index,
  settings
) {
  const r =
    scaledMap.pixels[index];

  const g =
    scaledMap.pixels[index + 1];

  const normalizedX =
    (r - 128) / 127;

  const normalizedY =
    (g - 128) / 127;

  return {
    dx: normalizedX * settings.strengthX,
    dy: normalizedY * settings.strengthY
  };
}

function getFlowFieldOffset(
  x,
  y,
  index,
  settings
) {
  const n = noise(
    x * settings.noiseScale,
    y * settings.noiseScale
  );

  const angle =
    n * TWO_PI * settings.angleMult;

  return {
    dx: cos(angle) * settings.strength,
    dy: sin(angle) * settings.strength
  };
}

function getRadialFieldOffset(
  x,
  y,
  index,
  settings
) {
  const centerX = settings.centerX;
  const centerY = settings.centerY;

  const vx =
    x - centerX;

  const vy =
    y - centerY;

  const distance =
    sqrt(vx * vx + vy * vy);

  const maxRadius =
    min(
      settings.width,
      settings.height
    ) *
    0.5 *
    settings.radius;

  if (
    distance === 0 ||
    distance > maxRadius
  ) {
    return {
      dx: 0,
      dy: 0
    };
  }

  const nx =
    vx / distance;

  const ny =
    vy / distance;

  const normalizedDistance =
    distance / maxRadius;

  const influence =
    pow(
      1 - normalizedDistance,
      settings.falloff
    );

  const displacement =
    settings.strength *
    influence;

  return {
    dx: nx * displacement,
    dy: ny * displacement
  };
}