class Personality {
  constructor(overrides = {}) {
    const p = SETTINGS.personality;
    this.scale = overrides.scale ?? random(p.scale[0], p.scale[1]);
    this.opacity = overrides.opacity ?? random(p.opacity[0], p.opacity[1]);
    this.weight = overrides.weight ?? random(p.weight[0], p.weight[1]);
    this.roughness = overrides.roughness ?? random(p.roughness[0], p.roughness[1]);
    this.speed = overrides.speed ?? random(p.speed[0], p.speed[1]);
    this.wander = overrides.wander ?? random(p.wander[0], p.wander[1]);
    this.drawFrequency = overrides.drawFrequency ?? random(p.drawFrequency[0], p.drawFrequency[1]);
    this.curiosity = overrides.curiosity ?? random(p.curiosity[0], p.curiosity[1]);
  }
}
