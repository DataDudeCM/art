let sound, fft;
let beatThreshold = 200; // Minimum energy to detect a beat
let beatDetected = false;
let lastBeatTime = 0;    // To avoid triggering too frequently
let beatHoldTime = 200;  // Minimum time (ms) between beats
/* IDEAS

Use the waveform to draw segments from the radius to the radius + waveform array value
Use beats to change the color
Draw transparently
Use the spectrum (frequency array) to 

OR

Use to draw cracks
waveform determines size of crack


*/



function preload() {
  sound = loadSound('js/testmusic.mp3');
}

function setup() {
  createCanvas(800, 600);
  fft = new p5.FFT();
  sound.play();
  //frameRate(1);
  background(0);
}

function draw() {
    background(0);

    //timeSlider(sound);

    //waveForm(fft);

    // Get the waveform data
    let waveform = fft.waveform();

    // Circle properties
    let centerX = width / 2;
    let centerY = height / 2;
    let baseRadius = 200; // Base radius of the circle

    // Draw the waveform circle
    noFill();
    //fill(255,1);
    stroke(255);
    strokeWeight(2);
    beginShape();
    let x0,y0;
    for (let i = 0; i < waveform.length; i++) {
      let angle = map(i, 0, waveform.length, 0, TWO_PI); // Map index to angle
      let amplitude = waveform[i]; // Get amplitude at this point
      let radius = baseRadius + map(amplitude, -1, 1, -200, 200); // Map amplitude to radius
      let x = centerX + radius * cos(angle); // Calculate x position
      let y = centerY + radius * sin(angle); // Calculate y position
      vertex(x, y); // Add vertex at the calculated position
      if (i == 0) {
        x0 = x;
        y0 = y;
      }
    }
    vertex(x0,y0);
    endShape(CLOSE); // Close the shape



    //freqSpectrum(fft);

    beatResult = getBeat(fft,'bass'); //detect bass beat and beat energy
    if (beatResult.bassEnergy > beatThreshold) {
      // reduce beatboost 

    }

    // Visualize the beat
    if (beatResult.beatDetected) {
        fill(random(255), random(255), random(255));
        ellipse(width / 2, height / 2, 200, 200); // Flashing circle
    }

    // Visualize bass energy
    fill(255);
    noStroke();
    rect(50, height - beatResult.bassEnergy, 50, beatResult.bassEnergy);
}

function timeSlider (sound) {
    // TIME SLIDER
    // Get the current playback time
    let currentTime = sound.currentTime(); // In seconds
    let duration = sound.duration();       // Total duration of the sound (in seconds)
    // Map the current time to the width of the canvas
    let x = map(currentTime, 0, duration, 0, width);
    // Visualize the current position
    stroke(255);
    line(x, 0, x, height);
}

function waveForm() {
    // WAVEFORM
    // returns an array of amplitude values (black)
    let waveform = fft.waveform();
    noFill();
    beginShape();
    stroke(255);
    for (let i = 0; i < waveform.length; i++){ // length is 1024
      let x = map(i, 0, waveform.length, 0, width);
      let y = map(waveform[i], -1, 1, 0, height);
      vertex(x,y);
    }
    endShape();
  }

  function freqSpectrum(fft) {
        // FREQ SPECTRUM
    // isolates values along the frequency (pitch) spectrum (red)
    let spectrum = fft.analyze(); 
    noStroke();
    fill(160, 0, 0);
    for(let i = 0; i < spectrum.length; i++) { // length is 1024
      let x = map(i, 0, spectrum.length, width, 0);
      let h = -height + map(spectrum[i], 0, 255, height, 0);
      rect(x, height, width / spectrum.length, h);
    } 
  }

  function getBeat(fft, freqType) {
        // DETECT BEAT
    //fft.analyze();

    // Get bass energy
    let bassEnergy = fft.getEnergy(freqType);

    // Detect beat
    if (bassEnergy > beatThreshold && millis() - lastBeatTime > beatHoldTime) {
        beatDetected = true;
        lastBeatTime = millis(); // Update last beat time
    } else {
        beatDetected = false;
    }
    return { beatDetected, bassEnergy };
  }
