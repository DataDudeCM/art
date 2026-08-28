class LineAgent extends BaseAgent {
  constructor(personality = new Personality()) {
    super("line", personality);
  }

  createMarkRequest() {
    const [minLength, maxLength] = SETTINGS.marks.lineLength;
    const len = lerp(minLength, maxLength, this.personality.scale);
    const direction = this.velocity.copy().normalize();
    const half = direction.copy().mult(len * 0.5);
    return {
      type: "line",
      x1: this.position.x - half.x,
      y1: this.position.y - half.y,
      x2: this.position.x + half.x,
      y2: this.position.y + half.y,
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
