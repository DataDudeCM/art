// The Nature of Code
// Daniel Shiffman
// http://natureofcode.com


function Cell(x_, y_, w_) {
    this.x = x_;
    this.y = y_;
    this.w = w_;
    this.mscore = 0;
  
    this.state = Math.floor(random(2));
      this.previous = this.state;
  
    this.savePrevious = function() {
      this.previous = this.state;
    };
  
    this.newState = function(s) {
      this.state = s;
    };
  
    this.display = function() {
      if (this.previous === 0 && this.state == 1) {
            this.mscore += 1;
            maxscore = (this.mscore > maxscore) ? this.mscore: maxscore;
            fill(0,0,255);
      }
      else if (this.state == 1) {
            this.mscore +=1;
            maxscore = (this.mscore > maxscore) ? this.mscore: maxscore;
            fill(0);
      } 
      else if (this.previous == 1 && this.state === 0) {
            this.mscore +=1;
            maxscore = (this.mscore > maxscore) ? this.mscore: maxscore;
            fill(255,0,0);
      }
      else fill(255);
      stroke(0);
      rect(this.x, this.y, this.w, this.w);
    };

    //Display a grid of grey squares based on the # of times the given cell
    //was touched; the brighter the cell, the more touches
    this.finaldisplay = function() {
        noStroke();
        fill(map(this.mscore, 0, maxscore, 0, 255));
        rect(this.x, this.y, this.w, this.w);
    };
  }