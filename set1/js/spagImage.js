// spag.js - STABLE Version

let strandColor, spagColor;
let isLoopingFlag = true;
let spagStrand = [];
let numStrands = 200; 
let MAX_STRANDS = 2500; // HARD LIMIT to prevent crash
let boundary = 50; 
let i = 0;
let noiseLevel = 1.075; 
let noiseScale = .05; 
let strandWidth = 5; 
let sliceSpeed = 1; 
let chanceToBranch = 0.5; // Adjusted for better control
let dispersionPercent = 50; 

let sourceImg; 
let isReady = false; // Safety flag

function preload() {
  // Ensure you have a file named 'waterportrait.png' in your folder
  sourceImg = loadImage('../images/portraitimage.webp', 
    () => { console.log("Image loaded successfully"); }, 
    () => { console.log("Failed to load image"); }
  ); 
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  
  if (sourceImg) {
    sourceImg.resize(width, height);
    sourceImg.loadPixels();
    isReady = true;
  }
  
  colorMode(RGB, 255); 
  background(30); 
  strokeCap(ROUND); 

  // Initial spawn
  for (let j = 0; j < numStrands; j++) {
    setPosition(int(random(0, 4)));
    spagStrand.push(new spagSlice(strandWidth, color(0), position, velocity, chanceToBranch));
  }
}

function draw() {
  if (!isReady) return; // Don't run logic until assets are ready

  // 1. CLEANUP: Remove dead strands
  // We use a backwards loop which is safer/faster for removal than filter() in tight loops
  for (let i = spagStrand.length - 1; i >= 0; i--) {
    if (!spagStrand[i].checkStatus()) {
      spagStrand.splice(i, 1);
    }
  }

  // 2. UPDATE & DRAW
  // We use a standard for loop to avoid issues if the array changes length during iteration
  // We also cap the iteration count just in case
  let currentCount = spagStrand.length;
  for (let i = 0; i < currentCount; i++) {
    let strand = spagStrand[i];
    // Double check strand exists (paranoid safety)
    if (strand) {
      strand.drawSlice();
      strand.updateSlice();
    }
  }

  // 3. REPLENISH (With Safety Cap)
  if (spagStrand.length < numStrands) {
     setPosition(int(random(0, 4)));
     spagStrand.push(new spagSlice(strandWidth, color(0), position, velocity, chanceToBranch));
  }
}

function setPosition(side) {
  let dispersion = width * dispersionPercent / 100;
  if (side > 3) side = int(random(0, 4));

  if (side == 0) { // top
    position = createVector(random(width * .5 - dispersion, width * .5 + dispersion), 0 - boundary);
    velocity = createVector(0, random(1, sliceSpeed)); 
  } else if (side == 1) { // right
    position = createVector(width + boundary, random(height * .5 - dispersion, height * .5 + dispersion));
    velocity = createVector(random(-1, -sliceSpeed), 0); 
  } else if (side == 2) { // bottom
    position = createVector(random(width * .5 - dispersion, width * .5 + dispersion), height + boundary);
    velocity = createVector(0, random(-1, -sliceSpeed)); 
  } else { // left
    position = createVector(0 - boundary, random(height * .5 - dispersion, height * .5 + dispersion));
    velocity = createVector(random(1, sliceSpeed), 0); 
  }
}

function keyReleased() {
  if (key == 's' || key == 'S') {
    save('spag_painting_' +  millis() + '.png');
  }
}