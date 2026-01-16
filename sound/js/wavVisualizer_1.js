let sound, fft;
let beatThreshold = 200; // Minimum energy to detect a beat
let beatDetected = false;
let lastBeatTime = 0;    // To avoid triggering too frequently
let beatHoldTime = 200;  // Minimum time (ms) between beats

function preload() {
  sound = loadSound('js/testmusic.mp3');
}

function setup() {
  createCanvas(800, 400);
  fft = new p5.FFT();
  sound.play();
  //frameRate(1);
}

function draw() {
    background(0);


    // Get the current playback time
    let currentTime = sound.currentTime(); // In seconds
    let duration = sound.duration();       // Total duration of the sound (in seconds)

    // Map the current time to the width of the canvas
    let x = map(currentTime, 0, duration, 0, width);

  // Visualize the current position
  stroke(255);
  line(x, 0, x, height);

    let waveform = fft.waveform();

    // Draw mirrored waveforms
    stroke(255, 100, 150);
    noFill();
    beginShape();
    for (let i = 0; i < waveform.length; i++) {
        let x = map(i, 0, waveform.length, 0, width);
        let y = map(waveform[i], -1, 1, height / 2, 0);
        vertex(x, y);
    }
    endShape();

    stroke(150, 200, 255);
    beginShape();
    for (let i = 0; i < waveform.length; i++) {
        let x = map(i, 0, waveform.length, 0, width);
        let y = map(waveform[i], -1, 1, height / 2, height);
        vertex(x, y);
    }
    endShape();
    
    fft.analyze();
    // Get bass energy
    let bassEnergy = fft.getEnergy("bass");

    // Detect beat
    if (bassEnergy > beatThreshold && millis() - lastBeatTime > beatHoldTime) {
        beatDetected = true;
        lastBeatTime = millis(); // Update last beat time
    } else {
        beatDetected = false;
    }

    // Visualize the beat
    if (beatDetected) {
        fill(random(255), random(255), random(255));
        ellipse(width / 2, height / 2, 200, 200); // Flashing circle
    }

    // Visualize bass energy
    fill(255);
    noStroke();
    rect(50, height - bassEnergy, 50, bassEnergy);
}
