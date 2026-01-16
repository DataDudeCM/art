
let particles = [];
const particleCount = 250;
const threshold = 40;

function setup() {
  createCanvas(windowWidth, windowHeight);
  // Create particles with a specific color distribution: 50% red, 25% yellow, 25% blue.
  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
  }
  background(0);
}

function draw() {

  
  // Check each unique pair of particles.
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      let d = dist(
        particles[i].pos.x, particles[i].pos.y, 
        particles[j].pos.x, particles[j].pos.y
      );
      if (d < threshold) {
        // Blend the colors a little bit.
        let blendFactor = 0.005; // Adjust for more or less blending
        let colA = particles[i].col;
        let colB = particles[j].col;
        particles[i].col = lerpColor(colA, colB, blendFactor);
        particles[j].col = lerpColor(colB, colA, blendFactor);
        
        // Map the distance to an alpha value (closer => more opaque).
        let alpha = map(d, 0, threshold, 80, 0);
        
        // Draw a circle around each particle using its current color.
        noFill();
        strokeWeight(1);
        
        // Circle for particle i
        stroke(red(particles[i].col), green(particles[i].col), blue(particles[i].col), alpha);
        ellipse(particles[i].pos.x, particles[i].pos.y, d * 2, d * 2);
        
        // Circle for particle j
        stroke(red(particles[j].col), green(particles[j].col), blue(particles[j].col), alpha);
        ellipse(particles[j].pos.x, particles[j].pos.y, d * 2, d * 2);
      }
    }
  }
  
  // Update and display all particles.
  for (let p of particles) {
    p.update();
    //p.display();
  }
}

class Particle {
  constructor() {
    // Random starting position.
    this.pos = createVector(random(width), random(height));
    // Random velocity.
    this.vel = createVector(random(-2, 2), random(-2, 2));
    // Assign color based on the desired distribution:
    // 50% red, 25% yellow, 25% blue.
    let r = random();
    if (r < 0.5) {
      this.col = color(255, 0, 0); // red
    } else if (r < 0.75) {
      this.col = color(255, 255, 0); // yellow
    } else {
      this.col = color(0, 0, 255); // blue
    }
  }
  
  update() {
    this.pos.add(this.vel);
    
    // Wrap around the canvas edges.
    if (this.pos.x > width) this.pos.x = 0;
    else if (this.pos.x < 0) this.pos.x = width;
    
    if (this.pos.y > height) this.pos.y = 0;
    else if (this.pos.y < 0) this.pos.y = height;
  }
  
  display() {
    noStroke();
    fill(this.col);
    ellipse(this.pos.x, this.pos.y, 5, 5);
  }
}
