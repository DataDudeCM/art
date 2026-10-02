let img;
let particles = [];
let imgW, imgH;
let center;
let noiseOffset;

function preload() {
  img = loadImage('/images/eclipse.jpg'); // Load your portrait image
}

function setup() {
  createCanvas(800, 800);
  frameRate(20);
  imgW = width;
  imgH = (img.height / img.width) * width;

  img.resize(imgW, imgH);
  img.loadPixels();

  center = createVector(width / 2, height / 2);
  noiseOffset = random(1000); // Randomize the Perlin noise pattern each time

  // Generate particles from bright areas of the image
  for (let y = 0; y < imgH; y += 5) {
    for (let x = 0; x < imgW; x += 5) {
      let index = (x + y * imgW) * 4;
      let bright = img.pixels[index]; // Get brightness
      if (bright < 200) { // Only create particles in darker areas
        let col = color(
          img.pixels[index],     // R
          img.pixels[index + 1], // G
          img.pixels[index + 2]  // B
        );
        particles.push(new FlowParticle(x, y, col));
      }
    }
  }
}

function draw() {
  //background(0,20);
  
  //image(img, 0, 0, imgW, imgH); // Draw resized image in the background

  for (let p of particles) {
    p.expandOutwardWithNoise();
    p.wrapAround(); // Ensure particles wrap around the screen
    p.show();
  }
}

class FlowParticle {
  constructor(x, y, col) {
    this.pos = createVector(x, y);
    this.vel = createVector(0, 0);
    this.accel = createVector(0, 0);
    this.col = col;
  }

  expandOutwardWithNoise() {
    let dir = p5.Vector.sub(this.pos, center); // Get outward direction
    dir.setMag(0.02); // Small initial acceleration outward

    // Apply Perlin noise variation
    let n = noise(this.pos.x * 0.005 + noiseOffset, this.pos.y * 0.005 + noiseOffset, frameCount * 0.005);
    let angle = map(n, 0, 1, -PI, PI);

    // Mix outward movement with noise-based randomness
    let force = p5.Vector.fromAngle(angle);
    force.mult(0.3); // Reduce the influence of noise so particles still expand outward

    this.accel.add(dir);  // Apply outward force
    this.accel.add(force); // Add noise-based randomness
    this.vel.add(this.accel);
    this.vel.limit(2);
    this.pos.add(this.vel);
    
    this.accel.mult(0); // Reset acceleration each frame
  }

  wrapAround() {
    // If the particle moves off the screen, wrap it around to the opposite side
    if (this.pos.x > width) this.pos.x = 0;
    if (this.pos.x < 0) this.pos.x = width;
    if (this.pos.y > height) this.pos.y = 0;
    if (this.pos.y < 0) this.pos.y = height;
  }

  show() {
    fill(this.col);
    noStroke();
    ellipse(this.pos.x, this.pos.y, 2);
  }
}
