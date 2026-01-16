// Rename to sunburst
//
// Images stored in MyArt/GenArt/sunburst


function setup() {
    cnv=createCanvas(800,800);
    colorMode(HSB,255,100,100,100);
    blendtype = SCREEN;
    strokeWeight(1);
    //frameRate(1);

    centers = [];
    points = [];
    radii = [];
    numsegments = 80; //number of segments between circles
    
    //circlesize = 800; //spread of entire design
    slider1 = createSlider(0,800,10);
    slider1.style('width', '80px');

    //outpct = .01; //span of light rays
    slider2 = createSlider(0,50,1,1);
    slider2.style('width', '80px');

    
    calpha = 1;
    linecolor = color('Green');
    linecolor.setAlpha(calpha);
    backcolor = color('Black');

    slider3 = createSlider(0,TWO_PI,HALF_PI,.1);
    slider3.style('width','80px');

    //offset = HALF_PI; //PI = 180 w point intersections; o = straight lines
    background(backcolor);
}
  
function draw() {

    let circlesize = slider1.value();
    let outpct = slider2.value()/10;
    let offset = slider3.value();

    centers[0] = createVector(int(random(-width*outpct,width*outpct)+width*.5), int(random(-height*outpct,height*outpct)+height*.5));
    centers[1] = createVector(int(random(-10,10))+width/2, int(random(-10,10))+height/2);
    radii[0] = random(40,circlesize);
    radii[1] = random(40,circlesize*.2);

    for (angle = 0; angle < TWO_PI; angle= angle + TWO_PI/numsegments) {
        points[0] = createVector(cos(angle)*radii[0]+centers[0].x,sin(angle)*radii[0]+centers[0].y);
        points[1] = createVector(cos(angle+offset)*radii[1]+centers[1].x,sin(angle+offset)*radii[1]+centers[1].y);
        //stroke(maincolor);
        stroke(linecolor);
        line(points[0].x,points[0].y,points[1].x, points[1].y);
    }

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
    if (key == 'r' || key == 'Rr') {
        blendMode(BLEND);
        background(backcolor);
        blendMode(blendtype);
	} 

    if (key == 's' || key == 'S') {
        let timeStamp = year() + "-" + month() + "-" + day() + "-" + hour() + "-" + minute() + "-" + second() + "-" + nf(millis(), 3, 0);
  	    save(cnv,'Particles_' + timeStamp + '.jpg');
    }
}