class TestComposition {
  constructor(canvasWidth, canvasHeight, settings = {}) {
    this.width = canvasWidth;
    this.height = canvasHeight;
    this.s = settings;
    this.palette = settings.palette || {
      red: [176, 82, 72],
      blue: [65, 95, 145],
      yellow: [201, 154, 56],
      green: [83, 116, 75],
      ochre: [170, 116, 62],
      violet: [111, 83, 124]
    };
  }

  create(intent) {
    switch (intent.movement) {
      case "structured":
        return this._fragileOrder(intent);
      case "opposed":
        return this._controlledConflict(intent);
      case "drifting":
        return this._quietCuriosity(intent);
      case "fractured":
        return this._breakingStructure(intent);
      case "outward":
        return this._searching(intent);
      case "diagonal":
      default:
        return this._restlessSolitude(intent);
    }
  }

  _restlessSolitude(intent) {
    const b = intent.compositionBias;
    const anchor = this._anchorFromZones([
      this._zone(0.22, 0.36, 0.30, 0.46, 0.45),
      this._zone(0.18, 0.34, 0.56, 0.76, 0.30),
      this._zone(0.36, 0.50, 0.38, 0.60, 0.25)
    ]);
    const elements = [];

    elements.push(this._circle({
      role: "anchor",
      x: anchor.x,
      y: anchor.y,
      radius: random(165, 220) * b.scaleContrast,
      color: this.palette.red,
      importance: 0.96,
      intent,
      cluster: 0
    }));

    // One companion stays near enough to create restlessness; the other masses
    // are deliberately pushed away to let isolation become visible.
    const open = this._openDirections(anchor);
    const secondaryPos = this._offsetFromAnchor(
      anchor,
      open.x * random(155, 255) * b.spread,
      -open.y * random(35, 145) * b.spread,
      24
    );

    elements.push(this._polygon({
      role: "secondary",
      x: secondaryPos.x,
      y: secondaryPos.y,
      radius: random(205, 290),
      sides: 3,
      rotation: random(-0.45, 0.25) - intent.tension * 0.35,
      color: this.palette.blue,
      importance: 0.72,
      intent,
      cluster: 0
    }));

    const counterPos = this._offsetFromAnchor(
      anchor,
      open.x * random(430, 590),
      open.y * random(220, 360),
      36
    );

    elements.push(this._circle({
      role: "counterweight",
      x: counterPos.x,
      y: counterPos.y,
      radius: random(62, 105),
      color: this.palette.yellow,
      importance: 0.52,
      intent,
      cluster: 1
    }));

    if (b.secondaryCount >= 3) {
      const distantSecondaryPos = this._offsetFromAnchor(
        anchor,
        open.x * random(360, 520),
        -open.y * random(280, 420),
        44
      );

      elements.push(this._polygon({
        role: "secondary",
        x: distantSecondaryPos.x,
        y: distantSecondaryPos.y,
        radius: random(145, 220),
        sides: 4,
        rotation: random(-0.9, 0.5),
        color: this.palette.green,
        importance: 0.58,
        intent,
        cluster: 1
      }));
    }

    return elements;
  }

  _fragileOrder(intent) {
    const b = intent.compositionBias;
    const anchor = this._anchorFromZones([
      this._zone(0.28, 0.40, 0.28, 0.40, 0.35),
      this._zone(0.34, 0.48, 0.44, 0.58, 0.40),
      this._zone(0.28, 0.42, 0.62, 0.76, 0.25)
    ]);
    const elements = [];
    const open = this._openDirections(anchor);
    const axisX = anchor.x + random(-25, 25);
    const interval = lerp(150, 225, 1 - b.clusterTightness);

    elements.push(this._circle({
      role: "anchor",
      x: anchor.x,
      y: anchor.y,
      radius: random(145, 185),
      color: this.palette.blue,
      importance: 0.90,
      intent,
      cluster: 0
    }));

    // A nearly ordered vertical sequence, but each placement slips slightly.
    for (let i = -1; i <= 1; i++) {
      const xSlip = random(-45, 45) * b.irregularity;
      const ySlip = random(-30, 30) * b.irregularity;
      const role = i === 1 ? "counterweight" : "secondary";

      elements.push(this._polygon({
        role,
        x: axisX + xSlip + open.x * (i === 1 ? interval * 1.1 : interval * 0.45),
        y: anchor.y + i * interval * open.y + ySlip,
        radius: random(95, 145),
        sides: i === 0 ? 4 : 3,
        rotation: random(-0.15, 0.15) + i * 0.06,
        color: i === 0 ? this.palette.yellow : this.palette.green,
        importance: role === "counterweight" ? 0.48 : 0.58,
        intent,
        cluster: 0
      }));
    }

    return elements;
  }

  _controlledConflict(intent) {
    const b = intent.compositionBias;
    const centerZone = this._anchorFromZones([
      this._zone(0.45, 0.51, 0.34, 0.46, 0.25),
      this._zone(0.46, 0.54, 0.44, 0.56, 0.50),
      this._zone(0.49, 0.57, 0.56, 0.68, 0.25)
    ]);
    const y = centerZone.y;
    const centerX = centerZone.x;
    const centerGap = lerp(250, 70, b.overlap);
    const elements = [];

    elements.push(this._circle({
      role: "anchor",
      x: centerX - centerGap * 0.5,
      y: y + random(-45, 45),
      radius: random(205, 270) * b.scaleContrast,
      color: this.palette.red,
      importance: 0.98,
      intent,
      cluster: 0
    }));

    elements.push(this._polygon({
      role: "counterweight",
      x: centerX + centerGap * 0.5,
      y: y + random(-55, 55),
      radius: random(220, 295),
      sides: 3,
      rotation: random(-0.2, 0.2) + PI,
      color: this.palette.blue,
      importance: 0.92,
      intent,
      cluster: 1
    }));

    // Small forms become pressure points near the collision zone.
    const count = Math.max(2, b.secondaryCount - 1);
    for (let i = 0; i < count; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      elements.push(this._polygon({
        role: "secondary",
        x: centerX + side * random(40, 150),
        y: y + random(-210, 220),
        radius: random(70, 125),
        sides: random() < 0.55 ? 3 : 4,
        rotation: random(-1.0, 1.0),
        color: i % 2 === 0 ? this.palette.yellow : this.palette.green,
        importance: 0.50,
        intent,
        cluster: i % 2
      }));
    }

    return elements;
  }

  _quietCuriosity(intent) {
    const b = intent.compositionBias;
    const anchor = this._anchorFromZones([
      this._zone(0.16, 0.30, 0.22, 0.36, 0.40),
      this._zone(0.58, 0.74, 0.18, 0.34, 0.20),
      this._zone(0.18, 0.34, 0.56, 0.74, 0.20),
      this._zone(0.34, 0.50, 0.28, 0.46, 0.20)
    ]);
    const elements = [];

    elements.push(this._circle({
      role: "anchor",
      x: anchor.x,
      y: anchor.y,
      radius: random(120, 165),
      color: this.palette.yellow,
      importance: 0.82,
      intent,
      cluster: 0
    }));

    const count = Math.max(2, b.secondaryCount);
    const open = this._openDirections(anchor);
    for (let i = 0; i < count; i++) {
      const t = count === 1 ? 0 : i / (count - 1);
      const pos = this._offsetFromAnchor(
        anchor,
        open.x * lerp(170, 560, t),
        open.y * lerp(60, 330, t),
        70
      );
      const x = pos.x;
      const y = pos.y;
      const isCircle = random() < 0.45;
      const common = {
        role: i === count - 1 ? "counterweight" : "secondary",
        x,
        y,
        radius: random(68, 125),
        color: i % 2 === 0 ? this.palette.blue : this.palette.green,
        importance: 0.44 + (1 - t) * 0.12,
        intent,
        cluster: 1
      };

      elements.push(isCircle
        ? this._circle(common)
        : this._polygon({
            ...common,
            sides: random() < 0.6 ? 3 : 4,
            rotation: random(-0.55, 0.55)
          })
      );
    }

    return elements;
  }

  _breakingStructure(intent) {
    const b = intent.compositionBias;
    const anchor = this._anchorFromZones([
      this._zone(0.24, 0.38, 0.34, 0.50, 0.35),
      this._zone(0.34, 0.48, 0.46, 0.60, 0.40),
      this._zone(0.48, 0.60, 0.22, 0.38, 0.25)
    ]);
    const elements = [];
    const open = this._openDirections(anchor);

    elements.push(this._polygon({
      role: "anchor",
      x: anchor.x,
      y: anchor.y,
      radius: random(230, 285),
      sides: 4,
      rotation: random(-0.18, 0.18),
      color: this.palette.ochre,
      importance: 0.94,
      intent,
      cluster: 0,
      distortion: 0.35 + b.irregularity * 0.45
    }));

    // Repeated forms begin on an implied structure and then progressively break away.
    const count = Math.max(3, b.secondaryCount);
    for (let i = 0; i < count; i++) {
      const fracture = (i + 1) / count;
      const direction = i % 2 === 0 ? 1 : -1;
      const x = anchor.x + open.x * direction * random(120, 240) * fracture + random(-55, 55) * b.irregularity;
      const y = anchor.y + open.y * (i - count / 2) * random(95, 150) + random(-70, 70) * b.irregularity;

      elements.push(this._polygon({
        role: i === count - 1 ? "counterweight" : "secondary",
        x,
        y,
        radius: random(85, 155) * (1 + fracture * 0.25),
        sides: random() < 0.72 ? 4 : 3,
        rotation: random(-0.35, 0.35) + direction * fracture * 0.85,
        color: i % 2 === 0 ? this.palette.blue : this.palette.red,
        importance: 0.50 + fracture * 0.08,
        intent,
        cluster: fracture < 0.5 ? 0 : 1,
        distortion: 0.25 + fracture * b.irregularity * 0.75
      }));
    }

    return elements;
  }

  _searching(intent) {
    const b = intent.compositionBias;
    const origin = this._anchorFromZones([
      this._zone(0.18, 0.30, 0.26, 0.42, 0.30),
      this._zone(0.20, 0.34, 0.58, 0.76, 0.25),
      this._zone(0.34, 0.48, 0.34, 0.52, 0.25),
      this._zone(0.54, 0.68, 0.22, 0.38, 0.20)
    ]);
    const elements = [];

    elements.push(this._circle({
      role: "anchor",
      x: origin.x,
      y: origin.y,
      radius: random(125, 165),
      color: this.palette.violet,
      importance: 0.84,
      intent,
      cluster: 0
    }));

    const count = Math.max(3, b.secondaryCount);
    const open = this._openDirections(origin);
    const baseAngle = Math.atan2(open.y, open.x) + random(-0.5, 0.5);

    // Elements step outward from the anchor, implying a path without drawing one.
    for (let i = 0; i < count; i++) {
      const t = (i + 1) / count;
      const angle = baseAngle + random(-0.35, 0.35) * intent.ambiguity + t * 0.42;
      const distance = lerp(150, 520 * b.spread, t);
      const x = origin.x + Math.cos(angle) * distance;
      const y = origin.y + Math.sin(angle) * distance;
      const isCircle = i % 2 === 0;
      const common = {
        role: i === count - 1 ? "counterweight" : "secondary",
        x: this._clamp(x, 90, this.width - 90),
        y: this._clamp(y, 90, this.height - 90),
        radius: lerp(125, 70, t) * random(0.82, 1.16),
        color: i % 3 === 0 ? this.palette.yellow : this.palette.blue,
        importance: lerp(0.62, 0.42, t),
        intent,
        cluster: 1
      };

      elements.push(isCircle
        ? this._circle(common)
        : this._polygon({
            ...common,
            sides: random() < 0.55 ? 3 : 4,
            rotation: angle + random(-0.4, 0.4)
          })
      );
    }

    return elements;
  }

  _circle({ role, x, y, radius, color, importance, intent, cluster = 1 }) {
    return {
      type: "circle",
      position: { x, y },
      geometry: { radius, rotation: 0 },
      composition: { role, importance, cluster },
      appearance: {
        color,
        watercolorStrength: 1,
        inkStrength: 0,
        opacity: 1
      },
      dynamics: this._dynamics(intent, role)
    };
  }

  _polygon({ role, x, y, radius, sides, rotation, color, importance, intent, cluster = 1, distortion = 0.12 }) {
    return {
      type: "polygon",
      position: { x, y },
      geometry: {
        radius,
        sides,
        rotation,
        points: this._makePolygon(x, y, radius, sides, rotation, distortion)
      },
      composition: { role, importance, cluster },
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
      weight: role === "anchor" ? 0.9 : role === "counterweight" ? 0.65 : 0.5
    };
  }

  _makePolygon(cx, cy, radius, sides, rotation = 0, distortion = 0.12) {
    const points = [];
    const minScale = Math.max(0.55, 1 - distortion);
    const maxScale = 1 + distortion * 0.75;

    for (let i = 0; i < sides; i++) {
      const angle = rotation + (TWO_PI / sides) * i;
      const r = radius * random(minScale, maxScale);

      points.push({
        x: cx + Math.cos(angle) * r,
        y: cy + Math.sin(angle) * r
      });
    }

    return points;
  }


  _zone(xMin, xMax, yMin, yMax, weight = 1) {
    return { xMin, xMax, yMin, yMax, weight };
  }

  _anchorFromZones(zones) {
    const zone = this._weightedChoice(zones);
    return this._point(zone.xMin, zone.xMax, zone.yMin, zone.yMax);
  }

  _weightedChoice(items) {
    const totalWeight = items.reduce((sum, item) => sum + (item.weight ?? 1), 0);
    let threshold = random(totalWeight);

    for (const item of items) {
      threshold -= (item.weight ?? 1);
      if (threshold <= 0) return item;
    }

    return items[items.length - 1];
  }


  _openDirections(anchor) {
    return {
      x: anchor.x < this.width * 0.5 ? 1 : -1,
      y: anchor.y < this.height * 0.5 ? 1 : -1
    };
  }

  _offsetFromAnchor(anchor, dx, dy, jitter = 0, margin = 80) {
    return {
      x: this._clamp(
        anchor.x + dx + random(-jitter, jitter),
        margin,
        this.width - margin
      ),
      y: this._clamp(
        anchor.y + dy + random(-jitter, jitter),
        margin,
        this.height - margin
      )
    };
  }

  _point(xMin, xMax, yMin, yMax) {
    return {
      x: random(xMin, xMax) * this.width,
      y: random(yMin, yMax) * this.height
    };
  }

  _clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }
}
