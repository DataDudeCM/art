/**
 * AUDIO HARMONIC LOOM
 * A generative visualization that maps audio frequencies to geometric tension.
 * * Artistic Approach: Balance and Rhythm.
 * This sketch uses the FFT (Fast Fourier Transform) to analyze sound 
 * and draw overlapping 'strings' that create Moire patterns.
 */

let song;
let fft;
let numStrings = 64;

function preload() {
  // Replace with your local .wav file path
  song = loadSound('../common/testmusic.mp3');
}

function setup() {
  createCanvas(800, 800);
  // Using an FFT with 1024 bins for high resolution
  fft = new p5.FFT(0.8, 1024);
  
  // Interaction to start/stop
  let btn = createButton('Play/Pause');
  btn.position(10, 10);
  btn.mousePressed(() => {
    if (song.isPlaying()) song.pause();
    else song.loop();
  });
  
  background(10);
}

function draw() {
  // Use a slight fade to create 'trails' of the sound's history
  // Similar to the 'fuzzy' opacity in your artrect.js
  background(10, 20); 

  let spectrum = fft.analyze();
  
  noFill();
  
  for (let i = 0; i < numStrings; i++) {
    // Map frequency bands to the number of strings
    let index = floor(map(i, 0, numStrings, 0, spectrum.length / 2));
    let amplitude = spectrum[index];
    
    // Artistic Rationale: 
    // High amplitude = more tension/displacement.
    // Lower frequencies are mapped to thicker, darker lines.
    let strokeAlpha = map(amplitude, 0, 255, 10, 150);
    let weight = map(i, 0, numStrings, 4, 0.5);
    
    stroke(255, strokeAlpha);
    strokeWeight(weight);
    
    let yPos = map(i, 0, numStrings, 100, height - 100);
    let waveOffset = map(amplitude, 0, 255, 0, 150);
    
    // Draw the 'string' with a Bezier curve influenced by the sound
    beginShape();
    vertex(50, yPos);
    // Control points moved by frequency energy
    bezierVertex(
      width / 3, yPos - waveOffset, 
      (width / 3) * 2, yPos + waveOffset, 
      width - 50, yPos
    );
    endShape();
  }
}