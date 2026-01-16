/*

Simulates a sun or an eclipse utilizing a custom Cracks class
the cracks simulate the solar flares
Blog post describing it here: https://cmartcreations2.com/eclipse/

*/

let points = [];
let cracks = [];
let isLoopingFlag = true;
let controls = [];
let refreshrate = 2;
let clearscreen = true;
let sliderStarty = 40;
let mainCanvas, canvasWidth, canvasHeight;
let sun = false;
let drawHue = (0);
let drawSat = (255);
let inverted = false;

function setup() {
  if (windowHeight < windowWidth - 200) {
    canvasWidth = windowHeight;
  } else {
    canvasWidth = windowWidth - 200;
  }
  mainCanvas = createCanvas(canvasWidth, canvasWidth);
  //mainCanvas.parent('eclipse');

  colorMode(HSB,255,255,255,100);
  crackColor = color('White');
  backColor = color('Black');

  //grainBuffer = createGraphics(width, height, WEBGL);
  //grainShader = grainBuffer.createShader(vert, frag)
  frameRate(refreshrate);
  background(backColor);
  //noLoop();


  // Create a slider ranging from 10 to 200, starting at 50, with step 5
  controls.push(new SliderControl('Max Life',0,250,50,5,width+20,sliderStarty));
  controls.push(new SliderControl('Seg Size',0.5,4,1,0.5,width+20,sliderStarty+30));
  controls.push(new SliderControl('Num Points',1,50,5,1,width+20,sliderStarty+60));
  controls.push(new SliderControl('Num Cracks',1,10,4,1,width+20,sliderStarty+90));
  controls.push(new SliderControl('Branch Factor',.005,.04,.02,.005,width+20,sliderStarty+120));
  controls.push(new SliderControl('Thickness',.5,10,3,.5,width+20,sliderStarty+150));
  controls.push(new SliderControl('Alpha',5,100,40,5,width+20,sliderStarty+180));
  controls.push(new SliderControl('Framerate',1,60,2,1,width+20,sliderStarty+210));
  controls.push(new SliderControl('Hue',0,255,255,1,width+20,sliderStarty+240));
  controls.push(new SliderControl('Saturation',0,255,255,1,width+20,sliderStarty+270));
  controls.push(new SliderControl('Radius',0,.5,.25,.005,width+20,sliderStarty+300));
  controls.push(new SliderControl('Jagginess',5,60,50,5,width+20,sliderStarty+330));

  NLabel = createDiv('Press N to toggle sun or eclipse');
  NLabel.position(width + 20, height - 60); // Position it above the slider
  NLabel.style('font-family', 'Arial');
  NLabel.style('font-size', '10px');
  CLabel = createDiv('Press C to toggle cleascreen');
  CLabel.position(width + 20, height - 40); // Position it above the slider
  CLabel.style('font-family', 'Arial');
  CLabel.style('font-size', '10px');
  PLabel = createDiv('Press P to pause or unpause');
  PLabel.position(width + 20, height - 20); // Position it above the slider
  PLabel.style('font-family', 'Arial');
  PLabel.style('font-size', '10px');

}

function draw() {
    frameRate(refreshrate);

    if (clearscreen == true) {
        background(backColor);
    }

    maxlife = controls[0].update();
    segsize = controls[1].update();
    numPoints = controls[2].update();
    numCracks = controls[3].update();
    branchfactor = controls[4].update();
    thickness = controls[5].update();
    alpha = controls[6].update();
    refreshrate = controls[7].update();
    drawHue = controls[8].update();
    drawSat = controls[9].update();
    circleRadius = controls[10].update() * width;
    jagginess = 61- controls[11].update();

    crackColor = color(drawHue, drawSat,255);
    crackColor.setAlpha(alpha);

    drawCircle();

}

function drawCircle() {
    let sunColor = color(crackColor);
    // Circle parameters
    let centerX = width / 2;
    let centerY = height / 2;
    
    // Draw points on the circle
    for (let i = 0; i < numPoints; i++) {
        //let angle = TWO_PI / numPoints * i; // Calculate the angle for each point
        let angle = TWO_PI * random(); // Calculate the angle for each point
        let x = centerX + circleRadius * cos(angle); // Calculate x position
        let y = centerY + circleRadius * sin(angle); // Calculate y position
        crackPoint(x,y,thickness,maxlife,segsize);
    }
    if (sun) {
      sunColor = crackColor;
    } else {
      sunColor = backColor;
    }
    sunColor.setAlpha(100);
    fill(sunColor);
    stroke('White');
    strokeWeight(1);
    ellipse(centerX, centerY,circleRadius*2);
}

//creates and grows cracks from a point until all growth has stopped
function crackPoint (xpos,ypos,thickness,lifetime, segsize) {
    for (let i = 0; i < numCracks; i++) {
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

class SliderControl {
  constructor(name, min, max, start, step, x, y) {
    this.name = name;
    this.slider = createSlider(min, max, start, step);
    this.slider.position(x, y);
    // if name is null, don't create label
    if (name !== null) {
      this.label = createDiv(`${name}: ${start}`);
      this.label.position(x, y-10);
      this.label.style('font-family', 'Arial');
      this.label.style('font-size', '10px');
    }
  }
  
  update() {
    let val = this.slider.value();
    this.label.html(`${this.name}: ${val}`);
    return val;
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


    let crackThickness = map(this.lifetime, this.maxlife, 0, this.thickness, 0.5);
    
    /* this code adds transparent fuzziness to the lines but slow
    let lineColor = crackColor;
    for (let k=4; k>0; k--) {
      lineColor.setAlpha(alpha*(.02/k));
      stroke(lineColor);
      strokeWeight(crackThickness*k*3); // Tapering effect
      line(this.x, this.y, newX, newY);
    }
    crackColor.setAlpha(alpha);
  */
    stroke(crackColor);
    strokeWeight(crackThickness);
    line(this.x, this.y, newX, newY);
  

    // Update position
    this.x = newX;
    this.y = newY;

    // Occasionally branch
    if (random() < branchfactor) {
    cracks.push(new Crack(this.x, this.y, this.angle + random(-PI / 4, PI / 4),crackThickness, this.maxlife*.4,this.segsize));
    }

    // Occasionally change direction slightly
    this.angle += random(-PI / jagginess, PI / jagginess);

    // Stop growing if out of bounds or too short-lived
    if (this.x < 0 || this.x > width || this.y < 0 || this.y > height) {
    this.lifetime = 0;
    }

    this.lifetime--;
    return false;
  }
}

function windowResized() {
    if (windowHeight < windowWidth - 200) {
      canvasWidth = windowHeight;
    } else {
      canvasWidth = windowWidth - 200;
    }
    resizeCanvas(canvasWidth, canvasWidth);
    for (let i=0;i < controls.length; i++) {
      controls[i].slider.position(width + 20,sliderStarty+(i*30));
      controls[i].label.position(width + 20,sliderStarty+(i*30)-10);
    }
    NLabel.position(width + 20, height - 60); 
    CLabel.position(width + 20, height - 40); 
    PLabel.position(width + 20, height - 20); 
}

function keyReleased() {
if (keyCode == DELETE || keyCode == BACKSPACE) background(255);
if (key == 'p' || key == 'P') {
    if (isLoopingFlag) {
    isLoopingFlag = false;
    noLoop()
    } else {
    isLoopingFlag = true;
    loop();
    }
}
if (key == 'c' || key == 'C') {
    if (clearscreen) {
    clearscreen = false;
    } else {
    clearscreen = true;
    }
}
if (key == 'n' || key == 'N') {
    if (sun) {
      sun = false;
    } else {
      sun = true;
    }
}
if (key == 'i' || key == 'I') {
    if (inverted == false) {
      inverted = true;
      backColor = color('White');
    } else {
      inverted = false;
      backColor = color('Black');
    }
}
if (key == 's' || key == 'S') {
    // images go to Downloads folder
    let timeStamp = year() + "-" + month() + "-" + day() + "-" + hour() + "-" + minute() + "-" + second() + "-" + nf(millis(), 3, 0);
    save('eclipse_' + timeStamp + 'png');
    }
}
  
