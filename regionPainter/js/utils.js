function getRegionKey(region) {
  if (!region || !region.pixels || region.pixels.length === 0) {
    return null;
  }

  let minIndex = Infinity;

  for (const p of region.pixels) {
    const index = p.y * width + p.x;

    if (index < minIndex) {
      minIndex = index;
    }
  }

  return `${region.pixelCount}-${minIndex}`;
}

function getOrAssignRegionColor(region, colorMap, palette) {
  const key = getRegionKey(region);

  if (!key) {
    return randomColor(palette);
  }

  if (!colorMap.has(key)) {
    colorMap.set(
      key,
      randomColor(palette)
    );
  }

  return colorMap.get(key);
}