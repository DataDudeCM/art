let shapes = [];
// Global modifiers
let globalPressure = 0;
let rotationSpeed = 0.005;
let knobScale = 1.0; 
let sColor = 200; // Base stroke color


function setup() {
  createCanvas(windowWidth, windowHeight);
  WebMidi.enable().then(onEnabled);
  background(26);
}

function draw() {
  // Persistence/Ghosting effect from your artrect.js logic
  background(26, 26, 26, 25); 
  colorMode(HSB, 255);
  
  translate(width / 2, height / 2);
  
  for (let i = shapes.length - 1; i >= 0; i--) {
    // We pass the global variables into the update/display methods
    shapes[i].update(rotationSpeed);
    shapes[i].display(globalPressure, knobScale);
    if (shapes[i].isDead()) shapes.splice(i, 1);
  }
}

class MandalaInstance {
  constructor(note, velocity) {
    this.note = note;
    this.velocity = velocity; // Initial strike force
    this.lifespan = 255;
    this.sides = floor(map(note, 36, 51, 3, 12));
    this.angle = 0;
    this.baseRadius = (this.velocity-.2)  * 400; // Scale radius by velocity
  }

  update(rSpeed) {
    this.lifespan -= 1.5; 
    this.angle += rSpeed; // Responds to Knob 1 in real-time
  }

  display(pressure, kScale) {
    push();
    rotate(this.angle);
    noFill();
    
    // Dynamic Stroke: Changes for ALL shapes when you press harder
    // This creates the "glow" effect you liked in your Arcane sketches
    strokeWeight(1 + (pressure * 20)); 
    
    let alpha = map(this.lifespan, 0, 255, 0, 150);
    stroke(sColor, 255, 255, alpha);

    // Dynamic Scale: Knob 2 affects the size of everything currently on screen
    let r = this.baseRadius * kScale;
    
    this.drawRecursive(0, 0, r, 3);
    pop();
  }

  drawRecursive(x, y, r, depth) {
    if (depth <= 0) return;
    beginShape();
    for (let a = 0; a < TWO_PI; a += TWO_PI / this.sides) {
      let sx = x + cos(a) * r;
      let sy = y + sin(a) * r;
      vertex(sx, sy);
      if (depth > 1) this.drawRecursive(sx, sy, r * 0.4, depth - 1);
    }
    endShape(CLOSE);
  }

  isDead() { return this.lifespan <= 0; }
}

function onEnabled() {
  const myInput = WebMidi.inputs[0];

  // 1. STRIKE: Adds the shape
  myInput.addListener("noteon", e => {
    console.log(`Pad: ${e.note.number}, Velocity: ${e.velocity}`);
    shapes.push(new MandalaInstance(e.note.number, e.velocity));
  });

  // 2. PRESSURE: Affects ALL active shapes' thickness
  myInput.addListener("channelaftertouch", e => {
    globalPressure = e.value; // Continuous update (0-1)
  });

  // 3. KNOBS: Affects ALL active shapes' rotation and scale
  myInput.addListener("controlchange", e => {
    // Knob 1: Rotation Speed
    if (e.controller.number === 3) {
      rotationSpeed = map(e.value, 0, 1, -0.1, 0.1);
    }
    // Knob 2: Global Size/Zoom
    if (e.controller.number === 9) {
      knobScale = map(e.value, 0, 1, 0.1, 2.0);
    }
    // Knob 3: Global Size/Zoom
    if (e.controller.number === 12) {
      sColor = map(e.value, 0, 1, 0, 255);
    }
  });
}