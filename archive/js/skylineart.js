/**
 * Skyline generator
 *
 */
 'use strict';

 
 let slider;
 let numshapes = 40;
 let displace = 4;
 let fuzzy = 38;
 let solid = true;

 //color palette for building when filled
 let palette = []
 palette[0]=[240,27,18];
 palette[1]=[232,17,35];
 palette[2]=[309,6,58];
 palette[3]=[11,24,72];
 palette[4]=[21,35,92];


 function setup() {
    const canvas = createCanvas(windowWidth-20, windowHeight-20);
    frameRate(20);  // set frame rate - default = 60
    colorMode(HSL,360,100,100,100);
    background(255, 100); // white
    strokeWeight(1);
    fill(200);
 }
 
function draw() {
    //background(42,10,90, 100); //beige
    background(42,310,90, 100); //beige

    // Draw 
    let maxbldgwidth = map(mouseX,0,width,10,100); //set the max width of bldgs
    let layers = 6;
    for (let i = 0; i < layers+1; i++) {
        for (let x = width/10; x < width-width/10; x+=maxbldgwidth) {
            let brightnessv = random(map(i,0,layers,40,70),90);
            let offset = random(0,height/20);  //height displacement to avoid symmetry
            let bldgstart = random(-maxbldgwidth/2,maxbldgwidth/2);  //shifts the bldg away from the evenly spaced x values
            let bldgwidth = random(10,maxbldgwidth);  //variable bldg width based on the mouse
            //draw buildings above waterline

            //strokeWeight(1);
            //ellipse(x,(height*.75)-bellcurve(x),10,10);
            
            let v1 = createVector(x + bldgstart, (height*.66)-((bellcurve(x)+offset)));

            //call my custom artsy rectangle function
            artrect(v1, bldgwidth, bellcurve(x)+offset);

            //if solid mode chosen - fill in the rectangles from the palette
            if (solid) {
                stroke(0,0,0,100);
                strokeWeight(1);
                fill(palette[int(random(0,palette.length))],100);
                rect(x + bldgstart, (height*.66)-((bellcurve(x)+offset)), bldgwidth, bellcurve(x)+offset);
                //draw buildings below waterline
            }
            noStroke();
            fill(200,10,brightnessv,map(i,0,layers,20,60));  //saturated
            rect(x + bldgstart, (height*.66), bldgwidth, bellcurve(x)+offset);
        }
    }
 }

 //Function to get a Y value for a given X using std bell curve
 function bellcurve(x) {
    let mean = width / 2;
    //let std = 120;
    let std = map(mouseY,0,height,60,200);
    let yout = abs(1000/(std * sqrt(2*3.1415)) * exp(-(sq(x - mean)) / (4 * sq(std))));
    return yout*height/16;
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
