/**
 * Skyline generator
 *
 */
 'use strict';

 let slider;
 let numshapes = 10;
 let displace = 15;
 let fuzzy = 9;
 let solid = true;
 let margin = 20;
 
 let palette = []
 palette[0]=[240,27,18];
 palette[1]=[232,17,35];
 palette[2]=[309,6,58];
 palette[3]=[11,24,72];
 palette[4]=[21,35,92];

 function setup() {
    const canvas = createCanvas(windowWidth-20, windowHeight-20);
    frameRate(60);  // set frame rate - default = 60
    colorMode(HSL,360,100,100,100);
    background(255, 100); // white
    background(42,10,90, 100); //beige
    strokeWeight(1);
    fill(200);
 }
 
function draw() {
    let x = random(margin,width-4*margin);
    let y = random(margin,height-4*margin);
    let rwidth = random(5,40);
    let rheight = random(5,40);
    let v1 = createVector(x, y);
    if (sqrt(sq(x-(width-2*margin)/2)+sq(y-(height-2*margin)/2)) < width/3)  {
        artrect(v1, rwidth, rheight);
        if (solid) {
            stroke(0,0,0,100);
            strokeWeight(random(2));
            //strokeWeight(map(i,0,layers,0,2));
            fill(palette[int(random(0,palette.length))],100);
            //fill(42,10,brightnessv+10,100);  //unsaturated
            rect(x, y, rwidth, rheight);
        }
    }
 }

 function keyPressed() {
    console.log(key);
    if (keyCode == BACKSPACE) {
        if (solid) {
            solid = false;
        } else {
            solid = true;
        }
    }
    if (key == 's' || key == 'S') {
        let timeStamp = year() + "-" + month() + "-" + day() + "-" + hour() + "-" + minute() + "-" + second() + "-" + nf(millis(), 3, 0);
  	    save(timeStamp + 'png');
    }
 }
