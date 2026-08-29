class LineAgent extends BaseAgent {
  constructor(personality = new Personality()) {
    super("line", personality);

    this.series = null;
  }

  update() {
    // While drawing a series, stay anchored in place.
    if (this.series && this.series.active) {
      this.age++;
      this.framesSinceMark++;
      return;
    }

    super.update();
  }

  shouldDraw() {
    // If already in a series, draw on scheduled frames only.
    if (this.series && this.series.active) {
      if (frameCount >= this.series.nextFrame) {
        this.series.nextFrame += this.series.frameInterval;
        return true;
      }

      return false;
    }

    // Otherwise use the normal single-mark behavior.
    const normalDraw = super.shouldDraw();

    if (!normalDraw) {
      return false;
    }

    // Occasionally convert a normal draw into the start of a series.
    if (
      SETTINGS.lineSeries.enabled &&
      random() < SETTINGS.lineSeries.startChance
    ) {
      this.startSeries();
    }

    return true;
  }

  startSeries() {
    const cfg = SETTINGS.lineSeries;
    const canvasSize = min(width, height);

    const total = floor(random(cfg.count[0], cfg.count[1] + 1));
    const spacing = random(cfg.spacing[0], cfg.spacing[1]) * canvasSize;

    const orientation = random() < 0.5
      ? "vertical"
      : "horizontal";

    const frameInterval = floor(
      random(cfg.intervalFrames[0], cfg.intervalFrames[1] + 1)
    );

    this.series = {
      active: true,
      anchor: this.position.copy(),
      total,
      index: 0,
      spacing,
      orientation,
      frameInterval,
      nextFrame: frameCount
    };
  }

  createMarkRequest() {
    const [minPct, maxPct] = SETTINGS.marks.lineLength;
    const canvasSize = min(width, height);

    const len = lerp(
      minPct * canvasSize,
      maxPct * canvasSize,
      this.personality.scale
    );

    let x1, y1, x2, y2;

    if (this.series && this.series.active) {
      const s = this.series;
      const centeredIndex = s.index - (s.total - 1) * 0.5;
      const jitter = SETTINGS.lineSeries.jitter;

      let cx = s.anchor.x;
      let cy = s.anchor.y;

      if (s.orientation === "vertical") {
        cx += centeredIndex * s.spacing;
        cy += random(-jitter, jitter);

        x1 = cx;
        y1 = cy - len * 0.5;
        x2 = cx;
        y2 = cy + len * 0.5;
      } else {
        cy += centeredIndex * s.spacing;
        cx += random(-jitter, jitter);

        x1 = cx - len * 0.5;
        y1 = cy;
        x2 = cx + len * 0.5;
        y2 = cy;
      }

      s.index++;

      if (s.index >= s.total) {
        this.series = null;
      }
    } else {
      const direction = this.velocity.copy().normalize();
      const half = direction.copy().mult(len * 0.5);

      x1 = this.position.x - half.x;
      y1 = this.position.y - half.y;
      x2 = this.position.x + half.x;
      y2 = this.position.y + half.y;
    }

    return {
      type: "line",
      x1,
      y1,
      x2,
      y2,

      opacity: this.personality.opacity,
      weight: this.personality.weight,
      roughness: this.personality.roughness,
      colorHex: this.colorHex,
      age: this.age,

      completeness: this.personality.completeness,
      repetition: this.personality.repetition,
      distortion: this.personality.distortion
    };
  }
}