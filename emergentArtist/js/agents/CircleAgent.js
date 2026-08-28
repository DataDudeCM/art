class CircleAgent extends BaseAgent {
  constructor(personality = new Personality()) {
    super("circle", personality);
  }

  createMarkRequest() {
    const [minPct, maxPct] = SETTINGS.marks.circleDiameter;
    const canvasSize = min(width, height);

    const diameter = lerp(
      minPct * canvasSize,
      maxPct * canvasSize,
      this.personality.scale
    );

    // decide "size" of circle segments
    const r = random();
    let segmentAngle;

    if (r < 0.70) {
      segmentAngle = TWO_PI;          // 360
    } else if (r < 0.85) {
      segmentAngle = PI + HALF_PI;    // 270
    } else if (r < 0.95) {
      segmentAngle = PI;              // 180
    } else {
      segmentAngle = HALF_PI;         // 90
    }

    return {
      type: "circle",
      x: this.position.x,
      y: this.position.y,
      diameter,

      opacity: this.personality.opacity,
      weight: this.personality.weight,
      roughness: this.personality.roughness,
      repetition: this.personality.repetition,
      distortion: this.personality.distortion,

      segmentAngle,

      colorHex: this.colorHex,
      age: this.age
    };
  }
}
