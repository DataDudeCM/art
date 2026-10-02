// Make sure to include d3.js in your project
// <script src="https://d3js.org/d3.v4.min.js"></script>

let points = [];
let cracks = [];
let maxlife = 60; //default = 160
let numcenters = 10; // default = 5
let numcracks = 2; // default = 4
let segsize = 3; // default = 1.5
let branchfactor = .02; // default = .02
let isLoopingFlag = true;
let thickness = 3;

function setup() {
  mainCanvas = createCanvas(900, 900);
  grainBuffer = createGraphics(width, height, WEBGL);
  grainShader = grainBuffer.createShader(vert, frag)
  //noLoop();

}

function draw() {
    background('LightGrey');
    
    // Generate random points and draw the Voronoi pattern with cracks
    points = [];
    for (let i = 0; i < numcenters; i++) {
        points.push([random(width), random(height)]);
    }
    drawVoronoi();
    
    applyGrain(mainCanvas);

    //draw border
    fill('White');
    rect(0,0,width,20); //top
    rect(0,0,20,height); //left
    rect(width-20,0,width,height); // right border
    rect(0,height-20,width,height); // bottom border
}

function drawVoronoi() {
  // Create Voronoi generator using d3
  const voronoi = d3.voronoi().extent([[0, 0], [width, height]]);
  const diagram = voronoi(points);

  
  // Draw each cell
  for (let cell of diagram.polygons()) {
    beginShape();
    ptnum = 0;
    for (let [x, y] of cell) {
        if (ptnum == 0) {
            firstx=x;
            firsty=y;
        } else {
            squigLine(createVector(prevx,prevy), createVector(x,y),thickness);
        }
        vertex(x, y); //vertex of each cell
        fill('Black');
        strokeWeight(thickness);
        ellipse(x,y,thickness*2); //centers of cracks
        crackPoint(x,y,thickness,maxlife,segsize);
        ptnum ++;
        prevx= x;
        prevy= y;
    }
    squigLine(createVector(prevx,prevy),createVector(firstx,firsty), thickness);
    noFill();
    strokeWeight(0);
    endShape(CLOSE); //draw the cell 
  }
}

//creates and grows cracks from a point until all growth has stopped
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
    this.angle += random(-PI / 12, PI / 12);

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
  
