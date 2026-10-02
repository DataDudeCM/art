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
let noiseLevel = 1; //1 straight; < 1 left, > 1 right
let noiseScale = 0.02; //1 straight; .02 default

function setup() {
  createCanvas(800, 800);
  colorMode(HSB,100);
  //frameRate(10);

  //pick color palette
  selectedPalette = palettes[4]; //set selectedPalette to the one with index i

  //pick drawing colors from palette
  background(selectedPalette[0]);
  //background(color('Cornsilk'));
  strandColor = selectedPalette[4];
  outlineColor = selectedPalette[0];

  numStrands = 80;
  boundary = 5;

  //spagStrand.push( new spagSlice (createVector(random(width), height+boundary),15,strandColor, outlineColor));

  start = width/2 + random(-width/3,width/3);
  for (i = 0; i < numStrands; i += 1) {
    spagStrand.push( new spagSlice (createVector(start+random(-width*.1,width*.1), height+boundary),12,strandColor, outlineColor));
  }
  /*
  for (i = 0; i < numStrands; i += 1) {
    while (spagStrand[i].checkStatus() ) {
      spagStrand[i].drawSlice();
      spagStrand[i].updateSlice();
    }
  }
*/
}

function draw() {
  for (i = 0; i < numStrands; i += 1) {
    if (spagStrand[i].checkStatus()) {
      spagStrand[i].drawSlice();
      spagStrand[i].updateSlice();
    }
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
      save('spag_' + timeStamp + 'png');
    }
}
