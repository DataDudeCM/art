let particles = [];
const particleCount = 120;
const threshold = 60;

function setup() {
  createCanvas(windowWidth, windowHeight);
  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
  }
    background(0);
}

function draw() {

  
  // For each unique pair of particles, draw circles if they're close enough
  noFill();
  stroke(255, 10); // semi-transparent white
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      let d = dist(
        particles[i].pos.x, particles[i].pos.y, 
        particles[j].pos.x, particles[j].pos.y
      );
      if (d < threshold * random(.5,1.5)) {
        // Draw a circle around each particle with a diameter based on the distance
        ellipse(particles[i].pos.x, particles[i].pos.y, d * 2, d * 2);
        ellipse(particles[j].pos.x, particles[j].pos.y, d * 2, d * 2);
      }
    }
  }
  
  // Update and display all particles
  for (let p of particles) {
    p.update();
    //p.display();
  }
}

class Particle {
  constructor() {
    // Random starting position
    this.pos = createVector(random(width), random(height));
    // Each particle gets its own noise offset vector
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
    fill(0,100);
    ellipse(this.pos.x, this.pos.y, 2, 2);
  }
}

function keyReleased() {
    if (key === 's' || key === 'S') {
      // images go to Downloads folder
      let timeStamp = `${year()}-${month()}-${day()}-${hour()}-${minute()}-${second()}-${nf(millis(), 3, 0)}`;
      save(`particlePerlin_${timeStamp}.png`);
    }
}
