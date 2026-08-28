class BaseAgent {
  constructor(species, personality = new Personality()) {
    this.species = species;
    this.personality = personality;
    this.position = createVector(random(width), random(height));
    this.velocity = p5.Vector.random2D().setMag(this.personality.speed);
    this.age = 0;
    this.framesSinceMark = 0;
    this.distanceTraveled = 0;
    this.colorHex = chooseAgentColor();
  }

  update() {
    const previous = this.position.copy();
    this.wander();
    this.position.add(this.velocity);
    this.wrapEdges();
    this.age++;
    this.framesSinceMark++;
    this.distanceTraveled += p5.Vector.dist(previous, this.position);
  }

  wander() {
    this.velocity.rotate(random(-this.personality.wander, this.personality.wander));
    if (this.velocity.magSq() > 0) this.velocity.setMag(this.personality.speed);
  }

  wrapEdges() {
    if (this.position.x < 0) this.position.x = width;
    if (this.position.x > width) this.position.x = 0;
    if (this.position.y < 0) this.position.y = height;
    if (this.position.y > height) this.position.y = 0;
  }

  shouldDraw() {
    return random() < this.personality.drawFrequency;
  }

  createMarkRequest() {
    throw new Error(`${this.species} must implement createMarkRequest()`);
  }

  debugDraw() {
    push();
    const c = color(this.colorHex);
    c.setAlpha(190);
    noStroke();
    fill(c);
    circle(this.position.x, this.position.y, SETTINGS.debug.agentSize);
    const v = this.velocity.copy().setMag(SETTINGS.debug.velocityLength);
    stroke(c);
    strokeWeight(1);
    line(this.position.x, this.position.y, this.position.x + v.x, this.position.y + v.y);
    pop();
  }
}
