// Vector scribble
//



function setup() {
    cnv=createCanvas(400,400);
    colorMode(HSB,255,100,100,100);
    angleMode(DEGREES);
    background('Black');
    linecolor = color('Green');
    stroke(linecolor);
    vel = createVector(0,-5);
    pos = createVector(100,width/2);
}
  
function draw() {

    if (pos.x < 0) { pos.x = width; }
    if (pos.x > width) { pos.x = 0; }
    if (pos.y < 0) { pos.y = height; }
    if (pos.y > height) {pos.y = 0; }
    
    startpt = pos.copy();
    vel.rotate(random(-5,5));
    vel.setMag(random(1,10));
    pos.add(vel);

    line(startpt.x,startpt.y,pos.x,pos.y);

}  

function mousePressed() {

}

function keyPressed() {
    if (keyCode == BACKSPACE) {
        if (isLooping()) {
            noLoop()
        } else {
            loop();
        }
	} 
    if (key == 'r' || key == 'R') {
        blendMode(BLEND);
        background(backcolor);
        blendMode(blendtype);
	} 

    if (key == 's' || key == 'S') {
        let timeStamp = year() + "-" + month() + "-" + day() + "-" + hour() + "-" + minute() + "-" + second() + "-" + nf(millis(), 3, 0);
  	    save(cnv,'Particles_' + timeStamp + '.jpg');
    }
}