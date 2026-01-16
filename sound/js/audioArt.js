let song;
let fft;
let isStarted = false; // Flag to track if we've started

function preload() {
  // Make sure to upload a file named 'song.mp3' or update this path
  song = loadSound('../common/testmusic.mp3');
}

function setup() {
  createCanvas(800, 1000);
  background(0); // Start with black canvas
  
  // Initialize FFT but don't analyze yet
  fft = new p5.FFT(0.8, 1024);
  
  // UX: Tell the user what to do
  fill(255);
  textAlign(CENTER);
  textSize(20);
  text("CLICK ANYWHERE TO PAINT", width / 2, height / 2);
}

function draw() {
  // Only run the visualization if the song is playing
  if (isStarted) {
    
    // 1. Analyze
    let spectrum = fft.analyze(); 
    
    // 2. Calculate Y based on current song time
    // We map the current time to the height of the canvas
    let y = map(song.currentTime(), 0, song.duration(), 0, height);
    
    // 3. Draw the row
    noStroke();
    
    for (let i = 0; i < spectrum.length; i++) {
      // Linear mapping of frequency to width
      let x = map(i, 0, spectrum.length, 0, width);
      
      // Get amplitude (0-255)
      let amp = spectrum[i];
      
      // Only draw if there is sound to avoid muddying the canvas
      if (amp > 0) {
        // Use low opacity (alpha) to blend overlapping frames
        // This creates the "painterly" build-up
        fill(amp, 50); 
        
        // Draw the pixel
        rect(x, y, width / spectrum.length, 2);
      }
    }
  }
}

// This function runs once when you click the mouse
function mousePressed() {
  if (!isStarted) {
    // Clear the "Click to Start" text
    background(0);
    
    // Start the Audio Context (required by browsers)
    userStartAudio();
    
    // Play the song
    song.play();
    
    isStarted = true;
  }
}