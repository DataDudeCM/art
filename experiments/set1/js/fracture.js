/* Creates cracks eminating from a central point

*/

let cracks = [];
let maxlife = 160; //default = 160
let numcenters = 3; // default = 5
let numcracks = 4; // default = 4
let segsize = 1.5; // default = 1.5
let branchfactor = .02; // default = .02
let isLoopingFlag = true;

function setup() {
    mainCanvas = createCanvas(800, 800);
    grainBuffer = createGraphics(width, height, WEBGL);
    grainShader = grainBuffer.createShader(vert, frag)

    frameRate(1);
    //noLoop();
}

function draw() {
  background('LightGrey');
  for (i=0; i< numcenters; i++) {
    xpos = random(width);
    ypos = random(height);
    crackPoint(xpos,ypos,4,maxlife,segsize);
  }
  applyGrain(mainCanvas);
}

function crackPoint (xpos,ypos,thickness,lifetime, segsize) {
  for (let i = 0; i < numcracks; i++) {
    cracks.push(new Crack(xpos,ypos, random(TWO_PI), thickness, lifetime,segsize));
  }
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

// Crack class to handle growth and branching
class Crack {
  constructor(x, y, angle, thickness, lifetime, segsize) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.lifetime = lifetime; // Limit how long the crack grows
    this.maxlife = lifetime;
    this.thickness = thickness;
    this.segsize = segsize;
  }

  grow() {
    if (this.lifetime <= 0) return true;

    // Move in the current direction
    let newX = this.x + cos(this.angle) * this.segsize;
    let newY = this.y + sin(this.angle) * this.segsize;

    // Draw the crack
    stroke(0);
    let crackThickness = map(this.lifetime, this.maxlife, 0, this.thickness, 0.5);
    strokeWeight(crackThickness); // Tapering effect
    line(this.x, this.y, newX, newY);

    // Update position
    this.x = newX;
    this.y = newY;

    // Occasionally branch
    if (random() < branchfactor) {
      cracks.push(new Crack(this.x, this.y, this.angle + random(-PI / 4, PI / 4),crackThickness, this.maxlife*.4,this.segsize));
    }

    // Occasionally change direction slightly
    this.angle += random(-PI / 15, PI / 15);

    // Stop growing if out of bounds or too short-lived
    if (this.x < 0 || this.x > width || this.y < 0 || this.y > height) {
      this.lifetime = 0;
    }

    this.lifetime--;
    return false;
  }
}

function keyReleased() {
  if (keyCode == DELETE || keyCode == BACKSPACE) background(255);
  if (key == 'l' || key == 'L') {
    if (isLoopingFlag) {
      isLoopingFlag = false;
      noLoop()
    } else {
      isLoopingFlag = true;
      loop();
    }
  }
  if (key == 's' || key == 'S') {
    // images go to Downloads folder
    let timeStamp = year() + "-" + month() + "-" + day() + "-" + hour() + "-" + minute() + "-" + second() + "-" + nf(millis(), 3, 0);
      save('fracture_' + timeStamp + 'png');
    }
}
