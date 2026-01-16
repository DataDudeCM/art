// OPTIMIZED TRAP SEQUENCER
// Key Change: Separating Data (Audio) from View (Visuals)

let synthKick, synthSnare, synthHat;
let currentStep = 0;
let totalSteps = 16;
let isPlaying = false;
let cellWidth, cellHeight;

// THE DATA (Lightweight 2D Array)
// 0 = Kick, 1 = Snare, 2 = Hat
// 1 = ON, 0 = OFF
let gridData = [
  [1, 0, 0, 0, 0, 0, 0, 0,  1, 0, 1, 0, 0, 0, 0, 0], // Row 0: Kick
  [0, 0, 0, 0, 1, 0, 0, 0,  0, 0, 0, 0, 1, 0, 0, 0], // Row 1: Snare
  [1, 1, 1, 1, 1, 1, 1, 1,  1, 1, 1, 1, 1, 1, 1, 1]  // Row 2: Hat
];

function setup() {
  createCanvas(600, 300);
  cellWidth = width / totalSteps;
  cellHeight = height / 3;

  // 1. SOUND DESIGN (Optimized for Punch)
  synthKick = new Tone.MembraneSynth({
    pitchDecay: 0.05, octaves: 10, oscillator: { type: "sine" },
    envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4 }
  }).toDestination();

  synthSnare = new Tone.NoiseSynth({
    volume: -5,
    noise: { type: "white" }, envelope: { attack: 0.001, decay: 0.2, sustain: 0 }
  }).toDestination();

  synthHat = new Tone.MetalSynth({
    frequency: 200, envelope: { attack: 0.001, decay: 0.1, release: 0.01 },
    harmonicity: 5.1, modulationIndex: 32, resonance: 4000, octaves: 1.5,
    volume: -15
  }).toDestination();

  Tone.Transport.bpm.value = 140;

  // 2. THE OPTIMIZED LOOP
  // We do NOT loop through cells here. We just check the data array.
  Tone.Transport.scheduleRepeat((time) => {
    let step = currentStep % totalSteps;

    // Direct Array Access (O(1) complexity - Very Fast)
    let kickOn = gridData[0][step];
    let snareOn = gridData[1][step];
    let hatOn = gridData[2][step];

    if (kickOn) synthKick.triggerAttackRelease("C1", "8n", time);
    if (snareOn) synthSnare.triggerAttackRelease("8n", time);
    
    if (hatOn) {
      // The Trap Ratchet Logic
      if (Math.random() > 1) {
        // Triplet roll
        synthHat.triggerAttackRelease("32n", time);
        synthHat.triggerAttackRelease("32n", time + Tone.Time("32n")); 
        synthHat.triggerAttackRelease("32n", time + Tone.Time("32n") * 2); 
      } else {
        synthHat.triggerAttackRelease("32n", time);
      }
    }

    // Schedule the visual update separately so it doesn't block audio
    Tone.Draw.schedule(() => {
      currentStep++;
    }, time);
    
  }, "16n");
}

function draw() {
  background(30);
  
  // 3. THE VIEW
  // We draw based on the data array
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < totalSteps; col++) {
      let x = col * cellWidth;
      let y = row * cellHeight;
      
      // Determine Color
      let isActive = gridData[row][col] === 1;
      let isCurrent = (currentStep % totalSteps) === col;
      
      stroke(0);
      strokeWeight(2);
      
      if (isActive) {
        if (row === 0) fill(255, 50, 50);      // Kick
        if (row === 1) fill(50, 255, 200);     // Snare
        if (row === 2) fill(255, 200, 50);     // Hat
      } else {
        fill(60);
      }
      
      // Brighten the playing column
      if (isCurrent) {
        fill(isActive ? 255 : 120);
      }
      
      rect(x, y, cellWidth, cellHeight, 5);
    }
  }
}

async function mousePressed() {
  if (Tone.context.state !== 'running') {
    await Tone.start();
  }
  
  // Calculate which cell was clicked
  let col = floor(mouseX / cellWidth);
  let row = floor(mouseY / cellHeight);
  
  // Boundary check
  if (col >= 0 && col < totalSteps && row >= 0 && row < 3) {
    // Toggle the Data (0 -> 1 or 1 -> 0)
    gridData[row][col] = gridData[row][col] ? 0 : 1;
  }
}

function keyPressed() {
  if (key === ' ') {
    if (isPlaying) {
      Tone.Transport.stop();
      currentStep = 0;
    } else {
      Tone.Transport.start();
    }
    isPlaying = !isPlaying;
  }
}