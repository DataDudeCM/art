// 
// spagSlice Class

class spagSlice {

  constructor(sliceCenter, sliceWidth, lineColor, outlineColor) {
    
    this.slcenter = sliceCenter;
    this.slwidth = int(random(sliceWidth*.6,sliceWidth));
    this.slw2 = int(this.slwidth/2);

    this.position = sliceCenter;
    this.point1 = createVector(0,0);
    this.point2 = createVector(0,0);

    //this.lineColor = lineColor;
    this.lineColor = color(selectedPalette[int(random(1,5))]);
    this.outlineColor = color(outlineColor);

    this.velocity = createVector(0, random(-1,-2)); //upward vector
    //this.velocity = createVector(random(-2,2), random(-1,-2)); //upward vector
    this.perp = createVector(0,0);
    this.acceleration = createVector(0,0);
    this.maxSpeed = 4;
    this.maxForce = .1;
    this.typeCheck = 'Bounded';
    this.lifePercent = .001; // percent life lost per cycle
    this.life = 100;
    this.alive = true;
    this.noiseStart = int(random(10000,200000));

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
    strokeWeight(2);
    line(this.point1.x, this.point1.y, this.point2.x, this.point2.y);
    
    //draw each endpoint
    //this.outlineColor.setAlpha(this.life);

    if (this.slw2 > 1) {
      fill(this.outlineColor);
      stroke(this.outlineColor);
      strokeWeight(1);
      ellipse(this.point1.x, this.point1.y, 1, 1);
      ellipse(this.point2.x, this.point2.y, 1, 1);
    }

    //point(this.point1.x,this.point1.y);
    //point(this.point2.x,this.point2.y);


    pop();
  }

  updateSlice () {

    //update velocity and position
    let rotateRange = map(this.life,100,0,.005,.05); //set rotation range broader as life winds down; .005 to .05 default
    //this.velocity.rotate(random(-.02,.02));
    this.velocity.rotate(map(noiseLevel*noise((noiseScale*frameCount)+this.noiseStart),0,1,-rotateRange,rotateRange));
    //this.velocity.rotate(random(-rotateRange,rotateRange));
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

    //this.life = this.life * (1-this.lifePercent);
    this.life = this.life - (this.life*this.lifePercent);
    //print(this.life,this.slw2, this.life/100);
    if (this.slw2 > 2) {
      this.slw2 = this.slw2 - (this.slw2*this.lifePercent*2); //bigger multiplier causes faster to thin line
    }

  }

}


