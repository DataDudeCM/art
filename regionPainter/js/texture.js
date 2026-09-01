function generateTextureLayer() {
  textureLayer.clear();

  if (!SETTINGS.texture.enabled) {
    return;
  }

  textureLayer.push();

  textureLayer.noStroke();

  const amount =
    SETTINGS.texture.opacity;

  // broad uneven paper/canvas tone
  for (let y = 0; y < height; y += 4) {
    for (let x = 0; x < width; x += 4) {
      const n =
        noise(x * 0.008, y * 0.008);

      const alpha =
        map(n, 0, 1, 0, amount);

      textureLayer.fill(
        40,
        alpha * 0.18
      );

      textureLayer.rect(
        x,
        y,
        4,
        4
      );
    }
  }

  // Sparse fibers / tiny imperfections
  const fibers =
    width * height * 0.00012;

  textureLayer.strokeWeight(0.5);

  for (let i = 0; i < fibers; i++) {
    const x = random(width);
    const y = random(height);

    const len =
      random(2, 12);

    const angle =
      random(TWO_PI);

    textureLayer.stroke(
      30,
      random(3, amount * 0.3)
    );

    textureLayer.line(
      x,
      y,
      x + cos(angle) * len,
      y + sin(angle) * len
    );
  }

  textureLayer.pop();
}