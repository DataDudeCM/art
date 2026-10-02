class SimpleRenderer {
  constructor(layer) {
    this.layer = layer;
  }

  render(mark) {
    if (mark.type === "circle") this.drawCircle(mark);
    if (mark.type === "line") this.drawLine(mark);
  }

  drawCircle(mark) {
    const g = this.layer;
    const c = color(mark.colorHex);
    c.setAlpha(mark.opacity * 255);

    const radius = mark.diameter * 0.5;
    const roughnessPixels = lerp(0, radius * 0.1, mark.roughness);

    // completeness determines how much of the circle is drawn
    const endAngle = mark.segmentAngle;

    // repetition determines how many overlapping strokes are drawn
    const copies = 1 + floor(mark.repetition * 5); 

    g.push();
    g.noFill();
    g.stroke(c);
    g.strokeWeight(mark.weight);

    for (let copy = 0; copy < copies; copy++) {

      const strokeColor = color(mark.colorHex);

      // Each repeated stroke varies from faint up to
      // the agent's maximum opacity.
      const strokeOpacity =
        copy === 0
          ? mark.opacity
          : random(mark.opacity * 0.35, mark.opacity);

      strokeColor.setAlpha(strokeOpacity * 255);

      g.stroke(strokeColor);
      // Tiny offset between repeated strokes
      const maxOffset = SETTINGS.marks.repetitionOffset;

      const ox = random(-maxOffset, maxOffset) * mark.repetition;
      const oy = random(-maxOffset, maxOffset) * mark.repetition;

      const segments = max(
        8,
        floor(64 * (endAngle / TWO_PI))
      );

      g.beginShape();

      for (let i = 0; i <= segments; i++) {
        const a = map(i, 0, segments, 0, endAngle);

        // Existing small-scale roughness
        const n = noise(
          mark.age * 0.01,
          cos(a) * 0.8 + 10,
          sin(a) * 0.8 + 20
        );

        const r =
          radius +
          map(n, 0, 1, -roughnessPixels, roughnessPixels);

        // Larger-scale deformation of the geometry
        const distortionX =
          1 +
          sin(a * 2 + mark.age * 0.01) *
          mark.distortion *
          0.35;

        const distortionY =
          1 +
          cos(a * 3 + mark.age * 0.013) *
          mark.distortion *
          0.35;

        const x =
          mark.x +
          ox +
          cos(a) * r * distortionX;

        const y =
          mark.y +
          oy +
          sin(a) * r * distortionY;

        g.vertex(x, y);
      }

      g.endShape();
    }

    g.pop();
  }

  drawLine(mark) {
    const g = this.layer;
    const c = color(mark.colorHex);
    c.setAlpha(mark.opacity * 255);

    g.push();
    g.noFill();
    g.stroke(c);
    g.strokeWeight(mark.weight);

    const d = dist(
      mark.x1,
      mark.y1,
      mark.x2,
      mark.y2
    );

    const segments = max(3, floor(d / 9));
    const roughnessPixels = lerp(0, 8, mark.roughness);

    const dx = mark.x2 - mark.x1;
    const dy = mark.y2 - mark.y1;

    const mag = sqrt(dx * dx + dy * dy) || 1;

    // Perpendicular direction to the line
    const px = -dy / mag;
    const py = dx / mag;

    // completeness shortens the line equally from both ends
    const startT = (1 - mark.completeness) * 0.5;
    const endT = 1 - startT;

    // repetition creates overlapping strokes
    const copies = 1 + floor(mark.repetition * 3);

    for (let copy = 0; copy < copies; copy++) {

      const maxOffset = SETTINGS.marks.repetitionOffset;

      const ox = random(-maxOffset, maxOffset) * mark.repetition;
      const oy = random(-maxOffset, maxOffset) * mark.repetition;

      const strokeColor = color(mark.colorHex);

      // Each repeated stroke varies from faint up to
      // the agent's maximum opacity.
      const strokeOpacity =
        copy === 0
          ? mark.opacity
          : random(mark.opacity * 0.35, mark.opacity);

      strokeColor.setAlpha(strokeOpacity * 255);

      g.stroke(strokeColor);

      g.beginShape();

      for (let i = 0; i <= segments; i++) {

        const segmentT = i / segments;

        // map the normal 0–1 line into the shortened interval
        const t = lerp(startT, endT, segmentT);

        let x = lerp(mark.x1, mark.x2, t);
        let y = lerp(mark.y1, mark.y2, t);

        // Existing fine roughness
        const n = noise(
          mark.age * 0.01,
          t * 2.5,
          50
        );

        const roughOffset =
          map(
            n,
            0,
            1,
            -roughnessPixels,
            roughnessPixels
          );

        // Larger-scale bend/deformation
        const distortionOffset =
          sin(t * PI) *
          sin(t * TWO_PI + mark.age * 0.01) *
          mark.distortion *
          d *
          0.15;

        const totalOffset =
          roughOffset + distortionOffset;

        x += px * totalOffset + ox;
        y += py * totalOffset + oy;

        g.vertex(x, y);
      }

      g.endShape();
    }

    g.pop();
  }
}
