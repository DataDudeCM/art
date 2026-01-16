/**
 * drawing a filled circle with lines.
 *
 * MOUSE
 * position x          : length
 * position y          : thickness and number of lines
 *
 * KEYS
 * s                   : save png
 */
 'use strict';

 function setup() {
    //createCanvas(720, 720);
    const canvas = createCanvas(720, 720);
    frameRate(30);
    noFill();
    background(255);
    strokeWeight(2);
    stroke(0, 20);
 }
 
 function draw() {
    push();
    translate(width / 2, height / 2);

    var circleResolution = parseInt(random(2, 10));
    var radius = random(0,width) - width / 2;
    var angle = TAU / circleResolution;

    stroke(0,parseInt(random(0,255)));

    if (parseInt(random(0,1)) == 0) {
        fill(37, 140, 212, parseInt(random(0,50)));
    }
    else {
        noFill();
    }
    
    beginShape();
    for (var i = 0; i <= circleResolution; i++) {
    var x = cos(angle * i) * radius;
    var y = sin(angle * i) * radius;
    vertex(x, y);
    }
    endShape(close);

    pop();
 }

 function mousePressed() {
     noLoop();
 }

 function mouseReleased() {
    background(255); 
    loop();
 }

 function keyReleased() {
   if (keyCode == DELETE || keyCode == BACKSPACE) background(255);
   if (key == 's' || key == 'S') saveCanvas(gd.timestamp(), 'png');
 }