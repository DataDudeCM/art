let particles = [];
const particleCount = 50;
const threshold = 20;

function setup() {
  createCanvas(windowWidth, windowHeight);
  rectMode(CENTER); // Center the squares on the particle positions
  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
  }
    background(255);
}

function draw() {

  
  // Check each unique pair of particles and draw squares if they're close enough
  noFill();
  stroke(0, 10); // semi-transparent white for a subtle effect
  
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      let d = dist(
        particles[i].pos.x, particles[i].pos.y, 
        particles[j].pos.x, particles[j].pos.y
      );
      if (d < threshold) {
        // Draw a square around each particle with a size based on the distance between them
        d=d*3;
        rect(particles[i].pos.x, particles[i].pos.y, d * 2, d * 2);
        rect(particles[j].pos.x, particles[j].pos.y, d * 2, d * 2);
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
    // Random starting position
    this.pos = createVector(random(width), random(height));
    // Each particle gets its own noise offset vector for organic movement
    this.noiseOffset = createVector(random(1000), random(1000));
  }
  
  update() {
    // Use Perlin noise to determine an angle for movement
    let angle = noise(this.noiseOffset.x, this.noiseOffset.y) * TWO_PI * 2;
    let velocity = p5.Vector.fromAngle(angle);
    velocity.mult(2); // Adjust speed as needed
    this.pos.add(velocity);
    
    // Increment the noise offsets to animate the noise over time
    this.noiseOffset.add(0.005, 0.005);
    
    // Wrap around the canvas edges
    if (this.pos.x > width) this.pos.x = 0;
    else if (this.pos.x < 0) this.pos.x = width;
    
    if (this.pos.y > height) this.pos.y = 0;
    else if (this.pos.y < 0) this.pos.y = height;
  }
  
  display() {
    noStroke();
    fill(255);
    // Draw the particle as a small circle
    ellipse(this.pos.x, this.pos.y, 5, 5);
  }
}
