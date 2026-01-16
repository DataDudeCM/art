let padValue = 0;      // Changes when you hit a pad
let knobValue = 127;   // Changes when you turn Knob 1
let padColor;

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 255);
  padColor = color(100, 150, 255); // A nice "Arcane" hex-blue
  
  // Initialize WebMidi
  WebMidi.enable()
    .then(onEnabled)
    .catch(err => alert(err));
}

function onEnabled() {
  // Check if MPD218 is connected
  if (WebMidi.inputs.length < 1) {
    console.log("No MIDI devices found. Plug in that MPD218!");
  } else {
    console.log("Device found:", WebMidi.inputs[0].name);
    
    // Listen to the first available input (your Akai)
    const myInput = WebMidi.inputs[0];

    // PAD TRIGGER: Note On
    myInput.addListener("noteon", e => {
      // e.note.number is the pad ID; e.velocity is how hard you hit it (0-1)
      padValue = e.velocity * 500; 
      padColor = color(map(e.note.number, 24, 67, 0, 255), 200, 255); 
      console.log(`Pad: ${e.note.number} ${e.note.identifier}, Velocity: ${e.rawVelocity}`);
    });

    // KNOB TRIGGER: Control Change
    myInput.addListener("controlchange", e => {
      // e.value is 0-127. e.controller.number is the knob ID (usually 1-6)
      if (e.controller.number === 1) {
        knobValue = map(e.value, 0, 127, 10, 400);
      }
      console.log(`Knob: ${e.controller.number}, Value: ${e.value}`);
    });
  }
}

function draw() {
  // Semi-transparent background for that "ghosting" trailing effect
  background(20, 20, 30, 25); 
  
  noStroke();
  fill(padColor);
  
  // The circle size is controlled by the last knob turn
  // The "burst" effect happens when you hit a pad
  ellipse(width/2, height/2, knobValue + padValue);
  
  // Slowly shrink the "pad burst" to create a pulse effect
  if (padValue > 0) padValue -= 5;
}