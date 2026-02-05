let mySound;
let bufferSize = 1024; // Lower buffer size = buzzier, higher pitch base
let noiseZ = 0; // The "time" dimension for our breathing effect

function setup() {
  createCanvas(800, 400);
  background(30);
  
  // Initialize the sound system
  // We create an empty buffer and immediately loop it
  let ac = getAudioContext();
  let buf = ac.createBuffer(1, bufferSize, ac.sampleRate);
  
  mySound = new p5.SoundFile();
  mySound.buffer = buf;
  
  // Start silently (volume will be controlled by mouse)
  mySound.loop();
}

function draw() {
  background(30, 50); // Slight trail effect for visuals
  
  // --- VARIATION #2: INTERACTION ---
  // MouseX controls "Roughness" (Noise Scale)
  // Low scale (0.5) = smooth/flute-like. High scale (10) = jagged/noise.
  let noiseScale = map(mouseX, 0, width, 0.5, 10, true);
  
  // MouseY controls "Amplitude" (Volume)
  let masterAmp = map(mouseY, height, 0, 0.0, 1.0, true);
  
  // Get direct access to the audio data array
  // This allows us to write directly to the sound card's memory
  let data = mySound.buffer.getChannelData(0);
  
  // Setup visualization styles
  noFill();
  stroke(0, 255, 150);
  strokeWeight(2);
  
  beginShape();
  
  for (let i = 0; i < bufferSize; i++) {
    // Calculate the angle for the circular path
    let angle = map(i, 0, bufferSize, 0, TWO_PI);
    
    // Calculate circular coordinates
    let x = (cos(angle) + 1) * noiseScale;
    let y = (sin(angle) + 1) * noiseScale;
    
    // --- VARIATION #1: BREATHING ---
    // We pass 'noiseZ' as the 3rd parameter. 
    // This samples a cross-section of the 3D noise cloud.
    let n = noise(x, y, noiseZ);
    
    // Remap noise (0 to 1) to audio range (-1 to 1)
    // And apply our mouse volume
    let sample = map(n, 0, 1, -1, 1) * masterAmp;
    
    // 1. Write to Audio Engine
    data[i] = sample;
    
    // 2. Draw to Screen
    // Map the sample to screen coordinates for the waveform
    let vy = map(sample, -1, 1, height, 0);
    let vx = map(i, 0, bufferSize, 0, width);
    vertex(vx, vy);
  }
  
  endShape();
  
  // Increment Z to make the sound "breathe" forward in time
  noiseZ += 0.01; 
  
  // Instructions
  noStroke();
  fill(255);
  text("X: Roughness | Y: Volume", 20, 30);
}

// Ensure audio context starts on user interaction (browser policy)
function mousePressed() {
  if (getAudioContext().state !== 'running') {
    getAudioContext().resume();
  }
}