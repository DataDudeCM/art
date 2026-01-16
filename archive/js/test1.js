function setup() {
    createCanvas(600,300);
}

function draw() {
    background(220);
    var circlesize = map(mouseY,0,height,20,200);
    var radiusdiff = map(mouseX,0,width,5,100);
    // circle 01
    fill(51, 51, 51);
    strokeWeight(2);
    stroke(75);
    ellipse(width/2, height/2, circlesize, circlesize);
    // circle 02
    stroke(0);
    fill(255, 53, 139);
    ellipse(width/2, height/2, circlesize - radiusdiff, circlesize - radiusdiff);
    // circle 03
    fill(1, 176, 240);
    ellipse(width/2, height/2, circlesize - 2*radiusdiff, circlesize - 2*radiusdiff );
    // circle 04
    fill(174, 238, 0);
    ellipse(width/2, height/2, circlesize - 3*radiusdiff, circlesize - 3*radiusdiff);
}