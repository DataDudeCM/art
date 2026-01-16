/* Creates cracks eminating from a central point

Enhancements
    -add starting width as a parameter - strokeweight
    -move num cracks coming from point to within the crack class
     within grow function, add loop based on numcracks
*/

let cracks = [];
let maxlife = 40;
let numcenters = 4;
let numcracks = 6;

function setup() {
    createCanvas(800, 800);
    background('White');
    for (let j = 0; j < numcenters; j++) {
        // Seed a few starting points for cracks
        xpos = random(width);
        ypos = random(height);
        for (let i = 0; i < numcracks; i++) {
            cracks.push(new Crack(xpos,ypos, random(TWO_PI), 2, maxlife));
        }
    }
    noLoop;
}

function draw() {
  while (cracks.length > 0) {
    // Iterate from the end towards the beginning to allow removal of dead cracks
    for (let i = cracks.length - 1; i >= 0; i--) {
      dead = cracks[i].grow();
      if (dead) {
        cracks.splice(i, 1); // Safely remove inactive objects
      }
    }
  }
}

function crackPoint (xpos,ypos) {
  
    
}

// Crack class to handle growth and branching
class Crack {
  constructor(x, y, angle, thickness, lifetime) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.lifetime = lifetime; // Limit how long the crack grows
    this.maxlife = lifetime;
    this.thickness = thickness;
  }

  grow() {
    if (this.lifetime <= 0) return true;

    // Move in the current direction
    let newX = this.x + cos(this.angle) * 4;
    let newY = this.y + sin(this.angle) * 3;

    // Draw the crack
    stroke(0);
    let crackThickness = map(this.lifetime, this.maxlife, 0, this.thickness, 0.5);
    strokeWeight(crackThickness); // Tapering effect
    line(this.x, this.y, newX, newY);

    // Update position
    this.x = newX;
    this.y = newY;

    // Occasionally branch
    if (random() < 0.01) {
      cracks.push(new Crack(this.x, this.y, this.angle + random(-PI / 4, PI / 4),crackThickness, this.maxlife*.4));
    }

    // Occasionally change direction slightly
    this.angle += random(-PI / 10, PI / 10);

    // Stop growing if out of bounds or too short-lived
    if (this.x < 0 || this.x > width || this.y < 0 || this.y > height) {
      this.lifetime = 0;
    }

    this.lifetime--;
    return false;
  }
}
