class InkRenderer {
  constructor(layer, settings = {}) {
    this.g = layer;
    this.s = settings;
  }

  renderElements(seed, elements) {
    this.g.clear();
    this.g.randomSeed(seed + 2000);
    this.g.noiseSeed(seed + 2000);

    for (const element of elements) {
      if (element.type === "line") {
        this.drawLine(element);
      } else if (element.type === "arc") {
        this.drawArc(element);
      }
    }
  }

  drawLine(element) {
    const { x1, y1, x2, y2 } = element.geometry;
    const passes = this.s.passes ?? 3;
    const jitter = this.s.jitter ?? 2.2;
    const alphaMin = this.s.alphaMin ?? 35;
    const alphaMax = this.s.alphaMax ?? 78;
    const weightMin = this.s.weightMin ?? 0.7;
    const weightMax = this.s.weightMax ?? 1.6;
    const breakChance = this.s.breakChance ?? 0.08;
    const segments = Math.max(8, Math.floor(dist(x1, y1, x2, y2) / 24));
    const ink = this.s.color ?? [42, 39, 35];

    this.g.noFill();

    for (let pass = 0; pass < passes; pass++) {
      this.g.stroke(
        ink[0], ink[1], ink[2],
        this.g.random(alphaMin, alphaMax) * (element.appearance?.inkStrength ?? 1)
      );
      this.g.strokeWeight(this.g.random(weightMin, weightMax));

      let shapeOpen = false;

      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const x = lerp(x1, x2, t) + this.g.random(-jitter, jitter);
        const y = lerp(y1, y2, t) + this.g.random(-jitter, jitter);

        // Draw each uninterrupted run as one continuous polyline. This avoids
        // darker overlap spots where individually drawn line segments meet.
        if (!shapeOpen) {
          this.g.beginShape();
          this.g.vertex(x, y);
          shapeOpen = true;
          continue;
        }

        if (this.g.random() < breakChance) {
          this.g.endShape();
          shapeOpen = false;
          continue;
        }

        this.g.vertex(x, y);
      }

      if (shapeOpen) {
        this.g.endShape();
      }
    }
  }

  drawArc(element) {
    const { radius, startAngle, endAngle } = element.geometry;
    const center = element.position;
    const passes = this.s.arcPasses ?? 3;
    const jitter = this.s.arcJitter ?? 2.0;
    const alphaMin = this.s.arcAlphaMin ?? 24;
    const alphaMax = this.s.arcAlphaMax ?? 62;
    const weightMin = this.s.arcWeightMin ?? 0.65;
    const weightMax = this.s.arcWeightMax ?? 1.4;
    const breakChance = this.s.arcBreakChance ?? 0.06;
    const span = Math.abs(endAngle - startAngle);
    const segments = Math.max(16, Math.floor(span * radius / 22));
    const ink = this.s.color ?? [42, 39, 35];

    this.g.noFill();

    for (let pass = 0; pass < passes; pass++) {
      this.g.stroke(
        ink[0], ink[1], ink[2],
        this.g.random(alphaMin, alphaMax) * (element.appearance?.inkStrength ?? 1)
      );
      this.g.strokeWeight(this.g.random(weightMin, weightMax));

      let shapeOpen = false;

      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const angle = lerp(startAngle, endAngle, t);
        const radialJitter = this.g.random(-jitter, jitter);
        const rr = radius + radialJitter;
        const x = center.x + Math.cos(angle) * rr + this.g.random(-jitter, jitter) * 0.4;
        const y = center.y + Math.sin(angle) * rr + this.g.random(-jitter, jitter) * 0.4;

        // As with straight ink lines, continuous polylines keep the joints
        // from accumulating extra alpha and appearing as dots.
        if (!shapeOpen) {
          this.g.beginShape();
          this.g.vertex(x, y);
          shapeOpen = true;
          continue;
        }

        if (this.g.random() < breakChance) {
          this.g.endShape();
          shapeOpen = false;
          continue;
        }

        this.g.vertex(x, y);
      }

      if (shapeOpen) {
        this.g.endShape();
      }
    }
  }
}
