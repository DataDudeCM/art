let numshapes = 12;
let displace = 4;
let fuzzy = 10;

let padValue = 0;      // Changes when you hit a pad
let knobValue = 127;   // Changes when you turn Knob 1
let jF = 0.05;         // jaggy factor for artrect
let nF  = 1;            // noise factor for artrect
let scale = 0.01;      // scale for noise function
let noiseOffset = 1000; // noise offset

function setup() {
    const canvas = createCanvas(windowWidth, windowHeight);
    frameRate(1);  // set frame rate - default = 60
    colorMode(HSB, 255);
    background("White"); // white
    strokeWeight(1);
    //fill(0,100);  //black

      // Initialize WebMidi
    WebMidi.enable()
        .then(onEnabled)
        .catch(err => alert(err));
}

function draw() {
    background("White"); //white

    let width = 400;
    let height = 400;   
    let v1 = createVector(windowWidth*.5-width*.5, windowHeight*.5-height*.5);
    artrect(v1, width, height, 10, 8, jF, nF);
    //rect(200,200,150,100);
    //noLoop();
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
        if (e.controller.number === 3) {
            //just an example, use knob 3 to control jaggy factor
            jF = map(e.value, 0, 1, 0, 1);
        }
        if (e.controller.number === 9) {
            //just an example, use knob 3 to control jaggy factor
            nF = map(e.value, 0, 1, 0, 50);
        }
      console.log(`Knob: ${e.controller.number}, Value: ${e.value}`);
    });
  }
}