/**
 * Skyline generator
 *
 */
 'use strict';

 let slider;

 function setup() {
    const canvas = createCanvas(windowWidth, windowHeight);
    frameRate(1);  // set frame rate - default = 60
    colorMode(HSL,360,100,100,100);
    background(255, 100); // white
    strokeWeight(1);
    fill(200);
 }
 
function draw() {
    //background(200,40,85, 100); // blue
    //background(42,10,40, 100); //beige
    background(255); //white
    // Draw 
    let maxbldgwidth = map(mouseX,0,width,10,100); //set the max width of bldgs
    let layers = 6;
    for (let i = 0; i < layers+1; i++) {
        for (let x = width/10; x < width-width/10; x+=maxbldgwidth) {
            let brightnessv = random(map(i,0,layers,40,70),90);
            let displace = random(0,height/20);  //height displacement to avoid symmetry
            let bldgstart = random(-maxbldgwidth/2,maxbldgwidth/2);  //shifts the bldg away from the evenly spaced x values
            let bldgwidth = random(10,maxbldgwidth);  //variable bldg width based on the mouse
            //draw buildings above waterline
            stroke(0,0,0,100);
            //strokeWeight(map(i,0,layers,0,2));
            fill(200,40,brightnessv,100);  //saturated  42, 50 = beige
            //fill(42,10,brightnessv+10,100);  //unsaturated
            rect(x + bldgstart, (height*.75)-((pdf(x)+displace)), bldgwidth, pdf(x)+displace);
            //draw buildings below waterline
            noStroke();
            fill(200,40,brightnessv,map(i,0,layers,20,60));  //saturated
            //fill(42,10,brightnessv,map(i,0,layers,20,60));  //unsaturated
            rect(x + bldgstart, (height*.75), bldgwidth, pdf(x)+displace);
        }
    }
    //noLoop();
 }

 //Function to get a Y value for a given X using std bell curve
 function pdf(x) {
    let mean = width / 2;
    let std = map(mouseY,0,height,40,width/2);
    let yout = abs(1000/(std * sqrt(2*3.1415)) * exp(-(sq(x - mean)) / (4 * sq(std))));
    return yout*height/16;
 }


 function keyReleased() {
   if (keyCode == DELETE || keyCode == BACKSPACE) background(255);
   if (key == 's' || key == 'S') saveCanvas(gd.timestamp(), 'png');
 }

