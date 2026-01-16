let img;
let particles = [];

function preload() {
  img = loadImage('/images/untitled-6.png');
}

function setup() {
  createCanvas(img.width, img.height);
  img.loadPixels();

  // Generate particles from bright areas of the image
  for (let y = 0; y < img.height; y += 5) {
    for (let x = 0; x < img.width; x += 5) {
      let index = (x + y * img.width) * 4;
      let bright = img.pixels[index]; 
      if (bright < 200) {
        particles.push(new FlowParticle(x, y));
      }
    }
  }
}

function draw() {
  background(20);
  
  for (let p of particles) {
    p.followFlow();
    p.show();
  }
}

class FlowParticle {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.vel = createVector(0, 0);
  }

  followFlow() {
    let n = noise(this.pos.x * 0.01, this.pos.y * 0.01, frameCount * 0.01);
    let angle = map(n, 0, 1, -PI, PI);
    let force = p5.Vector.fromAngle(angle);
    this.vel.add(force);
    this.vel.limit(2);
    this.pos.add(this.vel);
  }

  show() {
    fill(255, 50);
    noStroke();
    ellipse(this.pos.x, this.pos.y, 2);
  }
}
