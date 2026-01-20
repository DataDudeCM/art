let angleStepSlider, ampSlider, freqSlider, radiusSlider;

function setup() {
  createCanvas(800, 600);
  
  fill(255);
  noStroke();
  
  // 1. Angle Step (Resolution): 
  // How many degrees do we jump? 
  // 120 = Triangle, 90 = Square, 1 = Smooth Circle.
  createP('Segment Angle (Resolution)');
  angleStepSlider = createSlider(1, 120, 5, 1);
  
  // 2. Base Radius: How big is the main circle?
  createP('Base Radius');
  radiusSlider = createSlider(10, 300, 150, 1);
  
  // 3. Amplitude: How far the spikes stick out
  createP('Wave Height (Amplitude)');
  ampSlider = createSlider(0, 150, 40, 1);
  
  // 4. Frequency: How many "petals" or bumps
  createP('Frequency (Petals)');
  freqSlider = createSlider(0, 20, 8, 1);
  
  background(30);
}

function draw() {
  // Transparency Trail Effect
  noStroke();
  fill(30, 20); // Dark background with low opacity
  rect(0, 0, width, height);
  
  translate(width / 2, height / 2); // Move 0,0 to center of screen

  let angleStep = angleStepSlider.value();
  let baseRadius = radiusSlider.value();
  let waveAmp = ampSlider.value();
  let freq = freqSlider.value();

  // "Breathing" modifier
  let breathe = sin(frameCount * 0.03); 
  let currentAmp = waveAmp * (1 + breathe * 0.5); 
  
  // Rotate the whole shape slowly over time
  rotate(frameCount * 0.01);

  stroke(255, 200, 100); // Warm Gold/Amber color
  strokeWeight(2);

  // -- POLAR LOOP --
  // We need to calculate the START point (angle 0) before the loop 
  // so we have a 'prevX' and 'prevY' to connect to.
  
  // r = radius + sine_wave_offset
  let startR = baseRadius + sin(0 * freq) * currentAmp;
  let prevX = startR * cos(0);
  let prevY = startR * sin(0);

  // Loop from 0 to 360 degrees (in RADIANS usually, but logic is easier to read in steps)
  for (let a = angleStep; a <= 360; a += angleStep) {
    
    let rad = radians(a); // Convert degree to radian for p5 functions
    
    // Calculate Radius for this angle
    // We add sine wave variation to the base radius
    let r = baseRadius + sin(rad * freq) * currentAmp;
    
    // Convert Polar to Cartesian
    let x = r * cos(rad);
    let y = r * sin(rad);
    
    line(prevX, prevY, x, y);
    
    // Draw joints (optional)
    push();
    stroke(255, 100, 100, 150);
    strokeWeight(4);
    point(x, y);
    pop();
    
    prevX = x;
    prevY = y;
  }
  
  // CLOSE THE LOOP
  // Connect the very last point back to the very first point (angle 0)
  let closeR = baseRadius + sin(0 * freq) * currentAmp;
  let closeX = closeR * cos(0);
  let closeY = closeR * sin(0);
  line(prevX, prevY, closeX, closeY);
}