// 
// spagSlice Class

class spagSlice {

  constructor(sliceWidth, outlineColor, position, velocity, chanceToBranch, life = 100) {
    // this version randomly picks start points from all 4 sides
    this.noiseStart = int(random(10000,200000));
    // pick a side at random (0 = top, 1 = right, 2 = bottom, 3 = left)
    
    
    //this.slwidth = int(random(sliceWidth*.6,sliceWidth));
    this.slwidth = sliceWidth;
    this.slw2 = int(this.slwidth/2);

    this.point1 = createVector(0,0);
    this.point2 = createVector(0,0);
    this.newVelocity = createVector(0,0);

    //this.lineColor = lineColor;
    this.lineColor = color(selectedPalette[int(random(1,5))]);
    this.outlineColor = color(outlineColor);

    this.position = position;
    this.velocity = velocity;

    //this.velocity = createVector(random(-2,2), random(-1,-2)); //upward vector
    this.perp = createVector(0,0);
    this.acceleration = createVector(0,0);
    this.maxSpeed = 8;
    this.maxForce = .1; // default = .1
    this.typeCheck = 'Bounded';
    this.lifePercent = .001; // percent life lost per cycle; default = .001
    this.life = life; //default = 100
    this.alive = true;
    this.chanceToBranch = chanceToBranch;


  }

  checkStatus () {
    if (this.alive) {
      return true;
    } else {
      return false;
    }
  }

  drawSlice () {

    //check if off screen
    if (this.typeCheck == 'Bounded') {
      if (this.position.x > width+boundary ||
        this.position.x < 0 - boundary ||
        this.position.y > height+boundary ||
        this.position.y < 0 - boundary ) {
          this.alive = false;
        }
      }

    //draw the line between the two points
    push();

    translate(this.position.x, this.position.y);
    
    //this.lineColor.setAlpha(this.life);
    stroke(this.lineColor);
    strokeWeight(2); // best strokeweight for visibility on most monitors  
    line(this.point1.x, this.point1.y, this.point2.x, this.point2.y);
    
    //draw each endpoint
    //this.outlineColor.setAlpha(this.life);

    if (this.slw2 > 1) {
      fill(this.outlineColor);
      stroke(this.outlineColor)
      strokeWeight(this.slw2/4);
      ellipse(this.point1.x, this.point1.y, 2, 2); // "left" side of line
      ellipse(this.point2.x, this.point2.y, 2, 2); // "right" side of line
    }

    pop();
  }

  updateSlice () {

    //update velocity and position

    //the rotation range has the biggest impact on the "wires" curliness 
    let rotateRange = map(this.life,100,0,.005,.05); //set rotation range broader as life winds down; .005 to .05 default
    this.velocity.rotate(map(noiseLevel*noise((noiseScale*frameCount)+this.noiseStart),0,1,-rotateRange,rotateRange));
    this.velocity.add(this.acceleration);
    this.velocity.limit(this.maxSpeed);
    this.position.add(this.velocity);
    //reset acceleration
    this.acceleration.mult(0);
    // set the endpoints by using two perpendicular vectors

    this.point1 = createVector(-this.velocity.y, this.velocity.x);
    this.point1.normalize();
    this.point1.mult(this.slw2);
    this.point2 = createVector(-this.point1.x, -this.point1.y);
    this.point2.normalize();
    this.point2.mult(this.slw2);
  
    this.life = this.life * (1-this.lifePercent); //bigger multiplier causes faster fading

    this.slw2 = this.slw2 * (1-this.lifePercent); //bigger multiplier causes faster to thin line

    // checks to see if the strand is too thin to keep going
    if (this.slw2 < 1.5 || this.life < 1) {
      this.alive = false;
    } else {
      if (random(100) < this.chanceToBranch) { 

        this.newVelocity = this.velocity.copy();
        this.newPosition = this.position.copy();
        this.newVelocity.rotate(random(-PI/8,PI/8));
        this.newPosition.add(this.newVelocity);
        spagStrand.push( new spagSlice (this.slw2*2, this.outlineColor, this.newPosition, this.newVelocity, random(this.chanceToBranch*4),this.life ));

      }
    }
  }

}


