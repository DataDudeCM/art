// 
// spagSlice Class

class spagSlice {

  constructor(side, sliceSpeed, sliceWidth, lineColor, outlineColor, dispersion) {
    this.dispersion = dispersion;
    // this version randomly picks start points from all 4 sides
    this.noiseStart = int(random(10000,200000));
    // pick a side at random (0 = top, 1 = right, 2 = bottom, 3 = left)
    if (side > 3) {
      this.side = int(random(0,4));
    } else {
      this.side = side;
    }
      //

    if (this.side == 0) { // top
      this.position = createVector(random(width*.5-this.dispersion, width*.5+this.dispersion), 0-boundary);
      //this.position = createVector(map(noiseLevel*noise((noiseScale*frameCount)+this.noiseStart),0,1,0,width), 0-boundary);
      this.velocity = createVector(0, random(1,sliceSpeed)); //down vector
    } else if (this.side == 1) { // right
      this.position = createVector(width+boundary, random(height*.5-this.dispersion,height*.5+this.dispersion));
      //this.position = createVector(width+boundary, map(noiseLevel*noise((noiseScale*frameCount)+this.noiseStart),0,1,0,height));
      this.velocity = createVector(random(-1,-sliceSpeed),0); //left vector
    } else if (this.side == 2) { // bottom
      this.position = createVector(random(width*.5-this.dispersion, width*.5+this.dispersion), height+boundary);
      this.velocity = createVector(0, random(-1,-sliceSpeed)); //upward vector
    } else { // left
      this.position = createVector(0-boundary, random(height*.5-this.dispersion,height*.5+this.dispersion));
      this.velocity = createVector(random(1,sliceSpeed),0); //down vector
    }
    
    this.slwidth = int(random(sliceWidth*.6,sliceWidth));
    this.slw2 = int(this.slwidth/2);

    this.point1 = createVector(0,0);
    this.point2 = createVector(0,0);

    //this.lineColor = lineColor;
    this.lineColor = color(selectedPalette[int(random(1,5))]);
    this.outlineColor = color(outlineColor);


    //this.velocity = createVector(random(-2,2), random(-1,-2)); //upward vector
    this.perp = createVector(0,0);
    this.acceleration = createVector(0,0);
    this.maxSpeed = 8;
    this.maxForce = .1; // default = .1
    this.typeCheck = 'Bounded';
    this.lifePercent = .003; // percent life lost per cycle; default = .001
    this.life = 10; //default = 100
    this.alive = true;


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
    //the rotation range has the biggest impact on the "wires" curliness 
    let rotateRange = map(this.life,100,0,.05,.02); //set rotation range broader as life winds down; .005 to .05 default
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
  
    this.life = this.life * (1-this.lifePercent); //bigger multiplier causes faster fading

    this.slw2 = this.slw2 * (1-this.lifePercent); //bigger multiplier causes faster to thin line

    // checks to see if the strand is too thin to keep going
    if (this.slw2 < 1) {
      this.alive = false;
    }
  }

}


