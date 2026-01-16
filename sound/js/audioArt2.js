let song;
let fft;
let isStarted = false;

function preload() {
  song = loadSound('../common/testmusic2.mp3'); 
}

function setup() {
  createCanvas(800, 1000);
  background(10); // Very dark (almost black) background
  
  // HSB Mode: 
  // Hue (0-360), Saturation (0-100), Brightness (0-100), Alpha (0-1)
  colorMode(HSB, 360, 100, 100, 1);
  
  fft = new p5.FFT(0.8, 2048); 
  
  fill(0, 0, 100);
  textAlign(CENTER);
  text("CLICK TO START PAINTING", width/2, height/2);
}

function draw() {
  if (isStarted) {
    let spectrum = fft.analyze(); 
    let y = map(song.currentTime(), 0, song.duration(), 0, height);
    
    noStroke();
    
    // START LOOP
    // We start at i=1 to avoid log(0) issues
    for (let i = 1; i < spectrum.length; i++) {
      
      let amp = spectrum[i];
      
      // THRESHOLD: Only draw if there is actual sound
      if (amp > 5) {
        
        // --- 1. THE POSITION (BASS IN CENTER) ---
        
        // We calculate the width of the "wing" (center to edge)
        let center = width / 2;
        
        // Logarithmic mapping: 
        // Low i (Bass) -> 0 distance (Center)
        // High i (Treble) -> width/2 distance (Edge)
        let r_offset = map(log(i), 0, log(spectrum.length), 0, center);
        let r_offsetNext = map(log(i+1), 0, log(spectrum.length), 0, center);
        
        // Calculate the width of this specific frequency band
        let w = r_offsetNext - r_offset;
        
        
        // --- 2. THE COLOR (ARCANE PALETTE) ---
        
        // We map Frequency (i) to Hue (Color)
        // 200 = Blue, 280 = Purple, 50 = Gold, 0 = Red
        // Let's go from Deep Purple (Bass) -> Cyan (Mids) -> Gold (Treble)
        // Range: 280 (Purple) down to 180 (Cyan) then jump to 45 (Gold) for highs?
        // Let's try a continuous flow: 260 (Purple) -> 160 (Teal) -> 40 (Gold)
        // Note: This requires mapping the range carefully or the colors will look rainbow-y.
        
        let h; 
        if (i < spectrum.length / 4) {
           // Bass to Low Mids: Purple (280) to Blue (200)
           h = map(i, 0, spectrum.length/4, 280, 200);
        } else {
           // Mids to Highs: Blue (200) to Gold (40)
           h = map(i, spectrum.length/4, spectrum.length, 200, 40);
        }
        
        // Saturation: Loud sounds = More vivid. Quiet = Greyer.
        let s = map(amp, 0, 255, 40, 90);
        
        // Brightness: Loud = Bright.
        let b = map(amp, 0, 255, 30, 100);
        
        // Alpha: Low opacity for the "painterly" blending
        fill(h, s, b, 0.1); 
        
        
        // --- 3. THE DRIP (HEIGHT) ---
        // Loud sounds are taller
        let h_rect = map(amp, 0, 255, 1, 30); 
        
        // --- DRAWING ---
        
        // Draw Right Side (Center + Offset)
        rect(center + r_offset, y, w + 0.5, h_rect);
        
        // Draw Left Side (Center - Offset - Width)
        // Note: We subtract 'w' so the rectangle grows outward correctly
        rect(center - r_offset - w, y, w + 0.5, h_rect);
      }
    }
  }
}

function mousePressed() {
  if (!isStarted) {
    background(10); // Clear screen to dark gray
    userStartAudio();
    song.play();
    isStarted = true;
  }
}