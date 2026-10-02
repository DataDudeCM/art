class TestComposition {
  constructor(canvasWidth, canvasHeight, settings = {}) {
    this.width = canvasWidth;
    this.height = canvasHeight;
    this.s = settings;
    this.lastProtectedZone = null;
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
    this.lastProtectedZone = null;

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
    const protectedZone = this._makeProtectedZone(anchor, b.negativeSpace);
    this.lastProtectedZone = protectedZone;

    const anchorElement = this._circle({
      role: "anchor",
      x: anchor.x,
      y: anchor.y,
      radius: random(165, 220) * b.scaleContrast,
      color: this.palette.red,
      importance: 0.96,
      intent,
      cluster: 0
    });
    elements.push(anchorElement);

    // One companion stays near enough to create restlessness; the other masses
    // are deliberately pushed away to let isolation become visible.
    const open = this._openDirections(anchor);
    const secondaryPos = this._avoidZone(
      this._offsetFromAnchor(
        anchor,
        open.x * random(155, 255) * b.spread,
        -open.y * random(35, 145) * b.spread,
        24
      ),
      protectedZone,
      120
    );

    const secondaryElement = this._polygon({
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
    });
    elements.push(secondaryElement);

    const counterPos = this._avoidZone(
      this._offsetFromAnchor(
        anchor,
        open.x * random(430, 590),
        open.y * random(220, 360),
        36
      ),
      protectedZone,
      80
    );

    const counterElement = this._circle({
      role: "counterweight",
      x: counterPos.x,
      y: counterPos.y,
      radius: random(62, 105),
      color: this.palette.yellow,
      importance: 0.52,
      intent,
      cluster: 1
    });
    elements.push(counterElement);

    if (b.secondaryCount >= 3) {
      const distantSecondaryPos = this._avoidZone(
        this._offsetFromAnchor(
          anchor,
          open.x * random(360, 520),
          -open.y * random(280, 420),
          44
        ),
        protectedZone,
        110
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

    this._addEchoCircle(elements, anchorElement, {
      intent,
      scale: 0.22,
      dx: open.x * random(35, 80),
      dy: -open.y * random(55, 110),
      jitter: 16,
      color: this.palette.ochre,
      cluster: 0
    });

    const restlessAngle = Math.atan2(open.y, open.x) + random(-0.45, 0.25);
    const restlessStart = {
      x: anchor.x - Math.cos(restlessAngle) * random(170, 250),
      y: anchor.y - Math.sin(restlessAngle) * random(170, 250)
    };
    const restlessEnd = {
      x: anchor.x + Math.cos(restlessAngle) * random(430, 600),
      y: anchor.y + Math.sin(restlessAngle) * random(430, 600)
    };
    elements.push(this._line({
      role: "gesture",
      x1: this._clamp(restlessStart.x, 70, this.width - 70),
      y1: this._clamp(restlessStart.y, 70, this.height - 70),
      x2: this._clamp(restlessEnd.x, 70, this.width - 70),
      y2: this._clamp(restlessEnd.y, 70, this.height - 70),
      importance: 0.62,
      intent,
      relationship: { type: "align", targetRole: "anchor" }
    }));

    elements.push(this._arc({
      role: "echo",
      x: anchor.x,
      y: anchor.y,
      radius: anchorElement.geometry.radius * random(1.2, 1.55),
      startAngle: random(-PI * 0.15, PI * 0.15),
      endAngle: random(PI * 0.65, PI * 1.05),
      importance: 0.34,
      intent,
      cluster: 0,
      relationship: { type: "echo", targetRole: "anchor" }
    }));

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

    const anchorElement = this._circle({
      role: "anchor",
      x: anchor.x,
      y: anchor.y,
      radius: random(145, 185),
      color: this.palette.blue,
      importance: 0.90,
      intent,
      cluster: 0
    });
    elements.push(anchorElement);

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

    this._addEchoCircle(elements, anchorElement, {
      intent,
      scale: 0.18,
      dx: open.x * interval * 0.18,
      dy: -open.y * interval * 1.2,
      jitter: 10,
      color: this.palette.blue,
      cluster: 0,
      relationshipType: "align"
    });

    this._addEchoPolygon(elements, anchorElement, {
      intent,
      scale: 0.28,
      dx: open.x * interval * 0.22,
      dy: open.y * interval * 1.25,
      jitter: 14,
      color: this.palette.yellow,
      sides: 4,
      rotation: random(-0.15, 0.15),
      distortion: 0.10,
      cluster: 0,
      relationshipType: "align"
    });

    const lineLength = random(330, 480);
    for (let i = -1; i <= 1; i++) {
      const x = axisX + open.x * (i * 42 + random(-10, 10));
      const y1 = anchor.y - open.y * lineLength * 0.52;
      const y2 = anchor.y + open.y * lineLength * 0.52;
      elements.push(this._line({
        role: "axis",
        x1: x,
        y1: this._clamp(y1, 65, this.height - 65),
        x2: x + random(-10, 10) * b.irregularity,
        y2: this._clamp(y2 + i * random(-22, 22), 65, this.height - 65),
        importance: i === 0 ? 0.52 : 0.34,
        intent,
        cluster: 0,
        relationship: { type: "align", targetRole: "anchor" }
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

    const anchorElement = this._circle({
      role: "anchor",
      x: centerX - centerGap * 0.5,
      y: y + random(-45, 45),
      radius: random(205, 270) * b.scaleContrast,
      color: this.palette.red,
      importance: 0.98,
      intent,
      cluster: 0
    });
    elements.push(anchorElement);

    const counterElement = this._polygon({
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
    });
    elements.push(counterElement);

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

    this._addOrbitCluster(elements, { x: centerX, y }, {
      intent,
      count: 2,
      distanceMin: 50,
      distanceMax: 105,
      sizeMin: 18,
      sizeMax: 34,
      color: this.palette.ochre,
      cluster: 0,
      relationshipType: "align",
      targetRole: "midpoint"
    });

    this._addEchoCircle(elements, anchorElement, {
      intent,
      scale: 0.16,
      dx: (counterElement.position.x - anchorElement.position.x) * 0.45,
      dy: random(-40, 40),
      jitter: 10,
      color: this.palette.red,
      cluster: 0,
      relationshipType: "align"
    });

    const conflictAngle = random(-0.95, -0.45);
    const conflictHalf = random(390, 520);
    elements.push(this._line({
      role: "gesture",
      x1: this._clamp(centerX - Math.cos(conflictAngle) * conflictHalf, 60, this.width - 60),
      y1: this._clamp(y - Math.sin(conflictAngle) * conflictHalf, 60, this.height - 60),
      x2: this._clamp(centerX + Math.cos(conflictAngle) * conflictHalf, 60, this.width - 60),
      y2: this._clamp(y + Math.sin(conflictAngle) * conflictHalf, 60, this.height - 60),
      importance: 0.76,
      intent,
      relationship: { type: "intersect", targetRole: "anchor/counterweight" }
    }));

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
    const protectedZone = this._makeProtectedZone(anchor, b.negativeSpace);
    this.lastProtectedZone = protectedZone;

    const anchorElement = this._circle({
      role: "anchor",
      x: anchor.x,
      y: anchor.y,
      radius: random(120, 165),
      color: this.palette.yellow,
      importance: 0.82,
      intent,
      cluster: 0
    });
    elements.push(anchorElement);

    const count = Math.max(2, b.secondaryCount);
    const open = this._openDirections(anchor);
    for (let i = 0; i < count; i++) {
      const t = count === 1 ? 0 : i / (count - 1);
      const pos = this._avoidZone(
        this._offsetFromAnchor(
          anchor,
          open.x * lerp(170, 560, t),
          open.y * lerp(60, 330, t),
          70
        ),
        protectedZone,
        80
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

    this._addOrbitCluster(elements, anchorElement.position, {
      intent,
      count: 2,
      distanceMin: anchorElement.geometry.radius * 0.72,
      distanceMax: anchorElement.geometry.radius * 1.05,
      sizeMin: 18,
      sizeMax: 34,
      color: this.palette.ochre,
      cluster: 0,
      relationshipType: "orbit",
      targetRole: anchorElement.composition.role
    });

    const arcStart = random(-PI * 0.8, -PI * 0.2);
    elements.push(this._arc({
      role: "orbit",
      x: anchor.x,
      y: anchor.y,
      radius: anchorElement.geometry.radius * random(1.45, 1.85),
      startAngle: arcStart,
      endAngle: arcStart + random(PI * 0.65, PI * 1.05),
      importance: 0.42,
      intent,
      cluster: 0,
      relationship: { type: "orbit", targetRole: "anchor" }
    }));

    if (random() < 0.7) {
      elements.push(this._arc({
        role: "echo",
        x: anchor.x,
        y: anchor.y,
        radius: anchorElement.geometry.radius * random(1.95, 2.25),
        startAngle: arcStart + random(0.18, 0.42),
        endAngle: arcStart + random(PI * 0.42, PI * 0.72),
        importance: 0.28,
        intent,
        cluster: 0,
        relationship: { type: "echo", targetRole: "orbit" }
      }));
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

    const anchorElement = this._polygon({
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
    });
    elements.push(anchorElement);

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

    this._addEchoPolygon(elements, anchorElement, {
      intent,
      scale: 0.28,
      dx: open.x * random(90, 150),
      dy: -open.y * random(70, 130),
      jitter: 20,
      color: this.palette.ochre,
      sides: 4,
      rotation: random(-0.2, 0.2) + 0.2,
      distortion: 0.32,
      cluster: 0
    });

    const structureBaseAngle = random(-0.12, 0.12);
    for (let i = 0; i < 3; i++) {
      const fracture = i / 2;
      const angle = structureBaseAngle + open.x * fracture * random(0.18, 0.52);
      const cx = anchor.x + open.x * (i - 1) * random(65, 105);
      const cy = anchor.y + open.y * (i - 1) * random(45, 80);
      const half = random(190, 280);
      elements.push(this._line({
        role: i === 0 ? "axis" : "gesture",
        x1: this._clamp(cx - Math.cos(angle) * half, 60, this.width - 60),
        y1: this._clamp(cy - Math.sin(angle) * half, 60, this.height - 60),
        x2: this._clamp(cx + Math.cos(angle) * half, 60, this.width - 60),
        y2: this._clamp(cy + Math.sin(angle) * half, 60, this.height - 60),
        importance: 0.48 - fracture * 0.10,
        intent,
        cluster: fracture < 0.5 ? 0 : 1,
        relationship: { type: "align", targetRole: "structure" }
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
    const protectedZone = this._makeProtectedZone(origin, b.negativeSpace);
    this.lastProtectedZone = protectedZone;

    const anchorElement = this._circle({
      role: "anchor",
      x: origin.x,
      y: origin.y,
      radius: random(125, 165),
      color: this.palette.violet,
      importance: 0.84,
      intent,
      cluster: 0
    });
    elements.push(anchorElement);

    const count = Math.max(3, b.secondaryCount);
    const open = this._openDirections(origin);
    const baseAngle = Math.atan2(open.y, open.x) + random(-0.5, 0.5);

    // Elements step outward from the anchor, implying a path without drawing one.
    for (let i = 0; i < count; i++) {
      const t = (i + 1) / count;
      const angle = baseAngle + random(-0.35, 0.35) * intent.ambiguity + t * 0.42;
      const distance = lerp(150, 520 * b.spread, t);
      const candidate = this._avoidZone(
        {
          x: origin.x + Math.cos(angle) * distance,
          y: origin.y + Math.sin(angle) * distance
        },
        protectedZone,
        72
      );
      const x = candidate.x;
      const y = candidate.y;
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

    this._addEchoCircle(elements, anchorElement, {
      intent,
      scale: 0.16,
      dx: Math.cos(baseAngle) * random(75, 110),
      dy: Math.sin(baseAngle) * random(75, 110),
      jitter: 10,
      color: this.palette.yellow,
      cluster: 0
    });

    this._addOrbitCluster(elements, {
      x: origin.x + Math.cos(baseAngle) * 85,
      y: origin.y + Math.sin(baseAngle) * 85
    }, {
      intent,
      count: 2,
      distanceMin: 22,
      distanceMax: 55,
      sizeMin: 14,
      sizeMax: 28,
      color: this.palette.yellow,
      cluster: 0,
      relationshipType: "echo",
      targetRole: anchorElement.composition.role
    });

    const searchEnd = {
      x: origin.x + Math.cos(baseAngle) * random(420, 610),
      y: origin.y + Math.sin(baseAngle) * random(420, 610)
    };
    elements.push(this._line({
      role: "gesture",
      x1: origin.x + Math.cos(baseAngle) * anchorElement.geometry.radius * 0.7,
      y1: origin.y + Math.sin(baseAngle) * anchorElement.geometry.radius * 0.7,
      x2: this._clamp(searchEnd.x, 70, this.width - 70),
      y2: this._clamp(searchEnd.y, 70, this.height - 70),
      importance: 0.44,
      intent,
      relationship: { type: "connect", targetRole: "path" }
    }));

    elements.push(this._arc({
      role: "gesture",
      x: origin.x + Math.cos(baseAngle) * random(180, 260),
      y: origin.y + Math.sin(baseAngle) * random(180, 260),
      radius: random(120, 190),
      startAngle: baseAngle - random(1.0, 1.35),
      endAngle: baseAngle + random(0.2, 0.65),
      importance: 0.34,
      intent,
      cluster: 1,
      relationship: { type: "echo", targetRole: "path" }
    }));

    return elements;
  }

  _line({ role, x1, y1, x2, y2, importance, intent, cluster = 0, relationship = null }) {
    return {
      type: "line",
      geometry: { x1, y1, x2, y2 },
      composition: { role, importance, cluster },
      appearance: {
        watercolorStrength: 0,
        inkStrength: 0.82,
        opacity: 1
      },
      relationship,
      dynamics: this._dynamics(intent, role)
    };
  }

  _arc({ role, x, y, radius, startAngle, endAngle, importance, intent, cluster = 0, relationship = null }) {
    return {
      type: "arc",
      position: { x, y },
      geometry: { radius, startAngle, endAngle },
      composition: { role, importance, cluster },
      appearance: {
        watercolorStrength: 0,
        inkStrength: 0.68,
        opacity: 1
      },
      relationship,
      dynamics: this._dynamics(intent, role)
    };
  }

  _circle({ role, x, y, radius, color, importance, intent, cluster = 1, relationship = null }) {
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
      relationship,
      dynamics: this._dynamics(intent, role)
    };
  }

  _polygon({ role, x, y, radius, sides, rotation, color, importance, intent, cluster = 1, distortion = 0.12, relationship = null }) {
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
      relationship,
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


  _addEchoCircle(elements, source, { intent, scale = 0.25, dx = 0, dy = 0, jitter = 0, color = null, role = "accent", cluster = null, relationshipType = "echo" }) {
    const sourcePos = this._elementPosition(source);
    const sourceRadius = this._elementRadius(source);
    const pos = this._offsetFromAnchor(sourcePos, dx, dy, jitter);

    const echo = this._circle({
      role,
      x: pos.x,
      y: pos.y,
      radius: sourceRadius * scale * random(0.9, 1.1),
      color: color || source.appearance?.color || this.palette.ochre,
      importance: 0.34,
      intent,
      cluster: cluster ?? source.composition?.cluster ?? 0,
      relationship: {
        type: relationshipType,
        targetRole: source.composition?.role ?? "anchor"
      }
    });

    elements.push(echo);
    return echo;
  }

  _addEchoPolygon(elements, source, { intent, scale = 0.28, dx = 0, dy = 0, jitter = 0, color = null, role = "accent", cluster = null, sides = null, rotation = null, distortion = 0.12, relationshipType = "echo" }) {
    const sourcePos = this._elementPosition(source);
    const sourceRadius = this._elementRadius(source);
    const pos = this._offsetFromAnchor(sourcePos, dx, dy, jitter);
    const polygon = this._polygon({
      role,
      x: pos.x,
      y: pos.y,
      radius: sourceRadius * scale * random(0.9, 1.1),
      sides: sides ?? source.geometry?.sides ?? 4,
      rotation: rotation ?? source.geometry?.rotation ?? 0,
      color: color || source.appearance?.color || this.palette.ochre,
      importance: 0.34,
      intent,
      cluster: cluster ?? source.composition?.cluster ?? 0,
      distortion,
      relationship: {
        type: relationshipType,
        targetRole: source.composition?.role ?? "anchor"
      }
    });

    elements.push(polygon);
    return polygon;
  }

  _addOrbitCluster(elements, center, { intent, count = 2, distanceMin = 30, distanceMax = 80, sizeMin = 14, sizeMax = 30, color = null, role = "accent", cluster = 0, relationshipType = "orbit", targetRole = "anchor" }) {
    const point = this._elementPosition(center);
    const startAngle = random(TWO_PI);

    for (let i = 0; i < count; i++) {
      const angle = startAngle + (TWO_PI / count) * i + random(-0.35, 0.35);
      const distance = random(distanceMin, distanceMax);
      const x = this._clamp(point.x + Math.cos(angle) * distance, 80, this.width - 80);
      const y = this._clamp(point.y + Math.sin(angle) * distance, 80, this.height - 80);

      elements.push(this._circle({
        role,
        x,
        y,
        radius: random(sizeMin, sizeMax),
        color: color || this.palette.ochre,
        importance: 0.30,
        intent,
        cluster,
        relationship: {
          type: relationshipType,
          targetRole
        }
      }));
    }
  }

  _elementPosition(source) {
    if (source.position) return { x: source.position.x, y: source.position.y };
    return { x: source.x, y: source.y };
  }

  _elementRadius(source) {
    return source.geometry?.radius ?? source.radius ?? 40;
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



  _makeProtectedZone(anchor, negativeSpace) {
    // Place a soft circular exclusion zone in a region away from the anchor.
    // High-isolation intents receive larger protected areas; lower-isolation
    // intents still get breathing room without becoming sparse by formula.
    const candidates = [
      { x: this.width * 0.22, y: this.height * 0.22 },
      { x: this.width * 0.78, y: this.height * 0.22 },
      { x: this.width * 0.22, y: this.height * 0.78 },
      { x: this.width * 0.78, y: this.height * 0.78 }
    ];

    // Favor corners farther from the anchor, but retain seeded variation.
    const weighted = candidates.map((point) => {
      const d = Math.hypot(point.x - anchor.x, point.y - anchor.y);
      return {
        ...point,
        weight: Math.max(0.1, d / Math.hypot(this.width, this.height))
      };
    });

    const center = this._weightedChoice(weighted);
    const radius = lerp(
      Math.min(this.width, this.height) * 0.10,
      Math.min(this.width, this.height) * 0.24,
      this._clamp(negativeSpace, 0, 1)
    );

    return {
      x: center.x + random(-45, 45),
      y: center.y + random(-45, 45),
      radius
    };
  }

  _avoidZone(point, zone, padding = 0) {
    if (!zone) return point;

    const dx = point.x - zone.x;
    const dy = point.y - zone.y;
    const distance = Math.hypot(dx, dy);
    const minimumDistance = zone.radius + padding;

    if (distance >= minimumDistance) return point;

    // Push the candidate just outside the protected region. If it lands
    // exactly at the center, choose a seeded direction instead.
    const angle = distance > 0.001
      ? Math.atan2(dy, dx)
      : random(TWO_PI);

    return {
      x: this._clamp(
        zone.x + Math.cos(angle) * minimumDistance,
        80,
        this.width - 80
      ),
      y: this._clamp(
        zone.y + Math.sin(angle) * minimumDistance,
        80,
        this.height - 80
      )
    };
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
