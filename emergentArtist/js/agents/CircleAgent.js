class CircleAgent extends BaseAgent {
  constructor(personality = new Personality()) {
    super("circle", personality);
  }

  createMarkRequest() {
    const [minDiameter, maxDiameter] = SETTINGS.marks.circleDiameter;
    return {
      type: "circle",
      x: this.position.x,
      y: this.position.y,
      diameter: lerp(minDiameter, maxDiameter, this.personality.scale),
      opacity: this.personality.opacity,
      weight: this.personality.weight,
      roughness: this.personality.roughness,
      colorHex: this.colorHex,
      age: this.age
    };
  }
}
