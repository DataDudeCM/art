// spagSlice Class - STABLE Version

class spagSlice {

  constructor(sliceWidth, outlineColor, position, velocity, chanceToBranch) {
    this.noiseStart = int(random(10000, 200000));
    this.slwidth = sliceWidth;
    this.slw2 = int(this.slwidth / 2);

    this.point1 = createVector(0, 0);
    this.point2 = createVector(0, 0);
    this.newVelocity = createVector(0, 0);

    this.lineColor = color(255); 
    this.outlineColor = color(outlineColor); 

    this.position = position.copy(); 
    this.velocity = velocity.copy();

    this.acceleration = createVector(0, 0);
    this.maxSpeed = 8;
    this.lifePercent = .002; 
    this.life = 100; 
    this.alive = true;
    this.chanceToBranch = chanceToBranch;
  }

  checkStatus() {
    return this.alive;
  }

  drawSlice() {
    if (this.position.x > width + 50 || this.position.x < -50 || 
        this.position.y > height + 50 || this.position.y < -50) {
      this.alive = false;
      return;
    }

    let x = Math.floor(this.position.x);
    let y = Math.floor(this.position.y);

    if (x >= 0 && x < width && y >= 0 && y < height) {
      let index = (x + y * width) * 4;
      
      // Safety check: ensure pixel array exists
      if (sourceImg && sourceImg.pixels && sourceImg.pixels.length > 0) {
        let r = sourceImg.pixels[index];
        let g = sourceImg.pixels[index + 1];
        let b = sourceImg.pixels[index + 2];
        
        this.lineColor = color(r, g, b, 200); 
        let bright = (r + g + b) / 3;
        this.slwidth = map(bright, 0, 255, 1, 5);
      }
    } else {
      this.lineColor.setAlpha(0);
    }

    push();
    translate(this.position.x, this.position.y);
    stroke(this.lineColor);
    strokeWeight(this.slwidth); 
    line(0, 0, -this.velocity.x * 2, -this.velocity.y * 2);
    pop();
  }

  updateSlice() {
    let rotateRange = map(this.life, 100, 0, .005, .05); 
    this.velocity.rotate(map(noiseLevel * noise((noiseScale * frameCount) + this.noiseStart), 0, 1, -rotateRange, rotateRange));
    
    this.velocity.add(this.acceleration);
    this.velocity.limit(this.maxSpeed);
    this.position.add(this.velocity);
    this.acceleration.mult(0);

    this.life = this.life * (1 - this.lifePercent);

    if (this.life < 1) {
      this.alive = false;
    } else {
      // BRANCHING LOGIC FIXED
      // 1. Check if we have hit the max strand count global limit
      // 2. Check random chance
      if (spagStrand.length < MAX_STRANDS && random(100) < this.chanceToBranch) {
        
        this.newVelocity = this.velocity.copy();
        this.newPosition = this.position.copy();
        this.newVelocity.rotate(random(-PI/8, PI/8));
        
        // CRITICAL FIX: Reduce chance for child, don't increase it!
        // We multiply by 0.5 so children are half as likely to branch as parents
        let childChance = this.chanceToBranch * 0.5;
        
        spagStrand.push(new spagSlice(this.slwidth, this.outlineColor, this.newPosition, this.newVelocity, childChance));
      }
    }
  }
}