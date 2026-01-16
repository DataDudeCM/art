// Rainbow smoke simulation based on Jozsef Fejes' algorithm in p5.js
let particles = [];

function setup() {
  createCanvas(800, 800);
  noStroke();
  blendMode(ADD); // Enable additive blending for more vibrant colors
}

function draw() {
  background(0, 20); // Fading effect to create the smoke illusion

  // Add new particles each frame
  for (let i = 0; i < 10; i++) {
    particles.push(new Particle(width / 2, height / 2));
  }

  // Update and display particles
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    p.update();
    p.display();

    // Remove particles that are too transparent
    if (p.lifespan <= 0) {
      particles.splice(i, 1);
    }
  }
}

class Particle {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.vel = createVector(random(-2, 2), random(-2, 2));
    this.acc = createVector(0, 0);
    this.lifespan = 255;
    this.hue = random(360); // Use HSB color mode
  }

  applyForce(force) {
    this.acc.add(force);
  }

  update() {
    this.vel.add(this.acc);
    this.pos.add(this.vel);
    this.acc.mult(0);
    this.lifespan -= 1;
    this.hue = (this.hue + random(0.5, 1)) % 360; // Gradual hue change
  }

  display() {
    colorMode(HSB, 360, 255, 255, 255);
    fill(this.hue, 255, 255, this.lifespan);
    ellipse(this.pos.x, this.pos.y, 8);
  }
}
