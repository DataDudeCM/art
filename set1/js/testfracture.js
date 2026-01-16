let cracks = [];

function setup() {
  createCanvas(800, 800);
  background(220);

  // Seed a few starting points for cracks
  for (let i = 0; i < 5; i++) {
    cracks.push(new Crack(random(width), random(height), random(TWO_PI)));
  }
}

function draw() {
  for (let crack of cracks) {
    crack.grow();
  }
}

// Crack class to handle growth and branching
class Crack {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.lifetime = 120; // Limit how long the crack grows
  }

  grow() {
    if (this.lifetime <= 0) return;

    // Move in the current direction
    let newX = this.x + cos(this.angle) * 2;
    let newY = this.y + sin(this.angle) * 2;

    // Draw the crack
    stroke(0);
    strokeWeight(map(this.lifetime, 200, 0, 2, 0.5)); // Tapering effect
    line(this.x, this.y, newX, newY);

    // Update position
    this.x = newX;
    this.y = newY;

    // Occasionally branch
    if (random() < 0.01) {
      cracks.push(new Crack(this.x, this.y, this.angle + random(-PI / 4, PI / 4)));
    }

    // Occasionally change direction slightly
    this.angle += random(-PI / 16, PI / 16);

    // Stop growing if out of bounds or too short-lived
    if (this.x < 0 || this.x > width || this.y < 0 || this.y > height) {
      this.lifetime = 0;
    }

    this.lifetime--;
  }
}
