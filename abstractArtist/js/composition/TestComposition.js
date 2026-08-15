class TestComposition {
  constructor(canvasWidth, canvasHeight) {
    this.width = canvasWidth;
    this.height = canvasHeight;
  }

  create(intent) {
    const anchor = {
      x: random(0.31, 0.41) * this.width,
      y: random(0.43, 0.55) * this.height
    };

    const spread = lerp(0.78, 1.22, intent.isolation);
    const diagonalPush = intent.movement === "diagonal" ? intent.tension : intent.tension * 0.35;

    const elements = [];

    elements.push(this._circle({
      role: "anchor",
      x: anchor.x,
      y: anchor.y,
      radius: random(160, 220),
      color: [176, 82, 72],
      importance: 0.95,
      intent
    }));

    const triX = anchor.x + random(130, 245) * spread;
    const triY = anchor.y + random(-120, 80) - diagonalPush * 85;

    elements.push(this._polygon({
      role: "secondary",
      x: triX,
      y: triY,
      radius: random(220, 340),
      sides: 3,
      rotation: random(-0.6, 0.6) + diagonalPush * 0.35,
      color: [65, 95, 145],
      importance: 0.72,
      intent
    }));

    elements.push(this._circle({
      role: "counterweight",
      x: anchor.x + random(390, 520) * spread,
      y: anchor.y + random(-310, -170) * spread,
      radius: random(70, 125),
      color: [201, 154, 56],
      importance: 0.54,
      intent
    }));

    elements.push(this._polygon({
      role: "secondary",
      x: anchor.x + random(350, 490) * spread,
      y: anchor.y + random(210, 350) * spread,
      radius: random(180, 280),
      sides: 4,
      rotation: random(-0.8, 0.8) + diagonalPush * 0.18,
      color: [83, 116, 75],
      importance: 0.62,
      intent
    }));

    return elements;
  }

  _circle({ role, x, y, radius, color, importance, intent }) {
    return {
      type: "circle",
      position: { x, y },
      geometry: { radius, rotation: 0 },
      composition: { role, importance, cluster: role === "anchor" ? 0 : 1 },
      appearance: {
        color,
        watercolorStrength: 1,
        inkStrength: 0,
        opacity: 1
      },
      dynamics: this._dynamics(intent, role)
    };
  }

  _polygon({ role, x, y, radius, sides, rotation, color, importance, intent }) {
    return {
      type: "polygon",
      position: { x, y },
      geometry: {
        radius,
        sides,
        rotation,
        points: this._makePolygon(x, y, radius, sides, rotation)
      },
      composition: { role, importance, cluster: 1 },
      appearance: {
        color,
        watercolorStrength: 1,
        inkStrength: 0,
        opacity: 1
      },
      dynamics: this._dynamics(intent, role)
    };
  }

  _dynamics(intent, role) {
    return {
      tension: intent.tension,
      isolation: intent.isolation,
      continuity: constrain(1 - intent.fragility, 0, 1),
      ambiguity: intent.ambiguity,
      energy: intent.energy,
      weight: role === "anchor" ? 0.9 : 0.5
    };
  }

  _makePolygon(cx, cy, radius, sides, rotation = 0) {
    const points = [];

    for (let i = 0; i < sides; i++) {
      const angle = rotation + (TWO_PI / sides) * i;
      const r = radius * random(0.75, 1.1);

      points.push({
        x: cx + Math.cos(angle) * r,
        y: cy + Math.sin(angle) * r
      });
    }

    return points;
  }
}
