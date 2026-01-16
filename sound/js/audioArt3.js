let song;
let fft;
let isStarted = false;

function preload() {
  song = loadSound('../common/testmusic2.mp3'); 
}

function setup() {
  createCanvas(800, 1000);
  background(0); // Pure black for the glow effect
  
  // HSB: Hue(360), Sat(100), Bright(100), Alpha(1.0)
  colorMode(HSB, 360, 100, 100, 1);
  
  // PHOTOGRAPHER TRICK: Additive Blending
  // Colors stack up to create white/hot spots
  blendMode(ADD); 
  
  fft = new p5.FFT(0.8, 1024); // Lowered bins slightly for performance with the complex drawing
  
  fill(0, 0, 100);
  textAlign(CENTER);
  text("CLICK TO CREATE ART", width/2, height/2);
}

function draw() {
  if (isStarted) {
    let spectrum = fft.analyze(); 
    let y = map(song.currentTime(), 0, song.duration(), 0, height);
    
    // We don't use stroke or fill generally, we handle it per particle
    noFill();
    
    // Loop through spectrum
    for (let i = 1; i < spectrum.length; i++) {
      let amp = spectrum[i];
      
      // Higher threshold to keep the background clean (High contrast)
      if (amp > 20) {
        
        let center = width / 2;
        
        // --- 1. ORGANIC NOISE OFFSET ---
        // We use the current X (freq) and Y (time) to sample a noise field
        // This makes the lines "wiggle" like smoke or roots
        let noiseScale = 0.01;
        let drift = map(noise(i * noiseScale, y * noiseScale), 0, 1, -50, 50);
        
        // Calculate Base Position
        let r_dist = map(log(i), 0, log(spectrum.length), 0, center);
        
        // Apply Drift
        let x_right = center + r_dist + drift;
        let x_left = center - r_dist + drift; // Drift usually moves both same direction (wind)
        
        // --- 2. ARCANE COLOR PALETTE ---
        // Bass (Center) = Cyan/Green (Zaun toxic)
        // Treble (Edges) = Magenta/Pink (Arcane magic)
        // Let's swap the previous palette for a high-contrast Neon one
        let h = map(i, 0, spectrum.length, 160, 320); 
        
        // Dynamic Alpha: Louder = More Opaque
        let alpha = map(amp, 0, 255, 0.05, 0.4);
        
        // --- 3. DRAWING "SCRATCHES" ---
        // instead of rect(), we use push/pop to rotate lines
        
        strokeWeight(map(amp, 0, 255, 0.5, 2)); // Line thickness based on volume
        stroke(h, 80, 80, alpha);
        
        // DRAW RIGHT
        push();
        translate(x_right, y);
        // Rotate the scratch based on noise so it flows
        rotate(noise(y * 0.05 + i) * TWO_PI); 
        line(0, 0, map(amp, 0, 255, 2, 20), 0); // Line length based on volume
        pop();
        
        // DRAW LEFT
        push();
        translate(x_left, y);
        rotate(noise(y * 0.05 + i) * TWO_PI); 
        line(0, 0, map(amp, 0, 255, 2, 20), 0);
        pop();
      }
    }
  }
}

function mousePressed() {
  if (!isStarted) {
    background(0);
    userStartAudio();
    song.play();
    isStarted = true;
  }
}