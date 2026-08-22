let particles = [];
const particleCount = 400;
const maxDistance = 150;

function setup() {
  createCanvas(windowWidth, windowHeight);
  // Create 50 particles with random positions and velocities
  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
  }
  // Use a dark background that will help emphasize the trails
  background(0);
}

function draw() {
  // Instead of completely clearing the screen, draw a semi-transparent rectangle
  // This creates a trailing effect for the moving particles.
  background(0,50);

  // Draw lines between particles if they're close enough
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      let d = dist(
        particles[i].pos.x, particles[i].pos.y, 
        particles[j].pos.x, particles[j].pos.y
      );
      if (d < maxDistance) {
        // Map the distance to an alpha value so closer particles get more opaque lines.
        let alpha = map(d, 0, maxDistance, 255, 0);
        //stroke(255, alpha);
        stroke(255);
        strokeWeight(1);
        line(
          particles[i].pos.x, particles[i].pos.y, 
          particles[j].pos.x, particles[j].pos.y
        );
      }
    }
  }
  
  // Update and display each particle
  for (let particle of particles) {
    particle.update();
    particle.display();
  }
}

class Particle {
  constructor() {
    // Random starting position
    this.pos = createVector(random(width), random(height));
    // Random velocity for a gentle movement
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
    stroke(255, 200); // Set stroke color for the lines
    // Use a fill color with transparency for the particles as well.
    fill(0);
    ellipse(this.pos.x, this.pos.y, 10, 10);
  }
}
function keyReleased() {
    if (key === 's' || key === 'S') {
      // images go to Downloads folder
      let timeStamp = `${year()}-${month()}-${day()}-${hour()}-${minute()}-${second()}-${nf(millis(), 3, 0)}`;
      save(`lattice_${timeStamp}.png`);
    }
}
