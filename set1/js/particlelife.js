let particles = [];
let numParticles = 20;
let brush;

function preload() {
  // If you have any assets to load, do it here
  brush = loadImage('../brushes/Random.png');
  brush.resize(100, 100); // Resize brush for better visibility
}

function setup() {
  createCanvas(600, 600);
  for (let i = 0; i < numParticles; i++) {
    particles.push(new Particle());
  }
  background(255);
  //tint(255, 10); // Apply transparency to the image
  blendMode(MULTIPLY);
  imageMode(CENTER);
}

function draw() {
  //background(20, 30, 50);
  //background(255); //creates trails
  for (let p of particles) {
    p.update();
    p.checkCollision(particles);
    p.show();
  }
}

class Particle {
  constructor() {
    this.x = random(width);
    this.y = random(height);
    this.r = random(20, 100); // Fixed radius
    this.xSpeed = random(-10, 10);
    this.ySpeed = random(-10, 10);
    this.color = random(1) > 0.25 ? color(255, 0, 0) : color(0, 0, 255); // Red or Blue
  }

  update() {
    this.x += this.xSpeed;
    this.y += this.ySpeed;

    // Bounce off edges
    if (this.x < 0 || this.x > width) this.xSpeed *= -1;
    if (this.y < 0 || this.y > height) this.ySpeed *= -1;
  }

  checkCollision(particles) {
    for (let other of particles) {
      if (other === this) continue; // Skip self-collision
      let d = dist(this.x, this.y, other.x, other.y);
      if (d < this.r * 2) { // Collision detected
        this.interact(other);
      }
    }
  }

  interact(other) {
    // Rule: Change color on collision
    if (this.color.levels[0] === 255 && other.color.levels[2] === 255) {
      // Red touches Blue: Turn both Purple
      this.color = color(128, 0, 128);
      other.color = color(128, 0, 128);
    } else if (this.color.levels[2] === 255 && other.color.levels[0] === 255) {
      // Blue touches Red: Turn both Green
      this.color = color(0, 255, 0);
      other.color = color(0, 255, 0);
    }
    // Feel free to tweak these rules!
  }

  show() {
    tint(this.color.levels[0], this.color.levels[1], this.color.levels[2], 50); // Apply color with transparency
    
    push();
    translate(this.x, this.y);
    rotate(random(TWO_PI));
    image(brush, 0, 0, this.r, this.r);
    pop();

    push();
    translate(this.x, this.y);
    rotate(random(TWO_PI));
    image(brush, 0, 0, this.r*1.5, this.r*1.5);
    pop();

    noTint();

  }
}



function keyReleased() {
    if (keyCode == DELETE || keyCode == BACKSPACE) background(255);
    if (key == 'l' || key == 'L') {
      if (isLoopingFlag) {
        isLoopingFlag = false;
        noLoop()
      } else {
        isLoopingFlag = true;
        loop();
      }
    }
    if (key == 's' || key == 'S') {
      // images go to Downloads folder
      let timeStamp = year() + "-" + month() + "-" + day() + "-" + hour() + "-" + minute() + "-" + second() + "-" + nf(millis(), 3, 0);
        save('city_' + timeStamp + 'png');
      }
  }
