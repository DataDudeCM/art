let piDigits = "31415926535897932384626433832795028841971693993751";
let agents = [];

function setup() {
  createCanvas(800, 800);
  background(255);
  
  // Agent 1: Normal pi digits, starting at angle 0
  agents.push(new Agent(createVector(width / 2, height / 2), 0, piDigits, 1, color(0, 100, 200, 50)));
  
  // Agent 2: Reversed pi digits, starting at angle 90°
  let revDigits = piDigits.split('').reverse().join('');
  agents.push(new Agent(createVector(width / 2, height / 2), 90, revDigits, 1, color(200, 50, 50, 50)));
  
  // Agent 3: Normal pi digits, different starting angle and index
  agents.push(new Agent(createVector(width / 2, height / 2), 180, piDigits, 1, color(50, 200, 50, 50), 10, 36, 20));
  
  // Agent 4: Shuffled pi digits, starting at angle 270°
  let shuffledDigits = shuffle(piDigits.split('')).join('');
  agents.push(new Agent(createVector(width / 2, height / 2), 270, shuffledDigits, 1, color(150, 0, 150, 50)));
  
  frameRate(60);
}

function draw() {
  // Draw a translucent white overlay to create a trailing/fading effect
  /*
  noStroke();
  fill(255, 10);
  rect(0, 0, width, height);
  */
  
  // Use mouse position to control global parameters:
  // - Mouse Y controls the step size (how far each agent moves)
  // - Mouse X controls the turning multiplier (how sharply they turn)
  let globalStepSize = map(mouseY, 0, height, 2, 20);
  let globalTurningMultiplier = map(mouseX, 0, width, 5, 90);
  
  // Update each agent with these interactive values
  for (let agent of agents) {
    agent.stepSize = globalStepSize;
    agent.turningMultiplier = globalTurningMultiplier;
    agent.update();
  }
}

// Agent class that drives each turtle-like drawing entity
class Agent {
  constructor(pos, initialAngle, piSequence, readingDirection, agentColor, stepSize = 20, turningMultiplier = 36, startIndex = 0) {
    this.pos = pos.copy();
    this.angle = initialAngle; // in degrees
    this.piSequence = piSequence;
    this.readingDirection = readingDirection; // usually 1 (forward)
    this.index = startIndex;
    this.agentColor = agentColor;
    this.stepSize = stepSize;
    this.turningMultiplier = turningMultiplier;
  }
  
  update() {
    stroke(this.agentColor);
    strokeWeight(2);
    
    // Get the current digit from the pi sequence and compute turning angle
    let digit = int(this.piSequence.charAt(this.index));
    let turningAngle = digit * this.turningMultiplier;
    
    // Save current position
    let prevPos = this.pos.copy();
    
    // Move forward based on the current angle and step size
    let rad = radians(this.angle);
    this.pos.x += cos(rad) * this.stepSize;
    this.pos.y += sin(rad) * this.stepSize;
    
    // Draw the segment
    line(prevPos.x, prevPos.y, this.pos.x, this.pos.y);
    
    // Update angle by adding the turning angle
    this.angle += turningAngle;
    
    // Advance the digit index cyclically
    this.index += this.readingDirection;
    if (this.index >= this.piSequence.length) {
      this.index = 0;
    } else if (this.index < 0) {
      this.index = this.piSequence.length - 1;
    }
    
    // Optional: Wrap around the canvas edges for continuous motion
    if (this.pos.x < 0) this.pos.x = width;
    if (this.pos.x > width) this.pos.x = 0;
    if (this.pos.y < 0) this.pos.y = height;
    if (this.pos.y > height) this.pos.y = 0;
  }
}
