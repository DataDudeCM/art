
let particles = [];
const particleCount = 200;
const circleThreshold = 50;    // for drawing white circles
const nudgeThreshold = 10;     // for nudging particles apart
const minOrbit = 50;
const maxOrbit = 800;

function setup() {
  createCanvas(windowWidth, windowHeight);
  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
  }
  background(0);
}

function draw() {

  
  // Check each unique pair of particles
  noFill();
  strokeWeight(1);
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      let d = dist(
        particles[i].pos.x, particles[i].pos.y,
        particles[j].pos.x, particles[j].pos.y
      );
      
      // Nudge particles apart if they are too close (nudgeThreshold)
      if (d < nudgeThreshold) {
        let nudgeForce = 0.5;  // tweak this value to adjust the strength of the nudge
        let push = p5.Vector.sub(particles[i].pos, particles[j].pos);
        if (push.mag() > 0) { // safeguard against zero distance
          push.normalize();
          // Apply equal and opposite nudges
          particles[i].offset.add(push.copy().mult(nudgeForce));
          particles[j].offset.sub(push.copy().mult(nudgeForce));
        }
      }
      
      // Draw white circles when within circleThreshold
      if (d < circleThreshold) {
        let alpha = map(d, 0, circleThreshold, 5, 0);
        stroke(255, alpha);
        ellipse(particles[i].pos.x, particles[i].pos.y, d * 2);
        ellipse(particles[j].pos.x, particles[j].pos.y, d * 2);
      }
    }
  }
  
  // Update and display each particle
  for (let p of particles) {
    p.update();
    //p.display();
  }
}

class Particle {
  constructor() {
    // Each particle orbits the center with a random orbit radius and speed.
    this.orbitRadius = random(minOrbit, maxOrbit);
    this.orbitAngle = random(TWO_PI);
    this.orbitSpeed = random(0.005, 0.02);
    this.offset = createVector(0, 0); // additional offset for nudging
    this.pos = createVector(0, 0);
    this.updatePosition();
  }
  
  updatePosition() {
    let cx = width / 2;
    let cy = height / 2;
    // Compute the base orbit position
    let orbitX = cx + this.orbitRadius * cos(this.orbitAngle);
    let orbitY = cy + this.orbitRadius * sin(this.orbitAngle);
    this.pos.set(orbitX, orbitY);
    // Add any offset due to nudging
    this.pos.add(this.offset);
  }
  
  update() {
    this.orbitAngle += this.orbitSpeed;
    // Gradually reduce the offset so particles return to their orbits over time.
    this.offset.mult(0.95);
    this.updatePosition();
  }
  
  display() {
    noStroke();
    fill(255);
    ellipse(this.pos.x, this.pos.y, 5);
  }
}
