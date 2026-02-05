let mySound;
let bufferSize = 1024;
let noiseZ = 0;

// STATE
let isFrozen = false;
let lockedMX, lockedMY;

// CAMERA
let viewRotX, viewRotZ;

// BLENDING VARIABLES
let blendAmt = 0.0; // 0.0 = Noise, 1.0 = Pure Wave
let waveType = 'sine'; // 'sine' or 'saw'

// VISUALIZATION
let history = []; 
let maxHistory = 50; 
let gridScale = 12; 
let visSkip = 8; 

function setup() {
  createCanvas(800, 600, WEBGL);
  
  // Disable context menu
  document.oncontextmenu = function() { return false; }
  
  // Isometric view
  viewRotX = PI / 3; 
  viewRotZ = PI / 4 + 0.2;

  let ac = getAudioContext();
  let buf = ac.createBuffer(1, bufferSize, ac.sampleRate);
  mySound = new p5.SoundFile();
  mySound.buffer = buf;
  mySound.loop();
  
  noiseDetail(8, 0.65);
}

function draw() {
  background(20);
  
  // --- 1. HANDLE MOUSE INPUT (SCALING & ROTATION) ---
  let mX, mY;
  
  if (mouseIsPressed && mouseButton === RIGHT) {
    viewRotZ += (mouseX - pmouseX) * 0.01;
    viewRotX += (mouseY - pmouseY) * 0.01;
    mX = lockedMX || 0.5; 
    mY = lockedMY || 0.5;
  } else {
    if (!isFrozen) {
      mX = map(mouseX, 0, width, 0.2, 20.0);
      mY = map(mouseY, height, 0, 0.0, 1.0);
      noiseZ += 0.02;
      lockedMX = mX;
      lockedMY = mY;
    } else {
      mX = lockedMX;
      mY = lockedMY;
    }
  }

  // --- 2. HANDLE KEYBOARD INPUT (BLENDING) ---
  // Arrow Up = More Pure Wave | Arrow Down = More Noise
  if (keyIsDown(UP_ARROW)) blendAmt += 0.02;
  if (keyIsDown(DOWN_ARROW)) blendAmt -= 0.02;
  
  // Constrain blendAmt between 0 and 1
  blendAmt = constrain(blendAmt, 0, 1);

  // --- 3. TEXT HUD ---
  push();
  resetMatrix();
  fill(255);
  noStroke();
  textSize(14);
  
  text(`Noise Scale: ${nf(mX, 1, 2)}`, 20, 30);
  text(`Volume: ${nf(mY, 1, 2)}`, 20, 50);
  
  // Show Blend Status
  fill(255, 200, 0);
  let typeLabel = waveType === 'sine' ? "SINE (Smooth)" : "SAW (Sharp)";
  text(`BLEND: ${Math.round(blendAmt * 100)}% ${typeLabel}`, 20, 80);
  text(`(Arrows Up/Down to Blend, 'S' to toggle Type)`, 20, 100);

  if(isFrozen) {
    fill(255, 100, 100);
    text("FROZEN (Left Click to release)", 20, 130);
  }
  pop();

  // --- 4. AUDIO ENGINE ---
  let data = mySound.buffer.getChannelData(0);
  let currentVisualFrame = []; 
  
  for (let i = 0; i < bufferSize; i++) {
    // A. CALCULATE NOISE
    let angle = map(i, 0, bufferSize, 0, TWO_PI);
    let x = (cos(angle) + 1) * mX;
    let y = (sin(angle) + 1) * mX;
    let n = noise(x, y, noiseZ);
    let noiseSample = map(n, 0, 1, -1, 1);
    
    // B. CALCULATE PURE WAVE
    let pureSample = 0;
    if (waveType === 'sine') {
      pureSample = sin(angle); 
    } else {
      // Sawtooth: linear ramp from -1 to 1 across the buffer
      pureSample = map(i, 0, bufferSize, -1, 1);
    }
    
    // C. BLEND THEM
    // lerp(start, stop, amount)
    let mixedSample = lerp(noiseSample, pureSample, blendAmt);
    
    // Apply Master Volume
    let finalSample = mixedSample * mY;
    
    data[i] = finalSample;
    
    if (i % visSkip === 0) {
      currentVisualFrame.push(finalSample);
    }
  }

  // --- 5. RENDER 3D TERRAIN ---
  history.unshift(currentVisualFrame);
  if (history.length > maxHistory) history.pop();

  directionalLight(255, 255, 255, 0, 0, -1);
  ambientLight(60);
  
  rotateX(viewRotX); 
  rotateZ(viewRotZ); 
  
  let meshWidth = history.length * gridScale;
  let meshHeight = (bufferSize / visSkip) * gridScale;
  translate(-meshWidth / 2, -meshHeight / 2, 0);

  noFill();
  strokeWeight(1.5);
  
  for (let x = 0; x < history.length - 1; x++) {
    if (isFrozen) stroke(255, 100, 100);
    else {
      // Color change based on blend!
      // Green = Noise, Yellow = Hybrid, White = Pure
      let r = map(blendAmt, 0, 1, 0, 255);
      let g = 255;
      let b = map(blendAmt, 0, 1, 200, 100);
      let alpha = map(x, 0, history.length, 255, 0);
      stroke(r, g, b, alpha);
    }
    
    beginShape(TRIANGLE_STRIP);
    for (let y = 0; y < history[x].length; y++) {
      let xPos = x * gridScale;
      let yPos = y * gridScale;
      let zPos = history[x][y] * 150; 
      let zPosNext = history[x+1][y] * 150;
      vertex(xPos, yPos, zPos);
      vertex((x + 1) * gridScale, yPos, zPosNext);
    }
    endShape();
  }
}

// TOGGLE WAVE TYPE WITH 'S' KEY
function keyPressed() {
  if (key === 's' || key === 'S') {
    if (waveType === 'sine') waveType = 'saw';
    else waveType = 'sine';
  }
}

function mousePressed() {
  if (getAudioContext().state !== 'running') {
    getAudioContext().resume();
  }
  if (mouseButton === LEFT) {
    isFrozen = !isFrozen;
  }
}