// 
// spag
// --program to create spaghetti doodles similar to how i draw them
//
// Initial concept is to have particles traverse the screen in a twisting path
// Each will have a perpendicular line drawn through them with different colored dots at the end 
// when connected will look like the outline of the strand of spaghetti
// bits of this line will not be shown to simulate a sketchy line

let strandColor, spagColor;
let isLoopingFlag = true;
let spagStrand = [];
let numStrands = 100;
let boundary = 8; // how far off screen to start/end strands
let i=0;
let selectedPalette;
let noiseLevel = 1.075; //1.075 seems to be straight; < 1 left, > 1 right
let noiseScale = .0075; //1 straight; .5 frayed, .05 windy, .005 curly
let strandWidth = 8; //10 is default
let sliceSpeed = 1; //1.5 is default
let chanceToBranch  = 0.01; // percent chance to branch each frames .05 is default 
let dispersionPercent = 10; // how far from center to start strands;
// need to add max rotation angle per frame variable
// need to add life span variable


function setup() {
  //createCanvas(2270, 1270);
  mainCanvas = createCanvas(windowWidth, windowHeight);

  grainBuffer = createGraphics(width, height, WEBGL);
  grainShader = grainBuffer.createShader(vert, frag);

  colorMode(HSB,100);
  //frameRate(10);


  //pick color palette
  selectedPalette = palettes[int(random(3,11))]; //set selectedPalette to any of the palettes except the first two since they must have at least 5 colors

  //pick drawing colors from palette
  background(selectedPalette[0]);
  //background(color('Black'));
  strandColor = selectedPalette[3];
  //outlineColor = selectedPalette[0];
  outlineColor = color('Black');

  let startPosition = int(random(0,4));

  for (let i = 0; i < numStrands; i += 1) {
    setPosition(4);
    spagStrand.push( new spagSlice (strandWidth,outlineColor,position,velocity, chanceToBranch) );
  }

}

function draw() {
  for (let i = 0; i < spagStrand.length; i += 1) {
    if (spagStrand[i].checkStatus()) {
      spagStrand[i].drawSlice();
      spagStrand[i].updateSlice();
    }
  }
    // Label the data point (for the Data Architect)
  fill(180);
  noStroke();
  textSize(10);
  textFont('Courier New');
  textAlign(LEFT, BOTTOM);
  text("N.Scale: " + nfc(noiseScale, 4), 5, 20);
  text("Chance to Branch: " + nfc(chanceToBranch, 4), 5, 30);
  if (mouseIsPressed || spagStrand.length > 100000) { // reset if mouse pressed or too many strands
    spagStrand.length = 0;
    setup();
  }

}

function setPosition(side) {

  let dispersion = width*dispersionPercent/100; // how far from center to start strands;
    //setPosition - 
  if (side > 3) {
      side = int(random(0,4));
    } else {
      side = side;
    }
      //

  if (side == 0) { // top
    position = createVector(random(width*.5-dispersion, width*.5+dispersion), 0-boundary);
    //position = createVector(map(noiseLevel*noise((noiseScale*frameCount)+this.noiseStart),0,1,0,width), 0-boundary);
    velocity = createVector(0, random(1,sliceSpeed)); //down vector
  } else if (side == 1) { // right
    position = createVector(width+boundary, random(height*.5-dispersion,height*.5+dispersion));
    //position = createVector(width+boundary, map(noiseLevel*noise((noiseScale*frameCount)+this.noiseStart),0,1,0,height));
    velocity = createVector(random(-1,-sliceSpeed),0); //left vector
  } else if (side == 2) { // bottom
    position = createVector(random(width*.5-dispersion, width*.5+dispersion), height+boundary);
    velocity = createVector(0, random(-1,-sliceSpeed)); //upward vector
  } else { // left
    position = createVector(0-boundary, random(height*.5-dispersion,height*.5+dispersion));
    velocity = createVector(random(1,sliceSpeed),0); //down vector
  }
}

function keyReleased() {
  if (keyCode == DELETE || keyCode == BACKSPACE) {
    spagStrand.length = 0;
    setup();
  } 
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
      save('spag_' + timeStamp + 'png');
    }
}
