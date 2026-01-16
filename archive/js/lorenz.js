/**
 * Basic template for Class / Slider
 *
 */
 'use strict';

let x = 5;
let y = 7;

 function setup() {
    const canvas = createCanvas(windowWidth, windowHeight);
    frameRate(60);  // set frame rate - default = 60
    colorMode(HSL);
    background(0, 100); // white
    strokeWeight(1);
    noStroke();
    fill(0);
 }
 
function draw() {
    background(360, 100); // white
    let x = 5;
    let y = 7;
    for (let t = -2; t < 2; t+= .0001) {
        x = x*3 * sq(t);
        y = pow(y,4) * t - sq(t);
        console.log(x,y);
        ellipse(x+width/2,y+height/2,4,4); 
    }
 }


 function keyPressed() {
   if (keyCode == DELETE || keyCode == BACKSPACE) background(255);
   if (key == 's' || key == 'S') saveCanvas(gd.timestamp(), 'png');
 }
