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