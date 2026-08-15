class WatercolorRenderer {
  constructor(layer, settings) {
    this.g = layer;
    this.s = settings;
  }

  renderElements(seed, elements) {
    this.g.clear();
    this.g.blendMode(MULTIPLY);

    this.g.randomSeed(seed + 1000);
    this.g.noiseSeed(seed + 1000);

    for (const element of elements) {
      if (element.type === "circle") {
        this.drawCircle(
          element.position.x,
          element.position.y,
          element.geometry.radius,
          element.appearance.color
        );
      } else if (element.type === "polygon") {
        this.drawPolygon(
          element.geometry.points,
          element.appearance.color
        );
      }
    }
  }

  drawCircle(x, y, radius, colorArr) {
    const layers = this.s.layers;

    for (let i = 0; i < layers; i++) {
      const px = x + this.g.random(-this.s.positionJitter, this.s.positionJitter);
      const py = y + this.g.random(-this.s.positionJitter, this.s.positionJitter);

      const r =
        radius *
        this.g.random(
          1 - this.s.radiusJitter,
          1 + this.s.radiusJitter
        );

      const alpha = this.g.random(this.s.alphaMin, this.s.alphaMax);

      this._drawIrregularCircle(
        px,
        py,
        r,
        colorArr,
        alpha,
        i * 100
      );
    }

    this._addGranulation(x, y, radius, colorArr);
    this._addEdgePooling(x, y, radius, colorArr);
  }

  _drawIrregularCircle(x, y, radius, colorArr, alpha, noiseOffset) {
    const points = this.s.points;
    const step = TWO_PI / points;

    this.g.noStroke();
    this.g.fill(colorArr[0], colorArr[1], colorArr[2], alpha);

    this.g.beginShape();

    for (let i = 0; i < points; i++) {
      const a = i * step;

      const nx = Math.cos(a) * this.s.noiseScale + noiseOffset;
      const ny = Math.sin(a) * this.s.noiseScale + noiseOffset;

      const n = this.g.noise(nx, ny);

      const wobble = this.g.map(
        n,
        0,
        1,
        -this.s.edgeJitter,
        this.s.edgeJitter
      );

      const rr = radius + wobble;

      const vx = x + Math.cos(a) * rr;
      const vy = y + Math.sin(a) * rr;

      this.g.vertex(vx, vy);
    }

    this.g.endShape(CLOSE);
  }

  drawPolygon(points, colorArr) {
    const layers = this.s.layers;

    for (let i = 0; i < layers; i++) {
      const alpha = this.g.random(this.s.alphaMin, this.s.alphaMax);

      this.g.noStroke();
      this.g.fill(
        colorArr[0],
        colorArr[1],
        colorArr[2],
        alpha
      );

      this.g.beginShape();

      for (let p of points) {
        const jx = this.g.random(
          -this.s.positionJitter,
          this.s.positionJitter
        );

        const jy = this.g.random(
          -this.s.positionJitter,
          this.s.positionJitter
        );

        this.g.vertex(
          p.x + jx,
          p.y + jy
        );
      }

      this.g.endShape(CLOSE);
    }
  }

  _makePolygon(cx, cy, radius, sides, rotation = 0) {
    const points = [];

    for (let i = 0; i < sides; i++) {
      const angle =
        rotation +
        (TWO_PI / sides) * i;

      const r = radius * this.g.random(0.75, 1.1);

      points.push({
        x: cx + Math.cos(angle) * r,
        y: cy + Math.sin(angle) * r
      });
    }

    return points;
  }
  _addGranulation(x, y, radius, colorArr) {
    const dotCount = this.s.granulationCount;
    const dotColor = this._darken(colorArr, this.s.granulationDarken);

    this.g.noStroke();

    for (let i = 0; i < dotCount; i++) {
      const a = this.g.random(TWO_PI);
      const d = Math.sqrt(this.g.random()) * radius * 0.95;

      const px = x + Math.cos(a) * d;
      const py = y + Math.sin(a) * d;

      const n = this.g.noise(px * 0.03, py * 0.03);

      if (n < this.s.granulationThreshold) continue;

      const alpha = this.g.random(
        this.s.granulationAlphaMin,
        this.s.granulationAlphaMax
      );

      const size = this.g.random(
        this.s.granulationSizeMin,
        this.s.granulationSizeMax
      );

      this.g.fill(dotColor[0], dotColor[1], dotColor[2], alpha);
      this.g.circle(px, py, size);
    }
  }

  _addEdgePooling(x, y, radius, colorArr) {
    const pooledColor = this._darken(colorArr, this.s.poolingDarken);

    this.g.noFill();
    this.g.strokeWeight(this.s.poolingStrokeWeight);

    const rings = this.s.poolingRings;
    const points = this.s.points;
    const step = TWO_PI / points;

    for (let ring = 0; ring < rings; ring++) {
      for (let i = 0; i < points; i++) {
        const a1 = i * step;
        const a2 = (i + 1) * step;

        const n = this.g.noise(
          Math.cos(a1) * 0.8 + ring * 10,
          Math.sin(a1) * 0.8 + ring * 10
        );

        if (n < this.s.poolingThreshold) continue;

        const r1 =
          radius +
          this.g.map(n, 0, 1, -this.s.edgeJitter, this.s.edgeJitter) +
          this.g.random(-2, 2);

        const r2 =
          radius +
          this.g.map(n, 0, 1, -this.s.edgeJitter, this.s.edgeJitter) +
          this.g.random(-2, 2);

        const x1 = x + Math.cos(a1) * r1;
        const y1 = y + Math.sin(a1) * r1;
        const x2 = x + Math.cos(a2) * r2;
        const y2 = y + Math.sin(a2) * r2;

        const alpha = this.g.random(
          this.s.poolingAlphaMin,
          this.s.poolingAlphaMax
        );

        this.g.stroke(pooledColor[0], pooledColor[1], pooledColor[2], alpha);
        this.g.line(x1, y1, x2, y2);
      }
    }
  }

  _darken(colorArr, amount) {
    return [
      Math.max(0, colorArr[0] - amount),
      Math.max(0, colorArr[1] - amount),
      Math.max(0, colorArr[2] - amount)
    ];
  }
}