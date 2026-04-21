/*
  fracture.js — Realistic crack / fracture generator
  Two material modes: Concrete and Glass

  Controls:
    R               — Regenerate
    Sliders         — Adjust parameters
    Concrete/Glass  — Switch material and regenerate
*/

let controls = [];
let activeCracks = [];
let materialMode = 0;   // 0 = concrete, 1 = glass
let generating  = false;

const SX  = 0;          // slider column index into controls[]
const SY  = 10;
let sliderX, sliderGap = 38;

// Material colors (set per generate)
let bgCol, voidCol, edgeCol, glowCol, stainCol;

// ── setup ────────────────────────────────────────────────────────────────────

function setup() {
  let cw = min(windowWidth - 225, windowHeight - 10);
  createCanvas(cw, cw);
  sliderX = width + 15;
  colorMode(RGB, 255, 255, 255, 255);

  let s = SY + 20, g = sliderGap;
  controls.push(new SliderControl('Origins',    1,   8,   2,   1,   sliderX, s));         // 0
  controls.push(new SliderControl('Branches %', 0,  50,  15,   1,   sliderX, s + g));     // 1
  controls.push(new SliderControl('Jitter',     0, 100,  40,   5,   sliderX, s + g*2));   // 2
  controls.push(new SliderControl('Max Length', 30, 500, 180,  10,  sliderX, s + g*3));   // 3
  controls.push(new SliderControl('Width',     0.5,  8,   3,  0.5,  sliderX, s + g*4));   // 4
  controls.push(new SliderControl('Depth',      1,   7,   4,   1,   sliderX, s + g*5));   // 5
  controls.push(new SliderControl('Speed',      1,  30,  10,   1,   sliderX, s + g*6));   // 6

  // Material buttons
  let btnRow = s + g * 7 + 12;
  let btnConcrete = createButton('Concrete');
  btnConcrete.position(sliderX, btnRow);
  btnConcrete.mousePressed(() => { materialMode = 0; generate(); });

  let btnGlass = createButton('Glass');
  btnGlass.position(sliderX, btnRow + 32);
  btnGlass.mousePressed(() => { materialMode = 1; generate(); });

  let btnRegen = createButton('Regenerate  [R]');
  btnRegen.position(sliderX, btnRow + 70);
  btnRegen.mousePressed(generate);

  generate();
}

// ── generate ─────────────────────────────────────────────────────────────────

function generate() {
  activeCracks = [];

  let numOrigins = int(controls[0].slider.value());
  let maxLen     = controls[3].slider.value();
  let maxW       = controls[4].slider.value();
  let maxDepth   = int(controls[5].slider.value());

  setMaterialColors();
  drawBackground();

  for (let i = 0; i < numOrigins; i++) {
    let ox = random(width * 0.12, width * 0.88);
    let oy = random(height * 0.12, height * 0.88);
    spawnOrigin(ox, oy, maxLen, maxW, maxDepth);
  }
  generating = true;
}

function spawnOrigin(ox, oy, maxLen, maxW, maxDepth) {
  // Glass: draw small impact crush zone
  if (materialMode === 1) {
    noStroke();
    for (let r = maxW * 5; r > 0; r -= 0.8) {
      fill(200, 220, 255, map(r, 0, maxW * 5, 80, 0));
      ellipse(ox, oy, r, r);
    }
  }

  let numPrimary = materialMode === 0 ? int(random(2, 5)) : int(random(4, 9));
  for (let j = 0; j < numPrimary; j++) {
    // Slight random offset so primaries don't all share the same start pixel
    let ang = (j / numPrimary) * TWO_PI + random(-0.35, 0.35);
    activeCracks.push(
      new Crack(ox, oy, ang, maxLen, maxW, random(1000), maxDepth)
    );
  }
}

// ── material colors ───────────────────────────────────────────────────────────

function setMaterialColors() {
  if (materialMode === 0) {
    // Concrete: warm light grey surface
    bgCol    = color(202, 195, 183);
    stainCol = color(50, 42, 30, 18);    // water-stain halo, very low opacity
    edgeCol  = color(148, 140, 130, 210); // shadow ridge at crack edge
    voidCol  = color(28, 20, 14);         // dark crack interior
    glowCol  = color(230, 225, 215, 0);   // unused in concrete
  } else {
    // Glass: near-black bg, cool white-blue cracks
    bgCol    = color(16, 20, 32);
    stainCol = color(80, 120, 200, 20);   // blue outer corona
    edgeCol  = color(90, 130, 210, 55);   // blue glow edge
    voidCol  = color(205, 225, 250, 240); // bright glass fracture
    glowCol  = color(255, 255, 255, 45);  // tight white highlight
  }
}

// ── background texture ────────────────────────────────────────────────────────

function drawBackground() {
  background(bgCol);

  if (materialMode === 0) {
    // Concrete grain via pixel manipulation
    // Sample on a 3-pixel grid for performance, fill 3x3 blocks
    noiseSeed(int(random(99999)));
    let br = red(bgCol), bg_ = green(bgCol), bb = blue(bgCol);
    let bk = 3; // block size
    loadPixels();
    for (let y = 0; y < height; y += bk) {
      for (let x = 0; x < width; x += bk) {
        let n1 = noise(x * 0.011, y * 0.011);
        let n2 = noise(x * 0.065, y * 0.065);
        let v  = (n1 * 0.6 + n2 * 0.4) * 46 - 23;
        let pr = constrain(br + v,        0, 255);
        let pg = constrain(bg_ + v * 0.9, 0, 255);
        let pb = constrain(bb + v * 0.75, 0, 255);
        for (let dy = 0; dy < bk && y + dy < height; dy++) {
          for (let dx = 0; dx < bk && x + dx < width; dx++) {
            let idx = ((y + dy) * width + (x + dx)) * 4;
            pixels[idx]     = pr;
            pixels[idx + 1] = pg;
            pixels[idx + 2] = pb;
            pixels[idx + 3] = 255;
          }
        }
      }
    }
    updatePixels();
  }
  // Glass: plain dark background is fine — the cracks provide all the visual interest
}

// ── draw loop ─────────────────────────────────────────────────────────────────

function draw() {
  // Keep slider labels updated
  for (let c of controls) c.updateLabel();

  if (!generating || activeCracks.length === 0) {
    generating = false;
    return;
  }

  let speed    = int(controls[6].slider.value());
  let branchP  = controls[1].slider.value() / 100;
  let jitterP  = controls[2].slider.value() / 100;

  for (let s = 0; s < speed; s++) {
    for (let i = activeCracks.length - 1; i >= 0; i--) {
      activeCracks[i].grow(branchP, jitterP);
      if (activeCracks[i].dead) activeCracks.splice(i, 1);
    }
    if (activeCracks.length === 0) break;
  }
}

function keyPressed() {
  if (key === 'r' || key === 'R') generate();
}

// ── Crack class ───────────────────────────────────────────────────────────────

class Crack {
  constructor(x, y, angle, energy, baseW, noiseOff, depth) {
    this.x       = x;
    this.y       = y;
    this.angle   = angle;
    this.energy  = energy;
    this.maxE    = energy;
    this.baseW   = baseW;
    this.noiseOff = noiseOff;
    this.noiseT  = random(200); // unique noise phase per crack
    this.depth   = depth;
    this.dead    = false;
    this.step    = 2.2;         // pixels per grow() call
  }

  grow(branchP, jitter) {
    if (this.energy <= 0) { this.dead = true; return; }

    // Organic direction drift — Perlin noise so the path curves, not jags
    let n = noise(this.noiseOff, this.noiseT * 0.022);
    this.angle += map(n, 0, 1, -jitter, jitter);
    this.noiseT++;

    let nx = this.x + cos(this.angle) * this.step;
    let ny = this.y + sin(this.angle) * this.step;

    // Stop at canvas edge
    if (nx < 0 || nx > width || ny < 0 || ny > height) {
      this.dead = true; return;
    }

    // Width tapers smoothly as energy drains (square-root curve)
    let t = pow(this.energy / this.maxE, 0.55);
    let w = max(this.baseW * t, 0.25);

    // ── Multi-pass rendering for realism ──

    if (materialMode === 0) {
      // Pass 1: very wide, ultra-low-alpha stain (water seep into surface)
      stroke(stainCol);
      strokeWeight(w + 9);
      line(this.x, this.y, nx, ny);

      // Pass 2: shadow ridge along crack edges
      stroke(edgeCol);
      strokeWeight(w + 2.5);
      line(this.x, this.y, nx, ny);

      // Pass 3: dark void (the crack itself)
      stroke(voidCol);
      strokeWeight(w);
      line(this.x, this.y, nx, ny);

    } else {
      // Pass 1: outer blue corona (refraction halo)
      stroke(stainCol);
      strokeWeight(w + 9);
      line(this.x, this.y, nx, ny);

      // Pass 2: blue-white glow edge
      stroke(edgeCol);
      strokeWeight(w + 4);
      line(this.x, this.y, nx, ny);

      // Pass 3: tight white inner glow
      stroke(glowCol);
      strokeWeight(w + 1.5);
      line(this.x, this.y, nx, ny);

      // Pass 4: bright glass fracture line
      stroke(voidCol);
      strokeWeight(w);
      line(this.x, this.y, nx, ny);
    }

    this.x = nx;
    this.y = ny;
    this.energy -= this.step;

    // Branching — only while crack still has meaningful energy
    if (this.depth > 0 && this.energy > this.step * 6 && random() < branchP) {
      let sign   = random() < 0.5 ? 1 : -1;
      // Branch angle: ~35–65° off main direction (physically plausible range)
      let bAngle  = this.angle + sign * random(PI * 0.32, PI * 0.62);
      let bEnergy = this.energy * random(0.22, 0.52);
      let bW      = this.baseW * random(0.38, 0.65);
      activeCracks.push(
        new Crack(nx, ny, bAngle, bEnergy, bW, random(1000), this.depth - 1)
      );
    }
  }
}

// ── SliderControl ─────────────────────────────────────────────────────────────

class SliderControl {
  constructor(name, min, max, start, step, x, y) {
    this.name   = name;
    this.slider = createSlider(min, max, start, step);
    this.slider.position(x, y);
    this.slider.style('width', '190px');
    this.label  = createDiv(`${name}: ${start}`);
    this.label.position(x, y - 15);
    this.label.style('font-family', 'Arial');
    this.label.style('font-size', '11px');
    this.label.style('color', '#ccc');
  }

  // Call each frame just to keep the label current
  updateLabel() {
    this.label.html(`${this.name}: ${this.slider.value()}`);
  }

  // Convenience: read + update label in one call
  update() {
    let val = this.slider.value();
    this.label.html(`${this.name}: ${val}`);
    return val;
  }
}
