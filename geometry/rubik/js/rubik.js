let basePairs = [];
let numPairs = 50;
let helixRadius = 100;   // base radius for the helix
let pitch = 15;          // vertical distance per step along the helix
let angleOffset = 0;     // overall rotation of the helix
let maxSeparation = 30;  // maximum extra separation for unzipping

// Pre-generated textures for the letters A, T, C, and G.
let letterTextures = {};

function setup() {
  createCanvas(800, 600, WEBGL);
  
  // Create textures for each letter.
  let letters = ['A', 'T', 'C', 'G'];
  for (let letter of letters) {
    letterTextures[letter] = createLetterTexture(letter);
  }
  
  // Generate base pairs along the helix.
  for (let i = 0; i < numPairs; i++) {
    let theta = i * 0.5; // Angular spacing along the helix.
    // Randomly choose one of the two complementary base pairs (A-T or C-G).
    if (random(1) < 0.5) {
      basePairs.push(new BasePair(theta, 'A', 'T'));
    } else {
      basePairs.push(new BasePair(theta, 'C', 'G'));
    }
  }
}

function draw() {
  background(30);
  
  // Set up basic lighting for a nice 3D look.
  ambientLight(80);
  directionalLight(255, 255, 255, 0, 0, -1);
  
  // Compute the "unzipping" factor as an oscillating value from 0 (zipped) to maxSeparation (unzipped).
  let unzip = map(sin(frameCount * 0.02), -1, 1, 0, maxSeparation);
  
  // Rotate the entire helix slowly so you can see it from different angles.
  rotateY(angleOffset);
  angleOffset += 0.01;
  
  // Center the helix vertically.
  translate(0, 0, - (numPairs * pitch) / 2);
  
  // Display each base pair, using the current unzip value.
  for (let bp of basePairs) {
    bp.display(unzip);
  }
}

// Helper function to create a texture with a letter drawn on it.
function createLetterTexture(letter) {
  // Create a graphics buffer (off-screen canvas) for the letter.
  let pg = createGraphics(50, 50);
  pg.pixelDensity(1);
  pg.clear();
  pg.textAlign(CENTER, CENTER);
  pg.textSize(32);
  pg.fill(255);
  pg.noStroke();
  pg.text(letter, 25, 25);
  return pg;
}

// BasePair class represents a pair of nucleotides along the helix.
class BasePair {
  constructor(theta, leftLetter, rightLetter) {
    this.theta = theta;         // Angular position for this base pair.
    this.leftLetter = leftLetter;
    this.rightLetter = rightLetter;
    // Vertical position along the helix.
    this.z = pitch * theta;
  }
  
  // The unzip parameter adjusts the distance from the center.
  display(unzip) {
    push();
    // Calculate the effective radius for this frame.
    let effectiveRadius = helixRadius + unzip;
    
    // Compute positions for the left and right nucleotides.
    // They are on opposite sides of the circle: at theta and theta + PI.
    let xLeft = effectiveRadius * cos(this.theta);
    let yLeft = effectiveRadius * sin(this.theta);
    let xRight = effectiveRadius * cos(this.theta + PI);
    let yRight = effectiveRadius * sin(this.theta + PI);
    
    // Translate to the vertical (z) position for this base pair.
    translate(0, 0, this.z);
    
    // --- Draw Left Nucleotide ---
    push();
    translate(xLeft, yLeft, 0);
    fill(200, 100, 100);
    noStroke();
    sphere(10);
    // Map the letter texture onto a plane in front of the sphere.
    push();
    translate(0, 0, 12);
    texture(letterTextures[this.leftLetter]);
    noStroke();
    plane(20, 20);
    pop();
    pop();
    
    // --- Draw Right Nucleotide ---
    push();
    translate(xRight, yRight, 0);
    fill(100, 100, 200);
    noStroke();
    sphere(10);
    // Map the letter texture for the right nucleotide.
    push();
    translate(0, 0, 12);
    texture(letterTextures[this.rightLetter]);
    noStroke();
    plane(20, 20);
    pop();
    pop();
    
    // --- Draw Hydrogen Bond ---
    // A line between the two nucleotides represents the hydrogen bond.
    stroke(255);
    strokeWeight(2);
    line(xLeft, yLeft, 0, xRight, yRight, 0);
    
    pop();
  }
}
