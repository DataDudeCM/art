class PaperRenderer {
  constructor(layer, settings, paperImage = null) {
    this.g = layer;
    this.s = settings;
    this.paperImage = paperImage;
  }

  render(seed) {
    this.g.clear();

    this._setSeed(seed);

    if (this.s.mode === "image") {
      this._drawImagePaper();
    } else if (this.s.mode === "hybrid") {
      this._drawImagePaper();
      this._drawProceduralOverlay();
    } else {
      this._drawBase();
      this._drawTonalVariation();
      this._drawStains();
      this._drawFibers();
      this._drawGrain();
    }
  }

  _setSeed(seed) {
    this.g.randomSeed(seed);
    this.g.noiseSeed(seed);
  }

  _drawBase() {
    const [r, g, b] = this.s.baseColor;
    this.g.background(r, g, b);
  }

  _drawImagePaper() {
    if (!this.paperImage) {
      this._drawBase();
      return;
    }

    const imgAspect = this.paperImage.width / this.paperImage.height;
    const canvasAspect = this.g.width / this.g.height;

    let drawW, drawH, drawX, drawY;

    if (imgAspect > canvasAspect) {
      // image is wider than canvas shape
      drawH = this.g.height;
      drawW = drawH * imgAspect;
      drawX = (this.g.width - drawW) / 2;
      drawY = 0;
    } else {
      // image is taller/narrower than canvas shape
      drawW = this.g.width;
      drawH = drawW / imgAspect;
      drawX = 0;
      drawY = (this.g.height - drawH) / 2;
    }

    this.g.push();
    this.g.imageMode(CORNER);
    this.g.tint(255, this.s.imageTintAlpha);
    this.g.image(this.paperImage, drawX, drawY, drawW, drawH);
    this.g.pop();
  }


    _drawProceduralOverlay() {
    const originalGrainCount = this.s.grainCount;
    const originalFiberCount = this.s.fiberCount;
    const originalTonalStrength = this.s.tonalStrength;

    this.s.grainCount = Math.floor(originalGrainCount * this.s.proceduralOverlayStrength);
    this.s.fiberCount = Math.floor(originalFiberCount * this.s.proceduralOverlayStrength);
    this.s.tonalStrength = originalTonalStrength * this.s.proceduralOverlayStrength;

    this._drawTonalVariation();
    this._drawStains();
    this._drawFibers();
    this._drawGrain();

    this.s.grainCount = originalGrainCount;
    this.s.fiberCount = originalFiberCount;
    this.s.tonalStrength = originalTonalStrength;
  }

  _drawTonalVariation() {
    const [r, g, b] = this.s.baseColor;
    const step = this.s.tonalStep;

    this.g.noStroke();

    for (let y = 0; y < this.g.height; y += step) {
      for (let x = 0; x < this.g.width; x += step) {
        const n = this.g.noise(
          x * this.s.tonalScale,
          y * this.s.tonalScale
        );

        const shift = this.g.map(
          n,
          0,
          1,
          -this.s.tonalStrength,
          this.s.tonalStrength
        );

        this.g.fill(
          this._clamp(r + shift),
          this._clamp(g + shift),
          this._clamp(b + shift),
          16
        );

        this.g.rect(x, y, step + 1, step + 1);
      }
    }
  }

  _drawStains() {
    const count = Math.floor(
      this.g.random(this.s.stainCountMin, this.s.stainCountMax + 1)
    );

    this.g.noStroke();

    for (let i = 0; i < count; i++) {
      const cx = this.g.random(this.g.width * 0.08, this.g.width * 0.92);
      const cy = this.g.random(this.g.height * 0.08, this.g.height * 0.92);
      const radius = this.g.random(
        this.s.stainRadiusMin,
        this.s.stainRadiusMax
      );

      const layers = Math.floor(
        this.g.random(this.s.stainLayersMin, this.s.stainLayersMax + 1)
      );

      const warm = this.g.random() > 0.45;

      for (let j = 0; j < layers; j++) {
        const jx = this.g.random(-this.s.stainJitter, this.s.stainJitter);
        const jy = this.g.random(-this.s.stainJitter, this.s.stainJitter);

        const w = radius * this.g.random(1.0, 1.65);
        const h = radius * this.g.random(0.55, 1.25);

        const alpha = this.g.random(
          this.s.stainAlphaMin,
          this.s.stainAlphaMax
        );

        if (warm) {
          this.g.fill(134, 99, 57, alpha);
        } else {
          this.g.fill(98, 109, 103, alpha);
        }

        this.g.ellipse(cx + jx, cy + jy, w, h);
      }
    }
  }

  _drawFibers() {
    this.g.noFill();

    for (let i = 0; i < this.s.fiberCount; i++) {
      const x = this.g.random(this.g.width);
      const y = this.g.random(this.g.height);

      const len = this.g.random(
        this.s.fiberLengthMin,
        this.s.fiberLengthMax
      );

      // Mostly horizontal, with just enough variation to feel natural.
      const angle = this.g.randomGaussian(0, 0.28);

      const x2 = x + Math.cos(angle) * len;
      const y2 = y + Math.sin(angle) * len;

      const alpha = this.g.random(
        this.s.fiberAlphaMin,
        this.s.fiberAlphaMax
      );

      const weight = this.g.random(
        this.s.fiberWeightMin,
        this.s.fiberWeightMax
      );

      const darkFiber = this.g.random() > 0.42;

      if (darkFiber) {
        this.g.stroke(90, 78, 60, alpha);
      } else {
        this.g.stroke(255, 252, 242, alpha + 2);
      }

      this.g.strokeWeight(weight);
      this.g.line(x, y, x2, y2);
    }
  }

  _drawGrain() {
    this.g.noStroke();

    for (let i = 0; i < this.s.grainCount; i++) {
      const x = this.g.random(this.g.width);
      const y = this.g.random(this.g.height);

      const n = this.g.noise(x * 0.035, y * 0.035);

      const alpha = this.g.map(
        n,
        0,
        1,
        this.s.grainAlphaMin,
        this.s.grainAlphaMax
      );

      const size = this.g.random(
        this.s.grainSizeMin,
        this.s.grainSizeMax
      );

      if (this.g.random() > 0.5) {
        this.g.fill(88, 74, 57, alpha);
      } else {
        this.g.fill(255, 250, 237, alpha);
      }

      this.g.circle(x, y, size);
    }
  }

  _clamp(value) {
    return Math.max(0, Math.min(255, value));
  }
}
