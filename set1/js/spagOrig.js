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
let numStrands; 
let boundary;
let i=0;
let selectedPalette;
let noiseLevel = 1.05; //1 straight; < 1 left, > 1 right
let noiseScale = .05; //1 straight; .02 default
let strandWidth = 16;
let sliceSpeed = 2;

function setup() {
  //createCanvas(2270, 1270);
  mainCanvas = createCanvas(windowWidth, windowHeight);

  grainBuffer = createGraphics(width, height, WEBGL);
  grainShader = grainBuffer.createShader(vert, frag)

  colorMode(HSB,100);
  //frameRate(10);


  //pick color palette
  selectedPalette = palettes[int(random(10,11))]; //set selectedPalette to the one with index i

  //pick drawing colors from palette
  background(selectedPalette[0]);
  //background(color('Black'));
  strandColor = selectedPalette[3];
  //outlineColor = selectedPalette[0];
  outlineColor = color('Black');

  numStrands = 8;
  boundary = 5;

  //spagStrand.push( new spagSlice (createVector(random(width), height+boundary),15,strandColor, outlineColor));

  //start = width/2 + random(-5,5);
  let dispersion = width*.01;
  for (i = 0; i < numStrands; i += 1) {
    spagStrand.push( new spagSlice (2,sliceSpeed,strandWidth,strandColor, outlineColor,dispersion));
  }

}

function draw() {
  for (i = 0; i < spagStrand.length; i += 1) {
    if (spagStrand[i].checkStatus()) {
      spagStrand[i].drawSlice();
      spagStrand[i].updateSlice();
    }
  }
  if (mouseIsPressed) {
    spagStrand.length = 0;
    setup();
  }
  //applyGrain(mainCanvas); //doesn't work here since part of the draw loop

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
