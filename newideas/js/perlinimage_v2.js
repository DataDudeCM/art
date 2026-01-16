let img;
let particles = [];
let imgW, imgH; // Resized image dimensions

function preload() {
  img = loadImage('/images/jinx.jpg'); // Load your image
}

function setup() {
  frameRate(5);
  createCanvas(800, 800); // Set canvas size
  imgW = width;  // Scale width to canvas width
  imgH = (img.height / img.width) * width; // Maintain aspect ratio

  img.resize(imgW, imgH); // Resize image to fit canvas
  img.loadPixels();

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
  //background(20);
  
  //image(img, 0, 0, imgW, imgH); // Draw resized image in the background
  
  for (let p of particles) {
    p.followFlow();
    p.show();
  }
}

class FlowParticle {
  constructor(x, y, col) {
    this.pos = createVector(x, y);
    this.vel = createVector(0, 0);
    this.col = col; // Store the original color
  }

  followFlow() {
    let n = noise(this.pos.x * 0.005, this.pos.y * 0.005, frameCount * 0.005);
    let angle = map(n, 0, 1, -PI, PI);
    let force = p5.Vector.fromAngle(angle);
    this.vel.add(force)/4;
    this.vel.limit(2);
    this.pos.add(this.vel);
  }

  show() {
    fill(this.col); // Use the color of the original pixel
    noStroke();
    ellipse(this.pos.x, this.pos.y, 2);
  }
}
