let particles = [];
const particleCount = 50;
const threshold = 50;

function setup() {
  createCanvas(windowWidth, windowHeight);
  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
  }
  background(0);
}

function draw() {
  //background(0);

  // Check pairs of particles and draw circles for those within the threshold.
  noFill();
  stroke(255, 10); // semi-transparent white for a subtle effect

  // Loop over each unique pair of particles
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      let d = dist(
        particles[i].pos.x, particles[i].pos.y, 
        particles[j].pos.x, particles[j].pos.y
      );
      if (d < threshold) {
        // Draw a circle around each particle in the pair
        ellipse(particles[i].pos.x, particles[i].pos.y, d * 2, d * 2);
        ellipse(particles[j].pos.x, particles[j].pos.y, d * 2, d * 2);
      }
    }
  }

  // Update and display all particles
  for (let particle of particles) {
    particle.update();
    particle.display();
  }
}

class Particle {
  constructor() {
    // Random starting position
    this.pos = createVector(random(width), random(height));
    // Random velocity
    this.vel = createVector(random(-2, 2), random(-2, 2));
  }
  
  update() {
    this.pos.add(this.vel);
    
    // Wrap around the canvas edges
    if (this.pos.x > width) this.pos.x = 0;
    else if (this.pos.x < 0) this.pos.x = width;
    
    if (this.pos.y > height) this.pos.y = 0;
    else if (this.pos.y < 0) this.pos.y = height;
  }
  
  display() {
    noStroke();
    fill(255);
    //ellipse(this.pos.x, this.pos.y, 5, 5);
  }
}
