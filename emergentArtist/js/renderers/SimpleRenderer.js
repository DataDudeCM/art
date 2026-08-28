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
    g.push();
    g.noFill();
    g.stroke(c);
    g.strokeWeight(mark.weight);
    const radius = mark.diameter * 0.5;
    const roughnessPixels = lerp(0, radius * 0.12, mark.roughness);
    g.beginShape();
    for (let i = 0; i <= 64; i++) {
      const a = map(i, 0, 64, 0, TWO_PI);
      const n = noise(mark.age * 0.01, cos(a) * 0.8 + 10, sin(a) * 0.8 + 20);
      const r = radius + map(n, 0, 1, -roughnessPixels, roughnessPixels);
      g.vertex(mark.x + cos(a) * r, mark.y + sin(a) * r);
    }
    g.endShape();
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
    const d = dist(mark.x1, mark.y1, mark.x2, mark.y2);
    const segments = max(3, floor(d / 9));
    const roughnessPixels = lerp(0, 8, mark.roughness);
    const dx = mark.x2 - mark.x1;
    const dy = mark.y2 - mark.y1;
    const mag = sqrt(dx * dx + dy * dy) || 1;
    const px = -dy / mag;
    const py = dx / mag;
    g.beginShape();
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      let x = lerp(mark.x1, mark.x2, t);
      let y = lerp(mark.y1, mark.y2, t);
      const n = noise(mark.age * 0.01, t * 2.5, 50);
      const offset = map(n, 0, 1, -roughnessPixels, roughnessPixels);
      g.vertex(x + px * offset, y + py * offset);
    }
    g.endShape();
    g.pop();
  }
}
